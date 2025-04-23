/**
 * Screenshot manager module
 * NOT: Screenshot desteği kaldırıldı
 */

/**
 * Manages screenshot operations (deactivated)
 */
export class ScreenshotManager {
  /**
   * Creates a new ScreenshotManager instance
   * @param {Page} page - Playwright page object
   * @param {string} screenshotsDir - Directory to save screenshots (ignored)
   */
  constructor(page, screenshotsDir) {
    this.page = page;
    // Screenshot desteği kaldırıldı
    console.log('Screenshot support has been removed');
  }

  // Screenshot desteği kaldırıldı

  /**
   * Takes a screenshot (deactivated)
   * @param {string} name - Screenshot name
   * @param {Object} options - Screenshot options
   * @returns {Promise<string>} Empty string
   */
  async takeScreenshot(name, options = {}) {
    console.log('Screenshot support has been removed');
    return '';
  }

  /**
   * Takes a screenshot of a specific element (deactivated)
   * @param {string} selector - Element selector
   * @param {string} name - Screenshot name
   * @returns {Promise<string>} Empty string
   */
  async takeElementScreenshot(selector, name) {
    console.log('Element screenshot support has been removed');
    return '';
  }
}
