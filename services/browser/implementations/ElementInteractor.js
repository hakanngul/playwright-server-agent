/**
 * Element interactor implementation
 * Handles element interactions
 */

import path from 'path';
import { ElementHelper } from './ElementHelper.js';
import { ScreenshotManager } from './ScreenshotManager.js';
import { IElementFinder } from '../../core/IElementFinder.js';
import { IElementInteractor } from '../../core/IElementInteractor.js';
import { IScreenshotTaker } from '../../core/IScreenshotTaker.js';

/**
 * Implements element interactor interfaces
 * @implements {IElementFinder}
 * @implements {IElementInteractor}
 * @implements {IScreenshotTaker}
 */
export class ElementInteractor {
  /**
   * Creates a new ElementInteractor instance
   * @param {Object} page - Playwright page object
   * @param {string} screenshotsDir - Directory to save screenshots
   */
  constructor(page, screenshotsDir = path.join(process.cwd(), 'screenshots')) {
    this.page = page;
    this.screenshotsDir = screenshotsDir;
    this.elementHelper = new ElementHelper(page);
    this.screenshotManager = new ScreenshotManager(page, screenshotsDir);
  }

  /**
   * Finds an element
   * @param {string} target - Element target (selector, xpath, etc.)
   * @param {string} strategy - Selection strategy (css, xpath, id, etc.)
   * @returns {Promise<Object>} Element handle
   */
  async findElement(target, strategy) {
    return await this.elementHelper.findElement(target, strategy);
  }

  /**
   * Checks if an element exists
   * @param {string} target - Element target (selector, xpath, etc.)
   * @param {string} strategy - Selection strategy (css, xpath, id, etc.)
   * @returns {Promise<boolean>} True if element exists
   */
  async elementExists(target, strategy) {
    return await this.elementHelper.elementExists(target, strategy);
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
