/**
 * Hover step strategy
 * Handles hovering over elements
 */

import { StepStrategy } from './StepStrategy.js';

/**
 * Strategy for executing hover steps
 */
export class HoverStepStrategy extends StepStrategy {
  /**
   * Executes a hover step
   * @param {Object} step - Test step to execute
   * @param {Object} context - Execution context (page, helpers, etc.)
   * @returns {Promise<Object>} Step result
   */
  async execute(step, context) {
    const { elementHelper } = context;
    
    console.log(`Hovering over element: ${step.target} using ${step.strategy}`);
    await elementHelper.hoverElement(step.target, step.strategy);
    console.log('Hover performed successfully');
    
    return { success: true };
  }
}
