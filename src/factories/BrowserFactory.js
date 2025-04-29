/**
 * Browser factory
 * Creates browser-related components
 */

import { BrowserController } from '../implementations/BrowserController.js';
import { ElementInteractor } from '../implementations/ElementInteractor.js';

export class BrowserFactory {
  /**
   * Creates a browser controller
   * @param {string} browserType - Type of browser to use
   * @param {Object} options - Browser options
   * @returns {Object} Browser controller
   */
  static createBrowserController(browserType = 'chromium', options = {}) {
    return new BrowserController(browserType, options);
  }

  /**
   * Creates an element interactor
   * @param {Object} page - Playwright page object
   * @param {string} screenshotsDir - Directory to save screenshots
   * @returns {Object} Element interactor
   */
  static createElementInteractor(page, screenshotsDir) {
    return new ElementInteractor(page, screenshotsDir);
  }
}
