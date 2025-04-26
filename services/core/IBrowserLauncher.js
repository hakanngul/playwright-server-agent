/**
 * Browser launcher interface
 * Defines methods for launching and initializing browsers
 */

/**
 * Interface for browser launcher
 * @interface
 */
export class IBrowserLauncher {
  /**
   * Initializes and launches the browser
   * @returns {Promise<void>}
   */
  async initialize() {
    throw new Error('Method not implemented');
  }

  /**
   * Checks if the browser is initialized
   * @returns {boolean} True if initialized
   */
  isInitialized() {
    throw new Error('Method not implemented');
  }

  /**
   * Gets the browser type
   * @returns {string} Browser type
   */
  getBrowserType() {
    throw new Error('Method not implemented');
  }
}
