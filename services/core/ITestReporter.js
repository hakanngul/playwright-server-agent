/**
 * Test reporter interface
 * Defines methods for test reporting
 */

/**
 * Interface for test reporting
 * @interface
 */
export class ITestReporter {
  /**
   * Generates a report for test results
   * @param {Object} results - Test results
   * @returns {Promise<string>} Report ID
   */
  async generateReport(results) {
    throw new Error('Method not implemented');
  }
}
