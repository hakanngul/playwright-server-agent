/**
 * Playwright Server Agent Configuration Example
 * 
 * Copy this file to playwright-server-config.js and modify as needed
 */

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
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
    
    // Directory for videos
    videosDir: path.join(__dirname, 'videos'),
    
    // Directory for traces
    tracesDir: path.join(__dirname, 'traces'),
    
    // Directory for reports
    reportsDir: path.join(__dirname, 'reports'),
    
    // Directory for test plans
    testPlansDir: path.join(__dirname, 'test-plans')
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
