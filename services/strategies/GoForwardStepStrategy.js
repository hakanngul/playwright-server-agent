/**
 * GoForward step strategy
 * Handles browser forward navigation actions
 */

import { StepStrategy } from './StepStrategy.js';

/**
 * Strategy for executing browser forward navigation steps
 */
export class GoForwardStepStrategy extends StepStrategy {
  /**
   * Executes a browser forward navigation step
   * @param {Object} step - Test step to execute
   * @param {Object} context - Execution context (page, helpers, etc.)
   * @returns {Promise<Object>} Step result
   */
  async execute(step, context) {
    const { page } = context;
    
    console.log('Navigating forward');
    await page.goForward();
    console.log('Navigated forward');
    
    return { success: true };
  }
}
