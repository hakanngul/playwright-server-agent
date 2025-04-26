/**
 * Agent factory
 * Creates agent-related components
 */

import { TestAgent } from '../agent/implementations/TestAgent.js';
import { AgentManager } from '../agent/implementations/AgentManager.js';
import { QueueSystem } from '../agent/implementations/QueueSystem.js';
import { SystemMonitor } from '../agent/implementations/SystemMonitor.js';

export class AgentFactory {
  /**
   * Creates a test agent
   * @param {string} browserType - Type of browser to use
   * @param {Object} options - Agent options
   * @returns {IAgent} Test agent
   */
  static createTestAgent(browserType = 'chromium', options = {}) {
    return new TestAgent(browserType, options);
  }

  /**
   * Creates an agent manager
   * @param {Object} options - Agent manager options
   * @returns {IAgentManager} Agent manager
   */
  static createAgentManager(options = {}) {
    return new AgentManager(options);
  }

  /**
   * Creates a queue system
   * @param {Object} options - Queue system options
   * @returns {IQueueSystem} Queue system
   */
  static createQueueSystem(options = {}) {
    return new QueueSystem(options);
  }

  /**
   * Creates a system monitor
   * @param {Object} options - System monitor options
   * @returns {ISystemMonitor} System monitor
   */
  static createSystemMonitor(options = {}) {
    return new SystemMonitor(options);
  }
}
