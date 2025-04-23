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
import { applyAntiDetectionMeasures } from './AntiDetection.js';

// Import interfaces
import { IBrowserController } from '../interfaces/IBrowserController.js';
import { ITestRunner } from '../interfaces/ITestRunner.js';
import { IElementInteractor } from '../interfaces/IElementInteractor.js';

// Import implementations
import { BrowserController } from './BrowserController.js';
import { ElementInteractor } from './ElementInteractor.js';
import { TestRunnerAdapter } from './TestRunnerAdapter.js';

/**
 * TestAgent class for browser automation
 * Facade that combines browser controller, test runner, and element interactor
 */
export class TestAgent {
  /**
   * Creates a new TestAgent instance
   * @param {string} browserType - Type of browser to use (chromium, firefox, edge)
   * @param {Object} options - Browser configuration options
   */
  constructor(browserType = 'chromium', options = {}) {
    this.screenshotsDir = options.screenshotsDir || path.join(process.cwd(), 'screenshots');
    this.browserType = browserType;
    this.headless = options.headless !== undefined ? options.headless : true;
    this.onStepCompleted = null; // Callback for step completion

    // Create component instances
    this.browserController = new BrowserController(browserType, {
      headless: this.headless
    });

    this.testRunner = new TestRunnerAdapter({
      browserType: this.browserType,
      headless: this.headless,
      screenshotsDir: this.screenshotsDir
    });

    this.elementInteractor = null; // Will be initialized after browser is ready

    console.log(`TestAgent created with browserType: ${browserType}, headless: ${this.headless}`);
  }

  /**
   * Initializes the browser and components
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.browserController.isInitialized()) {
      return;
    }

    console.log(`Initializing browser (type: ${this.browserType})...`);
    try {
      // Initialize browser controller
      await this.browserController.initialize();

      // Initialize test runner
      await this.testRunner.initialize();

      // Create element interactor with the initialized page
      this.elementInteractor = new ElementInteractor(
        this.browserController.getPage(),
        this.screenshotsDir
      );

      // Set step completed callback
      if (this.onStepCompleted) {
        this.testRunner.setStepCompletedCallback(this.onStepCompleted);
      }

      console.log('Browser and components initialized successfully');
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
    if (!this.browserController.isInitialized()) {
      await this.initialize();
    }

    return await this.testRunner.runTest(testPlan);
  }

  /**
   * Navigates to a URL
   * @param {string} url - URL to navigate to
   * @returns {Promise<void>}
   */
  async navigateTo(url) {
    if (!this.browserController.isInitialized()) {
      await this.initialize();
    }

    await this.elementInteractor.navigateTo(url);
  }

  /**
   * Clicks on an element
   * @param {string} target - Element target (selector, xpath, etc.)
   * @param {string} strategy - Selection strategy (css, xpath, id, etc.)
   * @returns {Promise<boolean>} True if click was successful
   */
  async clickElement(target, strategy) {
    if (!this.browserController.isInitialized()) {
      await this.initialize();
    }

    return await this.elementInteractor.clickElement(target, strategy);
  }

  /**
   * Types text into an element
   * @param {string} target - Element target (selector, xpath, etc.)
   * @param {string} strategy - Selection strategy (css, xpath, id, etc.)
   * @param {string} value - Text to type
   * @returns {Promise<boolean>} True if typing was successful
   */
  async typeText(target, strategy, value) {
    if (!this.browserController.isInitialized()) {
      await this.initialize();
    }

    return await this.elementInteractor.typeText(target, strategy, value);
  }

  /**
   * Takes a screenshot
   * @param {string} name - Screenshot name
   * @returns {Promise<string>} Path to the saved screenshot
   */
  async takeScreenshot(name) {
    if (!this.browserController.isInitialized()) {
      await this.initialize();
    }

    return await this.elementInteractor.takeScreenshot(name);
  }

  /**
   * Closes the browser and all components
   * @returns {Promise<void>}
   */
  async close() {
    // Close test runner first
    if (this.testRunner) {
      await this.testRunner.close();
    }

    // Then close browser controller
    if (this.browserController) {
      await this.browserController.close();
    }

    // Clear element interactor
    this.elementInteractor = null;
  }

  /**
   * Sets the callback for step completion
   * @param {Function} callback - Callback function
   */
  setStepCompletedCallback(callback) {
    this.onStepCompleted = callback;

    // Update the test runner if it exists
    if (this.testRunner) {
      this.testRunner.setStepCompletedCallback(callback);
    }
  }

  /**
   * Gets the browser type
   * @returns {string} Browser type
   */
  getBrowserType() {
    return this.browserType;
  }

  /**
   * Gets the current page
   * @returns {Object} Playwright page object
   */
  getPage() {
    return this.browserController.getPage();
  }
}

// Export all components
export {
  BrowserManager,
  ElementHelper,
  ScreenshotManager,
  StepExecutor,
  TestRunner,
  applyAntiDetectionMeasures,
  BrowserController,
  ElementInteractor,
  TestRunnerAdapter
};
