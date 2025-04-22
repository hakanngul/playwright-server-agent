/**
 * ExitFullScreen step strategy
 * Handles exiting fullscreen mode
 */

import { StepStrategy } from './StepStrategy.js';

/**
 * Strategy for executing exit fullscreen steps
 */
export class ExitFullScreenStepStrategy extends StepStrategy {
  /**
   * Executes an exit fullscreen step
   * @param {Object} step - Test step to execute
   * @param {Object} context - Execution context (page, helpers, etc.)
   * @returns {Promise<Object>} Step result
   */
  async execute(step, context) {
    const { elementHelper } = context;
    
    console.log('Exiting fullscreen mode');
    await elementHelper.exitFullScreen();
    console.log('Exited fullscreen mode');
    
    return { success: true };
  }
}
