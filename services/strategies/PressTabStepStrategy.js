/**
 * PressTab step strategy
 * Handles pressing Tab key actions
 */

import { StepStrategy } from './StepStrategy.js';

/**
 * Strategy for executing press Tab key steps
 */
export class PressTabStepStrategy extends StepStrategy {
  /**
   * Executes a press Tab key step
   * @param {Object} step - Test step to execute
   * @param {Object} context - Execution context (page, helpers, etc.)
   * @returns {Promise<Object>} Step result
   */
  async execute(step, context) {
    const { page } = context;
    
    console.log('Pressing Tab key');
    await page.keyboard.press('Tab');
    console.log('Tab key pressed');
    
    return { success: true };
  }
}
