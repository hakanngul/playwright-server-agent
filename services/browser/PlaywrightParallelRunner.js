/**
 * Playwright Parallel Runner
 * Runs tests in parallel using Playwright Test Runner
 */

import os from 'os';
import path from 'path';
import fs from 'fs';
import { PlaywrightTestAdapter } from './PlaywrightTestAdapter.js';
import config from '../../config.js';

/**
 * Playwright Parallel Runner
 * Runs tests in parallel using Playwright Test Runner
 */
export class PlaywrightParallelRunner {
  /**
   * Creates a new PlaywrightParallelRunner instance
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
      screenshotsDir: options.screenshotsDir || path.join(process.cwd(), 'screenshots'),

      // Callbacks
      onTestStart: options.onTestStart || null,
      onTestComplete: options.onTestComplete || null,
      onStepComplete: options.onStepComplete || null,

      // Retry configuration
      retries: options.retries || config.test.retries || 1
    };

    // Ensure screenshots directory exists
    if (!fs.existsSync(this.options.screenshotsDir)) {
      fs.mkdirSync(this.options.screenshotsDir, { recursive: true });
    }

    // Create Playwright Test Adapter
    this.playwrightTestAdapter = new PlaywrightTestAdapter({
      testDir: path.join(process.cwd(), 'temp-tests'),
      outputDir: path.join(process.cwd(), 'test-results'),
      screenshotsDir: this.options.screenshotsDir,
      headless: this.options.headless,
      workers: this.options.workers,
      browserTypes: this.options.browserTypes
    });

    console.log(`PlaywrightParallelRunner created with workers: ${this.options.workers}, browsers: ${this.options.browserTypes.join(', ')}`);
    console.log(`Using Playwright Test Runner with ${this.options.retries} retries`);
  }

  /**
   * Sets the callback for test start
   * @param {Function} callback - Callback function
   */
  setTestStartCallback(callback) {
    this.options.onTestStart = callback;
    // Pass to adapter if it supports callbacks
    if (this.playwrightTestAdapter && typeof this.playwrightTestAdapter.setTestStartCallback === 'function') {
      this.playwrightTestAdapter.setTestStartCallback(callback);
    }
  }

  /**
   * Sets the callback for test completion
   * @param {Function} callback - Callback function
   */
  setTestCompletedCallback(callback) {
    this.options.onTestComplete = callback;
    // Pass to adapter if it supports callbacks
    if (this.playwrightTestAdapter && typeof this.playwrightTestAdapter.setTestCompletedCallback === 'function') {
      this.playwrightTestAdapter.setTestCompletedCallback(callback);
    }
  }

  /**
   * Sets the callback for step completion
   * @param {Function} callback - Callback function
   */
  setStepCompletedCallback(callback) {
    this.options.onStepComplete = callback;
    // Pass to adapter if it supports callbacks
    if (this.playwrightTestAdapter && typeof this.playwrightTestAdapter.setStepCompletedCallback === 'function') {
      this.playwrightTestAdapter.setStepCompletedCallback(callback);
    }
  }

  /**
   * Runs multiple tests in parallel
   * @param {Array<Object>} testPlans - Array of test plans to run
   * @returns {Promise<Array<Object>>} Test results
   */
  async runTests(testPlans) {
    console.log(`Running ${testPlans.length} tests in parallel with ${this.options.workers} workers`);

    // Always use Playwright Test Runner
    console.log('Using Playwright Test Runner for parallel execution');

    try {
      // Use Playwright Test Runner
      return await this.playwrightTestAdapter.runTests(testPlans);
    } catch (error) {
      console.error('Error running tests with Playwright Test Runner:', error);
      throw error; // Hata durumunda hatayı yukarı fırlat
    }
  }
}
