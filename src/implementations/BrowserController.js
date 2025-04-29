/**
 * Browser controller implementation
 * Handles browser initialization and management
 */

import { chromium, firefox, webkit } from 'playwright';
import { IBrowserController } from '../interfaces/IBrowserController.js';

/**
 * Implements browser controller interface
 */
export class BrowserController extends IBrowserController {
  /**
   * Creates a new BrowserController instance
   * @param {string} browserType - Type of browser to use (chromium, firefox, webkit)
   * @param {Object} options - Browser configuration options
   */
  constructor(browserType = 'chromium', options = {}) {
    super();
    this.browserType = browserType;
    this.headless = options.headless !== undefined ? options.headless : true;
    this.browser = null;
    this.context = null;
    this.page = null;
    this.initialized = false;

    console.log(`BrowserController created with browserType: ${browserType}, headless: ${this.headless}`);
  }

  /**
   * Initializes the browser
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    console.log(`Initializing browser (type: ${this.browserType})...`);
    try {
      // Select browser based on type
      let browserInstance;
      switch (this.browserType) {
        case 'firefox':
          browserInstance = firefox;
          break;
        case 'webkit':
          browserInstance = webkit;
          break;
        case 'chromium':
        default:
          browserInstance = chromium;
          break;
      }

      // Launch browser
      this.browser = await browserInstance.launch({
        headless: this.headless
      });

      // Create context and page
      this.context = await this.browser.newContext();
      this.page = await this.context.newPage();

      this.initialized = true;
      console.log('Browser initialized successfully');
    } catch (error) {
      console.error('Failed to initialize browser:', error);
      throw error;
    }
  }

  /**
   * Closes the browser
   * @returns {Promise<void>}
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.context = null;
      this.page = null;
      this.initialized = false;
    }
  }

  /**
   * Gets the current page
   * @returns {Object} Playwright page object
   */
  getPage() {
    return this.page;
  }

  /**
   * Gets the browser type
   * @returns {string} Browser type
   */
  getBrowserType() {
    return this.browserType;
  }

  /**
   * Checks if the browser is initialized
   * @returns {boolean} True if initialized
   */
  isInitialized() {
    return this.initialized;
  }
}
