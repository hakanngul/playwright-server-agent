/**
 * Step executor module
 * Executes test steps based on their type
 */

import { ElementHelper } from './ElementHelper.js';
import { AppError, NavigationError } from '../errors/index.js';
import { retry } from '../utils/RetryHelper.js';
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
        // Navigation actions
        case 'navigate':
        case 'navigateAndWait':
          await retry(async () => {
            try {
              console.log(`Navigating to: ${step.value}`);
              await this.page.goto(step.value, {
                waitUntil: 'networkidle',
                timeout: step.timeout || 60000
              });
              console.log('Navigation complete');
              return true;
            } catch (error) {
              // Convert Playwright errors to our custom errors
              if (error.name === 'TimeoutError') {
                throw new NavigationError(
                  `Timeout navigating to: ${step.value}`,
                  step.value,
                  true
                );
              }

              throw new NavigationError(
                `Failed to navigate to: ${step.value} - ${error.message}`,
                step.value,
                true
              );
            }
          }, {
            maxRetries: 2,
            initialDelay: 1000,
            factor: 2,
            onRetry: ({ attempt, error, willRetry }) => {
              console.log(`Retry ${attempt} navigating to: ${step.value} (${willRetry ? 'will retry' : 'giving up'})`);
              console.error(`Error: ${error.message}`);
            }
          });
          break;
        case 'goBack':
          await this.page.goBack();
          console.log('Navigated back');
          break;
        case 'goForward':
          await this.page.goForward();
          console.log('Navigated forward');
          break;
        case 'refresh':
          await this.page.reload();
          console.log('Page refreshed');
          break;

        // Element interaction actions
        case 'click':
          await this.elementHelper.clickElement(step.target, step.strategy);
          break;
        case 'doubleClick':
          await this.elementHelper.doubleClickElement(step.target, step.strategy);
          break;
        case 'hover':
          await this.elementHelper.hoverElement(step.target, step.strategy);
          break;
        case 'type':
          await this.elementHelper.typeText(step.target, step.strategy, step.value);
          break;
        case 'select':
          await this.elementHelper.selectOption(step.target, step.strategy, step.value);
          break;
        case 'check':
          await this.elementHelper.checkElement(step.target, step.strategy, true);
          break;
        case 'uncheck':
          await this.elementHelper.checkElement(step.target, step.strategy, false);
          break;
        case 'upload':
          await this.elementHelper.uploadFile(step.target, step.strategy, step.value);
          break;

        // Keyboard actions
        case 'pressEnter':
          console.log('Pressing Enter key');
          await this.page.keyboard.press('Enter');
          console.log('Enter key pressed, waiting for page to load...');
          await this.page.waitForLoadState('networkidle');
          break;
        case 'pressTab':
          console.log('Pressing Tab key');
          await this.page.keyboard.press('Tab');
          break;
        case 'pressEscape':
          console.log('Pressing Escape key');
          await this.page.keyboard.press('Escape');
          break;

        // Wait actions
        case 'wait':
          const waitTime = parseInt(step.value) || 1000;
          console.log(`Waiting for ${waitTime}ms`);
          await this.page.waitForTimeout(waitTime);
          console.log('Wait complete');
          break;
        case 'waitForElement':
          console.log(`Waiting for element: ${step.target}`);
          await this.elementHelper.waitForElementByStrategy(step.target, step.strategy, parseInt(step.timeout) || 30000);
          console.log('Element found');
          break;
        case 'waitForElementToDisappear':
          console.log(`Waiting for element to disappear: ${step.target}`);
          await this.elementHelper.waitForElementToDisappear(step.target, step.strategy);
          console.log('Element disappeared');
          break;
        case 'waitForNavigation':
          console.log('Waiting for navigation to complete');
          await this.elementHelper.waitForNavigation();
          console.log('Navigation complete');
          break;
        case 'waitForURL':
          console.log(`Waiting for URL: ${step.value}`);
          await this.elementHelper.waitForURL(step.value);
          console.log('URL reached');
          break;

        // Screenshot actions
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
        case 'takeElementScreenshot':
          try {
            console.log(`Taking screenshot of element: ${step.target}`);
            const elementScreenshot = `element_${Date.now()}.png`;
            const screenshotPath = path.join(this.screenshotManager.screenshotsDir, elementScreenshot);
            await this.elementHelper.takeElementScreenshot(step.target, step.strategy, screenshotPath);
            console.log(`Element screenshot saved: ${elementScreenshot}`);
            result.screenshot = elementScreenshot;
          } catch (error) {
            console.log(`Error taking element screenshot: ${error.message}`);
          }
          break;

        // Verification actions
        case 'verifyText':
          console.log(`Verifying text: ${step.value}`);
          const textPresent = await this.elementHelper.verifyTextPresent(step.value);
          if (!textPresent) {
            throw new Error(`Text not found: ${step.value}`);
          }
          break;
        case 'verifyTitle':
          console.log(`Verifying title: ${step.value}`);
          const titleMatches = await this.elementHelper.verifyTitle(step.value, step.exactMatch);
          if (!titleMatches) {
            throw new Error(`Title verification failed: ${step.value}`);
          }
          break;
        case 'verifyURL':
          console.log(`Verifying URL: ${step.value}`);
          const urlMatches = await this.elementHelper.verifyURL(step.value, step.exactMatch);
          if (!urlMatches) {
            throw new Error(`URL verification failed: ${step.value}`);
          }
          break;
        case 'verifyElementExists':
          console.log(`Verifying element exists: ${step.target}`);
          const elementExists = await this.elementHelper.doesElementExist(step.target, step.strategy);
          if (!elementExists) {
            throw new Error(`Element does not exist: ${step.target}`);
          }
          break;
        case 'verifyElementVisible':
          console.log(`Verifying element is visible: ${step.target}`);
          const elementVisible = await this.elementHelper.isElementVisible(step.target, step.strategy);
          if (!elementVisible) {
            throw new Error(`Element is not visible: ${step.target}`);
          }
          break;

        // Frame actions
        case 'clickInFrame':
          console.log(`Clicking element in frame: ${step.frameName}, target: ${step.target}`);
          await this.elementHelper.clickElementInFrame(step.frameName, step.target, step.strategy);
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
