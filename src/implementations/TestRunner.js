/**
 * Test runner implementation
 * Handles test execution
 */

import { ITestRunner } from '../interfaces/ITestRunner.js';
import { BrowserFactory } from '../factories/BrowserFactory.js';

/**
 * Implements test runner interface
 */
export class TestRunner extends ITestRunner {
  /**
   * Creates a new TestRunner instance
   * @param {Object} options - Test runner options
   */
  constructor(options = {}) {
    super();
    this.browserType = options.browserType || 'chromium';
    this.headless = options.headless !== undefined ? options.headless : true;
    this.screenshotsDir = options.screenshotsDir || 'screenshots';
    this.browserController = null;
    this.elementInteractor = null;
    this.onStepCompleted = null;
    this.onTestCompleted = null;
  }

  /**
   * Initializes the test runner
   * @returns {Promise<void>}
   */
  async initialize() {
    if (!this.browserController) {
      this.browserController = BrowserFactory.createBrowserController(this.browserType, {
        headless: this.headless
      });
      
      await this.browserController.initialize();
      
      this.elementInteractor = BrowserFactory.createElementInteractor(
        this.browserController.getPage(),
        this.screenshotsDir
      );
    }
  }

  /**
   * Runs a test plan
   * @param {Object} testPlan - Test plan to run
   * @returns {Promise<Object>} Test results
   */
  async runTest(testPlan) {
    if (!this.browserController || !this.browserController.isInitialized()) {
      await this.initialize();
    }

    console.log(`Running test: ${testPlan.name || 'Unnamed test'}`);
    
    const results = {
      name: testPlan.name,
      description: testPlan.description,
      browserType: this.browserType,
      headless: this.headless,
      startTime: new Date().toISOString(),
      steps: [],
      success: true,
      screenshots: []
    };

    try {
      // Execute each step in the test plan
      if (testPlan.steps && Array.isArray(testPlan.steps)) {
        for (let i = 0; i < testPlan.steps.length; i++) {
          const step = testPlan.steps[i];
          const stepResult = await this._executeStep(step, i + 1);
          
          results.steps.push(stepResult);
          
          if (this.onStepCompleted) {
            this.onStepCompleted(stepResult);
          }
          
          // If step failed, mark test as failed
          if (!stepResult.success) {
            results.success = false;
            if (stepResult.screenshot) {
              results.screenshots.push(stepResult.screenshot);
            }
            break;
          }
        }
      }
      
      results.endTime = new Date().toISOString();
      results.duration = new Date(results.endTime) - new Date(results.startTime);
      
      if (this.onTestCompleted) {
        this.onTestCompleted(results);
      }
      
      return results;
    } catch (error) {
      console.error('Error running test:', error);
      
      results.success = false;
      results.error = error.message;
      results.endTime = new Date().toISOString();
      results.duration = new Date(results.endTime) - new Date(results.startTime);
      
      // Take screenshot on error
      try {
        const screenshotPath = await this.elementInteractor.takeScreenshot('error');
        results.screenshots.push(screenshotPath);
      } catch (screenshotError) {
        console.error('Failed to take error screenshot:', screenshotError);
      }
      
      if (this.onTestCompleted) {
        this.onTestCompleted(results);
      }
      
      return results;
    }
  }

  /**
   * Sets the callback for step completion
   * @param {Function} callback - Callback function
   */
  setStepCompletedCallback(callback) {
    this.onStepCompleted = callback;
  }

  /**
   * Sets the callback for test completion
   * @param {Function} callback - Callback function
   */
  setTestCompletedCallback(callback) {
    this.onTestCompleted = callback;
  }

  /**
   * Executes a test step
   * @param {Object} step - Test step
   * @param {number} stepNumber - Step number
   * @returns {Promise<Object>} Step result
   * @private
   */
  async _executeStep(step, stepNumber) {
    console.log(`Executing step ${stepNumber}: ${step.description || step.action}`);
    
    const stepResult = {
      stepNumber,
      action: step.action,
      description: step.description,
      target: step.target,
      value: step.value,
      strategy: step.strategy || 'css',
      startTime: new Date().toISOString(),
      success: false
    };
    
    try {
      switch (step.action) {
        case 'navigate':
          await this.elementInteractor.navigateTo(step.value);
          stepResult.success = true;
          break;
          
        case 'click':
          stepResult.success = await this.elementInteractor.clickElement(step.target, step.strategy);
          break;
          
        case 'type':
          stepResult.success = await this.elementInteractor.typeText(step.target, step.strategy, step.value);
          break;
          
        case 'screenshot':
          const screenshotPath = await this.elementInteractor.takeScreenshot(step.value || 'step');
          stepResult.screenshot = screenshotPath;
          stepResult.success = true;
          break;
          
        default:
          console.warn(`Unsupported action: ${step.action}`);
          stepResult.success = false;
          stepResult.error = `Unsupported action: ${step.action}`;
      }
    } catch (error) {
      console.error(`Error executing step ${stepNumber}:`, error);
      stepResult.success = false;
      stepResult.error = error.message;
      
      // Take screenshot on error
      try {
        const screenshotPath = await this.elementInteractor.takeScreenshot(`step-${stepNumber}-error`);
        stepResult.screenshot = screenshotPath;
      } catch (screenshotError) {
        console.error('Failed to take error screenshot:', screenshotError);
      }
    }
    
    stepResult.endTime = new Date().toISOString();
    stepResult.duration = new Date(stepResult.endTime) - new Date(stepResult.startTime);
    
    return stepResult;
  }

  /**
   * Closes the test runner
   * @returns {Promise<void>}
   */
  async close() {
    if (this.browserController) {
      await this.browserController.close();
      this.browserController = null;
      this.elementInteractor = null;
    }
  }
}
