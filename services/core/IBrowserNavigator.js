/**
 * Browser navigator interface
 * Defines methods for browser navigation
 */

/**
 * Interface for browser navigation
 * @interface
 */
export class IBrowserNavigator {
  /**
   * Navigates to a URL
   * @param {string} url - URL to navigate to
   * @returns {Promise<void>}
   */
  async navigateTo(url) {
    throw new Error('Method not implemented');
  }

  /**
   * Gets the current page
   * @returns {Object} Playwright page object
   */
  getPage() {
    throw new Error('Method not implemented');
  }
}
