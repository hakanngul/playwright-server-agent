/**
 * Browser management module
 * Handles browser initialization, configuration and cleanup using Factory Pattern
 */

import { applyAntiDetectionMeasures } from './AntiDetection.js';
import { BrowserFactoryProducer } from '../factories/BrowserFactoryProducer.js';

/**
 * Manages browser instances and configurations using Factory Pattern
 */
export class BrowserManager {
  /**
   * Creates a new BrowserManager instance
   * @param {string} browserType - Type of browser to use (chromium, firefox, edge)
   * @param {Object} options - Browser configuration options
   */
  constructor(browserType = 'chromium', options = {}) {
    this.browserType = browserType;
    this.headless = options.headless !== undefined ? options.headless : true;
    this.browser = null;
    this.context = null;
    this.page = null;
    this.initialized = false;
    this.lastUsed = Date.now(); // Track when the browser was last used

    // Get the appropriate browser factory
    this.browserFactory = BrowserFactoryProducer.getFactory(this.browserType);

    console.log(`BrowserManager created with browserType: ${browserType}, headless: ${this.headless}`);
  }

  /**
   * Initializes the browser, context and page
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    console.log(`Initializing browser (type: ${this.browserType})...`);
    try {
      // Launch the browser using factory
      this.browser = await this.launchBrowser();
      console.log('Browser launched successfully');

      // Create browser context
      this.context = await this.createBrowserContext();

      // Create a new page
      this.page = await this.context.newPage();

      // Set timeouts
      this.page.setDefaultTimeout(30000); // 30 seconds timeout for operations

      // Apply anti-detection measures
      await applyAntiDetectionMeasures(this.page, this.browserType);

      this.initialized = true;
      console.log('Browser page initialized with anti-detection measures');
    } catch (error) {
      console.error('Failed to initialize browser:', error);
      throw error;
    }
  }

  /**
   * Launches the browser using factory pattern
   * @returns {Promise<Browser>} Playwright browser instance
   * @private
   */
  async launchBrowser() {
    // Use the factory to create the browser
    return await this.browserFactory.createBrowser({
      headless: this.headless
    });
  }

  /**
   * Creates browser context with appropriate options
   * @returns {Promise<BrowserContext>} Playwright browser context
   * @private
   */
  async createBrowserContext() {
    // Get context options from the factory
    const contextOptions = this.browserFactory.createContextOptions();

    console.log(`Creating browser context for ${this.browserType}`);

    return await this.browser.newContext(contextOptions);
  }

  /**
   * Closes the browser and cleans up resources
   * @returns {Promise<void>}
   */
  async close() {
    console.log('Closing browser and cleaning up resources...');
    if (this.browser) {
      try {
        // First close the page
        if (this.page) {
          await this.page.close().catch(e => console.error('Error closing page:', e));
          this.page = null;
        }

        // Then close the context
        if (this.context) {
          await this.context.close().catch(e => console.error('Error closing context:', e));
          this.context = null;
        }

        // Finally close the browser
        await this.browser.close().catch(e => console.error('Error closing browser:', e));
        console.log('Browser closed successfully');
      } catch (error) {
        console.error('Error during browser cleanup:', error);
      } finally {
        this.browser = null;
        this.initialized = false;
      }
    }
  }

  /**
   * Gets the current page
   * @returns {Page|null} Playwright page object
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
   * Updates the last used timestamp
   */
  updateLastUsed() {
    this.lastUsed = Date.now();
  }

  /**
   * Gets the last used timestamp
   * @returns {number} Last used timestamp
   */
  getLastUsed() {
    return this.lastUsed;
  }
}
