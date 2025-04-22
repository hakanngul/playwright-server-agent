/**
 * VerifyText step strategy
 * Handles text verification actions
 */

import { StepStrategy } from './StepStrategy.js';

/**
 * Strategy for executing text verification steps
 */
export class VerifyTextStepStrategy extends StepStrategy {
  /**
   * Executes a text verification step
   * @param {Object} step - Test step to execute
   * @param {Object} context - Execution context (page, helpers, etc.)
   * @returns {Promise<Object>} Step result
   */
  async execute(step, context) {
    const { elementHelper } = context;
    
    console.log(`Verifying text: ${step.value}`);
    const textPresent = await elementHelper.verifyTextPresent(step.value);
    if (!textPresent) {
      throw new Error(`Text not found: ${step.value}`);
    }
    console.log('Text verified successfully');
    
    return { success: true };
  }
}
