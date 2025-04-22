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
import { DoubleClickStepStrategy } from './DoubleClickStepStrategy.js';
import { HoverStepStrategy } from './HoverStepStrategy.js';
import { SelectStepStrategy } from './SelectStepStrategy.js';
import { CheckStepStrategy } from './CheckStepStrategy.js';
import { UncheckStepStrategy } from './UncheckStepStrategy.js';
import { UploadStepStrategy } from './UploadStepStrategy.js';
import { PressTabStepStrategy } from './PressTabStepStrategy.js';
import { PressEscapeStepStrategy } from './PressEscapeStepStrategy.js';
import { WaitForElementStepStrategy } from './WaitForElementStepStrategy.js';
import { WaitForElementToDisappearStepStrategy } from './WaitForElementToDisappearStepStrategy.js';
import { WaitForNavigationStepStrategy } from './WaitForNavigationStepStrategy.js';
import { WaitForURLStepStrategy } from './WaitForURLStepStrategy.js';
import { VerifyTextStepStrategy } from './VerifyTextStepStrategy.js';
import { VerifyTitleStepStrategy } from './VerifyTitleStepStrategy.js';
import { VerifyURLStepStrategy } from './VerifyURLStepStrategy.js';
import { VerifyElementExistsStepStrategy } from './VerifyElementExistsStepStrategy.js';
import { VerifyElementVisibleStepStrategy } from './VerifyElementVisibleStepStrategy.js';
import { GoBackStepStrategy } from './GoBackStepStrategy.js';
import { GoForwardStepStrategy } from './GoForwardStepStrategy.js';
import { RefreshStepStrategy } from './RefreshStepStrategy.js';

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
      // Navigation actions
      case 'navigate':
      case 'navigateAndWait':
        return new NavigateStepStrategy();
      case 'goBack':
        return new GoBackStepStrategy();
      case 'goForward':
        return new GoForwardStepStrategy();
      case 'refresh':
        return new RefreshStepStrategy();

      // Element interaction actions
      case 'click':
        return new ClickStepStrategy();
      case 'doubleClick':
        return new DoubleClickStepStrategy();
      case 'hover':
        return new HoverStepStrategy();
      case 'type':
        return new TypeStepStrategy();
      case 'select':
        return new SelectStepStrategy();
      case 'check':
        return new CheckStepStrategy();
      case 'uncheck':
        return new UncheckStepStrategy();
      case 'upload':
        return new UploadStepStrategy();

      // Keyboard actions
      case 'pressEnter':
        return new PressEnterStepStrategy();
      case 'pressTab':
        return new PressTabStepStrategy();
      case 'pressEscape':
        return new PressEscapeStepStrategy();

      // Wait actions
      case 'wait':
        return new WaitStepStrategy();
      case 'waitForElement':
        return new WaitForElementStepStrategy();
      case 'waitForElementToDisappear':
        return new WaitForElementToDisappearStepStrategy();
      case 'waitForNavigation':
        return new WaitForNavigationStepStrategy();
      case 'waitForURL':
        return new WaitForURLStepStrategy();

      // Screenshot actions
      case 'takeScreenshot':
        return new TakeScreenshotStepStrategy();

      // Verification actions
      case 'verifyText':
        return new VerifyTextStepStrategy();
      case 'verifyTitle':
        return new VerifyTitleStepStrategy();
      case 'verifyURL':
        return new VerifyURLStepStrategy();
      case 'verifyElementExists':
        return new VerifyElementExistsStepStrategy();
      case 'verifyElementVisible':
        return new VerifyElementVisibleStepStrategy();

      default:
        throw new Error(`Unsupported step type: ${stepType}`);
    }
  }
}
