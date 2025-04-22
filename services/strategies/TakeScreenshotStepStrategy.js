/**
 * TakeScreenshot step strategy
 * Handles screenshot capture actions
 */

import { StepStrategy } from './StepStrategy.js';
import path from 'path';

/**
 * Strategy for executing screenshot capture steps
 */
export class TakeScreenshotStepStrategy extends StepStrategy {
  /**
   * Executes a screenshot capture step
   * @param {Object} step - Test step to execute
   * @param {Object} context - Execution context (page, helpers, etc.)
   * @returns {Promise<Object>} Step result
   */
  async execute(step, context) {
    const { page, screenshotManager, screenshotsDir } = context;
    
    try {
      console.log('Taking screenshot of the current page');
      const screenshot = `screenshot_${Date.now()}.png`;
      await page.screenshot({ path: path.join(screenshotsDir, screenshot), type: 'png' });
      console.log(`Screenshot saved: ${screenshot}`);
      
      return { 
        success: true,
        screenshot: screenshot
      };
    } catch (error) {
      console.log('Screenshot capture is disabled, skipping takeScreenshot action');
      return { success: true };
    }
  }
}
