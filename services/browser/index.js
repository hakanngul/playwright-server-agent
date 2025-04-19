/**
 * Browser automation module
 * Main entry point for browser automation functionality
 */

import path from 'path';
import { BrowserManager } from './BrowserManager.js';
import { BrowserPool } from './BrowserPool.js';
import { ElementHelper } from './ElementHelper.js';
import { ScreenshotManager } from './ScreenshotManager.js';
import { StepExecutor } from './StepExecutor.js';
import { TestRunner } from './TestRunner.js';
import { applyAntiDetectionMeasures } from './AntiDetection.js';

/**
 * TestAgent class for browser automation
 * This is a compatibility layer for the original TestAgent class
 */
export class TestAgent {
  /**
   * Creates a new TestAgent instance
   * @param {string} browserType - Type of browser to use (chromium, firefox, edge)
   * @param {Object} options - Browser configuration options
   */
  constructor(browserType = 'chromium', options = {}) {
    this.browser = null;
    this.context = null;
    this.page = null;
    this.screenshotsDir = path.join(process.cwd(), 'screenshots');
    this.browserType = browserType;
    this.headless = options.headless !== undefined ? options.headless : true;
    this.onStepCompleted = null; // Callback for step completion
    this.initialized = false;

    // Browser pool options
    this.useBrowserPool = options.useBrowserPool !== undefined ? options.useBrowserPool : false;
    this.browserPoolOptions = options.browserPoolOptions || {};
    this._browserPool = null;

    // Create internal components
    this._testRunner = null;

    console.log(`TestAgent created with browserType: ${browserType}, headless: ${this.headless}, useBrowserPool: ${this.useBrowserPool}`);

    // Initialize browser pool if enabled
    if (this.useBrowserPool) {
      this.initBrowserPool();
    }
  }

  /**
   * Initializes the browser pool
   * @returns {void}
   */
  initBrowserPool() {
    // Create browser pool with options
    const poolOptions = {
      maxSize: this.browserPoolOptions.maxSize || 5,
      minSize: this.browserPoolOptions.minSize || 2,
      idleTimeout: this.browserPoolOptions.idleTimeout || 300000,
      browserOptions: {
        headless: this.headless
      }
    };

    this._browserPool = new BrowserPool(poolOptions);
    console.log(`Browser pool created with maxSize=${poolOptions.maxSize}, minSize=${poolOptions.minSize}`);

    // Initialize the pool in the background
    this._browserPool.initialize().catch(error => {
      console.error('Failed to initialize browser pool:', error);
    });
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
      // Create and initialize test runner
      this._testRunner = new TestRunner({
        browserType: this.browserType,
        headless: this.headless,
        screenshotsDir: this.screenshotsDir,
        onStepCompleted: this.onStepCompleted,
        useBrowserPool: this.useBrowserPool,
        browserPool: this._browserPool
      });

      await this._testRunner.initialize();

      // Get references to browser, context and page
      const browserManager = this._testRunner.browserManager;
      this.browser = browserManager.browser;
      this.context = browserManager.context;
      this.page = browserManager.page;

      this.initialized = true;
      console.log('Browser initialized successfully');
    } catch (error) {
      console.error('Failed to initialize browser:', error);
      throw error;
    }
  }

  /**
   * Runs a test plan
   * @param {Object} testPlan - Test plan to run
   * @returns {Promise<Object>} Test results
   */
  async runTest(testPlan) {
    if (!this.initialized) {
      await this.initialize();
    }

    return await this._testRunner.runTest(testPlan);
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

  /**
   * Clicks on an element
   * @param {string} target - Element target (selector, xpath, etc.)
   * @param {string} strategy - Selection strategy (css, xpath, id, etc.)
   * @returns {Promise<boolean>} True if click was successful
   */
  async clickElement(target, strategy) {
    if (!this.initialized) {
      await this.initialize();
    }

    const elementHelper = new ElementHelper(this.page);
    return await elementHelper.clickElement(target, strategy);
  }

  /**
   * Types text into an element
   * @param {string} target - Element target (selector, xpath, etc.)
   * @param {string} strategy - Selection strategy (css, xpath, id, etc.)
   * @param {string} value - Text to type
   * @returns {Promise<boolean>} True if typing was successful
   */
  async typeText(target, strategy, value) {
    if (!this.initialized) {
      await this.initialize();
    }

    const elementHelper = new ElementHelper(this.page);
    return await elementHelper.typeText(target, strategy, value);
  }

  /**
   * Takes a screenshot
   * @param {string} name - Screenshot name
   * @returns {Promise<string>} Path to the saved screenshot
   */
  async takeScreenshot(name) {
    if (!this.initialized) {
      await this.initialize();
    }

    const screenshotManager = new ScreenshotManager(this.page, this.screenshotsDir);
    return await screenshotManager.takeScreenshot(name);
  }

  /**
   * Closes the browser
   * @returns {Promise<void>}
   */
  async close() {
    if (this._testRunner) {
      await this._testRunner.close();
      this.browser = null;
      this.context = null;
      this.page = null;
      this.initialized = false;
    }
  }

  /**
   * Closes the browser pool
   * @returns {Promise<void>}
   */
  async closeBrowserPool() {
    if (this._browserPool) {
      console.log('Closing browser pool...');
      await this._browserPool.close();
      this._browserPool = null;
      console.log('Browser pool closed');
    }
  }

  /**
   * Gets browser pool statistics
   * @returns {Object|null} Pool statistics or null if pool is not enabled
   */
  getBrowserPoolStats() {
    if (!this.useBrowserPool || !this._browserPool) {
      return null;
    }

    return this._browserPool.getStats();
  }

  /**
   * Sets the callback for step completion
   * @param {Function} callback - Callback function
   */
  setStepCompletedCallback(callback) {
    this.onStepCompleted = callback;

    // Update the test runner if it exists
    if (this._testRunner) {
      this._testRunner.onStepCompleted = callback;
    }
  }
}

// Export all components
export {
  BrowserManager,
  BrowserPool,
  ElementHelper,
  ScreenshotManager,
  StepExecutor,
  TestRunner,
  applyAntiDetectionMeasures
};
