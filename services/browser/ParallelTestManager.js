/**
 * Parallel Test Manager
 * Manages parallel test execution using Playwright Test Runner
 */

import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { PlaywrightParallelRunner } from './PlaywrightParallelRunner.js';

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

    // Create Playwright Parallel Runner with advanced features
    this.testRunner = new PlaywrightParallelRunner({
      // Basic configuration
      workers: this.options.workers,
      browserTypes: this.options.browserTypes,
      headless: this.options.headless,
      screenshotsDir: this.options.screenshotsDir,

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
      onTestStart: this.options.onTestStart,
      onTestComplete: this.options.onTestComplete,
      onStepComplete: this.options.onStepComplete
    });

    console.log(`ParallelTestManager created with workers: ${this.options.workers}, headless: ${this.options.headless}`);
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
