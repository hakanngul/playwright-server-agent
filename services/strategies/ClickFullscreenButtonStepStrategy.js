/**
 * ClickFullscreenButton step strategy
 * Handles clicking fullscreen button
 */

import { StepStrategy } from './StepStrategy.js';

/**
 * Strategy for executing click fullscreen button steps
 */
export class ClickFullscreenButtonStepStrategy extends StepStrategy {
  /**
   * Executes a click fullscreen button step
   * @param {Object} step - Test step to execute
   * @param {Object} context - Execution context (page, helpers, etc.)
   * @returns {Promise<Object>} Step result
   */
  async execute(step, context) {
    const { elementHelper } = context;
    
    console.log('Clicking fullscreen button');
    try {
      // Tam ekran butonunu bulmak ve tıklamak için
      if (step.target) {
        await elementHelper.clickElement(step.target, step.strategy || 'css');
        console.log('Clicked on fullscreen button');
      } else {
        throw new Error('Target selector for fullscreen button is required');
      }
    } catch (error) {
      console.error(`Error clicking fullscreen button: ${error.message}`);
      throw error;
    }
    
    return { success: true };
  }
}
