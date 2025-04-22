/**
 * ClickByText step strategy
 * Handles clicking elements by text content
 */

import { StepStrategy } from './StepStrategy.js';

/**
 * Strategy for executing click by text steps
 */
export class ClickByTextStepStrategy extends StepStrategy {
  /**
   * Executes a click by text step
   * @param {Object} step - Test step to execute
   * @param {Object} context - Execution context (page, helpers, etc.)
   * @returns {Promise<Object>} Step result
   */
  async execute(step, context) {
    const { elementHelper } = context;
    
    console.log(`Clicking element by text: ${step.text}`);
    const textOptions = step.options || {};
    const textElement = await elementHelper.getElementByText(step.text, textOptions);
    if (!textElement) {
      throw new Error(`Element with text '${step.text}' not found`);
    }
    await textElement.click();
    console.log('Click by text performed successfully');
    
    return { success: true };
  }
}
