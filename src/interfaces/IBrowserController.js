/**
 * Browser controller interface
 * Defines methods for browser management
 */

/**
 * Interface for browser controller
 */
export class IBrowserController {
  /**
   * Initializes the browser
   * @returns {Promise<void>}
   */
  async initialize() {
    throw new Error('Method not implemented');
  }

  /**
   * Closes the browser
   * @returns {Promise<void>}
   */
  async close() {
    throw new Error('Method not implemented');
  }

  /**
   * Gets the current page
   * @returns {Object} Playwright page object
   */
  getPage() {
    throw new Error('Method not implemented');
  }

  /**
   * Gets the browser type
   * @returns {string} Browser type
   */
  getBrowserType() {
    throw new Error('Method not implemented');
  }

  /**
   * Checks if the browser is initialized
   * @returns {boolean} True if initialized
   */
  isInitialized() {
    throw new Error('Method not implemented');
  }
}
