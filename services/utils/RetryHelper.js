/**
 * Retry helper module
 * Provides utilities for retrying operations
 */

/**
 * Default retry options
 * @type {Object}
 */
const DEFAULT_RETRY_OPTIONS = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  factor: 2,
  retryOnException: true,
  retryOnResult: null,
  onRetry: null
};

/**
 * Retry helper class
 */
export class RetryHelper {
  /**
   * Creates a new RetryHelper instance
   * @param {Object} options - Retry options
   */
  constructor(options = {}) {
    this.options = { ...DEFAULT_RETRY_OPTIONS, ...options };
  }
  
  /**
   * Executes a function with retry
   * @param {Function} fn - Function to execute
   * @param {Object} options - Retry options
   * @returns {Promise<any>} Result of the function
   */
  async execute(fn, options = {}) {
    const retryOptions = { ...this.options, ...options };
    let lastError = null;
    let attempt = 0;
    
    while (attempt < retryOptions.maxRetries + 1) {
      try {
        const result = await fn();
        
        // Check if we should retry based on the result
        if (retryOptions.retryOnResult && retryOptions.retryOnResult(result)) {
          lastError = new Error(`Retry condition met on attempt ${attempt + 1}`);
          
          // Call onRetry callback if provided
          if (retryOptions.onRetry) {
            retryOptions.onRetry({
              attempt,
              error: lastError,
              result,
              willRetry: attempt < retryOptions.maxRetries
            });
          }
          
          if (attempt < retryOptions.maxRetries) {
            await this.delay(this.calculateDelay(attempt, retryOptions));
            attempt++;
            continue;
          }
          
          return result;
        }
        
        return result;
      } catch (error) {
        lastError = error;
        
        // Check if we should retry based on the exception
        if (!retryOptions.retryOnException || (error.isRetryable === false)) {
          throw error;
        }
        
        // Call onRetry callback if provided
        if (retryOptions.onRetry) {
          retryOptions.onRetry({
            attempt,
            error,
            willRetry: attempt < retryOptions.maxRetries
          });
        }
        
        if (attempt < retryOptions.maxRetries) {
          await this.delay(this.calculateDelay(attempt, retryOptions));
          attempt++;
          continue;
        }
        
        throw error;
      }
    }
    
    // This should never happen, but just in case
    throw lastError || new Error('Max retries exceeded');
  }
  
  /**
   * Calculates the delay for the next retry
   * @param {number} attempt - Current attempt
   * @param {Object} options - Retry options
   * @returns {number} Delay in milliseconds
   * @private
   */
  calculateDelay(attempt, options) {
    const delay = options.initialDelay * Math.pow(options.factor, attempt);
    return Math.min(delay, options.maxDelay);
  }
  
  /**
   * Delays execution for a specified time
   * @param {number} ms - Delay in milliseconds
   * @returns {Promise<void>} Promise that resolves after the delay
   * @private
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Creates a new RetryHelper instance with default options
 * @param {Object} options - Retry options
 * @returns {RetryHelper} RetryHelper instance
 */
export function createRetryHelper(options = {}) {
  return new RetryHelper(options);
}

/**
 * Executes a function with retry using default options
 * @param {Function} fn - Function to execute
 * @param {Object} options - Retry options
 * @returns {Promise<any>} Result of the function
 */
export async function retry(fn, options = {}) {
  const helper = new RetryHelper(options);
  return await helper.execute(fn);
}
