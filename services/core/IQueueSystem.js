/**
 * Queue system interface
 * Defines methods for queue management
 */

/**
 * Interface for queue system
 * @interface
 */
export class IQueueSystem {
  /**
   * Enqueues a request
   * @param {Object} request - Request to enqueue
   * @returns {string} Request ID
   */
  enqueue(request) {
    throw new Error('Method not implemented');
  }

  /**
   * Dequeues a request
   * @returns {Object|null} Next request or null if queue is empty
   */
  dequeue() {
    throw new Error('Method not implemented');
  }

  /**
   * Marks a request as completed
   * @param {string} requestId - Request ID
   * @param {Object} result - Request result
   */
  complete(requestId, result) {
    throw new Error('Method not implemented');
  }

  /**
   * Marks a request as failed
   * @param {string} requestId - Request ID
   * @param {Error} error - Error that caused the failure
   */
  fail(requestId, error) {
    throw new Error('Method not implemented');
  }

  /**
   * Gets the status of the queue
   * @returns {Object} Queue status
   */
  getStatus() {
    throw new Error('Method not implemented');
  }
}
