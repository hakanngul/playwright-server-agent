/**
 * Playwright Server Agent
 * Main entry point
 */

// Export interfaces
export { IBrowserController } from './interfaces/IBrowserController.js';
export { IElementInteractor } from './interfaces/IElementInteractor.js';
export { ITestRunner } from './interfaces/ITestRunner.js';
export { IAgent } from './interfaces/IAgent.js';

// Export implementations
export { BrowserController } from './implementations/BrowserController.js';
export { ElementInteractor } from './implementations/ElementInteractor.js';
export { TestRunner } from './implementations/TestRunner.js';
export { TestAgent } from './implementations/TestAgent.js';
export { AgentManager } from './implementations/AgentManager.js';

// Export factories
export { BrowserFactory } from './factories/BrowserFactory.js';
export { TestFactory } from './factories/TestFactory.js';
export { AgentFactory } from './factories/AgentFactory.js';

/**
 * Creates a test agent
 * @param {string} browserType - Type of browser to use
 * @param {Object} options - Agent options
 * @returns {TestAgent} Test agent
 */
export function createTestAgent(browserType = 'chromium', options = {}) {
  return new TestAgent(browserType, options);
}

/**
 * Creates an agent manager
 * @param {Object} options - Agent manager options
 * @returns {AgentManager} Agent manager
 */
export function createAgentManager(options = {}) {
  return new AgentManager(options);
}

/**
 * Runs a test
 * @param {Object} testPlan - Test plan to run
 * @param {Object} options - Test options
 * @returns {Promise<Object>} Test results
 */
export async function runTest(testPlan, options = {}) {
  const agent = createTestAgent(options.browserType, options);
  
  try {
    await agent.initialize();
    const result = await agent.runTest(testPlan);
    return result;
  } finally {
    await agent.close();
  }
}
