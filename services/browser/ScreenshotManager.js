/**
 * Screenshot manager module
 * Handles taking and saving screenshots
 */

import fs from 'fs';
import path from 'path';

/**
 * Manages screenshot operations
 */
export class ScreenshotManager {
  /**
   * Creates a new ScreenshotManager instance
   * @param {Page} page - Playwright page object
   * @param {string} screenshotsDir - Directory to save screenshots
   */
  constructor(page, screenshotsDir) {
    this.page = page;
    this.screenshotsDir = screenshotsDir;
    this.ensureDirectoryExists();
  }

  /**
   * Ensures the screenshots directory exists
   * @private
   */
  ensureDirectoryExists() {
    if (!fs.existsSync(this.screenshotsDir)) {
      fs.mkdirSync(this.screenshotsDir, { recursive: true });
      console.log(`Created screenshots directory: ${this.screenshotsDir}`);
    }
  }

  /**
   * Takes a screenshot and saves it to the screenshots directory
   * @param {string} name - Screenshot name
   * @param {Object} options - Screenshot options
   * @returns {Promise<string>} Path to the saved screenshot
   */
  async takeScreenshot(name, options = {}) {
    try {
      // Generate a unique filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${name}_${timestamp}.png`;
      const filepath = path.join(this.screenshotsDir, filename);

      // Take the screenshot
      await this.page.screenshot({
        path: filepath,
        fullPage: options.fullPage || false,
        type: 'png',
        quality: options.quality || 80
      });

      console.log(`Screenshot saved to: ${filepath}`);
      return filepath;
    } catch (error) {
      console.error(`Error taking screenshot: ${error.message}`);
      throw error;
    }
  }

  /**
   * Takes a screenshot of a specific element
   * @param {string} selector - Element selector
   * @param {string} name - Screenshot name
   * @returns {Promise<string>} Path to the saved screenshot
   */
  async takeElementScreenshot(selector, name) {
    try {
      // Generate a unique filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${name}_element_${timestamp}.png`;
      const filepath = path.join(this.screenshotsDir, filename);

      // Find the element
      const element = await this.page.$(selector);
      if (!element) {
        throw new Error(`Element not found: ${selector}`);
      }

      // Take the screenshot of the element
      await element.screenshot({
        path: filepath,
        type: 'png'
      });

      console.log(`Element screenshot saved to: ${filepath}`);
      return filepath;
    } catch (error) {
      console.error(`Error taking element screenshot: ${error.message}`);
      throw error;
    }
  }
}
