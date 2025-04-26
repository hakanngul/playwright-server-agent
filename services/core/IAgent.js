/**
 * Agent interface
 * Defines methods for test agents
 */

/**
 * Interface for test agents
 * @interface
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
   * Runs a test plan
   * @param {Object} testPlan - Test plan to run
   * @returns {Promise<Object>} Test results
   */
  async runTest(testPlan) {
    throw new Error('Method not implemented');
  }

  /**
   * Checks if the agent is busy
   * @returns {boolean} True if agent is busy
   */
  isBusy() {
    throw new Error('Method not implemented');
  }

  /**
   * Checks if the agent is initialized
   * @returns {boolean} True if agent is initialized
   */
  isInitialized() {
    throw new Error('Method not implemented');
  }

  /**
   * Closes the agent
   * @returns {Promise<void>}
   */
  async close() {
    throw new Error('Method not implemented');
  }
}
