/**
 * DragAndDrop step strategy
 * Handles dragging and dropping elements
 */

import { StepStrategy } from './StepStrategy.js';

/**
 * Strategy for executing drag and drop steps
 */
export class DragAndDropStepStrategy extends StepStrategy {
  /**
   * Executes a drag and drop step
   * @param {Object} step - Test step to execute
   * @param {Object} context - Execution context (page, helpers, etc.)
   * @returns {Promise<Object>} Step result
   */
  async execute(step, context) {
    const { elementHelper } = context;
    
    console.log(`Dragging element: ${step.sourceTarget} to element: ${step.targetTarget}`);
    await elementHelper.dragAndDrop(
      step.sourceTarget,
      step.sourceStrategy || step.strategy,
      step.targetTarget,
      step.targetStrategy || step.strategy,
      {
        timeout: step.timeout,
        method: step.method || 'auto'
      }
    );
    console.log('Drag and drop performed successfully');
    
    return { success: true };
  }
}
