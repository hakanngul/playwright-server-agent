import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import apiRoutes from './routes/api.js';
import reportRoutes from './routes/reports.js';
import performanceRoutes from './routes/performance.js';
import statusRoutes from './routes/status.js';
import agentRoutes from './routes/agent.js';
import testPlansRoutes from './routes/test-plans.js';
import testSuitesRoutes from './routes/test-suites.js';
import { TestAgent } from './services/testAgent.js';
import { ParallelTestManager } from './services/browser/ParallelTestManager.js';
import os from 'os';
import config from './config.js';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Log system information
function logSystemInfo() {
  console.log('\n--- System Information ---');
  console.log(`Platform: ${process.platform}`);
  console.log(`Node Version: ${process.version}`);

  // Check for Chrome/Chromium
  try {
    const chromeVersion = execSync('google-chrome --version').toString().trim();
    console.log(`Chrome Version: ${chromeVersion}`);
  } catch (e) {
    console.log('Chrome not found via google-chrome command');

    try {
      const chromiumVersion = execSync('chromium --version').toString().trim();
      console.log(`Chromium Version: ${chromiumVersion}`);
    } catch (e) {
      console.log('Chromium not found via chromium command');
    }
  }

  // Windows için Chrome kontrolü
  if (process.platform === 'win32') {
    try {
      const winChromeVersion = execSync('reg query "HKEY_CURRENT_USER\\Software\\Google\\Chrome\\BLBeacon" /v version').toString().trim();
      const versionMatch = winChromeVersion.match(/version\\s+REG_SZ\\s+([\\d.]+)/i);
      if (versionMatch && versionMatch[1]) {
        console.log(`Windows Chrome Version: ${versionMatch[1]}`);
      }
    } catch (e) {
      console.log('Chrome version not found in Windows registry');
    }
  }

  // Check for Firefox
  try {
    if (process.platform === 'win32') {
      const firefoxVersion = execSync('reg query "HKEY_CURRENT_USER\\Software\\Mozilla\\Mozilla Firefox" /v CurrentVersion').toString().trim();
      const versionMatch = firefoxVersion.match(/CurrentVersion\\s+REG_SZ\\s+([\\d.]+)/i);
      if (versionMatch && versionMatch[1]) {
        console.log(`Firefox Version: ${versionMatch[1]}`);
      }
    } else {
      const firefoxVersion = execSync('firefox --version').toString().trim();
      console.log(`Firefox Version: ${firefoxVersion}`);
    }
  } catch (e) {
    console.log('Firefox not found or version check failed');
  }

  // WebKit/Safari desteği kaldırıldı

  console.log('------------------------\n');
}

const app = express();
const PORT = process.env.PORT || 3002;

// Create HTTP server
const server = http.createServer(app);

// Create Socket.io server
const io = new SocketIOServer(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST']
  }
});

// Make io available globally for other modules
global.io = io;

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log('Socket.io connection established', socket.id);

  // Connection closed handler
  socket.on('disconnect', () => {
    console.log('Socket.io connection closed', socket.id);
  });

  // Send initial data to the client
  socket.emit('welcome', { message: 'Connected to Playwright Server Agent' });
});

// Function to broadcast message to all clients
function broadcastMessage(message) {
  io.emit('message', message);
}

// Middleware
app.use(express.json());

// Enable CORS for frontend requests
app.use((req, res, next) => {
  // Allow both 3000 and 3001 ports for frontend
  const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001'];
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }

  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
});

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Screenshots, videos ve traces desteği kaldırıldı

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve static files from the client/build directory (for backward compatibility)
app.use(express.static(path.join(__dirname, 'client/build')));

// Use API routes
app.use('/api', apiRoutes);

// Use reports routes
app.use('/api/reports', reportRoutes);

// Use performance routes
app.use('/api/performance', performanceRoutes);

// Use status routes
app.use('/api/status', statusRoutes);

// Use agent routes
app.use('/api/agent', agentRoutes);

// Use test plans routes
app.use('/api/test-plans', testPlansRoutes);

// Use test suites routes
app.use('/api/test-suites', testSuitesRoutes);

// Add a simple health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Add a simple test endpoint to verify Playwright is working
app.get('/api/test/verify-playwright', (_req, res) => {
  // Sadece Playwright'in yüklü olduğunu kontrol edelim, tarayıcı başlatmadan
  try {
    // Just check if we can import Playwright
    require('playwright');
    res.json({
      success: true,
      message: 'Playwright is installed correctly',
      availableBrowsers: {
        chromium: true,
        firefox: true,
        edge: true
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Playwright verification failed',
      error: error.message
    });
  }
});

// API Endpoints
// Add browser selection endpoint
app.get('/api/browsers', (_req, res) => {
  const browsers = [
    { id: 'chromium', name: 'Chromium' },
    { id: 'firefox', name: 'Firefox' },
    { id: 'edge', name: 'Microsoft Edge' },
    { id: 'webkit', name: 'WebKit (Safari)' }
  ];

  res.json(browsers);
});

// Create parallel test manager
const parallelTestManager = new ParallelTestManager({
  workers: process.env.MAX_WORKERS ? parseInt(process.env.MAX_WORKERS) : config.test.workers,
  headless: process.env.HEADLESS !== 'false' ? true : config.test.headless,
  // Screenshots desteği kaldırıldı
  browserTypes: config.test.browserTypes,
  usePlaywrightTestRunner: config.test.usePlaywrightTestRunner,
  retries: config.test.retries
});

// Add parallel test execution endpoint (legacy - redirects to agent-based endpoint)
app.post('/api/test/run-parallel', async (req, res) => {
  console.log('\n--- Received legacy parallel test run request, redirecting to agent-based endpoint ---');
  try {
    const { testPlans } = req.body;

    if (!testPlans || !Array.isArray(testPlans) || testPlans.length === 0) {
      console.error('Invalid test plans format');
      return res.status(400).json({
        error: 'Invalid test plans format. Request must include an array of test plans.'
      });
    }

    console.log(`Redirecting ${testPlans.length} test plans to agent-based endpoint`);

    // Forward to agent-based endpoint
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
      const requestId = agentRoutes.agentManager.submitRequest(testPlan);
      requestIds.push({ id: requestId, name: testPlan.name });
      console.log(`Test plan "${testPlan.name}" submitted with ID: ${requestId}`);
    }

    // Set agent limit temporarily for this batch
    agentRoutes.agentManager.setAgentLimit(maxAgents);

    // Start processing immediately
    agentRoutes.agentManager.processQueue();

    res.json({
      success: true,
      message: `${requestIds.length} test requests submitted for parallel execution (redirected from legacy endpoint)`,
      requestIds: requestIds
    });
  } catch (error) {
    console.error('Error redirecting parallel test requests:', error);
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Legacy endpoint - redirect to agent-based endpoint
app.post('/api/test/run', async (req, res) => {
  console.log('\n--- Received legacy test run request, redirecting to agent-based endpoint ---');
  try {
    const testPlan = req.body;

    if (!testPlan || !testPlan.steps || !Array.isArray(testPlan.steps)) {
      console.error('Invalid test plan format');
      return res.status(400).json({
        error: 'Invalid test plan format. Test plan must include steps array.'
      });
    }

    console.log(`Redirecting test plan: ${testPlan.name} with ${testPlan.steps.length} steps to agent-based endpoint`);

    // Forward to agent-based endpoint
    const requestId = agentRoutes.agentManager.submitRequest(testPlan);

    res.json({
      success: true,
      requestId,
      message: 'Test request submitted successfully (redirected from legacy endpoint)'
    });
  } catch (error) {
    console.error('Error redirecting test request:', error);
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Error handling middleware
app.use((err, _req, res, _next) => {
  console.error('Error handling middleware caught an error:');
  console.error(err);

  // Check if it's our custom error
  if (err.toJSON && typeof err.toJSON === 'function') {
    const errorJson = err.toJSON();
    const statusCode = err.code === 'NOT_FOUND' ? 404 :
                      err.code === 'VALIDATION_ERROR' ? 400 :
                      err.code === 'UNAUTHORIZED' ? 401 :
                      err.code === 'FORBIDDEN' ? 403 : 500;

    return res.status(statusCode).json({
      error: errorJson.message,
      code: errorJson.code,
      details: errorJson
    });
  }

  // For regular errors
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    error: message,
    code: err.code || 'INTERNAL_ERROR',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});



// Start server
server.listen(PORT, () => {
  console.log(`\n=== Playwright-Based Test Runner Server ===`);
  console.log(`Server running on port ${PORT}`);
  console.log(`API server running at http://localhost:${PORT}`);
  console.log(`Frontend should be started separately on port 3000`);
  logSystemInfo();

  // Make agent manager available to routes
  if (agentRoutes.agentManager) {
    app.set('agentManager', agentRoutes.agentManager);
    console.log('Agent manager set in app for other routes to use');
  } else {
    console.error('WARNING: agentManager not available from agentRoutes');
  }

  console.log('Agent-based test execution system is active');
  console.log('Ready to run tests!');
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received. Shutting down gracefully...');

  // Close agent manager
  try {
    const agentManager = agentRoutes.agentManager;
    if (agentManager) {
      await agentManager.close();
    }
  } catch (error) {
    console.error('Error closing agent manager:', error);
  }

  // Close server
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received. Shutting down gracefully...');

  // Close agent manager
  try {
    const agentManager = agentRoutes.agentManager;
    if (agentManager) {
      await agentManager.close();
    }
  } catch (error) {
    console.error('Error closing agent manager:', error);
  }

  // Close server
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
