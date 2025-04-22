/**
 * Performance Reporter module
 * Generates and saves performance reports
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Performance Reporter class
 */
export class PerformanceReporter {
  /**
   * Creates a new PerformanceReporter instance
   * @param {Object} options - Reporter options
   */
  constructor(options = {}) {
    this.reportsDir = options.reportsDir || path.join(process.cwd(), 'data/performance-reports');
    this.thresholds = options.thresholds || {
      fcp: 1000,    // 1 second
      lcp: 2500,    // 2.5 seconds
      cls: 0.1,     // 0.1
      fid: 100,     // 100ms
      ttfb: 600,    // 600ms
      requestDuration: 1000 // 1 second
    };
    
    // Ensure reports directory exists
    this.ensureDirectoryExists(this.reportsDir);
  }

  /**
   * Ensures a directory exists
   * @param {string} dir - Directory path
   * @private
   */
  ensureDirectoryExists(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Saves a performance report
   * @param {string} testName - Test name
   * @param {Object} performanceData - Performance data
   * @returns {Object} Report result
   */
  saveReport(testName, performanceData) {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const filename = `${testName.replace(/\\s+/g, '-')}_${timestamp}.json`;
    const filePath = path.join(this.reportsDir, filename);
    
    // Check for threshold violations
    const warnings = this.checkThresholds(performanceData);
    
    // Create report object
    const reportData = {
      testName,
      timestamp: new Date().toISOString(),
      performanceData,
      warnings,
      recommendations: this.generateRecommendations(performanceData, warnings)
    };
    
    // Save report
    fs.writeFileSync(filePath, JSON.stringify(reportData, null, 2));
    
    console.log(`Performance report saved to: ${filePath}`);
    
    return {
      filePath,
      warnings
    };
  }

  /**
   * Checks for threshold violations
   * @param {Object} performanceData - Performance data
   * @returns {Array} Warnings
   * @private
   */
  checkThresholds(performanceData) {
    const warnings = [];
    
    // Check Web Vitals thresholds
    if (performanceData.webVitals) {
      const { webVitals } = performanceData;
      
      // Check FCP
      if (webVitals.fcp && webVitals.fcp > this.thresholds.fcp) {
        warnings.push({
          type: 'fcp',
          message: `First Contentful Paint (${webVitals.fcp.toFixed(2)}ms) exceeds threshold (${this.thresholds.fcp}ms)`,
          value: webVitals.fcp,
          threshold: this.thresholds.fcp
        });
      }
      
      // Check LCP
      if (webVitals.lcp && webVitals.lcp > this.thresholds.lcp) {
        warnings.push({
          type: 'lcp',
          message: `Largest Contentful Paint (${webVitals.lcp.toFixed(2)}ms) exceeds threshold (${this.thresholds.lcp}ms)`,
          value: webVitals.lcp,
          threshold: this.thresholds.lcp
        });
      }
      
      // Check CLS
      if (webVitals.cls !== undefined && webVitals.cls > this.thresholds.cls) {
        warnings.push({
          type: 'cls',
          message: `Cumulative Layout Shift (${webVitals.cls.toFixed(3)}) exceeds threshold (${this.thresholds.cls})`,
          value: webVitals.cls,
          threshold: this.thresholds.cls
        });
      }
      
      // Check FID
      if (webVitals.fid && webVitals.fid > this.thresholds.fid) {
        warnings.push({
          type: 'fid',
          message: `First Input Delay (${webVitals.fid.toFixed(2)}ms) exceeds threshold (${this.thresholds.fid}ms)`,
          value: webVitals.fid,
          threshold: this.thresholds.fid
        });
      }
      
      // Check TTFB
      if (webVitals.ttfb && webVitals.ttfb > this.thresholds.ttfb) {
        warnings.push({
          type: 'ttfb',
          message: `Time to First Byte (${webVitals.ttfb.toFixed(2)}ms) exceeds threshold (${this.thresholds.ttfb}ms)`,
          value: webVitals.ttfb,
          threshold: this.thresholds.ttfb
        });
      }
    }
    
    // Check network metrics
    if (performanceData.networkMetrics) {
      const { networkMetrics } = performanceData;
      
      // Check slow requests
      if (networkMetrics.slowRequests && networkMetrics.slowRequests.length > 0) {
        warnings.push({
          type: 'slowRequests',
          message: `Found ${networkMetrics.slowRequests.length} slow requests (>1000ms)`,
          value: networkMetrics.slowRequests.length,
          details: networkMetrics.slowRequests
        });
      }
      
      // Check failed requests
      if (networkMetrics.failedRequests && networkMetrics.failedRequests.length > 0) {
        warnings.push({
          type: 'failedRequests',
          message: `Found ${networkMetrics.failedRequests.length} failed requests`,
          value: networkMetrics.failedRequests.length,
          details: networkMetrics.failedRequests
        });
      }
      
      // Check total page size
      if (networkMetrics.totalSize && networkMetrics.totalSize > 5000000) { // 5MB
        warnings.push({
          type: 'pageSize',
          message: `Page size (${(networkMetrics.totalSize / 1024 / 1024).toFixed(2)}MB) is too large`,
          value: networkMetrics.totalSize,
          threshold: 5000000
        });
      }
      
      // Check number of requests
      if (networkMetrics.totalRequests && networkMetrics.totalRequests > 100) {
        warnings.push({
          type: 'requestCount',
          message: `Too many requests (${networkMetrics.totalRequests})`,
          value: networkMetrics.totalRequests,
          threshold: 100
        });
      }
    }
    
    return warnings;
  }

  /**
   * Generates recommendations based on performance data and warnings
   * @param {Object} performanceData - Performance data
   * @param {Array} warnings - Warnings
   * @returns {Array} Recommendations
   * @private
   */
  generateRecommendations(performanceData, warnings) {
    const recommendations = [];
    
    // Add recommendations based on warnings
    for (const warning of warnings) {
      switch (warning.type) {
        case 'fcp':
          recommendations.push('Optimize critical rendering path, reduce render-blocking resources');
          break;
        case 'lcp':
          recommendations.push('Optimize largest image or text block, improve server response time');
          break;
        case 'cls':
          recommendations.push('Set size attributes on images and videos, avoid inserting content above existing content');
          break;
        case 'fid':
          recommendations.push('Break up long tasks, optimize JavaScript execution');
          break;
        case 'ttfb':
          recommendations.push('Improve server response time, use CDN, optimize backend');
          break;
        case 'slowRequests':
          recommendations.push('Optimize slow resources, consider using CDN, implement caching');
          break;
        case 'failedRequests':
          recommendations.push('Fix failed resource requests to improve page reliability');
          break;
        case 'pageSize':
          recommendations.push('Reduce page size by optimizing images and minifying resources');
          break;
        case 'requestCount':
          recommendations.push('Reduce number of requests by bundling resources, using sprites, or implementing HTTP/2');
          break;
      }
    }
    
    // Remove duplicates
    return [...new Set(recommendations)];
  }

  /**
   * Generates a trend report for a test
   * @param {string} testName - Test name
   * @param {number} limit - Maximum number of reports to include
   * @returns {Array} Trend data
   */
  generateTrendReport(testName, limit = 10) {
    const testNamePattern = testName.replace(/\\s+/g, '-');
    const files = fs.readdirSync(this.reportsDir)
      .filter(file => file.startsWith(testNamePattern) && file.endsWith('.json'))
      .sort()
      .reverse()
      .slice(0, limit);
    
    const trendData = files.map(file => {
      const filePath = path.join(this.reportsDir, file);
      const reportData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      return {
        timestamp: reportData.timestamp,
        webVitals: reportData.performanceData.webVitals,
        networkStats: {
          totalRequests: reportData.performanceData.networkMetrics?.totalRequests,
          totalSize: reportData.performanceData.networkMetrics?.totalSize,
          averageDuration: reportData.performanceData.networkMetrics?.averageDuration
        },
        warnings: reportData.warnings.length
      };
    });
    
    return trendData;
  }
}
