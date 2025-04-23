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
    usePlaywrightTestRunner: false,
    workers: 4,
    headless: true,
    retries: 1,
    timeout: 30000,
    browserTypes: ['chromium', 'firefox']
  },
  paths: {
    screenshotsDir: path.join(__dirname, 'screenshots'),
    videosDir: path.join(__dirname, 'videos'),
    tracesDir: path.join(__dirname, 'traces'),
    reportsDir: path.join(__dirname, 'reports'),
    testPlansDir: path.join(__dirname, 'test-plans')
  },
  performance: {
    collectMetrics: true,
    webVitals: true,
    networkMetrics: true,
    thresholds: {
      lcp: 2500,
      fid: 100,
      cls: 0.1,
      ttfb: 600
    }
  },
  database: {
    type: 'sqlite', // 'sqlite' or 'mongodb'
    mongodb: {
      uri: 'mongodb://localhost:27017',
      dbName: 'playwright_server_agent'
    },
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
  database: {
    ...defaultConfig.database,
    ...(userConfig.database || {}),
    mongodb: {
      ...defaultConfig.database.mongodb,
      ...(userConfig.database?.mongodb || {})
    },
    sqlite: {
      ...defaultConfig.database.sqlite,
      ...(userConfig.database?.sqlite || {})
    }
  }
};

// Create directories if they don't exist
Object.values(config.paths).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

export default config;
