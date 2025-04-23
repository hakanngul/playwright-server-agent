/**
 * Navigate step strategy
 * Handles navigation actions
 */

import { StepStrategy } from './StepStrategy.js';
import { NavigationError } from '../errors/index.js';
import { retry } from '../utils/RetryHelper.js';

/**
 * Strategy for executing navigation steps
 */
export class NavigateStepStrategy extends StepStrategy {
  /**
   * Executes a navigation step
   * @param {Object} step - Test step to execute
   * @param {Object} context - Execution context (page, helpers, etc.)
   * @returns {Promise<Object>} Step result
   */
  async execute(step, context) {
    const { page } = context;

    // Get URL from either target or value field
    const url = step.target || step.value;

    if (!url) {
      throw new NavigationError(
        'Navigation step is missing URL. Please provide a URL in the target or value field.',
        '',
        false
      );
    }

    await retry(async () => {
      try {
        console.log(`Navigating to: ${url}`);
        await page.goto(url, {
          waitUntil: 'networkidle',
          timeout: step.timeout || 60000
        });
        console.log('Navigation complete');
        return true;
      } catch (error) {
        // Convert Playwright errors to our custom errors
        if (error.name === 'TimeoutError') {
          throw new NavigationError(
            `Timeout navigating to: ${url}`,
            url,
            true
          );
        }

        throw new NavigationError(
          `Failed to navigate to: ${url} - ${error.message}`,
          url,
          true
        );
      }
    }, {
      maxRetries: 2,
      initialDelay: 1000,
      factor: 2,
      onRetry: ({ attempt, error, willRetry }) => {
        console.log(`Retry ${attempt} navigating to: ${url} (${willRetry ? 'will retry' : 'giving up'})`);
        console.error(`Error: ${error.message}`);
      }
    });

    return { success: true };
  }
}
