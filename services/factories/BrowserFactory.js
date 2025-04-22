/**
 * Browser factory module
 * Creates browser instances based on browser type
 */

/**
 * Interface for browser factories
 */
export class BrowserFactory {
  /**
   * Creates a browser instance
   * @param {Object} options - Browser options
   * @returns {Promise<Browser>} Browser instance
   */
  async createBrowser(options) {
    throw new Error('This method must be implemented by subclasses');
  }

  /**
   * Creates browser context options
   * @returns {Object} Browser context options
   */
  createContextOptions() {
    throw new Error('This method must be implemented by subclasses');
  }
}
