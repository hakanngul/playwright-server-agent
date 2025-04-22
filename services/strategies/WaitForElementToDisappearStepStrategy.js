/**
 * WaitForElementToDisappear step strategy
 * Handles waiting for elements to disappear
 */

import { StepStrategy } from './StepStrategy.js';

/**
 * Strategy for executing wait for element to disappear steps
 */
export class WaitForElementToDisappearStepStrategy extends StepStrategy {
  /**
   * Executes a wait for element to disappear step
   * @param {Object} step - Test step to execute
   * @param {Object} context - Execution context (page, helpers, etc.)
   * @returns {Promise<Object>} Step result
   */
  async execute(step, context) {
    const { elementHelper } = context;
    
    console.log(`Waiting for element to disappear: ${step.target}`);
    await elementHelper.waitForElementToDisappear(step.target, step.strategy);
    console.log('Element disappeared');
    
    return { success: true };
  }
}
