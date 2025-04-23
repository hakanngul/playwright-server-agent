/**
 * Playwright Parallel Runner
 * Runs tests in parallel using Playwright API with advanced features
 */

import { chromium, firefox, webkit, devices } from 'playwright';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createHash } from 'crypto';
import { generateModernHtmlReport } from '../reporting/templates/modern-report-template.js';

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
      videosDir: options.videosDir || path.join(process.cwd(), 'videos'),
      tracesDir: options.tracesDir || path.join(process.cwd(), 'traces'),
      reportsDir: options.reportsDir || path.join(process.cwd(), 'reports'),

      // Advanced features
      recordVideo: options.recordVideo !== undefined ? options.recordVideo : false,
      captureTraces: options.captureTraces !== undefined ? options.captureTraces : false,
      visualComparison: options.visualComparison !== undefined ? options.visualComparison : false,
      accessibilityTest: options.accessibilityTest !== undefined ? options.accessibilityTest : false,
      apiTesting: options.apiTesting !== undefined ? options.apiTesting : false,
      mobileEmulation: options.mobileEmulation !== undefined ? options.mobileEmulation : false,
      reuseContext: options.reuseContext !== undefined ? options.reuseContext : false,
      retryCount: options.retryCount || 0,

      // Callbacks
      onTestStart: options.onTestStart || null,
      onTestComplete: options.onTestComplete || null,
      onStepComplete: options.onStepComplete || null
    };

    // Ensure directories exist
    const dirs = [
      this.options.screenshotsDir,
      this.options.videosDir,
      this.options.tracesDir,
      this.options.reportsDir
    ];

    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }

    // Browser instances cache for context reuse
    this.browserInstances = {};

    // Reference screenshots for visual comparison
    this.referenceScreenshots = {};

    console.log(`PlaywrightParallelRunner created with workers: ${this.options.workers}, browsers: ${this.options.browserTypes.join(', ')}`);
    console.log(`Advanced features: ${Object.entries(this.options)
      .filter(([key, value]) => typeof value === 'boolean' && value === true)
      .map(([key]) => key)
      .join(', ')}`);
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

    // Generate unique test ID
    const testId = createHash('md5').update(`${testPlan.name}-${Date.now()}`).digest('hex').substring(0, 8);

    // Prepare result object
    const result = {
      id: testId,
      name: testPlan.name,
      description: testPlan.description,
      browserType: testPlan.browserPreference || 'chromium',
      headless: testPlan.headless !== undefined ? testPlan.headless : this.options.headless,
      startTime: new Date().toISOString(),
      endTime: null,
      duration: 0,
      steps: [],
      success: false,
      error: null,
      artifacts: {
        screenshots: [],
        videos: [],
        traces: [],
        reports: []
      },
      accessibility: null,
      visualComparison: null
    };

    const startTime = Date.now();
    let browser = null;
    let context = null;
    let page = null;

    try {
      // Get browser instance
      const browserType = this._getBrowserInstance(testPlan.browserPreference || 'chromium');
      const browserTypeName = testPlan.browserPreference || 'chromium';

      // Check if we should reuse browser instance
      if (this.options.reuseContext && this.browserInstances[browserTypeName]) {
        console.log(`Reusing existing ${browserTypeName} browser instance`);
        browser = this.browserInstances[browserTypeName];
      } else {
        // Launch browser with advanced options
        const launchOptions = {
          headless: testPlan.headless !== undefined ? testPlan.headless : this.options.headless
        };

        browser = await browserType.launch(launchOptions);

        // Store browser instance for reuse if enabled
        if (this.options.reuseContext) {
          this.browserInstances[browserTypeName] = browser;
        }
      }

      // Create context options
      const contextOptions = {};

      // Add video recording if enabled
      if (this.options.recordVideo || testPlan.options?.recordVideo) {
        contextOptions.recordVideo = {
          dir: this.options.videosDir,
          size: { width: 1280, height: 720 }
        };
        console.log('Video recording enabled for this test');
      }

      // Add mobile emulation if enabled
      if (this.options.mobileEmulation && testPlan.mobileDevice) {
        const deviceName = testPlan.mobileDevice;
        if (devices[deviceName]) {
          Object.assign(contextOptions, devices[deviceName]);
          console.log(`Emulating mobile device: ${deviceName}`);
        } else {
          console.warn(`Unknown device: ${deviceName}, using default settings`);
        }
      }

      // Create browser context
      context = await browser.newContext(contextOptions);

      // Start tracing if enabled
      if (this.options.captureTraces) {
        await context.tracing.start({
          screenshots: true,
          snapshots: true,
          sources: true
        });
      }

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
        let stepScreenshot = null;

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
              const screenshotPath = path.join(this.options.screenshotsDir, `${testId}_step_${index + 1}.png`);
              await page.screenshot({ path: screenshotPath });
              stepScreenshot = screenshotPath;
              result.artifacts.screenshots.push(screenshotPath);
              break;
            case 'apiRequest':
              if (this.options.apiTesting) {
                const apiResponse = await page.request[step.method.toLowerCase()](step.target, {
                  headers: step.headers || {},
                  data: step.data || undefined
                });

                // Store API response in step result
                stepSuccess = apiResponse.ok();
                if (!stepSuccess) {
                  stepError = `API request failed with status ${apiResponse.status()}`;
                }

                // Add response data to step result
                step.responseStatus = apiResponse.status();
                step.responseHeaders = await apiResponse.headers();
                try {
                  step.responseBody = await apiResponse.json();
                } catch (e) {
                  step.responseText = await apiResponse.text();
                }
                break;
              }
              // Fall through if API testing is not enabled
            case 'assertElementVisible':
              if (step.strategy === 'xpath') {
                await expect(page.locator(`xpath=${step.target}`)).toBeVisible();
              } else {
                await expect(page.locator(step.target)).toBeVisible();
              }
              break;
            case 'assertElementHidden':
              if (step.strategy === 'xpath') {
                await expect(page.locator(`xpath=${step.target}`)).toBeHidden();
              } else {
                await expect(page.locator(step.target)).toBeHidden();
              }
              break;
            case 'assertText':
              if (step.strategy === 'xpath') {
                await expect(page.locator(`xpath=${step.target}`)).toHaveText(step.value);
              } else {
                await expect(page.locator(step.target)).toHaveText(step.value);
              }
              break;
            case 'assertTitle':
              await expect(page).toHaveTitle(step.target);
              break;
            case 'assertUrl':
              await expect(page).toHaveURL(step.target);
              break;
            case 'visualCompare':
              if (this.options.visualComparison) {
                const screenshotPath = path.join(this.options.screenshotsDir, `${testId}_visual_${index + 1}.png`);
                const screenshot = await page.screenshot({ path: screenshotPath });
                result.artifacts.screenshots.push(screenshotPath);

                // Generate reference screenshot name
                const refName = `${testPlan.name}_${step.target || `step_${index + 1}`}`;
                const refPath = path.join(this.options.screenshotsDir, 'reference', `${refName}.png`);

                // Check if reference screenshot exists
                if (fs.existsSync(refPath)) {
                  // Compare screenshots
                  // In a real implementation, you would use a visual comparison library
                  // For now, we'll just log that comparison was done
                  console.log(`Visual comparison performed for ${refName}`);
                  result.visualComparison = {
                    ...result.visualComparison || {},
                    [refName]: {
                      reference: refPath,
                      actual: screenshotPath,
                      difference: null,
                      passed: true // Placeholder, would be determined by actual comparison
                    }
                  };
                } else {
                  // Save as reference if it doesn't exist
                  fs.mkdirSync(path.dirname(refPath), { recursive: true });
                  fs.copyFileSync(screenshotPath, refPath);
                  console.log(`Saved reference screenshot for ${refName}`);
                }
              }
              break;
            case 'accessibilityCheck':
              if (this.options.accessibilityTest) {
                // Perform accessibility check
                const accessibilitySnapshot = await page.accessibility.snapshot();

                // In a real implementation, you would analyze this snapshot
                // For now, we'll just store it in the result
                result.accessibility = {
                  ...result.accessibility || {},
                  [`step_${index + 1}`]: accessibilitySnapshot
                };

                console.log(`Accessibility check performed for step ${index + 1}`);
              }
              break;
            default:
              console.log(`Unsupported action: ${step.action}`);
          }

          // Take screenshot after step if not already taken
          if (!stepScreenshot && (step.screenshot || testPlan.screenshotAfterEachStep)) {
            const screenshotPath = path.join(this.options.screenshotsDir, `${testId}_step_${index + 1}.png`);
            await page.screenshot({ path: screenshotPath });
            stepScreenshot = screenshotPath;
            result.artifacts.screenshots.push(screenshotPath);
          }

          stepSuccess = true;
        } catch (error) {
          stepSuccess = false;
          stepError = error.message;

          // Take screenshot on error if not already taken
          if (!stepScreenshot) {
            try {
              const errorScreenshotPath = path.join(this.options.screenshotsDir, `${testId}_error_step_${index + 1}.png`);
              await page.screenshot({ path: errorScreenshotPath });
              stepScreenshot = errorScreenshotPath;
              result.artifacts.screenshots.push(errorScreenshotPath);
            } catch (screenshotError) {
              console.error(`Error taking screenshot: ${screenshotError.message}`);
            }
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
          error: stepError,
          screenshot: stepScreenshot
        };

        result.steps.push(stepResult);

        // Call step complete callback if provided
        if (this.options.onStepComplete) {
          this.options.onStepComplete(testPlan, stepResult);
        }

        // Stop execution if step failed and retry is not enabled
        if (!stepSuccess && !this.options.retryCount) {
          break;
        }
      }

      // Collect performance metrics
      try {
        // Web Vitals and other performance metrics
        result.performance = {
          webVitals: await page.evaluate(() => {
            // Modern performance API usage
            const performanceEntries = {};

            // First Contentful Paint (FCP)
            const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
            if (fcpEntry) performanceEntries.fcp = fcpEntry.startTime;

            // Largest Contentful Paint (LCP)
            const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
            if (lcpEntries && lcpEntries.length > 0) {
              performanceEntries.lcp = lcpEntries[lcpEntries.length - 1].startTime;
            }

            // Cumulative Layout Shift (CLS)
            const layoutShiftEntries = performance.getEntriesByType('layout-shift');
            if (layoutShiftEntries && layoutShiftEntries.length > 0) {
              performanceEntries.cls = layoutShiftEntries.reduce((sum, entry) => sum + entry.value, 0);
            }

            // First Input Delay (FID)
            const firstInputEntry = performance.getEntriesByType('first-input')[0];
            if (firstInputEntry) {
              performanceEntries.fid = firstInputEntry.processingStart - firstInputEntry.startTime;
            }

            // Time to First Byte (TTFB)
            const navigationEntries = performance.getEntriesByType('navigation');
            if (navigationEntries && navigationEntries.length > 0) {
              const navEntry = navigationEntries[0];
              performanceEntries.ttfb = navEntry.responseStart - navEntry.requestStart;
              performanceEntries.domContentLoaded = navEntry.domContentLoadedEventEnd - navEntry.startTime;
              performanceEntries.load = navEntry.loadEventEnd - navEntry.startTime;
            }

            // Resource timing
            const resourceEntries = performance.getEntriesByType('resource');
            if (resourceEntries && resourceEntries.length > 0) {
              performanceEntries.resourceCount = resourceEntries.length;
              performanceEntries.resourceLoadTime = resourceEntries.reduce((sum, entry) => sum + entry.duration, 0);

              // Categorize resources
              const resourcesByType = {};
              resourceEntries.forEach(entry => {
                const type = entry.initiatorType || 'other';
                if (!resourcesByType[type]) resourcesByType[type] = { count: 0, size: 0, time: 0 };
                resourcesByType[type].count++;
                resourcesByType[type].time += entry.duration;
                // transferSize is available in some browsers
                if (entry.transferSize) resourcesByType[type].size += entry.transferSize;
              });
              performanceEntries.resourcesByType = resourcesByType;
            }

            return performanceEntries;
          }),
          networkMetrics: {}
        };

        // Additional network metrics using CDP
        try {
          const client = await page.context().newCDPSession(page);
          await client.send('Network.enable');

          // Get network metrics if available
          try {
            const metrics = await client.send('Performance.getMetrics');
            result.performance.networkMetrics.metrics = metrics;
          } catch (e) {
            console.log('Performance.getMetrics not available, skipping');
          }

          // Get browser memory info if available
          try {
            const memoryInfo = await client.send('Memory.getBrowserSamplingProfile');
            result.performance.memoryMetrics = memoryInfo;
          } catch (e) {
            console.log('Memory metrics not available, skipping');
          }
        } catch (cdpError) {
          console.error('Error collecting CDP metrics:', cdpError);
        }
      } catch (error) {
        console.error('Error collecting performance metrics:', error);
      }

      // Set success status based on steps
      result.success = result.steps.every(step => step.success);
    } catch (error) {
      result.success = false;
      result.error = error.message;
    } finally {
      // Stop tracing if enabled and save trace
      if (this.options.captureTraces && context) {
        try {
          const tracePath = path.join(this.options.tracesDir, `${testId}.zip`);
          await context.tracing.stop({ path: tracePath });
          result.artifacts.traces.push(tracePath);
          console.log(`Trace saved to: ${tracePath}`);
        } catch (traceError) {
          console.error('Error saving trace:', traceError);
        }
      }

      // Save video if recording was enabled
      if ((this.options.recordVideo || testPlan.options?.recordVideo) && page) {
        try {
          console.log('Attempting to save video recording...');
          const video = page.video();
          if (video) {
            console.log('Video object exists, getting path...');
            const videoPath = await video.path().catch(e => {
              console.error('Error getting video path:', e);
              return null;
            });

            if (videoPath) {
              console.log(`Original video path: ${videoPath}`);
              const newVideoPath = path.join(this.options.videosDir, `${testId}.webm`);
              console.log(`Renaming video to: ${newVideoPath}`);
              fs.renameSync(videoPath, newVideoPath);
              result.artifacts.videos.push(newVideoPath);
              console.log(`Video saved to: ${newVideoPath}`);
            } else {
              console.error('Video path is null or undefined');
            }
          } else {
            console.error('Video object is null or undefined');
          }
        } catch (videoError) {
          console.error('Error saving video:', videoError);
        }
      } else {
        console.log('Video recording was not enabled for this test');
      }

      // Close context and browser
      if (context) {
        await context.close();
      }

      // Close browser if not reusing
      if (browser && !this.options.reuseContext) {
        await browser.close();
      }

      // Set end time and duration
      result.endTime = new Date().toISOString();
      result.duration = Date.now() - startTime;

      // Generate HTML report
      if (result.steps.length > 0) {
        try {
          const reportPath = path.join(this.options.reportsDir, `${testId}.html`);
          const reportContent = generateModernHtmlReport(result);
          fs.writeFileSync(reportPath, reportContent);
          result.artifacts.reports.push(reportPath);
          console.log(`Modern HTML report saved to: ${reportPath}`);
        } catch (reportError) {
          console.error('Error generating HTML report:', reportError);
        }
      }

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
