/**
 * Step strategy factory
 * Creates appropriate strategy based on step type
 */

import { StepStrategyRegistry } from './StepStrategyRegistry.js';
import { StepStrategy } from './StepStrategy.js';

// Import all strategies
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

// Additional strategies for complex interactions
import { HoverAndClickMenuItemStepStrategy } from './HoverAndClickMenuItemStepStrategy.js';
import { HoverAndVerifyTooltipStepStrategy } from './HoverAndVerifyTooltipStepStrategy.js';
import { DragAndDropStepStrategy } from './DragAndDropStepStrategy.js';
import { ClickByRoleStepStrategy } from './ClickByRoleStepStrategy.js';
import { ClickByTextStepStrategy } from './ClickByTextStepStrategy.js';
import { ClickByTestIdStepStrategy } from './ClickByTestIdStepStrategy.js';
import { ClickInFrameStepStrategy } from './ClickInFrameStepStrategy.js';
import { MaximizeWindowStepStrategy } from './MaximizeWindowStepStrategy.js';
import { ClickFullscreenButtonStepStrategy } from './ClickFullscreenButtonStepStrategy.js';
import { ExitFullScreenStepStrategy } from './ExitFullScreenStepStrategy.js';
import { TakeElementScreenshotStepStrategy } from './TakeElementScreenshotStepStrategy.js';

// Register all strategies
// Navigation actions
StepStrategyRegistry.register('navigate', NavigateStepStrategy);
StepStrategyRegistry.register('navigateAndWait', NavigateStepStrategy);
StepStrategyRegistry.register('goBack', GoBackStepStrategy);
StepStrategyRegistry.register('goForward', GoForwardStepStrategy);
StepStrategyRegistry.register('refresh', RefreshStepStrategy);

// Element interaction actions
StepStrategyRegistry.register('click', ClickStepStrategy);
StepStrategyRegistry.register('doubleClick', DoubleClickStepStrategy);
StepStrategyRegistry.register('hover', HoverStepStrategy);
StepStrategyRegistry.register('type', TypeStepStrategy);
StepStrategyRegistry.register('select', SelectStepStrategy);
StepStrategyRegistry.register('check', CheckStepStrategy);
StepStrategyRegistry.register('uncheck', UncheckStepStrategy);
StepStrategyRegistry.register('upload', UploadStepStrategy);

// Complex interaction actions
StepStrategyRegistry.register('hoverAndClickMenuItem', HoverAndClickMenuItemStepStrategy);
StepStrategyRegistry.register('hoverAndVerifyTooltip', HoverAndVerifyTooltipStepStrategy);
StepStrategyRegistry.register('dragAndDrop', DragAndDropStepStrategy);

// Role-based actions
StepStrategyRegistry.register('clickByRole', ClickByRoleStepStrategy);
StepStrategyRegistry.register('clickByText', ClickByTextStepStrategy);
StepStrategyRegistry.register('clickByTestId', ClickByTestIdStepStrategy);

// Frame actions
StepStrategyRegistry.register('clickInFrame', ClickInFrameStepStrategy);

// Browser window actions
StepStrategyRegistry.register('maximizeWindow', MaximizeWindowStepStrategy);
StepStrategyRegistry.register('clickFullscreenButton', ClickFullscreenButtonStepStrategy);
StepStrategyRegistry.register('exitFullScreen', ExitFullScreenStepStrategy);

// Keyboard actions
StepStrategyRegistry.register('pressEnter', PressEnterStepStrategy);
StepStrategyRegistry.register('pressTab', PressTabStepStrategy);
StepStrategyRegistry.register('pressEscape', PressEscapeStepStrategy);

// Wait actions
StepStrategyRegistry.register('wait', WaitStepStrategy);
StepStrategyRegistry.register('waitForElement', WaitForElementStepStrategy);
StepStrategyRegistry.register('waitForElementToDisappear', WaitForElementToDisappearStepStrategy);
StepStrategyRegistry.register('waitForNavigation', WaitForNavigationStepStrategy);
StepStrategyRegistry.register('waitForURL', WaitForURLStepStrategy);

// Screenshot actions
StepStrategyRegistry.register('takeScreenshot', TakeScreenshotStepStrategy);
StepStrategyRegistry.register('takeElementScreenshot', TakeElementScreenshotStepStrategy);

// Verification actions
StepStrategyRegistry.register('verifyText', VerifyTextStepStrategy);
StepStrategyRegistry.register('verifyTitle', VerifyTitleStepStrategy);
StepStrategyRegistry.register('verifyURL', VerifyURLStepStrategy);
StepStrategyRegistry.register('verifyElementExists', VerifyElementExistsStepStrategy);
StepStrategyRegistry.register('verifyElementVisible', VerifyElementVisibleStepStrategy);

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
    return StepStrategyRegistry.getStrategy(stepType);
  }

  /**
   * Checks if a strategy is registered for a step type
   * @param {string} stepType - Type of step
   * @returns {boolean} True if a strategy is registered
   */
  static hasStrategy(stepType) {
    return StepStrategyRegistry.hasStrategy(stepType);
  }

  /**
   * Gets all registered step types
   * @returns {Array<string>} Array of registered step types
   */
  static getRegisteredStepTypes() {
    return StepStrategyRegistry.getRegisteredStepTypes();
  }

  /**
   * Registers a new strategy
   * @param {string} stepType - Type of step
   * @param {Function} strategyClass - Strategy class constructor
   */
  static registerStrategy(stepType, strategyClass) {
    StepStrategyRegistry.register(stepType, strategyClass);
  }
}
