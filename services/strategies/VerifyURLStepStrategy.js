/**
 * VerifyURL step strategy
 * Handles URL verification actions
 */

import { StepStrategy } from './StepStrategy.js';

/**
 * Strategy for executing URL verification steps
 */
export class VerifyURLStepStrategy extends StepStrategy {
  /**
   * Executes a URL verification step
   * @param {Object} step - Test step to execute
   * @param {Object} context - Execution context (page, helpers, etc.)
   * @returns {Promise<Object>} Step result
   */
  async execute(step, context) {
    const { elementHelper } = context;
    
    console.log(`Verifying URL: ${step.value}`);
    const urlMatches = await elementHelper.verifyURL(step.value, step.exactMatch);
    if (!urlMatches) {
      throw new Error(`URL verification failed: ${step.value}`);
    }
    console.log('URL verified successfully');
    
    return { success: true };
  }
}
