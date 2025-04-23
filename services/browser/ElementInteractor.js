/**
 * Element interactor module
 * Handles element interactions
 */

import path from 'path';
import { ElementHelper } from './ElementHelper.js';
import { ScreenshotManager } from './ScreenshotManager.js';
import { IElementInteractor } from '../interfaces/IElementInteractor.js';

/**
 * Implements element interactor interface
 * @implements {IElementInteractor}
 */
export class ElementInteractor extends IElementInteractor {
  /**
   * Creates a new ElementInteractor instance
   * @param {Object} page - Playwright page object
   * @param {string} screenshotsDir - Directory to save screenshots
   */
  constructor(page, screenshotsDir = path.join(process.cwd(), 'screenshots')) {
    super();
    this.page = page;
    this.screenshotsDir = screenshotsDir;
    this.elementHelper = new ElementHelper(page);
    this.screenshotManager = new ScreenshotManager(page, screenshotsDir);
  }

  /**
   * Navigates to a URL
   * @param {string} url - URL to navigate to
   * @returns {Promise<void>}
   */
  async navigateTo(url) {
    console.log(`Navigating to: ${url}`);
    await this.page.goto(url, { waitUntil: 'networkidle' });
  }

  /**
   * Clicks on an element
   * @param {string} target - Element target (selector, xpath, etc.)
   * @param {string} strategy - Selection strategy (css, xpath, id, etc.)
   * @returns {Promise<boolean>} True if click was successful
   */
  async clickElement(target, strategy) {
    return await this.elementHelper.clickElement(target, strategy);
  }

  /**
   * Types text into an element
   * @param {string} target - Element target (selector, xpath, etc.)
   * @param {string} strategy - Selection strategy (css, xpath, id, etc.)
   * @param {string} value - Text to type
   * @returns {Promise<boolean>} True if typing was successful
   */
  async typeText(target, strategy, value) {
    return await this.elementHelper.typeText(target, strategy, value);
  }

  /**
   * Takes a screenshot
   * @param {string} name - Screenshot name
   * @returns {Promise<string>} Path to the saved screenshot
   */
  async takeScreenshot(name) {
    return await this.screenshotManager.takeScreenshot(name);
  }
}
