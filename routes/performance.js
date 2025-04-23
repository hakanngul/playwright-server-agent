/**
 * Performance API routes
 */

import express from 'express';
import { testResultService } from '../database/index.js';
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
    const resultId = req.params.id;

    // Get test result
    let result;
    try {
      result = testResultService.getTestResultById(resultId);
    } catch (err) {
      console.warn('Error using testResultService:', err);
      return res.status(404).json({ error: 'Test result not found' });
    }

    if (!result) {
      return res.status(404).json({ error: 'Test result not found' });
    }

    // Extract performance data
    let performanceData = null;
    let webVitals = null;
    let networkMetrics = null;

    if (result.custom_data) {
      try {
        // custom_data can be a string or an object
        const customData = typeof result.custom_data === 'string' ?
          JSON.parse(result.custom_data) : result.custom_data;
        
        // Check for performance field
        if (customData.performance) {
          performanceData = customData.performance;
        }
        
        // Check for webVitals and networkMetrics fields
        if (customData.webVitals) {
          webVitals = customData.webVitals;
        }
        if (customData.networkMetrics) {
          networkMetrics = customData.networkMetrics;
        }
      } catch (parseErr) {
        console.warn('Error parsing custom_data:', parseErr);
      }
    }

    // If performanceData doesn't exist but webVitals or networkMetrics do, create performanceData
    if (!performanceData && (webVitals || networkMetrics)) {
      performanceData = {};
      if (webVitals) performanceData.webVitals = webVitals;
      if (networkMetrics) performanceData.networkMetrics = networkMetrics;
    }

    if (!performanceData) {
      return res.status(404).json({ error: 'Performance data not found for this test result' });
    }

    // Get URL information
    let url = null;
    if (result.steps && Array.isArray(result.steps) && result.steps.length > 0) {
      const navigateStep = result.steps.find(step => step.action_type === 'navigate');
      if (navigateStep) {
        url = navigateStep.action_value;
      }
    }

    // Calculate step statistics
    const stepStats = { totalSteps: 0, averageStepDuration: 0, minStepDuration: 0, maxStepDuration: 0, slowestStepIndex: 0 };
    
    if (result.steps && Array.isArray(result.steps) && result.steps.length > 0) {
      const stepDurations = result.steps.map(step => step.duration || 0);
      stepStats.totalSteps = result.steps.length;
      stepStats.averageStepDuration = stepDurations.reduce((a, b) => a + b, 0) / stepDurations.length;
      stepStats.minStepDuration = Math.min(...stepDurations);
      stepStats.maxStepDuration = Math.max(...stepDurations);
      stepStats.slowestStepIndex = stepDurations.indexOf(Math.max(...stepDurations));
    }

    // Get memory usage
    const memoryUsage = {
      initialMemory: performanceData.initialMemory || null,
      finalMemory: performanceData.finalMemory || null,
      memoryDiff: performanceData.memoryDiff || null
    };

    // Generate warnings and recommendations
    const warnings = performanceData.warnings || [];
    const recommendations = performanceData.recommendations || [];

    res.json({
      testId: result.id,
      testName: result.name || 'Test Result',
      timestamp: result.start_time,
      duration: result.duration_ms,
      webVitals: webVitals || performanceData.webVitals || null,
      networkMetrics: networkMetrics || performanceData.networkMetrics || null,
      stepStats,
      memoryUsage,
      warnings,
      recommendations
    });
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
    const resultId = req.params.id;

    // Get test result
    let result;
    try {
      result = testResultService.getTestResultById(resultId);
    } catch (err) {
      console.warn('Error using testResultService:', err);
      return res.status(404).json({ error: 'Test result not found' });
    }

    if (!result) {
      return res.status(404).json({ error: 'Test result not found' });
    }

    // Extract Web Vitals metrics
    let webVitals = null;

    if (result.custom_data) {
      try {
        // custom_data can be a string or an object
        const customData = typeof result.custom_data === 'string' ?
          JSON.parse(result.custom_data) : result.custom_data;
        
        // Check for webVitals field
        if (customData.webVitals) {
          webVitals = customData.webVitals;
        }
        // If not found, check for performance.webVitals field
        else if (customData.performance && customData.performance.webVitals) {
          webVitals = customData.performance.webVitals;
        }
      } catch (parseErr) {
        console.warn('Error parsing custom_data:', parseErr);
      }
    }

    if (!webVitals) {
      return res.status(404).json({ error: 'Web Vitals data not found for this test result' });
    }

    // Calculate Web Vitals scores
    const scores = {};

    // FCP score
    if (webVitals.fcp) {
      if (webVitals.fcp < 1000) {
        scores.fcp = 'good';
      } else if (webVitals.fcp < 3000) {
        scores.fcp = 'needs-improvement';
      } else {
        scores.fcp = 'poor';
      }
    }

    // LCP score
    if (webVitals.lcp) {
      if (webVitals.lcp < 2500) {
        scores.lcp = 'good';
      } else if (webVitals.lcp < 4000) {
        scores.lcp = 'needs-improvement';
      } else {
        scores.lcp = 'poor';
      }
    }

    // CLS score
    if (webVitals.cls !== undefined) {
      if (webVitals.cls < 0.1) {
        scores.cls = 'good';
      } else if (webVitals.cls < 0.25) {
        scores.cls = 'needs-improvement';
      } else {
        scores.cls = 'poor';
      }
    }

    // FID score
    if (webVitals.fid) {
      if (webVitals.fid < 100) {
        scores.fid = 'good';
      } else if (webVitals.fid < 300) {
        scores.fid = 'needs-improvement';
      } else {
        scores.fid = 'poor';
      }
    }

    // Get URL information
    let url = null;
    if (result.steps && Array.isArray(result.steps) && result.steps.length > 0) {
      const navigateStep = result.steps.find(step => step.action_type === 'navigate');
      if (navigateStep) {
        url = navigateStep.action_value;
      }
    }

    // Generate issues and recommendations
    const issues = [];
    const recommendations = [];

    // Check for poor scores and add issues and recommendations
    if (scores.fcp === 'poor') {
      issues.push('First Contentful Paint is too slow');
      recommendations.push('Optimize critical rendering path');
    }
    if (scores.lcp === 'poor') {
      issues.push('Largest Contentful Paint is too slow');
      recommendations.push('Optimize largest content element loading');
    }
    if (scores.cls === 'poor') {
      issues.push('Cumulative Layout Shift is too high');
      recommendations.push('Set explicit dimensions for images and videos');
    }
    if (scores.fid === 'poor') {
      issues.push('First Input Delay is too high');
      recommendations.push('Optimize JavaScript execution');
    }

    res.json({
      testId: result.id,
      testName: result.name || 'Test Result',
      timestamp: result.start_time,
      webVitals,
      scores,
      issues,
      recommendations
    });
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
    const resultId = req.params.id;

    // Get test result
    let result;
    try {
      result = testResultService.getTestResultById(resultId);
    } catch (err) {
      console.warn('Error using testResultService:', err);
      return res.status(404).json({ error: 'Test result not found' });
    }

    if (!result) {
      return res.status(404).json({ error: 'Test result not found' });
    }

    // Extract network metrics
    let networkMetrics = null;
    let timingMetrics = null;
    let networkTimeline = null;
    let networkAnalysis = null;
    let uncacheableResources = null;
    let largeResources = null;

    if (result.custom_data) {
      try {
        // custom_data can be a string or an object
        const customData = typeof result.custom_data === 'string' ?
          JSON.parse(result.custom_data) : result.custom_data;
        
        // Check for networkMetrics field
        if (customData.networkMetrics) {
          networkMetrics = customData.networkMetrics;
        }
        // If not found, check for performance.networkMetrics field
        else if (customData.performance && customData.performance.networkMetrics) {
          networkMetrics = customData.performance.networkMetrics;
        }

        // Check for other network metrics
        if (customData.performance) {
          timingMetrics = customData.performance.timingMetrics;
          networkTimeline = customData.performance.networkTimeline;
          networkAnalysis = customData.performance.networkAnalysis;
          uncacheableResources = customData.performance.uncacheableResources;
          largeResources = customData.performance.largeResources;
        }
      } catch (parseErr) {
        console.warn('Error parsing custom_data:', parseErr);
      }
    }

    if (!networkMetrics) {
      return res.status(404).json({ error: 'Network metrics not found for this test result' });
    }

    // Get URL information
    let url = null;
    if (result.steps && Array.isArray(result.steps) && result.steps.length > 0) {
      const navigateStep = result.steps.find(step => step.action_type === 'navigate');
      if (navigateStep) {
        url = navigateStep.action_value;
      }
    }

    // Format resource statistics
    const resourceStats = [];
    if (networkMetrics.statsByType) {
      Object.entries(networkMetrics.statsByType).forEach(([type, stats]) => {
        resourceStats.push({
          type,
          count: stats.count,
          totalSize: stats.totalSize,
          averageDuration: stats.averageDuration,
          slowCount: stats.slowCount || 0,
          largeCount: stats.largeCount || 0
        });
      });
    }

    // Generate issues and recommendations
    const issues = [];
    const recommendations = [];

    // Check for slow requests
    if (networkMetrics.slowRequests && networkMetrics.slowRequests.length > 0) {
      issues.push(`Found ${networkMetrics.slowRequests.length} slow requests`);
      recommendations.push('Optimize slow network requests');
    }

    // Check for failed requests
    if (networkMetrics.failedRequests && networkMetrics.failedRequests.length > 0) {
      issues.push(`Found ${networkMetrics.failedRequests.length} failed requests`);
      recommendations.push('Fix failed network requests');
    }

    // Check for uncacheable resources
    if (uncacheableResources && uncacheableResources.length > 0) {
      issues.push(`Found ${uncacheableResources.length} uncacheable resources`);
      recommendations.push('Add proper cache headers to static resources');
    }

    // Check for large resources
    if (largeResources && largeResources.length > 0) {
      issues.push(`Found ${largeResources.length} large resources`);
      recommendations.push('Optimize large resources');
    }

    res.json({
      testId: result.id,
      testName: result.name || 'Test Result',
      url,
      timestamp: result.start_time,
      networkMetrics: {
        totalRequests: networkMetrics.totalRequests,
        totalSize: networkMetrics.totalSize,
        averageDuration: networkMetrics.averageDuration,
        slowRequests: networkMetrics.slowRequests || [],
        failedRequests: networkMetrics.failedRequests || [],
        resourceStats,
        timingMetrics: timingMetrics || {},
        uncacheableResources: uncacheableResources || [],
        largeResources: largeResources || []
      },
      issues,
      recommendations
    });
  } catch (error) {
    console.error(`Error getting network metrics for ${req.params.id}:`, error);
    res.status(500).json({ error: `Failed to get network metrics for ${req.params.id}` });
  }
});

/**
 * @route GET /api/performance/trend
 * @desc Get performance trend data for a specific test name
 */
router.get('/trend', async (req, res) => {
  try {
    const { testName, limit = 10 } = req.query;

    if (!testName) {
      return res.status(400).json({ error: 'Test name is required' });
    }

    // Get trend data
    const trendData = performanceReporter.generateTrendReport(testName, parseInt(limit));

    res.json({
      testName,
      limit: parseInt(limit),
      trendData
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
    const resultId = req.params.id;

    // Get test result
    let result;
    try {
      result = testResultService.getTestResultById(resultId);
    } catch (err) {
      console.warn('Error using testResultService:', err);
      return res.status(404).json({ error: 'Test result not found' });
    }

    if (!result) {
      return res.status(404).json({ error: 'Test result not found' });
    }

    // Extract performance data
    const performanceData = {
      testDuration: result.duration_ms,
      steps: result.steps || [],
      webVitals: result.web_vitals || {},
      networkMetrics: result.network_metrics || {},
      systemMetrics: result.system_metrics || {}
    };

    // Generate optimization suggestions
    const optimizationSuggestions = [];

    // Analyze slow steps
    if (performanceData.steps.length > 0) {
      const stepDurations = performanceData.steps.map(step => step.duration || 0);
      const stepStats = {
        totalSteps: performanceData.steps.length,
        averageStepDuration: stepDurations.reduce((a, b) => a + b, 0) / stepDurations.length,
        minStepDuration: Math.min(...stepDurations),
        maxStepDuration: Math.max(...stepDurations),
        slowestStepIndex: stepDurations.indexOf(Math.max(...stepDurations))
      };

      const slowStepRecommendations = performanceReporter.analyzeSlowSteps(stepStats, performanceData.steps);
      
      if (slowStepRecommendations.length > 0) {
        optimizationSuggestions.push({
          category: 'steps',
          severity: 'medium',
          issue: 'Slow test steps detected',
          recommendation: slowStepRecommendations[0],
          resources: [
            {
              step: stepStats.slowestStepIndex + 1,
              action: performanceData.steps[stepStats.slowestStepIndex].action_type,
              duration: performanceData.steps[stepStats.slowestStepIndex].duration
            }
          ]
        });
      }
    }

    // Analyze network bottlenecks
    if (performanceData.networkMetrics && Object.keys(performanceData.networkMetrics).length > 0) {
      const networkRecommendations = performanceReporter.analyzeNetworkBottlenecks(performanceData.networkMetrics);
      
      if (networkRecommendations.length > 0) {
        optimizationSuggestions.push({
          category: 'network',
          severity: 'high',
          issue: 'Network bottlenecks detected',
          recommendation: networkRecommendations[0],
          resources: []
        });
      }
    }

    // Analyze memory usage
    if (performanceData.systemMetrics && performanceData.systemMetrics.memory) {
      const memoryRecommendations = performanceReporter.analyzeMemoryUsage(performanceData.systemMetrics.memory);
      
      if (memoryRecommendations.length > 0) {
        optimizationSuggestions.push({
          category: 'memory',
          severity: 'low',
          issue: 'Memory usage issues detected',
          recommendation: memoryRecommendations[0],
          resources: []
        });
      }
    }

    // Analyze parallelization potential
    const parallelizationRecommendations = performanceReporter.analyzeParallelizationPotential(performanceData);
    
    if (parallelizationRecommendations.length > 0) {
      optimizationSuggestions.push({
        category: 'parallelization',
        severity: 'medium',
        issue: 'Parallelization opportunities detected',
        recommendation: parallelizationRecommendations[0],
        resources: []
      });
    }

    // Calculate potential improvements
    const potentialImprovements = {
      performance: optimizationSuggestions.length > 2 ? 'major' : optimizationSuggestions.length > 0 ? 'minor' : 'none',
      loadTime: optimizationSuggestions.some(s => s.category === 'network') ? '~500ms' : '~0ms',
      resourceUsage: optimizationSuggestions.some(s => s.category === 'memory') ? '~100KB' : '~0KB'
    };

    res.json({
      testId: result.id,
      testName: result.name || 'Test Result',
      timestamp: result.start_time,
      optimizationSuggestions,
      potentialImprovements
    });
  } catch (error) {
    console.error(`Error getting optimization recommendations for ${req.params.id}:`, error);
    res.status(500).json({ error: `Failed to get optimization recommendations for ${req.params.id}` });
  }
});

export default router;
