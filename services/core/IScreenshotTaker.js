/**
 * Screenshot taker interface
 * Defines methods for taking screenshots
 */

/**
 * Interface for screenshot taking
 * @interface
 */
export class IScreenshotTaker {
  /**
   * Takes a screenshot
   * @param {string} name - Screenshot name
   * @returns {Promise<string>} Path to the saved screenshot
   */
  async takeScreenshot(name) {
    throw new Error('Method not implemented');
  }
}
