/**
 * DoubleClick step strategy
 * Handles double-clicking actions
 */

import { StepStrategy } from './StepStrategy.js';

/**
 * Strategy for executing double-click steps
 */
export class DoubleClickStepStrategy extends StepStrategy {
  /**
   * Executes a double-click step
   * @param {Object} step - Test step to execute
   * @param {Object} context - Execution context (page, helpers, etc.)
   * @returns {Promise<Object>} Step result
   */
  async execute(step, context) {
    const { elementHelper } = context;
    
    console.log(`Double-clicking element: ${step.target} using ${step.strategy}`);
    await elementHelper.doubleClickElement(step.target, step.strategy);
    console.log('Double-click performed successfully');
    
    return { success: true };
  }
}
