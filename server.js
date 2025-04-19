import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import apiRoutes from './routes/api.js';
import reportRoutes from './routes/reports.js';
import { TestAgent } from './services/testAgent.js';
import { BrowserPool } from './services/browser/index.js';

// Global browser pool
let browserPool = null;

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

// Create WebSocket server
const wss = new WebSocketServer({ server });

// Array to store WebSocket connections
const clients = [];

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('WebSocket connection established');

  // Add new connection to clients array
  clients.push(ws);

  // Connection closed handler
  ws.on('close', () => {
    console.log('WebSocket connection closed');
    // Remove connection from clients array
    const index = clients.indexOf(ws);
    if (index !== -1) {
      clients.splice(index, 1);
    }
  });
});

// Function to broadcast message to all clients
function broadcastMessage(message) {
  clients.forEach(client => {
    if (client.readyState === 1) { // 1 = OPEN in WebSocket
      client.send(JSON.stringify(message));
    }
  });
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

// Ensure screenshots directory exists
const screenshotsDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Serve screenshots
app.use('/screenshots', express.static(screenshotsDir));

// Use API routes
app.use('/api', apiRoutes);

// Use reports routes
app.use('/api/reports', reportRoutes);

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
    { id: 'edge', name: 'Microsoft Edge' }
  ];

  res.json(browsers);
});

app.post('/api/test/run', async (req, res) => {
  console.log('\n--- Received test run request ---');
  try {
    const testPlan = req.body;

    if (!testPlan || !testPlan.steps || !Array.isArray(testPlan.steps)) {
      console.error('Invalid test plan format');
      return res.status(400).json({
        error: 'Invalid test plan format. Test plan must include steps array.'
      });
    }

    console.log(`Received test plan: ${testPlan.name} with ${testPlan.steps.length} steps`);

    // Get browser preference from test plan
    const browserPreference = testPlan.browserPreference || 'chromium';
    console.log(`Browser preference from request: ${browserPreference}`);

    // Get headless mode preference from test plan
    const headless = testPlan.headless !== undefined ? testPlan.headless : true;
    console.log(`Headless mode from request: ${headless}`);

    // Get browser pool usage preference from test plan
    const useBrowserPool = testPlan.useBrowserPool !== undefined ? testPlan.useBrowserPool : true;
    console.log(`Browser pool usage from request: ${useBrowserPool}`);

    // Create test agent with browser preference and options
    const testAgent = new TestAgent(browserPreference, {
      headless,
      useBrowserPool,
      browserPool: useBrowserPool ? browserPool : null
    });

    // Step completion callback
    testAgent.setStepCompletedCallback((result) => {
      console.log(`Step ${result.step} completed: ${result.success ? 'Success' : 'Failed'}`);

      // Send step completion message via WebSocket
      broadcastMessage({
        type: 'step_completed',
        stepIndex: result.step - 1,
        step: {
          action: result.action,
          target: result.target,
          value: result.value,
          strategy: result.strategy,
          description: result.description
        },
        result: result
      });
    });

    // Run the test
    const results = await testAgent.runTest(testPlan);

    // Make sure to close the browser
    try {
      await testAgent.close();
      console.log('Browser closed after test completion');
    } catch (error) {
      console.error('Error closing browser after test:', error);
    }

    console.log('Test completed, sending results to client');
    res.json(results);
  } catch (error) {
    console.error('Error running test:', error);
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

// Add browser pool configuration endpoint
app.get('/api/browser-pool/stats', (_req, res) => {
  if (!browserPool) {
    return res.json({
      enabled: false,
      message: 'Browser pool is not enabled'
    });
  }

  const stats = browserPool.getStats();
  res.json({
    enabled: true,
    stats
  });
});

// Add browser pool configuration endpoint
app.post('/api/browser-pool/config', (req, res) => {
  const config = req.body;

  if (!config) {
    return res.status(400).json({
      error: 'Invalid configuration format'
    });
  }

  // Close existing pool if it exists
  if (browserPool) {
    browserPool.close().catch(e => console.error('Error closing browser pool:', e));
  }

  // Create new pool with provided configuration
  const { enabled, maxSize, minSize, idleTimeout } = config;

  if (enabled) {
    browserPool = new BrowserPool({
      maxSize: maxSize || 5,
      minSize: minSize || 2,
      idleTimeout: idleTimeout || 300000,
      browserOptions: {
        headless: true // Default to headless for pool browsers
      }
    });

    // Initialize the pool
    browserPool.initialize().catch(e => console.error('Error initializing browser pool:', e));

    res.json({
      success: true,
      message: 'Browser pool configured and enabled',
      config: {
        enabled: true,
        maxSize: maxSize || 5,
        minSize: minSize || 2,
        idleTimeout: idleTimeout || 300000
      }
    });
  } else {
    browserPool = null;
    res.json({
      success: true,
      message: 'Browser pool disabled',
      config: { enabled: false }
    });
  }
});

// Start server
server.listen(PORT, () => {
  console.log(`\n=== Playwright-Based Test Runner Server ===`);
  console.log(`Server running on port ${PORT}`);
  console.log(`API server running at http://localhost:${PORT}`);
  console.log(`Frontend should be started separately on port 3000`);
  logSystemInfo();

  // Browser pool is disabled
  browserPool = null;

  console.log('Browser pool is disabled');
  console.log('Ready to run tests!');
});
