/**
 * Agent API Routes
 * Handles agent-related API endpoints
 */

import express from 'express';
import AgentManager from '../services/agent/AgentManager.js';

const router = express.Router();

// Create agent manager instance
const agentManager = new AgentManager();

// Export agent manager for graceful shutdown
router.agentManager = agentManager;

// Submit a test request
router.post('/test-run', async (req, res) => {
  try {
    const testPlan = req.body;

    if (!testPlan || !testPlan.steps || !Array.isArray(testPlan.steps)) {
      return res.status(400).json({
        error: 'Invalid test plan format. Test plan must include steps array.'
      });
    }

    console.log(`Received test plan: ${testPlan.name} with ${testPlan.steps.length} steps`);

    // Submit the request to the agent manager
    const requestId = agentManager.submitRequest(testPlan);

    res.json({
      success: true,
      requestId,
      message: 'Test request submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting test request:', error);
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get request status
router.get('/test-status/:requestId', (req, res) => {
  try {
    const { requestId } = req.params;
    const status = agentManager.getRequestStatus(requestId);

    if (!status) {
      return res.status(404).json({
        error: `Request ${requestId} not found`
      });
    }

    res.json({
      success: true,
      status
    });
  } catch (error) {
    console.error('Error getting request status:', error);
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get system status
router.get('/system-status', (req, res) => {
  try {
    const status = agentManager.getStatus();

    res.json({
      success: true,
      status
    });
  } catch (error) {
    console.error('Error getting system status:', error);
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get system metrics
router.get('/system-metrics', (req, res) => {
  try {
    const metrics = agentManager.systemMonitor.getMetrics();

    // Agent istatistiklerini ekle
    const agentStats = {
      total: agentManager.agents.size,
      available: agentManager.availableAgents.size,
      busy: agentManager.busyAgents.size,
      limit: agentManager.dynamicAgentOptions.currentLimit
    };

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      metrics: {
        system: metrics,
        agents: agentStats,
        queue: agentManager.queueSystem.getStatus()
      }
    });
  } catch (error) {
    console.error('Error getting system metrics:', error);
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get queued requests
router.get('/queued-requests', (req, res) => {
  try {
    const requests = agentManager.queueSystem.getQueuedRequests();

    // Sadece 'queued' durumundaki istekleri filtrele
    const queuedRequests = requests.filter(req => req.status === 'queued');

    res.json({
      success: true,
      count: queuedRequests.length,
      requests: queuedRequests
    });
  } catch (error) {
    console.error('Error getting queued requests:', error);
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get processing requests
router.get('/processing-requests', (req, res) => {
  try {
    const requests = agentManager.queueSystem.getProcessingRequests();

    res.json({
      success: true,
      count: requests.length,
      requests
    });
  } catch (error) {
    console.error('Error getting processing requests:', error);
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get active agents
router.get('/active-agents', (req, res) => {
  try {
    const agents = [];

    // Convert agents map to array
    for (const [agentId, agent] of agentManager.agents.entries()) {
      agents.push({
        id: agentId,
        browserType: agent.browserType,
        headless: agent.headless,
        status: agentManager.availableAgents.has(agentId) ? 'idle' : 'busy',
        createdAt: agent.createdAt,
        lastActiveAt: agent.lastActiveAt,
        currentRequest: agent.currentRequest
      });
    }

    res.json({
      success: true,
      count: agents.length,
      agents
    });
  } catch (error) {
    console.error('Error getting active agents:', error);
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

export default router;
