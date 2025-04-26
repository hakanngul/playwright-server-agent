/**
 * Test Agent
 * Handles browser automation and test execution
 */

import EventEmitter from 'events';
import path from 'path';
import { BrowserController } from '../browser/BrowserController.js';
import { ElementInteractor } from '../browser/ElementInteractor.js';
import { TestRunnerAdapter } from '../browser/TestRunnerAdapter.js';

export class TestAgent extends EventEmitter {
  /**
   * Creates a new TestAgent instance
   * @param {string} browserType - Type of browser to use (chromium, firefox, edge)
   * @param {Object} options - Browser configuration options
   */
  constructor(browserType = 'chromium', options = {}) {
    super();

    this.screenshotsDir = options.screenshotsDir || path.join(process.cwd(), 'screenshots');
    this.browserType = browserType;

    // Headless modunu doğru şekilde işle
    if (options.headless === false || options.headless === 'false') {
      this.headless = false;
    } else {
      this.headless = true;
    }

    console.log(`TestAgent created with browserType: ${browserType}, headless: ${this.headless}`);

    this.onStepCompleted = null; // Callback for step completion
    this.initialized = false;
    this.busy = false;

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
  }

  /**
   * Initializes the browser and components
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

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

      this.initialized = true;
      this.emit('initialized');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Runs a test plan
   * @param {Object} testPlan - Test plan to run
   * @returns {Promise<Object>} Test results
   */
  async runTest(testPlan) {
    if (this.busy) {
      throw new Error('Agent is busy');
    }

    if (!this.initialized) {
      await this.initialize();
    }

    this.busy = true;
    this.emit('test:started', { testPlan });

    try {
      const startTime = Date.now();
      const result = await this.testRunner.runTest(testPlan);
      const duration = Date.now() - startTime;

      // Add metadata to result
      const enhancedResult = {
        ...result,
        browserType: this.browserType,
        headless: this.headless,
        duration,
        timestamp: new Date().toISOString()
      };

      this.emit('test:completed', { testPlan, result: enhancedResult });
      this.busy = false;
      return enhancedResult;
    } catch (error) {
      this.emit('test:failed', { testPlan, error });
      this.busy = false;
      throw error;
    }
  }

  /**
   * Checks if the agent is busy
   * @returns {boolean} True if agent is busy
   */
  isBusy() {
    return this.busy;
  }

  /**
   * Checks if the agent is initialized
   * @returns {boolean} True if agent is initialized
   */
  isInitialized() {
    return this.initialized;
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

  /**
   * Closes the browser and all components
   * @returns {Promise<void>}
   */
  async close() {
    try {
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
      this.initialized = false;
      this.busy = false;

      this.emit('closed');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }
}

export default TestAgent;
