/**
 * WaitForElement step strategy
 * Handles waiting for elements to appear
 */

import { StepStrategy } from './StepStrategy.js';

/**
 * Strategy for executing wait for element steps
 */
export class WaitForElementStepStrategy extends StepStrategy {
  /**
   * Executes a wait for element step
   * @param {Object} step - Test step to execute
   * @param {Object} context - Execution context (page, helpers, etc.)
   * @returns {Promise<Object>} Step result
   */
  async execute(step, context) {
    const { elementHelper } = context;
    
    console.log(`Waiting for element: ${step.target}`);
    await elementHelper.waitForElementByStrategy(step.target, step.strategy, parseInt(step.timeout) || 30000);
    console.log('Element found');
    
    return { success: true };
  }
}
