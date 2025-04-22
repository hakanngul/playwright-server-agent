/**
 * Uncheck step strategy
 * Handles unchecking checkboxes
 */

import { StepStrategy } from './StepStrategy.js';

/**
 * Strategy for executing uncheck steps
 */
export class UncheckStepStrategy extends StepStrategy {
  /**
   * Executes an uncheck step
   * @param {Object} step - Test step to execute
   * @param {Object} context - Execution context (page, helpers, etc.)
   * @returns {Promise<Object>} Step result
   */
  async execute(step, context) {
    const { elementHelper } = context;
    
    console.log(`Unchecking element: ${step.target} using ${step.strategy}`);
    await elementHelper.checkElement(step.target, step.strategy, false);
    console.log('Element unchecked successfully');
    
    return { success: true };
  }
}
