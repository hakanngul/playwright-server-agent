/**
 * Test executor interface
 * Defines methods for test execution
 */

/**
 * Interface for test execution
 * @interface
 */
export class ITestExecutor {
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
}
