/**
 * ClickInFrame step strategy
 * Handles clicking elements inside frames
 */

import { StepStrategy } from './StepStrategy.js';

/**
 * Strategy for executing click in frame steps
 */
export class ClickInFrameStepStrategy extends StepStrategy {
  /**
   * Executes a click in frame step
   * @param {Object} step - Test step to execute
   * @param {Object} context - Execution context (page, helpers, etc.)
   * @returns {Promise<Object>} Step result
   */
  async execute(step, context) {
    const { elementHelper } = context;
    
    console.log(`Clicking element in frame: ${step.frameName}, target: ${step.target}`);
    await elementHelper.clickElementInFrame(step.frameName, step.target, step.strategy);
    console.log('Click in frame performed successfully');
    
    return { success: true };
  }
}
