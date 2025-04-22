/**
 * Test runner module
 * Runs test plans and manages test execution
 */

import { BrowserManager } from './BrowserManager.js';
import { StepExecutor } from './StepExecutor.js';
import { JsonReporter } from '../reporting/index.js';
import { ElementHelper } from './ElementHelper.js';
import { ScreenshotManager } from './ScreenshotManager.js';

/**
 * Interface for browser manager
 * @interface
 */
class IBrowserManager {
  /**
   * Initializes the browser
   * @returns {Promise<void>}
   */
  async initialize() {}

  /**
   * Gets the current page
   * @returns {Page|null} Playwright page object
   */
  getPage() {}

  /**
   * Checks if the browser is initialized
   * @returns {boolean} True if initialized
   */
  isInitialized() {}

  /**
   * Updates the last used timestamp
   */
  updateLastUsed() {}

  /**
   * Closes the browser and cleans up resources
   * @returns {Promise<void>}
   */
  async close() {}
}

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

    // Dependencies (can be injected)
    this.browserManager = options.browserManager || null;
    this.stepExecutor = options.stepExecutor || null;
    this.jsonReporter = options.jsonReporter || new JsonReporter({
      reportsDir: options.reportsDir || './data/reports',
      screenshotsDir: this.screenshotsDir
    });

    console.log(`TestRunner created with browserType: ${this.browserType}, headless: ${this.headless}`);
  }

  /**
   * Initializes the test runner
   * @returns {Promise<void>}
   */
  async initialize() {
    if (!this.browserManager) {
      // Create new browser manager
      console.log(`Creating new ${this.browserType} browser`);
      this.browserManager = new BrowserManager(this.browserType, {
        headless: this.headless
      });

      // Initialize browser
      await this.browserManager.initialize();
    }

    // Create step executor if not provided
    if (!this.stepExecutor) {
      const page = this.browserManager.getPage();

      // Create helper components
      const elementHelper = new ElementHelper(page);
      const screenshotManager = new ScreenshotManager(page, this.screenshotsDir);

      // Create step executor with dependencies
      this.stepExecutor = new StepExecutor(
        page,
        this.screenshotsDir,
        this.onStepCompleted,
        elementHelper,
        screenshotManager
      );
    }

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

    // Generate JSON report
    try {
      const reportId = await this.jsonReporter.generateReport(results);
      results.reportId = reportId;
      console.log(`JSON report generated with ID: ${reportId}`);
    } catch (error) {
      console.error(`Error generating JSON report: ${error.message}`);
    }

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

    if (this.browserManager) {
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
