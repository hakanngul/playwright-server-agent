/**
 * Upload step strategy
 * Handles file upload actions
 */

import { StepStrategy } from './StepStrategy.js';

/**
 * Strategy for executing file upload steps
 */
export class UploadStepStrategy extends StepStrategy {
  /**
   * Executes a file upload step
   * @param {Object} step - Test step to execute
   * @param {Object} context - Execution context (page, helpers, etc.)
   * @returns {Promise<Object>} Step result
   */
  async execute(step, context) {
    const { elementHelper } = context;
    
    console.log(`Uploading file to element: ${step.target} using ${step.strategy}`);
    await elementHelper.uploadFile(step.target, step.strategy, step.value);
    console.log('File uploaded successfully');
    
    return { success: true };
  }
}
