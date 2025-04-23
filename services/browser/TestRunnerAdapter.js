/**
 * Test runner adapter module
 * Adapts TestRunner to ITestRunner interface
 */

import { TestRunner } from './TestRunner.js';
import { ITestRunner } from '../interfaces/ITestRunner.js';

/**
 * Implements test runner interface
 * @implements {ITestRunner}
 */
export class TestRunnerAdapter extends ITestRunner {
  /**
   * Creates a new TestRunnerAdapter instance
   * @param {Object} options - Test runner options
   */
  constructor(options = {}) {
    super();
    this.testRunner = new TestRunner(options);
  }

  /**
   * Initializes the test runner
   * @returns {Promise<void>}
   */
  async initialize() {
    await this.testRunner.initialize();
  }

  /**
   * Runs a test plan
   * @param {Object} testPlan - Test plan to run
   * @returns {Promise<Object>} Test results
   */
  async runTest(testPlan) {
    return await this.testRunner.runTest(testPlan);
  }

  /**
   * Sets the callback for step completion
   * @param {Function} callback - Callback function
   */
  setStepCompletedCallback(callback) {
    this.testRunner.onStepCompleted = callback;
  }

  /**
   * Sets the callback for test completion
   * @param {Function} callback - Callback function
   */
  setTestCompletedCallback(callback) {
    this.testRunner.onTestCompleted = callback;
  }

  /**
   * Gets the browser manager
   * @returns {BrowserManager} Browser manager
   */
  getBrowserManager() {
    return this.testRunner.browserManager;
  }

  /**
   * Closes the test runner
   * @returns {Promise<void>}
   */
  async close() {
    await this.testRunner.close();
  }
}
