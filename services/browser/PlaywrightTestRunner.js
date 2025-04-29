/**
 * Playwright Test Runner Integration
 * Integrates Playwright Test Runner for parallel test execution
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Playwright Test Runner Integration
 * Provides parallel test execution capabilities using Playwright Test Runner
 */
export class PlaywrightTestRunner {
  /**
   * Creates a new PlaywrightTestRunner instance
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      // Test configuration
      testDir: options.testDir || path.join(process.cwd(), 'playwright-tests'),
      outputDir: options.outputDir || path.join(process.cwd(), 'test-results'),

      // Browser configuration
      browserTypes: options.browserTypes || ['chromium'],
      headless: options.headless !== undefined ? options.headless : true,

      // Parallelization
      workers: options.workers || undefined, // undefined = auto (based on CPU cores)

      // Reporting
      screenshotsDir: options.screenshotsDir || path.join(process.cwd(), 'screenshots'),
      // traces ve videos özellikleri kaldırıldı

      // Callbacks
      onTestStart: options.onTestStart || null,
      onTestComplete: options.onTestComplete || null,
      onStepComplete: options.onStepComplete || null
    };

    // Ensure test directory exists
    if (!fs.existsSync(this.options.testDir)) {
      fs.mkdirSync(this.options.testDir, { recursive: true });
    }

    // Ensure output directory exists
    if (!fs.existsSync(this.options.outputDir)) {
      fs.mkdirSync(this.options.outputDir, { recursive: true });
    }

    console.log(`PlaywrightTestRunner created with workers: ${this.options.workers || 'auto'}, browsers: ${this.options.browserTypes.join(', ')}`);
  }

  /**
   * Converts a test plan to a Playwright test file
   * @param {Object} testPlan - Test plan to convert
   * @returns {string} Path to the generated test file
   * @private
   */
  _convertTestPlanToPlaywrightTest(testPlan) {
    const testFilePath = path.join(this.options.testDir, `${testPlan.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.spec.js`);

    // Create test file content
    const testContent = `
import { test, expect } from '@playwright/test';

test('${testPlan.name}', async ({ page }) => {
  // Test metadata
  test.info().annotations.push({ type: 'description', description: '${testPlan.description || ''}' });
  test.info().annotations.push({ type: 'browserType', description: '${testPlan.browserPreference || 'chromium'}' });

  // Performance metrics
  const startTime = Date.now();
  const performanceMetrics = {
    steps: [],
    webVitals: null,
    networkMetrics: null
  };

  // Execute steps
  ${testPlan.steps.map((step, index) => {
    let stepCode = `
  // Step ${index + 1}: ${step.action} - ${step.description || ''}
  {
    const stepStartTime = Date.now();
    try {
      `;

    // Generate code for each step type
    switch (step.action) {
      case 'navigate':
        stepCode += `await page.goto('${step.target}', { waitUntil: 'networkidle' });`;
        break;
      case 'click':
        if (step.strategy === 'xpath') {
          stepCode += `await page.locator('xpath=${step.target}').click();`;
        } else {
          stepCode += `await page.locator('${step.target}').click();`;
        }
        break;
      case 'type':
        if (step.strategy === 'xpath') {
          stepCode += `await page.locator('xpath=${step.target}').fill('${step.value}');`;
        } else {
          stepCode += `await page.locator('${step.target}').fill('${step.value}');`;
        }
        break;
      case 'wait':
        stepCode += `await page.waitForTimeout(${step.target});`;
        break;
      case 'waitForElement':
        if (step.strategy === 'xpath') {
          stepCode += `await page.locator('xpath=${step.target}').waitFor({ state: 'visible' });`;
        } else {
          stepCode += `await page.locator('${step.target}').waitFor({ state: 'visible' });`;
        }
        break;
      case 'select':
        if (step.strategy === 'xpath') {
          stepCode += `await page.locator('xpath=${step.target}').selectOption('${step.value}');`;
        } else {
          stepCode += `await page.locator('${step.target}').selectOption('${step.value}');`;
        }
        break;
      case 'check':
        if (step.strategy === 'xpath') {
          stepCode += `await page.locator('xpath=${step.target}').check();`;
        } else {
          stepCode += `await page.locator('${step.target}').check();`;
        }
        break;
      case 'uncheck':
        if (step.strategy === 'xpath') {
          stepCode += `await page.locator('xpath=${step.target}').uncheck();`;
        } else {
          stepCode += `await page.locator('${step.target}').uncheck();`;
        }
        break;
      case 'screenshot':
        stepCode += `await page.screenshot({ path: '${path.join(this.options.screenshotsDir, `${step.target || `step_${index + 1}`}.png`)}' });`;
        break;
      default:
        stepCode += `console.log('Unsupported action: ${step.action}');`;
    }

    stepCode += `
      performanceMetrics.steps.push({
        step: ${index + 1},
        action: '${step.action}',
        target: '${step.target || ''}',
        value: '${step.value || ''}',
        duration: Date.now() - stepStartTime,
        success: true
      });
    } catch (error) {
      performanceMetrics.steps.push({
        step: ${index + 1},
        action: '${step.action}',
        target: '${step.target || ''}',
        value: '${step.value || ''}',
        duration: Date.now() - stepStartTime,
        success: false,
        error: error.message
      });

      // Take screenshot on error
      await page.screenshot({ path: '${path.join(this.options.screenshotsDir, `error_step_${index + 1}.png`)}' });

      throw error;
    }
  }`;

    return stepCode;
  }).join('\n')}

  // Collect performance metrics
  try {
    // Web Vitals
    performanceMetrics.webVitals = await page.evaluate(() => {
      if (!window.performance || !window.performance.timing) return null;

      const timing = window.performance.timing;
      return {
        ttfb: timing.responseStart - timing.requestStart,
        fcp: window.performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
        lcp: window.performance.getEntriesByType('largest-contentful-paint')[0]?.startTime,
        cls: window.performance.getEntriesByType('layout-shift').reduce((sum, entry) => sum + entry.value, 0)
      };
    });

    // Network metrics
    const client = await page.context().newCDPSession(page);
    await client.send('Network.enable');
    const networkMetrics = await client.send('Network.getMetrics');
    performanceMetrics.networkMetrics = networkMetrics;
  } catch (error) {
    console.error('Error collecting performance metrics:', error);
  }

  // Add test duration
  performanceMetrics.duration = Date.now() - startTime;

  // Store performance metrics in test result
  test.info().attachments.push({
    name: 'performance-metrics',
    contentType: 'application/json',
    body: Buffer.from(JSON.stringify(performanceMetrics))
  });
});
`;

    // Write test file
    fs.writeFileSync(testFilePath, testContent);

    return testFilePath;
  }

  /**
   * Runs multiple tests in parallel using Playwright Test Runner
   * @param {Array<Object>} testPlans - Array of test plans to run
   * @returns {Promise<Array<Object>>} Test results
   */
  async runTests(testPlans) {
    console.log(`Running ${testPlans.length} tests in parallel with Playwright Test Runner`);

    // Convert test plans to Playwright test files
    const testFiles = [];
    for (const testPlan of testPlans) {
      const testFile = this._convertTestPlanToPlaywrightTest(testPlan);
      testFiles.push({ testPlan, testFile });
    }

    // Run tests using Playwright CLI
    const results = [];

    // Create promises for all test runs
    const testPromises = testFiles.map(({ testPlan, testFile }) => {
      return new Promise((resolve) => {
        console.log(`Running test: ${testPlan.name} with file: ${testFile}`);

        // Prepare result object
        const result = {
          name: testPlan.name,
          description: testPlan.description,
          browserType: testPlan.browserPreference || 'chromium',
          headless: this.options.headless,
          startTime: new Date().toISOString(),
          endTime: null,
          duration: 0,
          steps: [],
          success: false,
          error: null
        };

        // Set browser project based on preference
        const browserProject = testPlan.browserPreference || 'chromium';

        // Set headless mode
        const headlessMode = testPlan.headless !== undefined ? testPlan.headless : this.options.headless;

        // Build command arguments
        const args = [
          'npx', 'playwright', 'test',
          testFile,
          '--project=' + browserProject,
          headlessMode ? '' : '--headed',
          '--reporter=json,list'
        ].filter(Boolean);

        // Spawn process
        const startTime = Date.now();
        const process = spawn(args[0], args.slice(1), {
          stdio: ['ignore', 'pipe', 'pipe'],
          shell: true
        });

        let stdout = '';
        let stderr = '';

        process.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        process.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        process.on('close', (code) => {
          const endTime = Date.now();
          result.endTime = new Date().toISOString();
          result.duration = endTime - startTime;

          if (code === 0) {
            result.success = true;

            // Try to parse JSON output
            try {
              // Look for JSON in stdout
              const jsonMatch = stdout.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                const jsonResult = JSON.parse(jsonMatch[0]);

                // Extract steps from test results
                if (jsonResult.suites && jsonResult.suites.length > 0) {
                  const suite = jsonResult.suites[0];
                  if (suite.specs && suite.specs.length > 0) {
                    const spec = suite.specs[0];

                    // Extract performance metrics from attachments
                    if (spec.attachments) {
                      const perfAttachment = spec.attachments.find(a => a.name === 'performance-metrics');
                      if (perfAttachment && perfAttachment.body) {
                        try {
                          const perfMetrics = JSON.parse(perfAttachment.body);
                          result.steps = perfMetrics.steps || [];
                          result.performance = {
                            webVitals: perfMetrics.webVitals,
                            networkMetrics: perfMetrics.networkMetrics
                          };
                        } catch (e) {
                          console.error('Error parsing performance metrics:', e);
                        }
                      }
                    }
                  }
                }
              }
            } catch (error) {
              console.error('Error parsing test results:', error);
            }
          } else {
            result.success = false;
            result.error = stderr || `Test failed with exit code ${code}`;
          }

          // Add to results
          results.push(result);

          // Call test completed callback if provided
          if (this.options.onTestComplete) {
            this.options.onTestComplete(result);
          }

          // Clean up test file
          try {
            fs.unlinkSync(testFile);
          } catch (error) {
            console.error(`Error removing test file ${testFile}:`, error);
          }

          resolve();
        });
      });
    });

    // Wait for all tests to complete
    await Promise.all(testPromises);

    return results;
  }
}
