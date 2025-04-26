/**
 * Agent Manager
 * Manages test agents and distributes test requests
 */

import EventEmitter from 'events';
import os from 'os';
import { TestAgent } from './TestAgent.js';
import QueueSystem from './QueueSystem.js';
import SystemMonitor from './SystemMonitor.js';

export class AgentManager extends EventEmitter {
  constructor(options = {}) {
    super();

    // Initialize options with defaults
    this.options = {
      maxAgents: options.maxAgents || Math.max(1, os.cpus().length - 1), // Default to CPU count - 1
      agentIdleTimeout: options.agentIdleTimeout || 5 * 1000, // 5 seconds (was 30 seconds)
      browserTypes: options.browserTypes || ['chromium', 'firefox', 'webkit', 'edge'],
      headless: options.headless !== undefined ? options.headless : true,
      closeAgentAfterTest: options.closeAgentAfterTest !== undefined ? options.closeAgentAfterTest : true, // Testi tamamladıktan sonra agent'ı kapat
      ...options
    };

    // Initialize agent pool
    this.agents = new Map(); // Map of agentId -> agent
    this.availableAgents = new Set(); // Set of available agent IDs
    this.busyAgents = new Set(); // Set of busy agent IDs

    // Initialize queue system
    this.queueSystem = new QueueSystem({
      maxQueueSize: options.maxQueueSize || 100,
      requestTimeout: options.requestTimeout || 30 * 60 * 1000
    });

    // Initialize system monitor
    this.systemMonitor = new SystemMonitor({
      cpuThresholdHigh: options.cpuThresholdHigh || 80,
      cpuThresholdLow: options.cpuThresholdLow || 20,
      memoryThresholdHigh: options.memoryThresholdHigh || 80,
      memoryThresholdLow: options.memoryThresholdLow || 20
    });

    // Dinamik agent sayısı ayarları
    this.dynamicAgentOptions = {
      enabled: options.dynamicAgentScaling !== false,
      minAgents: options.minAgents || 1,
      maxAgents: options.maxAgents || Math.max(1, os.cpus().length - 1),
      // Başlangıçta daha düşük bir limit ile başla (2 veya CPU sayısının yarısı)
      currentLimit: options.initialAgents || Math.min(2, Math.max(1, Math.floor(os.cpus().length / 2)))
    };

    // Setup event listeners
    this._setupEventListeners();
    this._setupSystemMonitorListeners();

    // Start processing loop
    this._startProcessingLoop();

    console.log(`AgentManager initialized with max ${this.options.maxAgents} agents`);
  }

  /**
   * Setup system monitor event listeners
   * @private
   */
  _setupSystemMonitorListeners() {
    // Yüksek kaynak kullanımında agent sayısını azalt
    this.systemMonitor.on('resources:high', (metrics) => {
      if (!this.dynamicAgentOptions.enabled) return;

      console.log(`High resource usage detected: CPU ${metrics.cpu.toFixed(2)}%, Memory ${metrics.memory.toFixed(2)}%`);

      // Agent sayısı limitini azalt
      const newLimit = Math.max(
        this.dynamicAgentOptions.minAgents,
        Math.floor(this.dynamicAgentOptions.currentLimit * 0.8) // %20 azalt
      );

      if (newLimit < this.dynamicAgentOptions.currentLimit) {
        console.log(`Reducing agent limit from ${this.dynamicAgentOptions.currentLimit} to ${newLimit}`);
        this.dynamicAgentOptions.currentLimit = newLimit;

        // Fazla agent'ları kapat (sadece boşta olanları)
        this._optimizeAgentCount();
      }
    });

    // Düşük kaynak kullanımında agent sayısını artır
    this.systemMonitor.on('resources:low', (metrics) => {
      if (!this.dynamicAgentOptions.enabled) return;

      console.log(`Low resource usage detected: CPU ${metrics.cpu.toFixed(2)}%, Memory ${metrics.memory.toFixed(2)}%`);

      // Agent sayısı limitini artır
      const newLimit = Math.min(
        this.dynamicAgentOptions.maxAgents,
        Math.floor(this.dynamicAgentOptions.currentLimit * 1.2) // %20 artır
      );

      if (newLimit > this.dynamicAgentOptions.currentLimit) {
        console.log(`Increasing agent limit from ${this.dynamicAgentOptions.currentLimit} to ${newLimit}`);
        this.dynamicAgentOptions.currentLimit = newLimit;
      }
    });
  }

  /**
   * Optimize agent count based on current limits
   * @private
   */
  _optimizeAgentCount() {
    // Eğer mevcut agent sayısı limitten fazlaysa
    if (this.agents.size > this.dynamicAgentOptions.currentLimit) {
      // Kapatılacak agent sayısı
      const agentsToTerminate = this.agents.size - this.dynamicAgentOptions.currentLimit;

      // Boşta olan agent'ları bul
      const idleAgents = Array.from(this.availableAgents)
        .map(agentId => this.agents.get(agentId))
        .sort((a, b) => {
          // En uzun süre boşta olanları önce kapat
          return new Date(a.lastActiveAt) - new Date(b.lastActiveAt);
        });

      // Boşta olan agent'ları kapat (limit kadar)
      for (let i = 0; i < Math.min(agentsToTerminate, idleAgents.length); i++) {
        const agent = idleAgents[i];
        console.log(`Terminating idle agent ${agent.id} for resource optimization`);
        this._terminateAgent(agent.id).catch(err => {
          console.error(`Error terminating agent ${agent.id}:`, err);
        });
      }
    }
  }

  /**
   * Submit a test request
   * @param {Object} testPlan - Test plan to execute
   * @returns {string} Request ID
   */
  submitRequest(testPlan) {
    // Validate test plan
    if (!testPlan || !testPlan.steps || !Array.isArray(testPlan.steps)) {
      throw new Error('Invalid test plan format. Test plan must include steps array.');
    }

    // Log test plan details
    console.log(`Received test plan: ${testPlan.name} with ${testPlan.steps.length} steps`);
    console.log(`Browser preference: ${testPlan.browserPreference || 'chromium'}`);
    console.log(`Headless mode: ${testPlan.headless !== undefined ? testPlan.headless : true}`);

    // Enqueue the request
    const requestId = this.queueSystem.enqueue({
      testPlan,
      priority: testPlan.priority || 1,
      browserType: testPlan.browserPreference || 'chromium',
      headless: testPlan.headless
    });

    console.log(`Test request ${requestId} queued: ${testPlan.name}`);

    return requestId;
  }

  /**
   * Get the status of a specific request
   * @param {string} requestId - Request ID
   * @returns {Object|null} Request status or null if not found
   */
  getRequestStatus(requestId) {
    // Check processing requests
    const processingRequests = this.queueSystem.getProcessingRequests();
    const processingRequest = processingRequests.find(req => req.id === requestId);
    if (processingRequest) {
      return processingRequest;
    }

    // Check queued requests
    const queuedRequests = this.queueSystem.getQueuedRequests();
    const queuedRequest = queuedRequests.find(req => req.id === requestId);
    if (queuedRequest) {
      return queuedRequest;
    }

    return null;
  }

  /**
   * Get system status
   * @returns {Object} System status
   */
  getStatus() {
    return {
      agents: {
        total: this.agents.size,
        available: this.availableAgents.size,
        busy: this.busyAgents.size
      },
      queue: this.queueSystem.getStatus()
    };
  }

  /**
   * Set the maximum number of agents
   * @param {number} limit - Maximum number of agents
   */
  setAgentLimit(limit) {
    if (typeof limit !== 'number' || limit < 1) {
      throw new Error('Agent limit must be a positive number');
    }

    const oldLimit = this.dynamicAgentOptions.currentLimit;
    this.dynamicAgentOptions.currentLimit = Math.min(limit, this.dynamicAgentOptions.maxAgents);

    console.log(`Agent limit changed from ${oldLimit} to ${this.dynamicAgentOptions.currentLimit}`);

    // If the new limit is lower, optimize agent count
    if (this.dynamicAgentOptions.currentLimit < oldLimit) {
      this._optimizeAgentCount();
    }
  }

  /**
   * Process the queue immediately
   * This can be called to start processing without waiting for the next interval
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
   * Create a new agent
   * @param {Object} options - Agent options
   * @returns {string} Agent ID
   * @private
   */
  _createAgent(options = {}) {
    // Mevcut agent sayısı limiti aşıyorsa yeni agent oluşturma
    if (this.agents.size >= this.dynamicAgentOptions.currentLimit) {
      console.log(`Cannot create new agent: limit of ${this.dynamicAgentOptions.currentLimit} agents reached`);
      return null;
    }

    // Sistem kaynaklarını kontrol et
    const metrics = this.systemMonitor.getMetrics();
    if (metrics.cpu > 90 || metrics.memory > 90) {
      console.log(`Cannot create new agent: system resources are too high (CPU: ${metrics.cpu.toFixed(2)}%, Memory: ${metrics.memory.toFixed(2)}%)`);
      return null;
    }

    // Generate a unique agent ID
    const agentId = `agent_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Determine browser type
    const browserType = options.browserType || this.options.browserTypes[0];

    // Create agent
    const headless = options.headless === false || options.headless === 'false' ? false : this.options.headless;

    console.log(`Creating agent with browserType: ${browserType}, headless: ${headless}`);

    const agent = new TestAgent(browserType, {
      headless: headless,
      ...options
    });

    // Add metadata
    agent.id = agentId;
    agent.status = 'idle';
    agent.createdAt = new Date().toISOString();
    agent.lastActiveAt = new Date().toISOString();
    agent.currentRequest = null;

    // Add to pool
    this.agents.set(agentId, agent);
    this.availableAgents.add(agentId);

    // Setup agent event listeners
    this._setupAgentEventListeners(agent);

    console.log(`Created new agent ${agentId} with browser ${browserType}`);

    // Emit event
    this.emit('agent:created', { agentId, browserType });

    return agentId;
  }

  /**
   * Get an available agent or create a new one
   * @param {Object} options - Agent options
   * @returns {Object} Agent
   * @private
   */
  _getAvailableAgent(options = {}) {
    // Check if we have an available agent with matching browser type
    const browserType = options.browserType || this.options.browserTypes[0];

    for (const agentId of this.availableAgents) {
      const agent = this.agents.get(agentId);
      if (agent.browserType === browserType) {
        return agent;
      }
    }

    // If no matching agent is available, check if we can create a new one
    if (this.agents.size < this.dynamicAgentOptions.currentLimit) {
      const agentId = this._createAgent(options);
      // Eğer agent oluşturulamazsa null döner
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
   * Mark an agent as busy
   * @param {string} agentId - Agent ID
   * @param {Object} request - Request being processed
   * @private
   */
  _markAgentAsBusy(agentId, request) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    // Update agent status
    agent.status = 'busy';
    agent.lastActiveAt = new Date().toISOString();
    agent.currentRequest = request.id;

    // Update sets
    this.availableAgents.delete(agentId);
    this.busyAgents.add(agentId);

    // Emit event
    this.emit('agent:busy', { agentId, requestId: request.id });
  }

  /**
   * Mark an agent as available
   * @param {string} agentId - Agent ID
   * @private
   */
  _markAgentAsAvailable(agentId) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    // Update agent status
    agent.status = 'idle';
    agent.lastActiveAt = new Date().toISOString();
    agent.currentRequest = null;

    // Update sets
    this.busyAgents.delete(agentId);
    this.availableAgents.add(agentId);

    // Emit event
    this.emit('agent:available', { agentId });
  }

  /**
   * Terminate an agent
   * @param {string} agentId - Agent ID
   * @private
   */
  async _terminateAgent(agentId) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    // Close browser
    try {
      await agent.close();
    } catch (error) {
      console.error(`Error closing agent ${agentId}:`, error);
    }

    // Remove from pool
    this.agents.delete(agentId);
    this.availableAgents.delete(agentId);
    this.busyAgents.delete(agentId);

    // Emit event
    this.emit('agent:terminated', { agentId });

    console.log(`Terminated agent ${agentId}`);
  }

  /**
   * Setup event listeners
   * @private
   */
  _setupEventListeners() {
    // Queue system events
    this.queueSystem.on('request:queued', (request) => {
      this.emit('request:queued', request);
      // Socket.io entegrasyonu için global.io kullanılacak
      if (global.io) {
        global.io.emit('request:queued', request);
      }
    });

    this.queueSystem.on('request:processing', (request) => {
      this.emit('request:processing', request);
      if (global.io) {
        global.io.emit('request:processing', request);
      }
    });

    this.queueSystem.on('request:completed', (request) => {
      this.emit('request:completed', request);
      if (global.io) {
        global.io.emit('request:completed', {
          id: request.id,
          testPlan: request.testPlan,
          result: request.result,
          status: 'completed',
          completedAt: request.completedAt
        });
      }
    });

    this.queueSystem.on('request:failed', (request) => {
      this.emit('request:failed', request);
      if (global.io) {
        global.io.emit('request:failed', {
          id: request.id,
          testPlan: request.testPlan,
          error: request.error,
          status: 'failed',
          completedAt: request.completedAt
        });
      }
    });

    // Setup periodic check for idle agents
    setInterval(() => {
      this._checkIdleAgents();
    }, 15000); // Check every 15 seconds
  }

  /**
   * Setup agent event listeners
   * @param {Object} agent - Agent instance
   * @private
   */
  _setupAgentEventListeners(agent) {
    // Handle agent errors
    agent.on('error', (error) => {
      console.error(`Agent ${agent.id} error:`, error);

      // If agent is processing a request, mark it as failed
      if (agent.currentRequest) {
        this.queueSystem.fail(agent.currentRequest, error);
      }

      // Terminate the agent
      this._terminateAgent(agent.id).catch(err => {
        console.error(`Error terminating agent ${agent.id}:`, err);
      });
    });
  }

  /**
   * Start the request processing loop
   * @private
   */
  _startProcessingLoop() {
    // Process requests periodically
    setInterval(() => {
      this._processNextRequest();
    }, 1000); // Check every second
  }

  /**
   * Process the next request in the queue
   * @private
   */
  async _processNextRequest() {
    // Check if there are any requests in the queue
    if (!this.queueSystem.hasQueuedRequests()) {
      return;
    }

    // Sistem kaynaklarını kontrol et
    const metrics = this.systemMonitor.getMetrics();
    if (metrics.cpu > 95 || metrics.memory > 95) {
      console.log(`Skipping request processing: system resources are critical (CPU: ${metrics.cpu.toFixed(2)}%, Memory: ${metrics.memory.toFixed(2)}%)`);
      return;
    }

    // Get the next request from the queue
    const request = this.queueSystem.dequeue();
    if (!request) {
      // No requests in the queue
      return;
    }

    // Get browser type and headless mode from request
    const browserType = request.browserType || this.options.browserTypes[0];
    const headless = request.headless === false || request.headless === 'false' ? false : this.options.headless;

    console.log(`Processing request ${request.id} with browser: ${browserType}, headless: ${headless}`);

    // Get an available agent or create a new one with the specified browser type and headless mode
    const agent = this._getAvailableAgent({
      browserType: browserType,
      headless: headless
    });

    if (!agent) {
      // No agents available, wait for the next cycle
      // Put the request back in the queue
      this.queueSystem.enqueue(request);
      return;
    }

    // Mark agent as busy
    this._markAgentAsBusy(agent.id, request);

    // Process the request
    try {
      console.log(`Agent ${agent.id} processing request ${request.id}: ${request.testPlan.name}`);

      // Run the test
      const result = await agent.runTest(request.testPlan);

      // Mark request as completed
      try {
        this.queueSystem.complete(request.id, result);
        console.log(`Agent ${agent.id} completed request ${request.id}`);
      } catch (completeError) {
        console.error(`Error marking request ${request.id} as complete:`, completeError);
        // Continue execution even if marking as complete fails
      }
    } catch (error) {
      console.error(`Agent ${agent.id} failed to process request ${request.id}:`, error);

      // Mark request as failed
      try {
        this.queueSystem.fail(request.id, error);
      } catch (failError) {
        console.error(`Error marking request ${request.id} as failed:`, failError);
        // Continue execution even if marking as failed fails
      }
    } finally {
      // Test tamamlandıktan sonra agent'ı kapat veya kullanılabilir olarak işaretle
      if (this.options.closeAgentAfterTest) {
        console.log(`Closing agent ${agent.id} after test completion`);
        try {
          await this._terminateAgent(agent.id);
        } catch (error) {
          console.error(`Error terminating agent ${agent.id}:`, error);
          // Hata durumunda agent'ı kullanılabilir olarak işaretle
          try {
            this._markAgentAsAvailable(agent.id);
          } catch (markError) {
            console.error(`Error marking agent ${agent.id} as available:`, markError);
            // At this point, we've done all we can to recover
          }
        }
      } else {
        // Eski davranış: Agent'ı kullanılabilir olarak işaretle
        try {
          this._markAgentAsAvailable(agent.id);
        } catch (markError) {
          console.error(`Error marking agent ${agent.id} as available:`, markError);
          // At this point, we've done all we can to recover
        }
      }

      // Process the next request regardless of what happened with this one
      setTimeout(() => this._processNextRequest(), 100);
    }
  }

  /**
   * Check for idle agents that can be terminated
   * @private
   */
  _checkIdleAgents() {
    const now = Date.now();
    let terminatedCount = 0;

    // Check each available agent
    for (const agentId of this.availableAgents) {
      const agent = this.agents.get(agentId);

      // Skip if this is the only agent
      if (this.agents.size <= 1) {
        continue;
      }

      // Check if agent has been idle for too long
      const lastActiveTime = new Date(agent.lastActiveAt).getTime();
      if (now - lastActiveTime > this.options.agentIdleTimeout) {
        console.log(`Agent ${agentId} has been idle for too long, terminating`);

        // Terminate the agent
        this._terminateAgent(agentId).catch(err => {
          console.error(`Error terminating agent ${agentId}:`, err);
        });

        terminatedCount++;
      }
    }

    // Eğer agent sonlandırıldıysa ve hiç meşgul agent yoksa, agent limitini azalt
    if (terminatedCount > 0 && this.busyAgents.size === 0) {
      // Minimum agent limitinden aşağı düşme
      const newLimit = Math.max(
        this.dynamicAgentOptions.minAgents,
        this.dynamicAgentOptions.currentLimit - terminatedCount
      );

      if (newLimit < this.dynamicAgentOptions.currentLimit) {
        console.log(`Reducing agent limit from ${this.dynamicAgentOptions.currentLimit} to ${newLimit} due to idle agents`);
        this.dynamicAgentOptions.currentLimit = newLimit;
      }
    }
  }

  /**
   * Close all agents and clean up
   */
  async close() {
    console.log('Closing AgentManager...');

    // Clear the queue
    this.queueSystem.clear();

    // Terminate all agents
    const terminationPromises = [];
    for (const agentId of this.agents.keys()) {
      terminationPromises.push(this._terminateAgent(agentId));
    }

    await Promise.all(terminationPromises);

    console.log('AgentManager closed');
  }
}

export default AgentManager;
