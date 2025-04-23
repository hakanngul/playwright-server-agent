/**
 * Playwright Test Adapter
 * Adapts JSON test plans to Playwright Test Runner
 */

import { test as baseTest } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Adapts JSON test plans to Playwright Test Runner
 */
export class PlaywrightTestAdapter {
  /**
   * Creates a new PlaywrightTestAdapter instance
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      testDir: options.testDir || path.join(process.cwd(), 'temp-tests'),
      outputDir: options.outputDir || path.join(process.cwd(), 'test-results'),
      screenshotsDir: options.screenshotsDir || path.join(process.cwd(), 'screenshots'),
      headless: options.headless !== undefined ? options.headless : true,
      workers: options.workers || undefined,
      browserTypes: options.browserTypes || ['chromium']
    };

    // Ensure directories exist
    this._ensureDirectoriesExist();

    console.log(`PlaywrightTestAdapter created with testDir: ${this.options.testDir}, outputDir: ${this.options.outputDir}`);
  }

  /**
   * Ensures required directories exist
   * @private
   */
  _ensureDirectoriesExist() {
    // Create test directory if it doesn't exist
    if (!fs.existsSync(this.options.testDir)) {
      fs.mkdirSync(this.options.testDir, { recursive: true });
    }

    // Create output directory if it doesn't exist
    if (!fs.existsSync(this.options.outputDir)) {
      fs.mkdirSync(this.options.outputDir, { recursive: true });
    }

    // Create screenshots directory if it doesn't exist
    if (!fs.existsSync(this.options.screenshotsDir)) {
      fs.mkdirSync(this.options.screenshotsDir, { recursive: true });
    }
  }

  /**
   * Converts a JSON test plan to a Playwright test file
   * @param {Object} testPlan - Test plan to convert
   * @returns {string} Path to the generated test file
   */
  convertTestPlanToPlaywrightTest(testPlan) {
    const testFileName = `${testPlan.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.spec.js`;
    const testFilePath = path.join(this.options.testDir, testFileName);

    // Generate test file content
    const testFileContent = this._generateTestFileContent(testPlan);

    // Write test file
    fs.writeFileSync(testFilePath, testFileContent);

    return testFilePath;
  }

  /**
   * Generates test file content from a test plan
   * @param {Object} testPlan - Test plan to convert
   * @returns {string} Test file content
   * @private
   */
  _generateTestFileContent(testPlan) {
    const browserType = testPlan.browserPreference || 'chromium';
    const headless = testPlan.headless !== undefined ? testPlan.headless : this.options.headless;

    return `
    import { test, expect } from '@playwright/test';

    // Test metadata
    test.describe('${testPlan.name}', () => {
      test.use({
        browserName: '${browserType}',
        headless: ${headless},
        screenshot: 'on',
      });

      test('${testPlan.description || testPlan.name}', async ({ page }) => {
        // Performance metrics
        const performanceData = {
          steps: [],
          webVitals: null,
          networkMetrics: null
        };

        // Execute steps
        ${this._generateStepsCode(testPlan.steps)}

        // Collect Web Vitals
        performanceData.webVitals = await page.evaluate(() => {
          if (!window.performance || !window.performance.timing) return null;

          const timing = window.performance.timing;
          return {
            ttfb: timing.responseStart - timing.requestStart,
            fcp: window.performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
            lcp: window.performance.getEntriesByType('largest-contentful-paint')[0]?.startTime,
            cls: window.performance.getEntriesByType('layout-shift').reduce((sum, entry) => sum + entry.value, 0)
          };
        });

        // Attach performance data
        await test.info().attach('performance-metrics', {
          body: JSON.stringify(performanceData),
          contentType: 'application/json'
        });
      });
    });
    `;
  }

  /**
   * Generates code for test steps
   * @param {Array<Object>} steps - Test steps
   * @returns {string} Generated code
   * @private
   */
  _generateStepsCode(steps) {
    return steps.map((step, index) => {
      const stepCode = this._generateStepCode(step, index);
      return `
        // Step ${index + 1}: ${step.action} - ${step.description || ''}
        {
          const stepStartTime = Date.now();
          try {
            ${stepCode}
            performanceData.steps.push({
              step: ${index + 1},
              action: '${step.action}',
              target: '${step.target || ''}',
              value: '${step.value || ''}',
              description: '${step.description || ''}',
              duration: Date.now() - stepStartTime,
              success: true,
              error: null
            });
          } catch (error) {
            performanceData.steps.push({
              step: ${index + 1},
              action: '${step.action}',
              target: '${step.target || ''}',
              value: '${step.value || ''}',
              description: '${step.description || ''}',
              duration: Date.now() - stepStartTime,
              success: false,
              error: error.message
            });
            throw error;
          }
        }
      `;
    }).join('\n');
  }

  /**
   * Generates code for a single step
   * @param {Object} step - Test step
   * @param {number} index - Step index
   * @returns {string} Generated code
   * @private
   */
  _generateStepCode(step, index) {
    switch (step.action) {
      case 'navigate':
        return `await page.goto('${step.target}', { waitUntil: 'networkidle' });`;
      case 'click':
        if (step.strategy === 'xpath') {
          return `await page.locator('xpath=${step.target}').click();`;
        }
        return `await page.locator('${step.target}').click();`;
      case 'type':
        if (step.strategy === 'xpath') {
          return `await page.locator('xpath=${step.target}').fill('${step.value}');`;
        }
        return `await page.locator('${step.target}').fill('${step.value}');`;
      case 'wait':
        return `await page.waitForTimeout(${parseInt(step.target)});`;
      case 'waitForElement':
        if (step.strategy === 'xpath') {
          return `await page.locator('xpath=${step.target}').waitFor({ state: 'visible' });`;
        }
        return `await page.locator('${step.target}').waitFor({ state: 'visible' });`;
      case 'select':
        if (step.strategy === 'xpath') {
          return `await page.locator('xpath=${step.target}').selectOption('${step.value}');`;
        }
        return `await page.locator('${step.target}').selectOption('${step.value}');`;
      case 'check':
        if (step.strategy === 'xpath') {
          return `await page.locator('xpath=${step.target}').check();`;
        }
        return `await page.locator('${step.target}').check();`;
      case 'uncheck':
        if (step.strategy === 'xpath') {
          return `await page.locator('xpath=${step.target}').uncheck();`;
        }
        return `await page.locator('${step.target}').uncheck();`;
      case 'pressEnter':
        return `await page.keyboard.press('Enter');`;
      case 'pressTab':
        return `await page.keyboard.press('Tab');`;
      case 'pressEscape':
        return `await page.keyboard.press('Escape');`;
      case 'takeScreenshot':
        return `await page.screenshot({ path: '${this.options.screenshotsDir}/${step.target || `screenshot_${index}`}.png' });`;
      case 'verifyText':
        return `await expect(page.locator('body')).toContainText('${step.value}');`;
      case 'verifyTitle':
        return `await expect(page).toHaveTitle(/${step.value}/);`;
      case 'verifyURL':
        return `await expect(page).toHaveURL(/${step.value}/);`;
      case 'verifyElementExists':
        if (step.strategy === 'xpath') {
          return `await expect(page.locator('xpath=${step.target}')).toHaveCount(1);`;
        }
        return `await expect(page.locator('${step.target}')).toHaveCount(1);`;
      case 'verifyElementVisible':
        if (step.strategy === 'xpath') {
          return `await expect(page.locator('xpath=${step.target}')).toBeVisible();`;
        }
        return `await expect(page.locator('${step.target}')).toBeVisible();`;
      default:
        return `console.log('Unsupported action: ${step.action}');`;
    }
  }

  /**
   * Runs a test with Playwright Test Runner
   * @param {Object} testPlan - Test plan to run
   * @returns {Promise<Object>} Test result
   */
  async runTest(testPlan) {
    const testFilePath = this.convertTestPlanToPlaywrightTest(testPlan);

    try {
      // Create result object
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
        error: null,
        performance: {
          webVitals: null,
          networkMetrics: null
        }
      };

      const startTime = Date.now();

      // Create config file
      const configPath = path.join(this.options.testDir, `playwright.config.${Date.now()}.cjs`);
      const configContent = `
      module.exports = {
        testDir: '${this.options.testDir}',
        outputDir: '${this.options.outputDir}',
        reporter: [['json', { outputFile: '${path.join(this.options.outputDir, 'results.json')}' }], ['list']],
        use: {
          headless: ${testPlan.headless !== undefined ? testPlan.headless : this.options.headless},
          screenshot: 'only-on-failure',
          trace: 'retain-on-failure'
        },
        projects: [
          {
            name: '${testPlan.browserPreference || 'chromium'}',
            use: { browserName: '${testPlan.browserPreference || 'chromium'}' }
          }
        ]
      };
      `;

      fs.writeFileSync(configPath, configContent);

      // Run test with Playwright Test Runner
      return new Promise((resolve, reject) => {
        const command = `npx playwright test "${testFilePath}" --config="${configPath}"`;
        console.log(`Running command: ${command}`);

        exec(command, { cwd: process.cwd() }, (error, stdout, stderr) => {
          // Set end time and duration
          result.endTime = new Date().toISOString();
          result.duration = Date.now() - startTime;

          console.log(`Test execution completed in ${result.duration}ms`);

          if (error) {
            console.error(`Test execution error: ${error.message}`);
            result.success = false;
            result.error = error.message;
          }

          // Try to read test results
          try {
            const resultsFile = path.join(this.options.outputDir, 'results.json');
            if (fs.existsSync(resultsFile)) {
              const resultsJson = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));

              // Convert Playwright results to custom format
              this._extractPlaywrightResults(resultsJson, result);
            }
          } catch (readError) {
            console.error(`Error reading test results: ${readError.message}`);
          }

          // Clean up temporary files
          try {
            fs.unlinkSync(testFilePath);
            fs.unlinkSync(configPath);
          } catch (cleanupError) {
            console.error(`Error cleaning up temporary files: ${cleanupError.message}`);
          }

          resolve(result);
        });
      });
    } catch (error) {
      console.error(`Error running test with Playwright Test Runner: ${error.message}`);
      throw error;
    }
  }

  /**
   * Extracts test results from Playwright Test Runner output
   * @param {Object} playwrightResults - Playwright test results
   * @param {Object} result - Result object to update
   * @private
   */
  _extractPlaywrightResults(playwrightResults, result) {
    if (playwrightResults && playwrightResults.suites && playwrightResults.suites.length > 0) {
      const suite = playwrightResults.suites[0];
      if (suite.specs && suite.specs.length > 0) {
        const spec = suite.specs[0];

        result.success = spec.ok;
        if (!spec.ok && spec.error) {
          result.error = spec.error.message;
        }

        if (spec.tests && spec.tests.length > 0) {
          const test = spec.tests[0];
          result.duration = test.duration;

          // Extract step results and performance metrics
          if (test.attachments) {
            const perfAttachment = test.attachments.find(a => a.name === 'performance-metrics');
            if (perfAttachment && perfAttachment.body) {
              try {
                const perfData = JSON.parse(perfAttachment.body);
                result.steps = perfData.steps || [];
                result.performance.webVitals = perfData.webVitals;
                result.performance.networkMetrics = perfData.networkMetrics;
              } catch (e) {
                console.error('Error parsing performance metrics:', e);
              }
            }
          }
        }
      }
    }
  }

  /**
   * Runs multiple tests in parallel
   * @param {Array<Object>} testPlans - Test plans to run
   * @returns {Promise<Array<Object>>} Test results
   */
  async runTests(testPlans) {
    console.log(`Running ${testPlans.length} tests with Playwright Test Runner`);

    // Run tests in parallel
    const testPromises = testPlans.map(testPlan => this.runTest(testPlan));
    return await Promise.all(testPromises);
  }
}
