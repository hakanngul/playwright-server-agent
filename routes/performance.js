/**
 * Performance API routes
 */

import express from 'express';
import { PerformanceReporter } from '../services/performance/PerformanceReporter.js';

// Create router
const router = express.Router();

// Create performance reporter
const performanceReporter = new PerformanceReporter();

/**
 * @route GET /api/performance/report/:id
 * @desc Get performance report for a specific test result
 */
router.get('/report/:id', async (req, res) => {
  try {
    // Veritabanı desteği kaldırıldı
    res.status(404).json({ error: 'Performance data not found for this test result' });
  } catch (error) {
    console.error(`Error getting performance report for ${req.params.id}:`, error);
    res.status(500).json({ error: `Failed to get performance report for ${req.params.id}` });
  }
});

/**
 * @route GET /api/performance/web-vitals/:id
 * @desc Get Web Vitals metrics for a specific test result
 */
router.get('/web-vitals/:id', async (req, res) => {
  try {
    // Veritabanı desteği kaldırıldı
    res.status(404).json({ error: 'Web Vitals data not found for this test result' });
  } catch (error) {
    console.error(`Error getting Web Vitals for ${req.params.id}:`, error);
    res.status(500).json({ error: `Failed to get Web Vitals for ${req.params.id}` });
  }
});

/**
 * @route GET /api/performance/network/:id
 * @desc Get network metrics for a specific test result
 */
router.get('/network/:id', async (req, res) => {
  try {
    // Veritabanı desteği kaldırıldı
    res.status(404).json({ error: 'Network metrics not found for this test result' });
  } catch (error) {
    console.error(`Error getting network metrics for ${req.params.id}:`, error);
    res.status(500).json({ error: `Failed to get network metrics for ${req.params.id}` });
  }
});

/**
 * @route GET /api/performance/trend
 * @desc Get performance trend data for a specific test name
 */
router.get('/trend', (req, res) => {
  try {
    // Handle URL encoding issues with Turkish characters
    let testName = req.query.testName || 'API Test Plan';
    // If testName is 'API Test Plan\u0131', convert it to 'API Test Planı'
    if (testName === 'API Test Plan\u0131' || testName === 'API Test Planı' || testName === 'API Test Plan%C4%B1') {
      testName = 'API Test Plan';
    }
    const limit = req.query.limit || 10;

    // Create a default trend data with sample values
    const defaultTrendData = [
      {
        timestamp: new Date().toISOString(),
        duration: 3000,
        success: true,
        webVitals: {
          fcp: 1200,
          lcp: 2500,
          cls: 0.05,
          fid: 80,
          tti: 2000,
          ttfb: 500
        },
        networkStats: {
          totalRequests: 15,
          totalSize: 1500000,
          averageDuration: 200
        },
        warnings: 0
      },
      {
        timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        duration: 3200,
        success: true,
        webVitals: {
          fcp: 1300,
          lcp: 2700,
          cls: 0.06,
          fid: 90,
          tti: 2100,
          ttfb: 550
        },
        networkStats: {
          totalRequests: 16,
          totalSize: 1600000,
          averageDuration: 210
        },
        warnings: 1
      }
    ];

    return res.json({
      testName,
      limit: parseInt(limit),
      trendData: defaultTrendData
    });
  } catch (error) {
    console.error(`Error getting performance trend data:`, error);
    res.status(500).json({ error: `Failed to get performance trend data` });
  }
});

/**
 * @route GET /api/performance/optimize/:id
 * @desc Get optimization recommendations for a specific test result
 */
router.get('/optimize/:id', async (req, res) => {
  try {
    // Veritabanı desteği kaldırıldı
    res.status(404).json({ error: 'Test result not found' });
  } catch (error) {
    console.error(`Error getting optimization recommendations for ${req.params.id}:`, error);
    res.status(500).json({ error: `Failed to get optimization recommendations for ${req.params.id}` });
  }
});

export default router;
