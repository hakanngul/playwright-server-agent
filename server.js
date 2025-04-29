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
import config from './config.js';
import os from 'os';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Log system information
function logSystemInfo() {
  console.log('\n--- System Information ---');
  console.log(`Platform: ${process.platform}`);
  console.log(`Architecture: ${process.arch}`);
  console.log(`Node Version: ${process.version}`);
  console.log(`Memory: ${Math.round(os.totalmem() / (1024 * 1024 * 1024))} GB`);
  console.log(`CPUs: ${os.cpus().length}`);

  // Check for Chrome/Chromium
  try {
    const chromeVersion = execSync('google-chrome --version').toString().trim();
    console.log(`Chrome Version: ${chromeVersion}`);
  } catch (e) {
    try {
      const chromiumVersion = execSync('chromium --version').toString().trim();
      console.log(`Chromium Version: ${chromiumVersion}`);
    } catch (e) {
      console.log('Chrome/Chromium not found');
    }
  }

  // Windows için Chrome kontrolü
  if (process.platform === 'win32') {
    try {
      const winChromeVersion = execSync('reg query "HKEY_CURRENT_USER\\Software\\Google\\Chrome\\BLBeacon" /v version').toString().trim();
      const versionMatch = winChromeVersion.match(/version\s+REG_SZ\s+([\d.]+)/i);
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
      const versionMatch = firefoxVersion.match(/CurrentVersion\s+REG_SZ\s+([\d.]+)/i);
      if (versionMatch && versionMatch[1]) {
        console.log(`Firefox Version: ${versionMatch[1]}`);
      }
    } else {
      const firefoxVersion = execSync('firefox --version').toString().trim();
      console.log(`Firefox Version: ${firefoxVersion}`);
    }
  } catch (e) {
    console.log('Firefox not found');
  }

  console.log('------------------------');
}

const app = express();
const PORT = process.env.PORT || config.server.port || 3002;

// Create HTTP server
const server = http.createServer(app);

// Create Socket.io server
const io = new SocketIOServer(server, {
  cors: {
    origin: config.server.allowedOrigins || ['http://localhost:3000', 'http://localhost:3001'],
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

// Socket.io ile mesaj göndermek için yardımcı fonksiyon
// Doğrudan io.emit('message', message) kullanılabilir

// Middleware
app.use(express.json());

// Enable CORS for frontend requests
app.use((req, res, next) => {
  // İzin verilen kaynakları yapılandırmadan al
  const allowedOrigins = config.server.allowedOrigins || ['http://localhost:3000', 'http://localhost:3001'];
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

// Screenshots desteği var, videos ve traces desteği kaldırıldı

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

// Legacy endpoint'ler için yapılandırma değerleri doğrudan config.js'den alınır

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
    const maxAgents = process.env.MAX_WORKERS ? parseInt(process.env.MAX_WORKERS) : config.test.workers;
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
  console.log(`\n=== Playwright Server Agent ===`);
  console.log(`Server running on port ${PORT}`);
  console.log(`API server running at http://localhost:${PORT}`);
  console.log(`Frontend should be started separately on port ${config.server.allowedOrigins[0].split(':')[2] || '3000'}`);

  // Sistem bilgilerini göster
  logSystemInfo();

  // Yapılandırma bilgilerini göster
  console.log('\n--- Configuration ---');
  console.log(`Agent-based test execution system is active`);
  console.log(`Supported browsers: ${config.test.browserTypes.join(', ')}`);
  console.log(`Headless mode: ${config.test.headless ? 'enabled' : 'disabled'}`);
  console.log(`Workers: ${config.test.workers}`);
  console.log(`Retries: ${config.test.retries}`);
  console.log(`Timeout: ${config.test.timeout}ms`);
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
