/**
 * VerifyElementExists step strategy
 * Handles element existence verification actions
 */

import { StepStrategy } from './StepStrategy.js';

/**
 * Strategy for executing element existence verification steps
 */
export class VerifyElementExistsStepStrategy extends StepStrategy {
  /**
   * Executes an element existence verification step
   * @param {Object} step - Test step to execute
   * @param {Object} context - Execution context (page, helpers, etc.)
   * @returns {Promise<Object>} Step result
   */
  async execute(step, context) {
    const { elementHelper } = context;
    
    console.log(`Verifying element exists: ${step.target}`);
    const elementExists = await elementHelper.doesElementExist(step.target, step.strategy);
    if (!elementExists) {
      throw new Error(`Element does not exist: ${step.target}`);
    }
    console.log('Element existence verified successfully');
    
    return { success: true };
  }
}
