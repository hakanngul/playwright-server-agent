/**
 * Step strategy factory
 * Creates appropriate strategy based on step type
 */

import { NavigateStepStrategy } from './NavigateStepStrategy.js';
import { ClickStepStrategy } from './ClickStepStrategy.js';
import { TypeStepStrategy } from './TypeStepStrategy.js';
import { WaitStepStrategy } from './WaitStepStrategy.js';
import { PressEnterStepStrategy } from './PressEnterStepStrategy.js';
import { TakeScreenshotStepStrategy } from './TakeScreenshotStepStrategy.js';

/**
 * Factory for creating step execution strategies
 */
export class StepStrategyFactory {
  /**
   * Gets the appropriate strategy for a step type
   * @param {string} stepType - Type of step
   * @returns {StepStrategy} Strategy for executing the step
   */
  static getStrategy(stepType) {
    switch (stepType) {
      case 'navigate':
      case 'navigateAndWait':
        return new NavigateStepStrategy();
      case 'click':
        return new ClickStepStrategy();
      case 'type':
        return new TypeStepStrategy();
      case 'wait':
        return new WaitStepStrategy();
      case 'pressEnter':
        return new PressEnterStepStrategy();
      case 'takeScreenshot':
        return new TakeScreenshotStepStrategy();
      // Diğer adım türleri için stratejiler eklenebilir
      default:
        throw new Error(`Unsupported step type: ${stepType}`);
    }
  }
}
