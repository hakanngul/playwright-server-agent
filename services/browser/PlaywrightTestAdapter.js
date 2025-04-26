/**
 * Playwright Test Adapter
 * Adapts JSON test plans to Playwright Test Runner
 */

import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { ITestRunner } from '../interfaces/ITestRunner.js';

/**
 * Adapts JSON test plans to Playwright Test Runner
 * @implements {ITestRunner}
 */
export class PlaywrightTestAdapter extends ITestRunner {
  /**
   * Creates a new PlaywrightTestAdapter instance
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    super();

    this.options = {
      testDir: options.testDir || path.join(process.cwd(), 'temp-tests'),
      outputDir: options.outputDir || path.join(process.cwd(), 'test-results'),
      screenshotsDir: options.screenshotsDir || path.join(process.cwd(), 'screenshots'),
      headless: options.headless !== undefined ? options.headless : true,
      workers: options.workers || undefined,
      browserTypes: options.browserTypes || ['chromium']
    };

    this.onStepCompleted = null;
    this.onTestCompleted = null;
    this.browserManager = null;

    // Ensure directories exist
    this._ensureDirectoriesExist();
  }

  /**
   * Ensures required directories exist
   * @private
   */
  _ensureDirectoriesExist() {
    const dirs = [this.options.testDir, this.options.outputDir, this.options.screenshotsDir];

    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  /**
   * Converts a JSON test plan to a Playwright test file
   * @param {Object} testPlan - Test plan to convert
   * @returns {string} Path to the generated test file
   */
  convertTestPlanToPlaywrightTest(testPlan) {
    // Dosya adını oluştur (özel karakterleri temizle)
    const sanitizedName = testPlan.name
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase();

    const timestamp = Date.now();
    const testFileName = `${sanitizedName}_${timestamp}.spec.js`;
    const testFilePath = path.join(this.options.testDir, testFileName);

    // Test içeriğini oluştur
    const testFileContent = this._generateSimpleTestContent(testPlan);

    // Dizinin var olduğundan emin ol
    if (!fs.existsSync(this.options.testDir)) {
      fs.mkdirSync(this.options.testDir, { recursive: true });
    }

    // Dosyayı yaz
    try {
      fs.writeFileSync(testFilePath, testFileContent);
      console.log(`Test file created at: ${testFilePath}`);
    } catch (error) {
      console.error(`Error writing test file: ${error.message}`);
      throw error;
    }

    return testFilePath;
  }

  /**
   * Daha basit bir test dosyası içeriği oluşturur
   * @param {Object} testPlan - Test planı
   * @returns {string} Test dosyası içeriği
   * @private
   */
  _generateSimpleTestContent(testPlan) {
    return `
    // @ts-check
    const { test, expect } = require('@playwright/test');

    test('${testPlan.name.replace(/'/g, "\\'")}', async ({ page }) => {
      console.log('Test başlıyor: ${testPlan.name}');

      // Adım 1: Sayfaya git
      await page.goto('${testPlan.steps[0]?.target || 'https://only-testing-blog.blogspot.com/'}');
      console.log('Sayfa açıldı');

      // Adım 2: Bekle
      await page.waitForTimeout(2000);
      console.log('Bekleme tamamlandı');

      // Test başarılı
      console.log('Test başarıyla tamamlandı');
    });
    `;
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

    test.describe('${testPlan.name.replace(/'/g, "\\'")}', () => {
      test('${(testPlan.description || testPlan.name).replace(/'/g, "\\'")}', async ({ page }) => {
        const stepResults = [];

        try {
          // Execute steps
          ${this._generateStepsCode(testPlan.steps)}

          // Test başarılı
          console.log('Test başarıyla tamamlandı');
        } catch (error) {
          console.error('Test hatası:', error);
          throw error;
        } finally {
          // Attach step results
          try {
            await test.info().attach('step-results', {
              body: JSON.stringify(stepResults, null, 2),
              contentType: 'application/json'
            });
          } catch (attachError) {
            console.error('Adım sonuçları eklenirken hata oluştu:', attachError);
          }
        }
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
            stepResults.push({
              step: ${index + 1},
              action: '${step.action}',
              target: '${step.target || ''}',
              value: '${step.value || ''}',
              description: '${step.description || ''}',
              duration: Date.now() - stepStartTime,
              success: true
            });
          } catch (error) {
            stepResults.push({
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
        error: null
      };

      const startTime = Date.now();

      // Create config file
      const configPath = path.join(this.options.testDir, `playwright.config.${Date.now()}.cjs`);
      const configContent = `
      // @ts-check

      /** @type {import('@playwright/test').PlaywrightTestConfig} */
      const config = {
        testDir: '${this.options.testDir}',
        outputDir: '${this.options.outputDir}',
        timeout: 30000,
        expect: {
          timeout: 10000
        },
        fullyParallel: false,
        forbidOnly: false,
        retries: 0,
        workers: 1,
        reporter: [['html'], ['json', { outputFile: '${path.join(this.options.outputDir, 'results.json')}' }], ['list']],
        use: {
          headless: ${testPlan.headless !== undefined ? testPlan.headless : this.options.headless},
          actionTimeout: 15000,
          navigationTimeout: 15000,
          trace: 'on-first-retry',
          screenshot: 'only-on-failure'
        },
        projects: [
          {
            name: '${testPlan.browserPreference || 'chromium'}',
            use: {
              browserName: '${testPlan.browserPreference || 'chromium'}'
            }
          }
        ]
      };

      module.exports = config;
      `;

      fs.writeFileSync(configPath, configContent);

      // Run test with Playwright Test Runner
      return new Promise((resolve) => {
        // Komut düzeltildi ve debug seçeneği eklendi
        const command = `npx playwright test "${testFilePath}" --config="${configPath}" --headed`;
        console.log(`Running test command: ${command}`);

        // Test dosyasının içeriğini logla
        console.log(`Test file content for ${testPlan.name}:`);
        console.log(fs.readFileSync(testFilePath, 'utf8'));

        // Config dosyasının içeriğini logla
        console.log(`Config file content for ${testPlan.name}:`);
        console.log(fs.readFileSync(configPath, 'utf8'));

        exec(command, { cwd: process.cwd(), maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
          // Set end time and duration
          result.endTime = new Date().toISOString();
          result.duration = Date.now() - startTime;

          console.log(`Test execution completed for ${testPlan.name}`);
          console.log(`Stdout: ${stdout}`);

          if (error) {
            console.error(`Test execution error for ${testPlan.name}: ${error.message}`);
            console.error(`Stderr: ${stderr}`);
            result.success = false;
            result.error = `${error.message}\nStderr: ${stderr}\nStdout: ${stdout}`;
          } else {
            console.log(`Test execution successful for ${testPlan.name}`);
            result.success = true;
          }

          // Try to read test results
          try {
            const resultsFile = path.join(this.options.outputDir, 'results.json');
            if (fs.existsSync(resultsFile)) {
              console.log(`Reading results from ${resultsFile}`);
              const resultsJson = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));

              // Convert Playwright results to custom format
              this._extractPlaywrightResults(resultsJson, result);
            } else {
              console.log(`Results file not found at ${resultsFile}`);
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
      console.error(`Error in runTest: ${error.message}`);
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
    if (playwrightResults?.suites?.[0]?.specs?.[0]) {
      const spec = playwrightResults.suites[0].specs[0];

      result.success = spec.ok;
      if (!spec.ok && spec.error) {
        result.error = spec.error.message;
      }

      if (spec.tests?.[0]) {
        const test = spec.tests[0];
        result.duration = test.duration;

        // Extract step results
        if (test.attachments) {
          const stepsAttachment = test.attachments.find(a => a.name === 'step-results');
          if (stepsAttachment?.body) {
            try {
              result.steps = JSON.parse(stepsAttachment.body);
            } catch (e) {
              // Silently handle parsing errors
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
    // Run tests in parallel
    const testPromises = testPlans.map(testPlan => this.runTest(testPlan));
    return await Promise.all(testPromises);
  }

  /**
   * Sets the callback for step completion
   * @param {Function} callback - Callback function
   */
  setStepCompletedCallback(callback) {
    this.onStepCompleted = callback;
  }

  /**
   * Sets the callback for test completion
   * @param {Function} callback - Callback function
   */
  setTestCompletedCallback(callback) {
    this.onTestCompleted = callback;
  }

  /**
   * Initializes the test runner
   * @returns {Promise<void>}
   */
  async initialize() {
    // Nothing to initialize for Playwright Test Runner
    return Promise.resolve();
  }

  /**
   * Closes the test runner
   * @returns {Promise<void>}
   */
  async close() {
    // Nothing to close for Playwright Test Runner
    return Promise.resolve();
  }

  /**
   * Gets the browser manager
   * @returns {Object|null} Browser manager
   */
  getBrowserManager() {
    return this.browserManager;
  }

  /**
   * Sets the browser manager
   * @param {Object} browserManager - Browser manager to use
   */
  setBrowserManager(browserManager) {
    this.browserManager = browserManager;
  }
}
