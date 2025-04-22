/**
 * Type step strategy
 * Handles typing actions
 */

import { StepStrategy } from './StepStrategy.js';

/**
 * Strategy for executing type steps
 */
export class TypeStepStrategy extends StepStrategy {
  /**
   * Executes a type step
   * @param {Object} step - Test step to execute
   * @param {Object} context - Execution context (page, helpers, etc.)
   * @returns {Promise<Object>} Step result
   */
  async execute(step, context) {
    const { elementHelper } = context;
    
    console.log(`Typing text into element: ${step.target} using ${step.strategy}`);
    await elementHelper.typeText(step.target, step.strategy, step.value);
    console.log('Text typed successfully');
    
    return { success: true };
  }
}
