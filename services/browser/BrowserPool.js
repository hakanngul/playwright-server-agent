/**
 * Browser pool module
 * This feature has been removed from the application
 */

/**
 * Browser pool for managing multiple browser instances
 * @deprecated This feature has been removed from the application
 */
export class BrowserPool {
  /**
   * Creates a new BrowserPool instance
   * @param {Object} options - Pool options
   */
  constructor(options = {}) {
    console.warn('WARNING: Browser Pool feature has been removed from the application.');
    console.warn('This class is kept for compatibility but has no functionality.');
  }

  /**
   * Initializes the browser pool
   * @returns {Promise<void>}
   * @deprecated This feature has been removed
   */
  async initialize() {
    console.warn('Browser Pool feature has been removed. This method does nothing.');
    return Promise.resolve();
  }

  /**
   * Acquires a browser from the pool
   * @returns {Promise<Object>} Object containing browser manager and ID
   * @deprecated This feature has been removed
   */
  async acquireBrowser() {
    console.warn('Browser Pool feature has been removed. This method does nothing.');
    throw new Error('Browser Pool feature has been removed from the application.');
  }

  /**
   * Releases a browser back to the pool
   * @returns {Promise<boolean>} True if browser was released
   * @deprecated This feature has been removed
   */
  async releaseBrowser() {
    console.warn('Browser Pool feature has been removed. This method does nothing.');
    return Promise.resolve(false);
  }

  /**
   * Closes all browsers in the pool
   * @returns {Promise<void>}
   * @deprecated This feature has been removed
   */
  async close() {
    console.warn('Browser Pool feature has been removed. This method does nothing.');
    return Promise.resolve();
  }

  /**
   * Gets pool statistics
   * @returns {Object} Pool statistics
   * @deprecated This feature has been removed
   */
  getStats() {
    console.warn('Browser Pool feature has been removed. This method does nothing.');
    return {
      enabled: false,
      message: 'Browser Pool feature has been removed from the application.'
    };
  }
}
