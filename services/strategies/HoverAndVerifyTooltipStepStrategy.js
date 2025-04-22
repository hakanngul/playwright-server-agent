/**
 * HoverAndVerifyTooltip step strategy
 * Handles hovering over an element and verifying a tooltip
 */

import { StepStrategy } from './StepStrategy.js';

/**
 * Strategy for executing hover and verify tooltip steps
 */
export class HoverAndVerifyTooltipStepStrategy extends StepStrategy {
  /**
   * Executes a hover and verify tooltip step
   * @param {Object} step - Test step to execute
   * @param {Object} context - Execution context (page, helpers, etc.)
   * @returns {Promise<Object>} Step result
   */
  async execute(step, context) {
    const { elementHelper } = context;
    
    console.log(`Hovering over element: ${step.target} and verifying tooltip: ${step.tooltipTarget}`);
    await elementHelper.hoverAndVerifyTooltip(
      step.target,
      step.strategy,
      step.tooltipTarget,
      step.tooltipStrategy,
      {
        timeout: step.timeout,
        tooltipAppearDelay: step.tooltipAppearDelay || 500,
        getTooltipText: step.getTooltipText || false
      }
    );
    console.log('Hover and verify tooltip performed successfully');
    
    return { success: true };
  }
}
