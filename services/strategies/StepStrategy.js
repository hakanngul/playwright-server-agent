/**
 * Step strategy interface
 * Base class for all step execution strategies
 */

/**
 * Base strategy for executing test steps
 */
export class StepStrategy {
  /**
   * Executes a test step
   * @param {Object} step - Test step to execute
   * @param {Object} context - Execution context (page, helpers, etc.)
   * @returns {Promise<Object>} Step result
   */
  async execute(step, context) {
    throw new Error('This method must be implemented by subclasses');
  }
}
