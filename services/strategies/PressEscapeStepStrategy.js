/**
 * PressEscape step strategy
 * Handles pressing Escape key actions
 */

import { StepStrategy } from './StepStrategy.js';

/**
 * Strategy for executing press Escape key steps
 */
export class PressEscapeStepStrategy extends StepStrategy {
  /**
   * Executes a press Escape key step
   * @param {Object} step - Test step to execute
   * @param {Object} context - Execution context (page, helpers, etc.)
   * @returns {Promise<Object>} Step result
   */
  async execute(step, context) {
    const { page } = context;
    
    console.log('Pressing Escape key');
    await page.keyboard.press('Escape');
    console.log('Escape key pressed');
    
    return { success: true };
  }
}
