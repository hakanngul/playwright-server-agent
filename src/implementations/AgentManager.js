/**
 * Agent manager implementation
 * Manages test agents and distributes test requests
 */

import EventEmitter from 'events';
import os from 'os';
import { AgentFactory } from '../factories/AgentFactory.js';

export class AgentManager extends EventEmitter {
  /**
   * Creates a new AgentManager instance
   * @param {Object} options - Agent manager configuration options
   */
  constructor(options = {}) {
    super();

    // Initialize options with defaults
    this.options = {
      maxAgents: options.maxAgents || Math.max(1, os.cpus().length - 1), // Default to CPU count - 1
      agentIdleTimeout: options.agentIdleTimeout || 5 * 1000, // 5 seconds
      browserTypes: options.browserTypes || ['chromium', 'firefox', 'webkit'],
      headless: options.headless !== undefined ? options.headless : true,
      closeAgentAfterTest: options.closeAgentAfterTest !== undefined ? options.closeAgentAfterTest : true,
      ...options
    };

    // Agent tracking
    this.agents = new Map(); // All agents (id -> agent)
    this.availableAgents = new Set(); // Available agent IDs
    this.busyAgents = new Set(); // Busy agent IDs
    this.nextAgentId = 1;

    // Request queue
    this.requestQueue = [];
    this.processingInterval = null;

    // Dinamik agent sayısı ayarları
    this.dynamicAgentOptions = {
      enabled: options.dynamicAgentScaling !== false,
      minAgents: options.minAgents || 1,
      maxAgents: options.maxAgents || Math.max(1, os.cpus().length - 1),
      currentLimit: options.initialAgents || Math.min(2, Math.max(1, Math.floor(os.cpus().length / 2)))
    };

    // Start processing loop
    this._startProcessingLoop();

    console.log(`AgentManager initialized with max ${this.options.maxAgents} agents`);
  }

  /**
   * Submits a test request
   * @param {Object} testPlan - Test plan to run
   * @param {Object} options - Test options
   * @returns {Promise<string>} Request ID
   */
  async submitRequest(testPlan, options = {}) {
    const requestId = this._generateRequestId();
    
    const request = {
      id: requestId,
      testPlan,
      options: {
        browserType: options.browserType || testPlan.browserPreference || 'chromium',
        headless: options.headless !== undefined ? options.headless : this.options.headless,
        priority: options.priority || 0,
        timestamp: Date.now()
      },
      status: 'queued'
    };
    
    this.requestQueue.push(request);
    this.emit('request:queued', { requestId, position: this.requestQueue.length });
    
    console.log(`Request ${requestId} queued (${this.requestQueue.length} in queue)`);
    
    // Process queue immediately
    this.processQueue();
    
    return requestId;
  }

  /**
   * Gets the status of a request
   * @param {string} requestId - Request ID
   * @returns {Object} Request status
   */
  getRequestStatus(requestId) {
    // Check if request is in queue
    const queuedRequest = this.requestQueue.find(req => req.id === requestId);
    if (queuedRequest) {
      return {
        id: requestId,
        status: 'queued',
        position: this.requestQueue.indexOf(queuedRequest) + 1,
        queueLength: this.requestQueue.length
      };
    }
    
    // Check if request is being processed
    for (const agentId of this.busyAgents) {
      const agent = this.agents.get(agentId);
      if (agent.currentRequestId === requestId) {
        return {
          id: requestId,
          status: 'processing',
          agentId,
          browserType: agent.browserType
        };
      }
    }
    
    // Request not found
    return {
      id: requestId,
      status: 'unknown'
    };
  }

  /**
   * Process the queue immediately
   */
  processQueue() {
    console.log('Manually triggering queue processing');
    // Process multiple requests at once based on available agents
    const availableSlots = this.dynamicAgentOptions.currentLimit - this.busyAgents.size;

    if (availableSlots <= 0) {
      console.log('No available slots for processing requests');
      return;
    }

    console.log(`Processing up to ${availableSlots} requests from queue`);

    // Process multiple requests
    for (let i = 0; i < availableSlots; i++) {
      this._processNextRequest();
    }
  }

  /**
   * Starts the queue processing loop
   * @private
   */
  _startProcessingLoop() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
    
    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, 1000); // Check queue every second
  }

  /**
   * Processes the next request in the queue
   * @private
   */
  async _processNextRequest() {
    if (this.requestQueue.length === 0) {
      return;
    }
    
    // Sort queue by priority and timestamp
    this.requestQueue.sort((a, b) => {
      if (a.options.priority !== b.options.priority) {
        return b.options.priority - a.options.priority; // Higher priority first
      }
      return a.options.timestamp - b.options.timestamp; // Older requests first
    });
    
    const request = this.requestQueue.shift();
    request.status = 'processing';
    
    console.log(`Processing request ${request.id}`);
    this.emit('request:processing', { requestId: request.id });
    
    try {
      // Get an agent for the request
      const agent = await this._getAgentForRequest(request.options);
      
      if (!agent) {
        console.log(`No agent available for request ${request.id}, re-queueing`);
        request.status = 'queued';
        this.requestQueue.unshift(request);
        return;
      }
      
      // Mark agent as busy
      this.availableAgents.delete(agent.id);
      this.busyAgents.add(agent.id);
      agent.currentRequestId = request.id;
      
      // Run the test
      const result = await agent.runTest(request.testPlan);
      
      // Mark agent as available or close it
      if (this.options.closeAgentAfterTest) {
        await agent.close();
        this.agents.delete(agent.id);
        this.busyAgents.delete(agent.id);
      } else {
        this.busyAgents.delete(agent.id);
        this.availableAgents.add(agent.id);
        agent.currentRequestId = null;
      }
      
      // Emit completion event
      this.emit('request:completed', { requestId: request.id, result });
      console.log(`Request ${request.id} completed successfully`);
      
      return result;
    } catch (error) {
      console.error(`Error processing request ${request.id}:`, error);
      this.emit('request:failed', { requestId: request.id, error: error.message });
      
      // Re-queue the request if it's a temporary error
      if (error.message.includes('agent') || error.message.includes('browser')) {
        console.log(`Re-queueing request ${request.id} due to temporary error`);
        request.status = 'queued';
        request.options.timestamp = Date.now(); // Update timestamp
        this.requestQueue.push(request);
      }
      
      throw error;
    }
  }

  /**
   * Gets an agent for a request
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Agent
   * @private
   */
  async _getAgentForRequest(options) {
    const browserType = options.browserType || 'chromium';
    const headless = options.headless !== undefined ? options.headless : this.options.headless;
    
    // Check if there's an available agent with matching browser type
    for (const agentId of this.availableAgents) {
      const agent = this.agents.get(agentId);
      if (agent.browserType === browserType && agent.headless === headless) {
        return agent;
      }
    }
    
    // If no matching agent is available, check if we can create a new one
    if (this.agents.size < this.dynamicAgentOptions.currentLimit) {
      const agentId = this._createAgent({
        browserType,
        headless
      });
      
      if (agentId === null) {
        console.log("Could not create a new agent, resource limits may be exceeded");
        return null;
      }
      
      return this.agents.get(agentId);
    }
    
    // If we can't create a new agent, use any available agent
    if (this.availableAgents.size > 0) {
      const agentId = Array.from(this.availableAgents)[0];
      return this.agents.get(agentId);
    }
    
    // No agents available
    return null;
  }

  /**
   * Creates a new agent
   * @param {Object} options - Agent options
   * @returns {string} Agent ID
   * @private
   */
  _createAgent(options) {
    const agentId = this.nextAgentId++;
    
    try {
      const agent = AgentFactory.createTestAgent(options.browserType, {
        headless: options.headless,
        screenshotsDir: options.screenshotsDir || path.join(process.cwd(), 'screenshots')
      });
      
      agent.id = agentId;
      
      // Set up event listeners
      agent.on('error', (error) => {
        console.error(`Agent ${agentId} error:`, error);
        this.emit('agent:error', { agentId, error });
      });
      
      agent.on('closed', () => {
        console.log(`Agent ${agentId} closed`);
        this.emit('agent:closed', { agentId });
        
        // Remove agent from tracking
        this.agents.delete(agentId);
        this.availableAgents.delete(agentId);
        this.busyAgents.delete(agentId);
      });
      
      // Add agent to tracking
      this.agents.set(agentId, agent);
      this.availableAgents.add(agentId);
      
      console.log(`Created agent ${agentId} (${options.browserType}, headless: ${options.headless})`);
      this.emit('agent:created', { agentId, browserType: options.browserType, headless: options.headless });
      
      return agentId;
    } catch (error) {
      console.error(`Failed to create agent:`, error);
      return null;
    }
  }

  /**
   * Generates a request ID
   * @returns {string} Request ID
   * @private
   */
  _generateRequestId() {
    return `req-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }

  /**
   * Closes all agents and stops processing
   * @returns {Promise<void>}
   */
  async close() {
    // Stop processing loop
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    
    // Close all agents
    const closePromises = [];
    for (const agent of this.agents.values()) {
      closePromises.push(agent.close());
    }
    
    await Promise.all(closePromises);
    
    // Clear tracking
    this.agents.clear();
    this.availableAgents.clear();
    this.busyAgents.clear();
    this.requestQueue = [];
    
    console.log('AgentManager closed');
  }
}
