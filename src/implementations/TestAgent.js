/**
 * Test agent implementation
 * Handles browser automation and test execution
 */

import EventEmitter from 'events';
import path from 'path';
import { IAgent } from '../interfaces/IAgent.js';
import { BrowserFactory } from '../factories/BrowserFactory.js';
import { TestFactory } from '../factories/TestFactory.js';

/**
 * Implements agent interface
 */
export class TestAgent extends EventEmitter {
  /**
   * Creates a new TestAgent instance
   * @param {string} browserType - Type of browser to use (chromium, firefox, webkit)
   * @param {Object} options - Agent configuration options
   */
  constructor(browserType = 'chromium', options = {}) {
    super();
    this.browserType = browserType;
    this.headless = options.headless !== undefined ? options.headless : true;
    this.screenshotsDir = options.screenshotsDir || path.join(process.cwd(), 'screenshots');
    this.initialized = false;
    this.busy = false;

    // Create component instances using factories
    this.browserController = BrowserFactory.createBrowserController(browserType, {
      headless: this.headless
    });

    this.testRunner = TestFactory.createTestRunner({
      browserType: this.browserType,
      headless: this.headless,
      screenshotsDir: this.screenshotsDir
    });

    this.elementInteractor = null; // Will be initialized after browser is ready

    console.log(`TestAgent created with browserType: ${browserType}, headless: ${this.headless}`);
  }

  /**
   * Initializes the agent
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
      this.elementInteractor = BrowserFactory.createElementInteractor(
        this.browserController.getPage(),
        this.screenshotsDir
      );

      // Set step completed callback
      this.testRunner.setStepCompletedCallback((step) => {
        this.emit('step:completed', step);
      });

      // Set test completed callback
      this.testRunner.setTestCompletedCallback((result) => {
        this.emit('test:completed', result);
      });

      this.initialized = true;
      this.emit('initialized');
      console.log('TestAgent initialized successfully');
    } catch (error) {
      this.emit('error', error);
      console.error('Failed to initialize TestAgent:', error);
      throw error;
    }
  }

  /**
   * Runs a test
   * @param {Object} testPlan - Test plan to run
   * @returns {Promise<Object>} Test results
   */
  async runTest(testPlan) {
    if (!this.initialized) {
      await this.initialize();
    }

    if (this.busy) {
      throw new Error('TestAgent is busy');
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
   * Closes the agent
   * @returns {Promise<void>}
   */
  async close() {
    if (this.testRunner) {
      await this.testRunner.close();
    }
    
    if (this.browserController) {
      await this.browserController.close();
    }
    
    this.initialized = false;
    this.busy = false;
    this.emit('closed');
  }

  /**
   * Checks if the agent is busy
   * @returns {boolean} True if agent is busy
   */
  isBusy() {
    return this.busy;
  }

  /**
   * Gets the current page
   * @returns {Object} Playwright page object
   */
  getPage() {
    return this.browserController.getPage();
  }
}
