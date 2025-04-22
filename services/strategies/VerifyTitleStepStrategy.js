/**
 * VerifyTitle step strategy
 * Handles title verification actions
 */

import { StepStrategy } from './StepStrategy.js';

/**
 * Strategy for executing title verification steps
 */
export class VerifyTitleStepStrategy extends StepStrategy {
  /**
   * Executes a title verification step
   * @param {Object} step - Test step to execute
   * @param {Object} context - Execution context (page, helpers, etc.)
   * @returns {Promise<Object>} Step result
   */
  async execute(step, context) {
    const { elementHelper } = context;
    
    console.log(`Verifying title: ${step.value}`);
    const titleMatches = await elementHelper.verifyTitle(step.value, step.exactMatch);
    if (!titleMatches) {
      throw new Error(`Title verification failed: ${step.value}`);
    }
    console.log('Title verified successfully');
    
    return { success: true };
  }
}
