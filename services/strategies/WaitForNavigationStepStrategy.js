/**
 * WaitForNavigation step strategy
 * Handles waiting for navigation to complete
 */

import { StepStrategy } from './StepStrategy.js';

/**
 * Strategy for executing wait for navigation steps
 */
export class WaitForNavigationStepStrategy extends StepStrategy {
  /**
   * Executes a wait for navigation step
   * @param {Object} step - Test step to execute
   * @param {Object} context - Execution context (page, helpers, etc.)
   * @returns {Promise<Object>} Step result
   */
  async execute(step, context) {
    const { elementHelper } = context;
    
    console.log('Waiting for navigation to complete');
    await elementHelper.waitForNavigation();
    console.log('Navigation complete');
    
    return { success: true };
  }
}
