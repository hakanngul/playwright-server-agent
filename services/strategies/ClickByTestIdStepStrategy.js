/**
 * ClickByTestId step strategy
 * Handles clicking elements by test ID
 */

import { StepStrategy } from './StepStrategy.js';

/**
 * Strategy for executing click by test ID steps
 */
export class ClickByTestIdStepStrategy extends StepStrategy {
  /**
   * Executes a click by test ID step
   * @param {Object} step - Test step to execute
   * @param {Object} context - Execution context (page, helpers, etc.)
   * @returns {Promise<Object>} Step result
   */
  async execute(step, context) {
    const { elementHelper } = context;
    
    console.log(`Clicking element by test ID: ${step.testId}`);
    const testIdElement = await elementHelper.getElementByTestId(step.testId);
    if (!testIdElement) {
      throw new Error(`Element with test ID '${step.testId}' not found`);
    }
    await testIdElement.click();
    console.log('Click by test ID performed successfully');
    
    return { success: true };
  }
}
