/**
 * ClickByRole step strategy
 * Handles clicking elements by role
 */

import { StepStrategy } from './StepStrategy.js';

/**
 * Strategy for executing click by role steps
 */
export class ClickByRoleStepStrategy extends StepStrategy {
  /**
   * Executes a click by role step
   * @param {Object} step - Test step to execute
   * @param {Object} context - Execution context (page, helpers, etc.)
   * @returns {Promise<Object>} Step result
   */
  async execute(step, context) {
    const { elementHelper } = context;
    
    console.log(`Clicking element by role: ${step.role}`);
    const roleOptions = step.options || {};
    const element = await elementHelper.getElementByRole(step.role, roleOptions);
    if (!element) {
      throw new Error(`Element with role '${step.role}' not found`);
    }
    await element.click();
    console.log('Click by role performed successfully');
    
    return { success: true };
  }
}
