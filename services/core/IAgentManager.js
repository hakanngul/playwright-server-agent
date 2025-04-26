/**
 * Agent manager interface
 * Defines methods for managing test agents
 */

/**
 * Interface for agent management
 * @interface
 */
export class IAgentManager {
  /**
   * Submits a test request
   * @param {Object} testPlan - Test plan to execute
   * @returns {string} Request ID
   */
  submitRequest(testPlan) {
    throw new Error('Method not implemented');
  }

  /**
   * Gets the status of a specific request
   * @param {string} requestId - Request ID
   * @returns {Object|null} Request status or null if not found
   */
  getRequestStatus(requestId) {
    throw new Error('Method not implemented');
  }

  /**
   * Gets system status
   * @returns {Object} System status
   */
  getStatus() {
    throw new Error('Method not implemented');
  }
}
