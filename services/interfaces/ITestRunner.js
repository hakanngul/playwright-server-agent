/**
 * Test runner interface
 * Defines methods for test execution
 */

/**
 * Interface for test runner
 * @interface
 */
export class ITestRunner {
  /**
   * Runs a test plan
   * @param {Object} testPlan - Test plan to run
   * @returns {Promise<Object>} Test results
   */
  async runTest(testPlan) {
    throw new Error('Method not implemented');
  }

  /**
   * Sets the callback for step completion
   * @param {Function} callback - Callback function
   */
  setStepCompletedCallback(callback) {
    throw new Error('Method not implemented');
  }

  /**
   * Sets the callback for test completion
   * @param {Function} callback - Callback function
   */
  setTestCompletedCallback(callback) {
    throw new Error('Method not implemented');
  }
}
