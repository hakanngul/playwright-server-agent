/**
 * Select step strategy
 * Handles selecting options from dropdowns
 */

import { StepStrategy } from './StepStrategy.js';

/**
 * Strategy for executing select steps
 */
export class SelectStepStrategy extends StepStrategy {
  /**
   * Executes a select step
   * @param {Object} step - Test step to execute
   * @param {Object} context - Execution context (page, helpers, etc.)
   * @returns {Promise<Object>} Step result
   */
  async execute(step, context) {
    const { elementHelper } = context;
    
    console.log(`Selecting option from element: ${step.target} using ${step.strategy}`);
    await elementHelper.selectOption(step.target, step.strategy, step.value);
    console.log('Option selected successfully');
    
    return { success: true };
  }
}
