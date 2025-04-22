/**
 * Step executor module
 * Executes test steps based on their type using Strategy Pattern
 */

import { ElementHelper } from './ElementHelper.js';
import { ScreenshotManager } from './ScreenshotManager.js';
import path from 'path';
import { StepStrategyFactory } from '../strategies/StepStrategyFactory.js';

/**
 * Executes test steps using Strategy Pattern
 */
export class StepExecutor {
  /**
   * Creates a new StepExecutor instance
   * @param {Page} page - Playwright page object
   * @param {string} screenshotsDir - Directory to save screenshots
   * @param {Function} onStepCompleted - Callback for step completion
   * @param {ElementHelper} elementHelper - Optional ElementHelper instance (for dependency injection)
   * @param {ScreenshotManager} screenshotManager - Optional ScreenshotManager instance (for dependency injection)
   */
  constructor(page, screenshotsDir, onStepCompleted = null, elementHelper = null, screenshotManager = null) {
    this.page = page;
    this.elementHelper = elementHelper || new ElementHelper(page);
    this.screenshotManager = screenshotManager || new ScreenshotManager(page, screenshotsDir);
    this.onStepCompleted = onStepCompleted;
    this.screenshotsDir = screenshotsDir;
  }

  /**
   * Executes a test step using Strategy Pattern
   * @param {Object} step - Test step to execute
   * @param {number} index - Step index
   * @returns {Promise<Object>} Step result
   */
  async executeStep(step, index) {
    console.log(`Executing step ${index + 1}: ${step.action} on ${step.target || step.value}`);

    const startTime = Date.now();
    let result = {
      step: index + 1,
      action: step.action,
      target: step.target,
      value: step.value,
      strategy: step.strategy,
      description: step.description,
      success: false,
      error: null,
      message: '',
      screenshot: null,
      startTime: new Date().toISOString(),
      endTime: null,
      duration: 0
    };

    try {
      // Create execution context with all dependencies
      const context = {
        page: this.page,
        elementHelper: this.elementHelper,
        screenshotManager: this.screenshotManager,
        screenshotsDir: this.screenshotsDir
      };

      // Get appropriate strategy for the step type
      try {
        const stepStrategy = StepStrategyFactory.getStrategy(step.action);

        // Execute the strategy
        const strategyResult = await stepStrategy.execute(step, context);

        // Update result with strategy result
        if (strategyResult) {
          if (strategyResult.screenshot) {
            result.screenshot = strategyResult.screenshot;
          }
          if (strategyResult.message) {
            result.message = strategyResult.message;
          }
        }

        result.success = true;
      } catch (error) {
        if (error.message.includes('Unsupported step type')) {
          console.warn(`No strategy found for action: ${step.action}. Using legacy execution.`);
          // Handle unsupported actions (for backward compatibility)
          throw new Error(`Unsupported action: ${step.action}`);
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error(`Error executing step ${index + 1}: ${error.message}`);
      result.success = false;
      result.error = error.message;

      // Take a screenshot on error
      try {
        const errorScreenshotPath = await this.screenshotManager.takeScreenshot(`error_step_${index + 1}`);
        result.screenshot = errorScreenshotPath;
      } catch (screenshotError) {
        console.error(`Failed to take error screenshot: ${screenshotError.message}`);
      }
    }

    // Set end time and calculate duration
    result.endTime = new Date().toISOString();
    result.duration = Date.now() - startTime;

    // Call the step completed callback if provided
    if (this.onStepCompleted) {
      this.onStepCompleted(result);
    }

    return result;
  }
}
