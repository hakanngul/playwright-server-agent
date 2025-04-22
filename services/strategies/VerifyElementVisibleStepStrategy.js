/**
 * VerifyElementVisible step strategy
 * Handles element visibility verification actions
 */

import { StepStrategy } from './StepStrategy.js';

/**
 * Strategy for executing element visibility verification steps
 */
export class VerifyElementVisibleStepStrategy extends StepStrategy {
  /**
   * Executes an element visibility verification step
   * @param {Object} step - Test step to execute
   * @param {Object} context - Execution context (page, helpers, etc.)
   * @returns {Promise<Object>} Step result
   */
  async execute(step, context) {
    const { elementHelper } = context;
    
    console.log(`Verifying element is visible: ${step.target}`);
    const elementVisible = await elementHelper.isElementVisible(step.target, step.strategy);
    if (!elementVisible) {
      throw new Error(`Element is not visible: ${step.target}`);
    }
    console.log('Element visibility verified successfully');
    
    return { success: true };
  }
}
