/**
 * Status API routes
 */

import express from 'express';
import os from 'os';
import { execSync } from 'child_process';
import { testResultService } from '../database/index.js';

// Create router
const router = express.Router();

/**
 * @route GET /api/status
 * @desc Get server status
 */
router.get('/', (req, res) => {
  try {
    // Calculate uptime
    const uptime = process.uptime();

    // Get system info
    const platform = process.platform;
    const nodeVersion = process.version;

    // Check for browsers
    const browsers = {
      chromium: 'not checked',
      firefox: 'not checked',
      webkit: 'not checked'
    };

    // Check for Chromium
    try {
      if (platform === 'win32') {
        const winChromeVersion = execSync('reg query "HKEY_CURRENT_USER\\Software\\Google\\Chrome\\BLBeacon" /v version').toString().trim();
        const versionMatch = winChromeVersion.match(/version\\s+REG_SZ\\s+([\\d.]+)/i);
        if (versionMatch && versionMatch[1]) {
          browsers.chromium = 'available';
        }
      } else if (platform === 'darwin') {
        execSync('which google-chrome || which chromium');
        browsers.chromium = 'available';
      } else {
        execSync('which google-chrome || which chromium');
        browsers.chromium = 'available';
      }
    } catch (e) {
      browsers.chromium = 'not found';
    }

    // Check for Firefox
    try {
      if (platform === 'win32') {
        const firefoxVersion = execSync('reg query "HKEY_CURRENT_USER\\Software\\Mozilla\\Mozilla Firefox" /v CurrentVersion').toString().trim();
        const versionMatch = firefoxVersion.match(/CurrentVersion\\s+REG_SZ\\s+([\\d.]+)/i);
        if (versionMatch && versionMatch[1]) {
          browsers.firefox = 'available';
        }
      } else {
        execSync('which firefox');
        browsers.firefox = 'available';
      }
    } catch (e) {
      browsers.firefox = 'not found';
    }

    // Get test statistics
    let testStats = {
      totalTestsRun: 0,
      successfulTests: 0,
      failedTests: 0,
      averageDuration: 0
    };

    try {
      const allResults = testResultService.getAllTestResults({ limit: 1000 });
      
      testStats.totalTestsRun = allResults.length;
      testStats.successfulTests = allResults.filter(r => r.success).length;
      testStats.failedTests = allResults.filter(r => !r.success).length;
      
      if (allResults.length > 0) {
        const totalDuration = allResults.reduce((sum, r) => sum + (r.duration_ms || 0), 0);
        testStats.averageDuration = Math.round(totalDuration / allResults.length);
      }
    } catch (e) {
      console.warn('Error getting test statistics:', e);
    }

    // Get worker status
    const workerStatus = {
      active: 0,
      idle: 4,
      maxWorkers: 4
    };

    res.json({
      status: 'running',
      uptime: Math.round(uptime),
      version: '1.0.0',
      systemInfo: {
        platform,
        nodeVersion,
        browsers
      },
      testStats,
      workerStatus
    });
  } catch (error) {
    console.error('Error getting server status:', error);
    res.status(500).json({ error: 'Failed to get server status' });
  }
});

export default router;
