/**
 * Browser closer interface
 * Defines methods for closing browsers
 */

/**
 * Interface for browser closing
 * @interface
 */
export class IBrowserCloser {
  /**
   * Closes the browser
   * @returns {Promise<void>}
   */
  async close() {
    throw new Error('Method not implemented');
  }
}
