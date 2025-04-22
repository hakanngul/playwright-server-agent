/**
 * WaitForURL step strategy
 * Handles waiting for specific URL
 */

import { StepStrategy } from './StepStrategy.js';

/**
 * Strategy for executing wait for URL steps
 */
export class WaitForURLStepStrategy extends StepStrategy {
  /**
   * Executes a wait for URL step
   * @param {Object} step - Test step to execute
   * @param {Object} context - Execution context (page, helpers, etc.)
   * @returns {Promise<Object>} Step result
   */
  async execute(step, context) {
    const { elementHelper } = context;
    
    console.log(`Waiting for URL: ${step.value}`);
    await elementHelper.waitForURL(step.value);
    console.log('URL reached');
    
    return { success: true };
  }
}
