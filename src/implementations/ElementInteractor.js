/**
 * Element interactor implementation
 * Handles element interactions
 */

import path from 'path';
import fs from 'fs';
import { IElementInteractor } from '../interfaces/IElementInteractor.js';

/**
 * Implements element interactor interface
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
    
    // Ensure screenshots directory exists
    if (!fs.existsSync(this.screenshotsDir)) {
      fs.mkdirSync(this.screenshotsDir, { recursive: true });
    }
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
  async clickElement(target, strategy = 'css') {
    try {
      const selector = this._getSelector(target, strategy);
      await this.page.waitForSelector(selector, { state: 'visible' });
      await this.page.click(selector);
      return true;
    } catch (error) {
      console.error(`Failed to click element: ${target} (${strategy})`, error);
      return false;
    }
  }

  /**
   * Types text into an element
   * @param {string} target - Element target (selector, xpath, etc.)
   * @param {string} strategy - Selection strategy (css, xpath, id, etc.)
   * @param {string} value - Text to type
   * @returns {Promise<boolean>} True if typing was successful
   */
  async typeText(target, strategy = 'css', value) {
    try {
      const selector = this._getSelector(target, strategy);
      await this.page.waitForSelector(selector, { state: 'visible' });
      await this.page.fill(selector, value);
      return true;
    } catch (error) {
      console.error(`Failed to type text into element: ${target} (${strategy})`, error);
      return false;
    }
  }

  /**
   * Takes a screenshot
   * @param {string} name - Screenshot name
   * @returns {Promise<string>} Path to the saved screenshot
   */
  async takeScreenshot(name) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${name}-${timestamp}.png`;
    const filePath = path.join(this.screenshotsDir, fileName);
    
    await this.page.screenshot({ path: filePath, fullPage: true });
    console.log(`Screenshot saved to: ${filePath}`);
    
    return filePath;
  }

  /**
   * Gets a selector based on strategy
   * @param {string} target - Element target
   * @param {string} strategy - Selection strategy
   * @returns {string} Selector
   * @private
   */
  _getSelector(target, strategy) {
    switch (strategy.toLowerCase()) {
      case 'xpath':
        return `xpath=${target}`;
      case 'id':
        return `#${target}`;
      case 'name':
        return `[name="${target}"]`;
      case 'css':
      default:
        return target;
    }
  }
}
