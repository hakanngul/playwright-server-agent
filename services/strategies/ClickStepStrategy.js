/**
 * Click step strategy
 * Handles click actions
 */

import { StepStrategy } from './StepStrategy.js';

/**
 * Strategy for executing click steps
 */
export class ClickStepStrategy extends StepStrategy {
  /**
   * Executes a click step
   * @param {Object} step - Test step to execute
   * @param {Object} context - Execution context (page, helpers, etc.)
   * @returns {Promise<Object>} Step result
   */
  async execute(step, context) {
    const { elementHelper } = context;
    
    console.log(`Clicking element: ${step.target} using ${step.strategy}`);
    await elementHelper.clickElement(step.target, step.strategy);
    console.log('Click performed successfully');
    
    return { success: true };
  }
}
