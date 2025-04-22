/**
 * Browser automation module
 * Main entry point for browser automation functionality
 */

import path from 'path';
import { BrowserManager } from './BrowserManager.js';
import { ElementHelper } from './ElementHelper.js';
import { ScreenshotManager } from './ScreenshotManager.js';
import { StepExecutor } from './StepExecutor.js';
import { TestRunner } from './TestRunner.js';
import { BrowserPoolManager } from './BrowserPoolManager.js';
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
    this.useBrowserPool = options.useBrowserPool !== undefined ? options.useBrowserPool : true;
    this.browserPoolManager = null;

    // Create internal components
    this._testRunner = null;

    console.log(`TestAgent created with browserType: ${browserType}, headless: ${this.headless}, useBrowserPool: ${this.useBrowserPool}`);

    // Initialize browser pool manager if enabled
    if (this.useBrowserPool) {
      this.browserPoolManager = new BrowserPoolManager({
        maxSize: options.maxPoolSize || 5,
        minSize: options.minPoolSize || 1,
        headless: this.headless
      });
    }
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
      // Initialize browser pool if enabled
      if (this.useBrowserPool && this.browserPoolManager) {
        await this.browserPoolManager.initialize();
      }

      // Create and initialize test runner
      this._testRunner = new TestRunner({
        browserType: this.browserType,
        headless: this.headless,
        screenshotsDir: this.screenshotsDir,
        onStepCompleted: this.onStepCompleted,
        useBrowserPool: this.useBrowserPool,
        browserPoolManager: this.browserPoolManager
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
    } else {
      // Tarayıcı zaten başlatılmış, son kullanım zamanını güncelle
      if (this._testRunner && this._testRunner.browserManager) {
        this._testRunner.browserManager.updateLastUsed();
      }
    }

    console.log(`Running test plan: ${testPlan.name} with browser type: ${this.browserType}`);
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

    // Note: We don't close the browser pool manager here
    // It will be kept alive for the lifetime of the server
    // to allow reusing browsers across requests
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
  ElementHelper,
  ScreenshotManager,
  StepExecutor,
  TestRunner,
  BrowserPoolManager,
  applyAntiDetectionMeasures
};
