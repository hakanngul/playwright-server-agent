/**
 * Agent factory
 * Creates agent-related components
 */

import { TestAgent } from '../implementations/TestAgent.js';
import { AgentManager } from '../implementations/AgentManager.js';

export class AgentFactory {
  /**
   * Creates a test agent
   * @param {string} browserType - Type of browser to use
   * @param {Object} options - Agent options
   * @returns {Object} Test agent
   */
  static createTestAgent(browserType = 'chromium', options = {}) {
    return new TestAgent(browserType, options);
  }

  /**
   * Creates an agent manager
   * @param {Object} options - Agent manager options
   * @returns {Object} Agent manager
   */
  static createAgentManager(options = {}) {
    return new AgentManager(options);
  }
}
