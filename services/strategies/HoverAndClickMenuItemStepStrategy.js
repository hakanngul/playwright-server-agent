/**
 * HoverAndClickMenuItem step strategy
 * Handles hovering over a menu trigger and clicking a menu item
 */

import { StepStrategy } from './StepStrategy.js';

/**
 * Strategy for executing hover and click menu item steps
 */
export class HoverAndClickMenuItemStepStrategy extends StepStrategy {
  /**
   * Executes a hover and click menu item step
   * @param {Object} step - Test step to execute
   * @param {Object} context - Execution context (page, helpers, etc.)
   * @returns {Promise<Object>} Step result
   */
  async execute(step, context) {
    const { elementHelper } = context;
    
    console.log(`Hovering over menu trigger: ${step.menuTrigger} and clicking menu item: ${step.menuItem}`);
    await elementHelper.hoverAndClickMenuItem(
      step.menuTrigger,
      step.menuTriggerStrategy || step.strategy,
      step.menuItem,
      step.menuItemStrategy || step.strategy,
      {
        timeout: step.timeout,
        menuAppearDelay: step.menuAppearDelay || 500
      }
    );
    console.log('Hover and click menu item performed successfully');
    
    return { success: true };
  }
}
