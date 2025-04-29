/**
 * Configuration module
 * Manages application configuration
 */

import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default configuration
const defaultConfig = {
  server: {
    port: 3002,
    allowedOrigins: ['http://localhost:3000', 'http://localhost:3001']
  },
  test: {
    // Use Playwright Test Runner instead of custom implementation
    usePlaywrightTestRunner: true,

    // Number of parallel workers
    workers: 4,

    // Run browsers in headless mode
    headless: true,

    // Number of retries for failed tests
    retries: 1,

    // Test timeout in milliseconds
    timeout: 30000,

    // Supported browser types
    browserTypes: ['chromium', 'firefox']
  },
  paths: {
    // Directory for screenshots
    screenshotsDir: path.join(__dirname, 'screenshots'),

    // Directory for reports
    reportsDir: path.join(__dirname, 'data/reports')

    // videos ve traces özellikleri kaldırıldı
  },
  performance: {
    // Collect performance metrics
    collectMetrics: true,

    // Collect Web Vitals metrics
    webVitals: true,

    // Collect network metrics
    networkMetrics: true,

    // Performance thresholds
    thresholds: {
      // Largest Contentful Paint (ms)
      lcp: 2500,

      // First Input Delay (ms)
      fid: 100,

      // Cumulative Layout Shift
      cls: 0.1,

      // Time to First Byte (ms)
      ttfb: 600
    }
  },
  database: {
    // Database type: 'sqlite' or 'mongodb'
    type: 'sqlite',

    // MongoDB configuration
    mongodb: {
      uri: 'mongodb://localhost:27017',
      dbName: 'playwright_server_agent'
    },

    // SQLite configuration
    sqlite: {
      path: path.join(__dirname, 'data', 'database.sqlite')
    }
  }
};

// Load user configuration if exists
let userConfig = {};
const userConfigPath = path.join(__dirname, 'playwright-server-config.js');

if (fs.existsSync(userConfigPath)) {
  try {
    // Use dynamic import for ES modules
    const importedConfig = await import(userConfigPath);
    userConfig = importedConfig.default || importedConfig;
    console.log('User configuration loaded successfully');
  } catch (error) {
    console.error(`Error loading user configuration: ${error.message}`);
  }
}

// Merge configurations
const config = {
  ...defaultConfig,
  server: { ...defaultConfig.server, ...(userConfig.server || {}) },
  test: { ...defaultConfig.test, ...(userConfig.test || {}) },
  paths: { ...defaultConfig.paths, ...(userConfig.paths || {}) },
  performance: {
    ...defaultConfig.performance,
    ...(userConfig.performance || {}),
    thresholds: {
      ...defaultConfig.performance.thresholds,
      ...(userConfig.performance?.thresholds || {})
    }
  },
  database: { ...defaultConfig.database, ...(userConfig.database || {}) }
};

// Create directories if they don't exist
Object.values(config.paths).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

export default config;
