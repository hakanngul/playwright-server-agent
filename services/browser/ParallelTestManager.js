/**
 * Parallel Test Manager
 * Manages parallel test execution using Playwright Test Runner
 */

import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { PlaywrightParallelRunner } from './PlaywrightParallelRunner.js';
import config from '../../config.js';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Manages parallel test execution
 */
export class ParallelTestManager {
  /**
   * Creates a new ParallelTestManager instance
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      // Browser configuration
      browserTypes: options.browserTypes || config.test.browserTypes || ['chromium'],
      headless: options.headless !== undefined ? options.headless : config.test.headless,

      // Parallelization
      workers: options.workers || config.test.workers || os.cpus().length,

      // Reporting
      screenshotsDir: options.screenshotsDir || config.paths.screenshotsDir || path.join(process.cwd(), 'screenshots'),

      // Callbacks
      onTestStart: options.onTestStart || null,
      onTestComplete: options.onTestComplete || null,
      onStepComplete: options.onStepComplete || null,

      // Test runner mode
      usePlaywrightTestRunner: options.usePlaywrightTestRunner !== undefined ?
        options.usePlaywrightTestRunner :
        config.test.usePlaywrightTestRunner,

      // Retry configuration
      retries: options.retries || config.test.retries || 1
    };

    // Create Playwright Parallel Runner
    this.testRunner = new PlaywrightParallelRunner({
      workers: this.options.workers,
      browserTypes: this.options.browserTypes,
      headless: this.options.headless,
      screenshotsDir: this.options.screenshotsDir,
      onTestStart: this.options.onTestStart,
      onTestComplete: this.options.onTestComplete,
      onStepComplete: this.options.onStepComplete,
      usePlaywrightTestRunner: this.options.usePlaywrightTestRunner,
      retries: this.options.retries
    });

    console.log(`ParallelTestManager created with workers: ${this.options.workers}, headless: ${this.options.headless}`);
    console.log(`Using ${this.options.usePlaywrightTestRunner ? 'Playwright Test Runner' : 'Custom Test Runner'} with ${this.options.retries} retries`);
  }

  /**
   * Runs multiple tests in parallel
   * @param {Array<Object>} testPlans - Array of test plans to run
   * @returns {Promise<Array<Object>>} Test results
   */
  async runTests(testPlans) {
    console.log(`Running ${testPlans.length} tests in parallel with ${this.options.workers} workers`);

    // Use Playwright Test Runner for parallel execution
    return await this.testRunner.runTests(testPlans);
  }

  /**
   * Sets the callback for test completion
   * @param {Function} callback - Callback function
   */
  setTestCompletedCallback(callback) {
    this.options.onTestComplete = callback;
  }
}
