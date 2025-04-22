/**
 * Check step strategy
 * Handles checking checkboxes
 */

import { StepStrategy } from './StepStrategy.js';

/**
 * Strategy for executing check steps
 */
export class CheckStepStrategy extends StepStrategy {
  /**
   * Executes a check step
   * @param {Object} step - Test step to execute
   * @param {Object} context - Execution context (page, helpers, etc.)
   * @returns {Promise<Object>} Step result
   */
  async execute(step, context) {
    const { elementHelper } = context;
    
    console.log(`Checking element: ${step.target} using ${step.strategy}`);
    await elementHelper.checkElement(step.target, step.strategy, true);
    console.log('Element checked successfully');
    
    return { success: true };
  }
}
