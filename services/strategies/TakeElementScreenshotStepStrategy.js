/**
 * TakeElementScreenshot step strategy
 * Handles taking screenshots of specific elements
 */

import { StepStrategy } from './StepStrategy.js';
import path from 'path';

/**
 * Strategy for executing element screenshot steps
 */
export class TakeElementScreenshotStepStrategy extends StepStrategy {
  /**
   * Executes an element screenshot step
   * @param {Object} step - Test step to execute
   * @param {Object} context - Execution context (page, helpers, etc.)
   * @returns {Promise<Object>} Step result
   */
  async execute(step, context) {
    const { elementHelper, screenshotsDir } = context;
    
    try {
      console.log(`Taking screenshot of element: ${step.target}`);
      const elementScreenshot = `element_${Date.now()}.png`;
      const screenshotPath = path.join(screenshotsDir, elementScreenshot);
      await elementHelper.takeElementScreenshot(step.target, step.strategy, screenshotPath);
      console.log(`Element screenshot saved: ${elementScreenshot}`);
      
      return { 
        success: true,
        screenshot: elementScreenshot
      };
    } catch (error) {
      console.log(`Error taking element screenshot: ${error.message}`);
      throw error;
    }
  }
}
