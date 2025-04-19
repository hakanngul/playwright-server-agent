/**
 * Step executor module
 * Executes test steps based on their type
 */

import { ElementHelper } from './ElementHelper.js';
import { ScreenshotManager } from './ScreenshotManager.js';
import path from 'path';

/**
 * Executes test steps
 */
export class StepExecutor {
  /**
   * Creates a new StepExecutor instance
   * @param {Page} page - Playwright page object
   * @param {string} screenshotsDir - Directory to save screenshots
   * @param {Function} onStepCompleted - Callback for step completion
   */
  constructor(page, screenshotsDir, onStepCompleted = null) {
    this.page = page;
    this.elementHelper = new ElementHelper(page);
    this.screenshotManager = new ScreenshotManager(page, screenshotsDir);
    this.onStepCompleted = onStepCompleted;
  }

  /**
   * Executes a test step
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
      switch (step.action) {
        case 'navigate':
        case 'navigateAndWait':
          await this.page.goto(step.value, {
            waitUntil: 'networkidle',
            timeout: 60000
          });
          console.log('Navigation complete');
          break;
        case 'click':
          await this.elementHelper.clickElement(step.target, step.strategy);
          break;
        case 'type':
          await this.elementHelper.typeText(step.target, step.strategy, step.value);
          break;
        case 'select':
          await this.elementHelper.selectOption(step.target, step.strategy, step.value);
          break;
        case 'wait':
          const waitTime = parseInt(step.value) || 1000;
          console.log(`Waiting for ${waitTime}ms`);
          await this.page.waitForTimeout(waitTime);
          console.log('Wait complete');
          break;
        case 'takeScreenshot':
          try {
            console.log('Taking screenshot of the current page');
            const screenshot = `screenshot_${Date.now()}.png`;
            await this.page.screenshot({ path: path.join(this.screenshotManager.screenshotsDir, screenshot), type: 'png' });
            console.log(`Screenshot saved: ${screenshot}`);
            result.screenshot = screenshot;
          } catch (error) {
            console.log('Screenshot capture is disabled, skipping takeScreenshot action');
          }
          break;
        case 'pressEnter':
          console.log('Pressing Enter key');
          await this.page.keyboard.press('Enter');
          console.log('Enter key pressed, waiting for page to load...');
          await this.page.waitForLoadState('networkidle');
          break;
        default:
          throw new Error(`Unsupported action: ${step.action}`);
      }

      result.success = true;
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
