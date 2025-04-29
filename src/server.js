/**
 * Playwright Server Agent - API Server
 */

import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createAgentManager } from './index.js';

// ES modules __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server);

// Create agent manager
const agentManager = createAgentManager({
  maxAgents: 2,
  headless: true,
  closeAgentAfterTest: true
});

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Test plans directory
const TEST_PLANS_DIR = path.join(__dirname, '../test-plans');
const TEST_SUITES_DIR = path.join(__dirname, '../test-suites');

// Ensure directories exist
if (!fs.existsSync(TEST_PLANS_DIR)) {
  fs.mkdirSync(TEST_PLANS_DIR, { recursive: true });
}

if (!fs.existsSync(TEST_SUITES_DIR)) {
  fs.mkdirSync(TEST_SUITES_DIR, { recursive: true });
}

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('Client connected');
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Set up agent manager events
agentManager.on('request:queued', ({ requestId, position }) => {
  io.emit('request:queued', { requestId, position });
});

agentManager.on('request:processing', ({ requestId }) => {
  io.emit('request:processing', { requestId });
});

agentManager.on('request:completed', ({ requestId, result }) => {
  io.emit('request:completed', { requestId, result });
});

agentManager.on('request:failed', ({ requestId, error }) => {
  io.emit('request:failed', { requestId, error });
});

agentManager.on('agent:created', ({ agentId, browserType, headless }) => {
  io.emit('agent:created', { agentId, browserType, headless });
});

agentManager.on('agent:closed', ({ agentId }) => {
  io.emit('agent:closed', { agentId });
});

// API Routes

// Get server status
app.get('/api/status', (req, res) => {
  res.json({
    status: 'running',
    agents: {
      total: agentManager.agents.size,
      available: agentManager.availableAgents.size,
      busy: agentManager.busyAgents.size
    },
    queue: {
      length: agentManager.requestQueue.length
    }
  });
});

// Test Plans API

// Get all test plans
app.get('/api/test-plans', (req, res) => {
  try {
    const testPlans = [];
    const files = fs.readdirSync(TEST_PLANS_DIR);
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(TEST_PLANS_DIR, file);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        try {
          const testPlan = JSON.parse(fileContent);
          testPlans.push({
            id: path.basename(file, '.json'),
            name: testPlan.name,
            description: testPlan.description,
            browserPreference: testPlan.browserPreference,
            headless: testPlan.headless,
            stepsCount: testPlan.steps ? testPlan.steps.length : 0
          });
        } catch (parseError) {
          console.error(`Error parsing test plan file: ${file}`, parseError);
        }
      }
    }
    
    res.json(testPlans);
  } catch (error) {
    console.error('Error getting test plans:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

// Get a test plan by ID
app.get('/api/test-plans/:id', (req, res) => {
  try {
    const { id } = req.params;
    const filePath = path.join(TEST_PLANS_DIR, `${id}.json`);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: `Test plan ${id} not found`
      });
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const testPlan = JSON.parse(fileContent);
    
    res.json({
      id,
      ...testPlan
    });
  } catch (error) {
    console.error('Error getting test plan:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

// Create a new test plan
app.post('/api/test-plans', (req, res) => {
  try {
    const testPlan = req.body;
    
    if (!testPlan || !testPlan.name || !testPlan.steps || !Array.isArray(testPlan.steps)) {
      return res.status(400).json({
        error: 'Invalid test plan format. Test plan must include name and steps array.'
      });
    }
    
    // Generate a unique ID for the test plan
    const id = `plan-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const filePath = path.join(TEST_PLANS_DIR, `${id}.json`);
    
    // Save the test plan to a file
    fs.writeFileSync(filePath, JSON.stringify(testPlan, null, 2), 'utf8');
    
    res.json({
      success: true,
      id,
      message: 'Test plan created successfully'
    });
  } catch (error) {
    console.error('Error creating test plan:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

// Update a test plan
app.put('/api/test-plans/:id', (req, res) => {
  try {
    const { id } = req.params;
    const testPlan = req.body;
    const filePath = path.join(TEST_PLANS_DIR, `${id}.json`);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: `Test plan ${id} not found`
      });
    }
    
    if (!testPlan || !testPlan.name || !testPlan.steps || !Array.isArray(testPlan.steps)) {
      return res.status(400).json({
        error: 'Invalid test plan format. Test plan must include name and steps array.'
      });
    }
    
    // Save the updated test plan to a file
    fs.writeFileSync(filePath, JSON.stringify(testPlan, null, 2), 'utf8');
    
    res.json({
      success: true,
      message: 'Test plan updated successfully'
    });
  } catch (error) {
    console.error('Error updating test plan:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

// Delete a test plan
app.delete('/api/test-plans/:id', (req, res) => {
  try {
    const { id } = req.params;
    const filePath = path.join(TEST_PLANS_DIR, `${id}.json`);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: `Test plan ${id} not found`
      });
    }
    
    // Delete the test plan file
    fs.unlinkSync(filePath);
    
    res.json({
      success: true,
      message: 'Test plan deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting test plan:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

// Run a test plan
app.post('/api/test-plans/:id/run', async (req, res) => {
  try {
    const { id } = req.params;
    const { headless } = req.body;
    const filePath = path.join(TEST_PLANS_DIR, `${id}.json`);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: `Test plan ${id} not found`
      });
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const testPlan = JSON.parse(fileContent);
    
    // Submit the test request to the agent manager
    const requestId = await agentManager.submitRequest(testPlan, {
      headless: headless !== undefined ? headless : testPlan.headless
    });
    
    res.json({
      success: true,
      requestId,
      message: 'Test plan submitted for execution'
    });
  } catch (error) {
    console.error('Error running test plan:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

// Test Suites API

// Get all test suites
app.get('/api/test-suites', (req, res) => {
  try {
    const testSuites = [];
    const files = fs.readdirSync(TEST_SUITES_DIR);
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(TEST_SUITES_DIR, file);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        try {
          const testSuite = JSON.parse(fileContent);
          testSuites.push({
            id: path.basename(file, '.json'),
            name: testSuite.name,
            description: testSuite.description,
            category: testSuite.category,
            parallelExecution: testSuite.parallelExecution,
            maxWorkers: testSuite.maxWorkers,
            defaultBrowserPreference: testSuite.defaultBrowserPreference,
            defaultHeadless: testSuite.defaultHeadless,
            testPlansCount: testSuite.testPlans ? testSuite.testPlans.length : 0
          });
        } catch (parseError) {
          console.error(`Error parsing test suite file: ${file}`, parseError);
        }
      }
    }
    
    res.json(testSuites);
  } catch (error) {
    console.error('Error getting test suites:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

// Get a test suite by ID
app.get('/api/test-suites/:id', (req, res) => {
  try {
    const { id } = req.params;
    const filePath = path.join(TEST_SUITES_DIR, `${id}.json`);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: `Test suite ${id} not found`
      });
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const testSuite = JSON.parse(fileContent);
    
    res.json({
      id,
      ...testSuite
    });
  } catch (error) {
    console.error('Error getting test suite:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

// Create a new test suite
app.post('/api/test-suites', (req, res) => {
  try {
    const testSuite = req.body;
    
    if (!testSuite || !testSuite.name || !testSuite.testPlans || !Array.isArray(testSuite.testPlans)) {
      return res.status(400).json({
        error: 'Invalid test suite format. Test suite must include name and testPlans array.'
      });
    }
    
    // Generate a unique ID for the test suite
    const id = `suite-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const filePath = path.join(TEST_SUITES_DIR, `${id}.json`);
    
    // Save the test suite to a file
    fs.writeFileSync(filePath, JSON.stringify(testSuite, null, 2), 'utf8');
    
    res.json({
      success: true,
      id,
      message: 'Test suite created successfully'
    });
  } catch (error) {
    console.error('Error creating test suite:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

// Update a test suite
app.put('/api/test-suites/:id', (req, res) => {
  try {
    const { id } = req.params;
    const testSuite = req.body;
    const filePath = path.join(TEST_SUITES_DIR, `${id}.json`);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: `Test suite ${id} not found`
      });
    }
    
    if (!testSuite || !testSuite.name || !testSuite.testPlans || !Array.isArray(testSuite.testPlans)) {
      return res.status(400).json({
        error: 'Invalid test suite format. Test suite must include name and testPlans array.'
      });
    }
    
    // Save the updated test suite to a file
    fs.writeFileSync(filePath, JSON.stringify(testSuite, null, 2), 'utf8');
    
    res.json({
      success: true,
      message: 'Test suite updated successfully'
    });
  } catch (error) {
    console.error('Error updating test suite:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

// Delete a test suite
app.delete('/api/test-suites/:id', (req, res) => {
  try {
    const { id } = req.params;
    const filePath = path.join(TEST_SUITES_DIR, `${id}.json`);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: `Test suite ${id} not found`
      });
    }
    
    // Delete the test suite file
    fs.unlinkSync(filePath);
    
    res.json({
      success: true,
      message: 'Test suite deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting test suite:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

// Run a test suite
app.post('/api/test-suites/:id/run', async (req, res) => {
  try {
    const { id } = req.params;
    const { headless, maxWorkers } = req.body;
    const filePath = path.join(TEST_SUITES_DIR, `${id}.json`);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: `Test suite ${id} not found`
      });
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const testSuite = JSON.parse(fileContent);
    
    // Submit each test plan in the suite
    const requestIds = [];
    
    for (const testPlanId of testSuite.testPlans) {
      const testPlanPath = path.join(TEST_PLANS_DIR, `${testPlanId}.json`);
      
      if (fs.existsSync(testPlanPath)) {
        const testPlanContent = fs.readFileSync(testPlanPath, 'utf8');
        const testPlan = JSON.parse(testPlanContent);
        
        // Submit the test request to the agent manager
        const requestId = await agentManager.submitRequest(testPlan, {
          headless: headless !== undefined ? headless : testSuite.defaultHeadless,
          priority: testSuite.parallelExecution ? 0 : requestIds.length // If not parallel, prioritize in order
        });
        
        requestIds.push(requestId);
      } else {
        console.warn(`Test plan ${testPlanId} not found, skipping`);
      }
    }
    
    res.json({
      success: true,
      requestIds,
      message: `Test suite submitted for execution with ${requestIds.length} test plans`
    });
  } catch (error) {
    console.error('Error running test suite:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

// Get request status
app.get('/api/requests/:id', (req, res) => {
  try {
    const { id } = req.params;
    const status = agentManager.getRequestStatus(id);
    
    res.json(status);
  } catch (error) {
    console.error('Error getting request status:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

// Start server
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  
  try {
    await agentManager.close();
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

export default server;
