/**
 * Playwright Parallel Runner
 * Runs tests in parallel using Playwright API
 */

import { chromium, firefox, webkit } from 'playwright';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Playwright Parallel Runner
 * Runs tests in parallel using Playwright API
 */
export class PlaywrightParallelRunner {
  /**
   * Creates a new PlaywrightParallelRunner instance
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      // Browser configuration
      browserTypes: options.browserTypes || ['chromium'],
      headless: options.headless !== undefined ? options.headless : true,
      
      // Parallelization
      workers: options.workers || os.cpus().length,
      
      // Reporting
      screenshotsDir: options.screenshotsDir || path.join(process.cwd(), 'screenshots'),
      
      // Callbacks
      onTestStart: options.onTestStart || null,
      onTestComplete: options.onTestComplete || null,
      onStepComplete: options.onStepComplete || null
    };
    
    // Ensure screenshots directory exists
    if (!fs.existsSync(this.options.screenshotsDir)) {
      fs.mkdirSync(this.options.screenshotsDir, { recursive: true });
    }
    
    console.log(`PlaywrightParallelRunner created with workers: ${this.options.workers}, browsers: ${this.options.browserTypes.join(', ')}`);
  }
  
  /**
   * Gets the browser instance based on browser type
   * @param {string} browserType - Browser type (chromium, firefox, webkit)
   * @returns {Object} Browser instance
   * @private
   */
  _getBrowserInstance(browserType) {
    switch (browserType.toLowerCase()) {
      case 'chromium':
        return chromium;
      case 'firefox':
        return firefox;
      case 'webkit':
        return webkit;
      default:
        return chromium;
    }
  }
  
  /**
   * Runs a single test
   * @param {Object} testPlan - Test plan to run
   * @returns {Promise<Object>} Test result
   * @private
   */
  async _runTest(testPlan) {
    console.log(`Running test: ${testPlan.name} with browser: ${testPlan.browserPreference || 'chromium'}`);
    
    // Prepare result object
    const result = {
      name: testPlan.name,
      description: testPlan.description,
      browserType: testPlan.browserPreference || 'chromium',
      headless: testPlan.headless !== undefined ? testPlan.headless : this.options.headless,
      startTime: new Date().toISOString(),
      endTime: null,
      duration: 0,
      steps: [],
      success: false,
      error: null
    };
    
    const startTime = Date.now();
    let browser = null;
    let context = null;
    let page = null;
    
    try {
      // Get browser instance
      const browserType = this._getBrowserInstance(testPlan.browserPreference || 'chromium');
      
      // Launch browser
      browser = await browserType.launch({
        headless: testPlan.headless !== undefined ? testPlan.headless : this.options.headless
      });
      
      // Create browser context
      context = await browser.newContext();
      
      // Create page
      page = await context.newPage();
      
      // Call test start callback if provided
      if (this.options.onTestStart) {
        this.options.onTestStart(testPlan);
      }
      
      // Execute steps
      for (const [index, step] of testPlan.steps.entries()) {
        const stepStartTime = Date.now();
        let stepSuccess = false;
        let stepError = null;
        
        try {
          // Execute step based on action type
          switch (step.action) {
            case 'navigate':
              await page.goto(step.target, { waitUntil: 'networkidle' });
              break;
            case 'click':
              if (step.strategy === 'xpath') {
                await page.locator(`xpath=${step.target}`).click();
              } else {
                await page.locator(step.target).click();
              }
              break;
            case 'type':
              if (step.strategy === 'xpath') {
                await page.locator(`xpath=${step.target}`).fill(step.value);
              } else {
                await page.locator(step.target).fill(step.value);
              }
              break;
            case 'wait':
              await page.waitForTimeout(parseInt(step.target));
              break;
            case 'waitForElement':
              if (step.strategy === 'xpath') {
                await page.locator(`xpath=${step.target}`).waitFor({ state: 'visible' });
              } else {
                await page.locator(step.target).waitFor({ state: 'visible' });
              }
              break;
            case 'select':
              if (step.strategy === 'xpath') {
                await page.locator(`xpath=${step.target}`).selectOption(step.value);
              } else {
                await page.locator(step.target).selectOption(step.value);
              }
              break;
            case 'check':
              if (step.strategy === 'xpath') {
                await page.locator(`xpath=${step.target}`).check();
              } else {
                await page.locator(step.target).check();
              }
              break;
            case 'uncheck':
              if (step.strategy === 'xpath') {
                await page.locator(`xpath=${step.target}`).uncheck();
              } else {
                await page.locator(step.target).uncheck();
              }
              break;
            case 'screenshot':
              await page.screenshot({
                path: path.join(this.options.screenshotsDir, `${step.target || `${testPlan.name}_step_${index + 1}`}.png`)
              });
              break;
            default:
              console.log(`Unsupported action: ${step.action}`);
          }
          
          stepSuccess = true;
        } catch (error) {
          stepSuccess = false;
          stepError = error.message;
          
          // Take screenshot on error
          try {
            await page.screenshot({
              path: path.join(this.options.screenshotsDir, `${testPlan.name}_error_step_${index + 1}.png`)
            });
          } catch (screenshotError) {
            console.error(`Error taking screenshot: ${screenshotError.message}`);
          }
        }
        
        // Add step result
        const stepResult = {
          step: index + 1,
          action: step.action,
          target: step.target || '',
          value: step.value || '',
          description: step.description || '',
          duration: Date.now() - stepStartTime,
          success: stepSuccess,
          error: stepError
        };
        
        result.steps.push(stepResult);
        
        // Call step complete callback if provided
        if (this.options.onStepComplete) {
          this.options.onStepComplete(testPlan, stepResult);
        }
        
        // Stop execution if step failed
        if (!stepSuccess) {
          break;
        }
      }
      
      // Collect performance metrics
      try {
        // Web Vitals
        result.performance = {
          webVitals: await page.evaluate(() => {
            if (!window.performance || !window.performance.timing) return null;
            
            const timing = window.performance.timing;
            return {
              ttfb: timing.responseStart - timing.requestStart,
              fcp: window.performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
              lcp: window.performance.getEntriesByType('largest-contentful-paint')[0]?.startTime,
              cls: window.performance.getEntriesByType('layout-shift').reduce((sum, entry) => sum + entry.value, 0)
            };
          }),
          networkMetrics: null
        };
        
        // Network metrics
        const client = await page.context().newCDPSession(page);
        await client.send('Network.enable');
        result.performance.networkMetrics = await client.send('Network.getMetrics');
      } catch (error) {
        console.error('Error collecting performance metrics:', error);
      }
      
      // Set success status based on steps
      result.success = result.steps.every(step => step.success);
    } catch (error) {
      result.success = false;
      result.error = error.message;
    } finally {
      // Close browser
      if (browser) {
        await browser.close();
      }
      
      // Set end time and duration
      result.endTime = new Date().toISOString();
      result.duration = Date.now() - startTime;
      
      // Call test complete callback if provided
      if (this.options.onTestComplete) {
        this.options.onTestComplete(result);
      }
    }
    
    return result;
  }
  
  /**
   * Runs multiple tests in parallel
   * @param {Array<Object>} testPlans - Array of test plans to run
   * @returns {Promise<Array<Object>>} Test results
   */
  async runTests(testPlans) {
    console.log(`Running ${testPlans.length} tests in parallel with ${this.options.workers} workers`);
    
    const results = [];
    const runningTests = [];
    const queue = [...testPlans];
    
    // Start initial batch of tests
    const startNextBatch = () => {
      while (runningTests.length < this.options.workers && queue.length > 0) {
        const testPlan = queue.shift();
        const testPromise = this._runTest(testPlan);
        
        // Add to running tests
        runningTests.push(testPromise);
        
        // Remove from running tests when completed
        testPromise.then(result => {
          results.push(result);
          
          const index = runningTests.indexOf(testPromise);
          if (index !== -1) {
            runningTests.splice(index, 1);
          }
          
          // Start next batch if queue is not empty
          if (queue.length > 0) {
            startNextBatch();
          }
        });
      }
    };
    
    // Start initial batch
    startNextBatch();
    
    // Wait for all tests to complete
    while (runningTests.length > 0) {
      await Promise.race(runningTests);
    }
    
    console.log(`All ${testPlans.length} tests completed`);
    return results;
  }
}
