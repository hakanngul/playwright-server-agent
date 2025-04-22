/**
 * Refresh step strategy
 * Handles page refresh actions
 */

import { StepStrategy } from './StepStrategy.js';

/**
 * Strategy for executing page refresh steps
 */
export class RefreshStepStrategy extends StepStrategy {
  /**
   * Executes a page refresh step
   * @param {Object} step - Test step to execute
   * @param {Object} context - Execution context (page, helpers, etc.)
   * @returns {Promise<Object>} Step result
   */
  async execute(step, context) {
    const { page } = context;
    
    console.log('Refreshing page');
    await page.reload();
    console.log('Page refreshed');
    
    return { success: true };
  }
}
