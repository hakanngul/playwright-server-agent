/**
 * Test runner module
 * Runs test plans and manages test execution
 */

import { BrowserManager } from './BrowserManager.js';
import { BrowserPool } from './BrowserPool.js';
import { StepExecutor } from './StepExecutor.js';

/**
 * Runs test plans
 */
export class TestRunner {
  /**
   * Creates a new TestRunner instance
   * @param {Object} options - Test runner options
   */
  constructor(options = {}) {
    this.browserType = options.browserType || 'chromium';
    this.headless = options.headless !== undefined ? options.headless : true;
    this.screenshotsDir = options.screenshotsDir;
    this.onStepCompleted = options.onStepCompleted || null;
    this.onTestCompleted = options.onTestCompleted || null;

    // Browser management options
    this.useBrowserPool = options.useBrowserPool !== undefined ? options.useBrowserPool : false;
    this.browserPool = options.browserPool || null;
    this.browserManager = options.browserManager || null;
    this.stepExecutor = null;
    this.browserPoolId = null; // ID for browser acquired from pool

    console.log(`TestRunner created with browserType: ${this.browserType}, headless: ${this.headless}, useBrowserPool: ${this.useBrowserPool}`);
  }

  /**
   * Initializes the test runner
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.useBrowserPool && this.browserPool) {
      // Use browser from pool
      console.log(`Acquiring ${this.browserType} browser from pool`);
      const { browserManager, id } = await this.browserPool.acquireBrowser(this.browserType, {
        headless: this.headless
      });
      this.browserManager = browserManager;
      this.browserPoolId = id;

      // Update last used timestamp
      this.browserManager.updateLastUsed();
    } else if (!this.browserManager) {
      // Create new browser manager
      console.log(`Creating new ${this.browserType} browser`);
      this.browserManager = new BrowserManager(this.browserType, {
        headless: this.headless
      });

      // Initialize browser
      await this.browserManager.initialize();
    }

    // Create step executor
    this.stepExecutor = new StepExecutor(
      this.browserManager.getPage(),
      this.screenshotsDir,
      this.onStepCompleted
    );

    console.log('TestRunner initialized');
  }

  /**
   * Runs a test plan
   * @param {Object} testPlan - Test plan to run
   * @returns {Promise<Object>} Test results
   */
  async runTest(testPlan) {
    console.log(`Running test plan: ${testPlan.name}`);

    // Initialize if not already initialized
    if (!this.browserManager || !this.browserManager.isInitialized()) {
      await this.initialize();
    } else if (this.browserManager) {
      // Update last used timestamp
      this.browserManager.updateLastUsed();
    }

    const startTime = Date.now();
    const results = {
      name: testPlan.name,
      description: testPlan.description,
      browserType: this.browserType,
      headless: this.headless,
      startTime: new Date().toISOString(),
      endTime: null,
      duration: 0,
      steps: [],
      success: false,
      error: null
    };

    try {
      // Execute each step in the test plan
      for (let i = 0; i < testPlan.steps.length; i++) {
        const step = testPlan.steps[i];
        const stepResult = await this.stepExecutor.executeStep(step, i);
        results.steps.push(stepResult);

        // If a step fails, stop execution
        if (!stepResult.success) {
          results.error = `Step ${i + 1} failed: ${stepResult.error}`;
          break;
        }
      }

      // If all steps succeeded, mark the test as successful
      if (!results.error) {
        results.success = true;
      }
    } catch (error) {
      console.error(`Error running test plan: ${error.message}`);
      results.success = false;
      results.error = error.message;
    }

    // Calculate duration and set end time
    results.endTime = new Date().toISOString();
    results.duration = Date.now() - startTime;

    // Call the test completed callback if provided
    if (this.onTestCompleted) {
      this.onTestCompleted(results);
    }

    return results;
  }

  /**
   * Closes the test runner and releases resources
   * @returns {Promise<void>}
   */
  async close() {
    console.log('Closing test runner and releasing resources...');

    if (this.useBrowserPool && this.browserPool && this.browserPoolId) {
      // Release browser back to pool
      console.log(`Releasing browser back to pool (ID: ${this.browserPoolId})`);
      try {
        await this.browserPool.releaseBrowser(this.browserPoolId);
        console.log('Browser released back to pool successfully');
      } catch (error) {
        console.error('Error releasing browser back to pool:', error);
      } finally {
        this.browserManager = null;
        this.browserPoolId = null;
        this.stepExecutor = null;
      }
    } else if (this.browserManager) {
      // Close browser directly
      try {
        await this.browserManager.close();
        console.log('Browser manager closed successfully');
      } catch (error) {
        console.error('Error closing browser manager:', error);
      } finally {
        this.browserManager = null;
        this.stepExecutor = null;
      }
    }
  }
}
