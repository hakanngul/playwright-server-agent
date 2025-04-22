/**
 * PressEnter step strategy
 * Handles pressing Enter key actions
 */

import { StepStrategy } from './StepStrategy.js';

/**
 * Strategy for executing press Enter key steps
 */
export class PressEnterStepStrategy extends StepStrategy {
  /**
   * Executes a press Enter key step
   * @param {Object} step - Test step to execute
   * @param {Object} context - Execution context (page, helpers, etc.)
   * @returns {Promise<Object>} Step result
   */
  async execute(step, context) {
    const { page } = context;
    
    console.log('Pressing Enter key');
    await page.keyboard.press('Enter');
    console.log('Enter key pressed, waiting for page to load...');
    await page.waitForLoadState('networkidle');
    
    return { success: true };
  }
}
