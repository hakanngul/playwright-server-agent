/**
 * Retry Manager
 * Manages automatic retries for tests and steps
 */

/**
 * Manages automatic retries for tests and steps
 */
export class RetryManager {
  /**
   * Creates a new RetryManager instance
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      maxRetries: options.maxRetries || 1,
      retryConditions: options.retryConditions || [
        // Default retry conditions
        (error) => error.message.includes('timeout'),
        (error) => error.message.includes('navigation'),
        (error) => error.message.includes('network'),
        (error) => error.message.includes('connection')
      ]
    };
    
    console.log(`RetryManager created with maxRetries: ${this.options.maxRetries}`);
  }
  
  /**
   * Runs a function with retry mechanism
   * @param {Function} fn - Function to run
   * @param {Object} context - Context for the function call
   * @returns {Promise<any>} Function result
   */
  async runWithRetry(fn, context = {}) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.options.maxRetries + 1; attempt++) {
      try {
        return await fn(context, attempt);
      } catch (error) {
        lastError = error;
        
        // If this is the last attempt, throw the error
        if (attempt > this.options.maxRetries) {
          throw error;
        }
        
        // Check if we should retry based on the error
        const shouldRetry = this.options.retryConditions.some(condition => condition(error));
        
        if (!shouldRetry) {
          throw error;
        }
        
        console.log(`Retry attempt ${attempt}/${this.options.maxRetries} for ${context.name || 'operation'}: ${error.message}`);
        
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    throw lastError;
  }
  
  /**
   * Runs a test with retry mechanism
   * @param {Function} testRunnerFn - Test runner function
   * @param {Object} testPlan - Test plan
   * @returns {Promise<Object>} Test result
   */
  async runTestWithRetry(testRunnerFn, testPlan) {
    return this.runWithRetry(
      async (context, attempt) => {
        console.log(`Running test "${testPlan.name}" (attempt ${attempt}/${this.options.maxRetries + 1})`);
        return await testRunnerFn(testPlan);
      },
      { name: testPlan.name }
    );
  }
  
  /**
   * Runs a step with retry mechanism
   * @param {Function} stepExecutorFn - Step executor function
   * @param {Object} step - Test step
   * @param {number} index - Step index
   * @returns {Promise<Object>} Step result
   */
  async runStepWithRetry(stepExecutorFn, step, index) {
    return this.runWithRetry(
      async (context, attempt) => {
        console.log(`Running step ${index + 1}: ${step.action} (attempt ${attempt}/${this.options.maxRetries + 1})`);
        return await stepExecutorFn(step, index);
      },
      { name: `Step ${index + 1}: ${step.action}` }
    );
  }
}
