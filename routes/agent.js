/**
 * Agent API Routes
 * Handles agent-related API endpoints
 */

import express from 'express';
import AgentManager from '../services/agent/AgentManager.js';

const router = express.Router();

// Create agent manager instance
const agentManager = new AgentManager({
  closeAgentAfterTest: true, // Test tamamlandıktan sonra agent'ı kapat
  agentIdleTimeout: 5000 // 5 saniye sonra boşta kalan agent'ları kapat
});

// Export agent manager for graceful shutdown
router.agentManager = agentManager;

// Submit a test request
router.post('/test-run', async (req, res) => {
  try {
    const requestData = req.body;
    let testPlan;

    // Check if request contains a testPlanId
    if (requestData.testPlanId) {
      // Get test plan from file system
      const fs = await import('fs');
      const path = await import('path');
      const { fileURLToPath } = await import('url');

      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);

      const TEST_PLANS_DIR = path.join(__dirname, '..', 'test-run-with-curl-scripts', 'test-plans');
      const filePath = path.join(TEST_PLANS_DIR, `${requestData.testPlanId}.json`);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          error: `Test plan with ID ${requestData.testPlanId} not found`
        });
      }

      const fileContent = fs.readFileSync(filePath, 'utf8');
      testPlan = JSON.parse(fileContent);

      console.log(`Loaded test plan from file: ${testPlan.name} with ${testPlan.steps.length} steps`);
    } else {
      // Use the test plan from request body
      testPlan = requestData;

      if (!testPlan || !testPlan.steps || !Array.isArray(testPlan.steps)) {
        return res.status(400).json({
          error: 'Invalid test plan format. Test plan must include steps array.'
        });
      }

      console.log(`Received test plan: ${testPlan.name} with ${testPlan.steps.length} steps`);
    }

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

// Get completed requests
router.get('/completed-requests', (req, res) => {
  try {
    // Tamamlanan ve başarısız olan istekleri al
    const completedRequests = agentManager.queueSystem.getCompletedRequests();

    res.json({
      success: true,
      count: completedRequests.length,
      requests: completedRequests
    });
  } catch (error) {
    console.error('Error getting completed requests:', error);
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Submit multiple test requests in parallel
router.post('/run-parallel', async (req, res) => {
  try {
    const { testPlans } = req.body;

    if (!testPlans || !Array.isArray(testPlans) || testPlans.length === 0) {
      return res.status(400).json({
        error: 'Invalid test plans format. Request must include an array of test plans.'
      });
    }

    console.log(`\n--- Received parallel test run request with ${testPlans.length} test plans ---`);

    // Set maximum number of agents to use
    const maxAgents = process.env.MAX_WORKERS ? parseInt(process.env.MAX_WORKERS) : 5;
    console.log(`Using maximum ${maxAgents} agents for parallel execution`);

    // Submit all test plans to the agent manager
    const requestIds = [];
    for (const testPlan of testPlans) {
      if (!testPlan || !testPlan.steps || !Array.isArray(testPlan.steps)) {
        console.warn(`Skipping invalid test plan: ${testPlan?.name || 'unnamed'}`);
        continue;
      }

      // Submit the request to the agent manager
      const requestId = agentManager.submitRequest(testPlan);
      requestIds.push({ id: requestId, name: testPlan.name });
      console.log(`Test plan "${testPlan.name}" submitted with ID: ${requestId}`);
    }

    // Set agent limit temporarily for this batch
    agentManager.setAgentLimit(maxAgents);

    // Start processing immediately
    agentManager.processQueue();

    res.json({
      success: true,
      message: `${requestIds.length} test requests submitted for parallel execution`,
      requestIds: requestIds
    });
  } catch (error) {
    console.error('Error submitting parallel test requests:', error);
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

export default router;
