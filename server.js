import express from 'express';
import path from 'path';
import fs from 'fs';
import http from 'http';
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { TestAgent } from './services/testAgent.js';
import apiRoutes from './routes/api.js';

// Get current file path and directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Log system information for debugging
const logSystemInfo = () => {
  console.log('\n--- System Information ---');
  console.log(`Platform: ${process.platform}`);
  console.log(`Node Version: ${process.version}`);

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

      // WebKit/Safari desteği kaldırıldı
      if (false) {
        try {
          // Sadece versiyon bilgisini al, uygulamayı başlatma
          const safariVersion = execSync('defaults read /Applications/Safari.app/Contents/Info CFBundleShortVersionString').toString().trim();
          console.log(`Safari Version: ${safariVersion}`);
        } catch (e) {
          console.log('Safari version check failed');
        }
      } else if (process.platform === 'win32') {
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
    console.log('Firefox not found or version check failed');
  }

  // WebKit/Safari desteği kaldırıldı

  console.log('------------------------\n');
};

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

// Add a simple health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Add a simple test endpoint to verify Playwright is working
app.get('/api/test/verify-playwright', (req, res) => {
  // Sadece Playwright'in yüklü olduğunu kontrol edelim, tarayıcı başlatmadan
  try {
    const { chromium, firefox } = require('playwright');
    res.json({
      success: true,
      message: 'Playwright is installed correctly',
      availableBrowsers: {
        chromium: true,
        firefox: true
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
app.get('/api/browsers', (req, res) => {
  const browsers = [
    { id: 'chromium', name: 'Chromium' },
    { id: 'firefox', name: 'Firefox' }
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

    // Create test agent with browser preference and options
    const testAgent = new TestAgent(browserPreference, { headless });

    // Step completion callback
    testAgent.onStepCompleted = (step, result, index) => {
      console.log(`Step ${index + 1} completed: ${result.success ? 'Success' : 'Failed'}`);

      // Send step completion message via WebSocket
      broadcastMessage({
        type: 'step_completed',
        stepIndex: index,
        step: step,
        result: result
      });
    };

    // Run the test
    const results = await testAgent.runTest(testPlan);
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
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Start server
server.listen(PORT, () => {
  console.log(`\n=== Playwright-Based Test Runner Server ===`);
  console.log(`Server running on port ${PORT}`);
  console.log(`API server running at http://localhost:${PORT}`);
  console.log(`Frontend should be started separately on port 3000`);
  logSystemInfo();
  console.log('Ready to run tests!');
});
