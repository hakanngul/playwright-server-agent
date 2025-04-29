/**
 * Agent interface
 * Defines methods for agent management
 */

/**
 * Interface for agent
 */
export class IAgent {
  /**
   * Initializes the agent
   * @returns {Promise<void>}
   */
  async initialize() {
    throw new Error('Method not implemented');
  }

  /**
   * Runs a test
   * @param {Object} testPlan - Test plan to run
   * @returns {Promise<Object>} Test results
   */
  async runTest(testPlan) {
    throw new Error('Method not implemented');
  }

  /**
   * Closes the agent
   * @returns {Promise<void>}
   */
  async close() {
    throw new Error('Method not implemented');
  }

  /**
   * Checks if the agent is busy
   * @returns {boolean} True if agent is busy
   */
  isBusy() {
    throw new Error('Method not implemented');
  }
}
