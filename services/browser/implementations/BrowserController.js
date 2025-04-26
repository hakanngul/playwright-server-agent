/**
 * Browser controller implementation
 * Handles browser initialization and management
 */

import { BrowserManager } from './BrowserManager.js';
import { IBrowserLauncher } from '../../core/IBrowserLauncher.js';
import { IBrowserNavigator } from '../../core/IBrowserNavigator.js';
import { IBrowserCloser } from '../../core/IBrowserCloser.js';

/**
 * Implements browser controller interfaces
 * @implements {IBrowserLauncher}
 * @implements {IBrowserNavigator}
 * @implements {IBrowserCloser}
 */
export class BrowserController {
  /**
   * Creates a new BrowserController instance
   * @param {string} browserType - Type of browser to use (chromium, firefox, edge)
   * @param {Object} options - Browser configuration options
   */
  constructor(browserType = 'chromium', options = {}) {
    this.browserType = browserType;
    this.headless = options.headless !== undefined ? options.headless : true;
    this.browserManager = null;
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
      // Create and initialize browser manager
      this.browserManager = new BrowserManager(this.browserType, {
        headless: this.headless
      });

      await this.browserManager.initialize();

      // Get references to browser, context and page
      this.browser = this.browserManager.browser;
      this.context = this.browserManager.context;
      this.page = this.browserManager.page;

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
    if (this.browserManager) {
      await this.browserManager.close();
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

  /**
   * Navigates to a URL
   * @param {string} url - URL to navigate to
   * @returns {Promise<void>}
   */
  async navigateTo(url) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    console.log(`Navigating to: ${url}`);
    await this.page.goto(url, { waitUntil: 'networkidle' });
  }
}
