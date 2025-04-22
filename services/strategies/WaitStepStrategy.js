/**
 * Wait step strategy
 * Handles wait actions
 */

import { StepStrategy } from './StepStrategy.js';

/**
 * Strategy for executing wait steps
 */
export class WaitStepStrategy extends StepStrategy {
  /**
   * Executes a wait step
   * @param {Object} step - Test step to execute
   * @param {Object} context - Execution context (page, helpers, etc.)
   * @returns {Promise<Object>} Step result
   */
  async execute(step, context) {
    const { page } = context;
    
    const waitTime = parseInt(step.value) || 1000;
    console.log(`Waiting for ${waitTime}ms`);
    await page.waitForTimeout(waitTime);
    console.log('Wait complete');
    
    return { success: true };
  }
}
