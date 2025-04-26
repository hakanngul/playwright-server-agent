/**
 * Test factory
 * Creates test-related components
 */

import { TestExecutor } from '../test/implementations/TestExecutor.js';
import { TestReporter } from '../test/implementations/TestReporter.js';
import { StepExecutor } from '../test/implementations/StepExecutor.js';

export class TestFactory {
  /**
   * Creates a test executor
   * @param {Object} options - Test executor options
   * @returns {ITestExecutor} Test executor
   */
  static createTestExecutor(options = {}) {
    return new TestExecutor(options);
  }

  /**
   * Creates a test reporter
   * @param {Object} options - Test reporter options
   * @returns {ITestReporter} Test reporter
   */
  static createTestReporter(options = {}) {
    return new TestReporter(options);
  }

  /**
   * Creates a step executor
   * @param {Object} page - Playwright page object
   * @param {string} screenshotsDir - Directory to save screenshots
   * @param {Function} onStepCompleted - Step completion callback
   * @param {IElementFinder & IElementInteractor} elementHelper - Element helper
   * @param {IScreenshotTaker} screenshotManager - Screenshot manager
   * @returns {Object} Step executor
   */
  static createStepExecutor(page, screenshotsDir, onStepCompleted, elementHelper, screenshotManager) {
    return new StepExecutor(page, screenshotsDir, onStepCompleted, elementHelper, screenshotManager);
  }
}
