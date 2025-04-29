/**
 * Test factory
 * Creates test-related components
 */

import { TestRunner } from '../implementations/TestRunner.js';

export class TestFactory {
  /**
   * Creates a test runner
   * @param {Object} options - Test runner options
   * @returns {Object} Test runner
   */
  static createTestRunner(options = {}) {
    return new TestRunner(options);
  }
}
