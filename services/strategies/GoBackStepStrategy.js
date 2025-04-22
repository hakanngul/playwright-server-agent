/**
 * GoBack step strategy
 * Handles browser back navigation actions
 */

import { StepStrategy } from './StepStrategy.js';

/**
 * Strategy for executing browser back navigation steps
 */
export class GoBackStepStrategy extends StepStrategy {
  /**
   * Executes a browser back navigation step
   * @param {Object} step - Test step to execute
   * @param {Object} context - Execution context (page, helpers, etc.)
   * @returns {Promise<Object>} Step result
   */
  async execute(step, context) {
    const { page } = context;
    
    console.log('Navigating back');
    await page.goBack();
    console.log('Navigated back');
    
    return { success: true };
  }
}
