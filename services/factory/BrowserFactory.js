/**
 * Browser factory
 * Creates browser-related components
 */

import { BrowserController } from '../browser/implementations/BrowserController.js';
import { ElementInteractor } from '../browser/implementations/ElementInteractor.js';
import { ScreenshotManager } from '../browser/implementations/ScreenshotManager.js';

export class BrowserFactory {
  /**
   * Creates a browser controller
   * @param {string} browserType - Type of browser to use
   * @param {Object} options - Browser options
   * @returns {IBrowserLauncher & IBrowserNavigator & IBrowserCloser} Browser controller
   */
  static createBrowserController(browserType = 'chromium', options = {}) {
    return new BrowserController(browserType, options);
  }

  /**
   * Creates an element interactor
   * @param {Object} page - Playwright page object
   * @param {string} screenshotsDir - Directory to save screenshots
   * @returns {IElementFinder & IElementInteractor} Element interactor
   */
  static createElementInteractor(page, screenshotsDir) {
    return new ElementInteractor(page, screenshotsDir);
  }

  /**
   * Creates a screenshot manager
   * @param {Object} page - Playwright page object
   * @param {string} screenshotsDir - Directory to save screenshots
   * @returns {IScreenshotTaker} Screenshot manager
   */
  static createScreenshotManager(page, screenshotsDir) {
    return new ScreenshotManager(page, screenshotsDir);
  }
}
