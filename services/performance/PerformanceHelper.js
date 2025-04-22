/**
 * Performance Helper module
 * Collects and analyzes web performance metrics
 */

/**
 * Helper class for collecting web performance metrics
 */
export class PerformanceHelper {
  /**
   * Creates a new PerformanceHelper instance
   * @param {Page} page - Playwright page object
   */
  constructor(page) {
    this.page = page;
  }

  /**
   * Sets up performance observers in the page
   * @returns {Promise<void>}
   */
  async setupPerformanceObservers() {
    await this.page.addInitScript(() => {
      // Initialize CLS tracking
      window.cls = 0;
      
      // Track CLS
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput) {
            window.cls += entry.value;
          }
        }
      }).observe({ type: 'layout-shift', buffered: true });
      
      // Track FID
      window.fid = null;
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (window.fid === null) {
            window.fid = entry.processingStart - entry.startTime;
          }
        }
      }).observe({ type: 'first-input', buffered: true });
      
      // Track LCP
      window.lcp = null;
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        window.lcp = lastEntry.startTime;
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    });
    
    console.log('Performance observers set up in the page');
  }

  /**
   * Captures Web Vitals metrics from the page
   * @returns {Promise<Object>} Web Vitals metrics
   */
  async captureWebVitals() {
    console.log('Capturing Web Vitals metrics...');
    
    try {
      const webVitals = await this.page.evaluate(() => {
        const vitals = {};
        
        // FCP - First Contentful Paint
        const fcpEntries = performance.getEntriesByName('first-contentful-paint');
        if (fcpEntries.length > 0) {
          vitals.fcp = fcpEntries[0].startTime;
        } else {
          // Fallback to first paint if FCP is not available
          const paintEntries = performance.getEntriesByType('paint');
          const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
          if (firstPaint) {
            vitals.fcp = firstPaint.startTime;
          }
        }
        
        // LCP - Largest Contentful Paint
        vitals.lcp = window.lcp;
        
        // CLS - Cumulative Layout Shift
        vitals.cls = window.cls;
        
        // FID - First Input Delay
        vitals.fid = window.fid;
        
        // TTI - Time to Interactive (approximation)
        const loadEventEnd = performance.timing.loadEventEnd - performance.timing.navigationStart;
        vitals.tti = loadEventEnd;
        
        // TTFB - Time to First Byte
        vitals.ttfb = performance.timing.responseStart - performance.timing.navigationStart;
        
        return vitals;
      });
      
      console.log('Web Vitals captured:', webVitals);
      return webVitals;
    } catch (error) {
      console.error('Error capturing Web Vitals:', error.message);
      return {
        error: error.message
      };
    }
  }

  /**
   * Captures network performance metrics
   * @returns {Promise<Object>} Network metrics
   */
  async captureNetworkMetrics() {
    console.log('Capturing network metrics...');
    
    try {
      const networkMetrics = await this.page.evaluate(() => {
        const resources = performance.getEntriesByType('resource');
        
        // Group resources by type
        const resourcesByType = resources.reduce((acc, resource) => {
          const type = resource.initiatorType || 'other';
          if (!acc[type]) {
            acc[type] = [];
          }
          acc[type].push({
            name: resource.name,
            duration: resource.duration,
            size: resource.transferSize || 0,
            startTime: resource.startTime
          });
          return acc;
        }, {});
        
        // Calculate totals
        const totalResources = resources.length;
        const totalSize = resources.reduce((sum, resource) => sum + (resource.transferSize || 0), 0);
        const totalDuration = resources.reduce((max, resource) => Math.max(max, resource.responseEnd), 0);
        
        // Find slow resources (taking more than 1 second)
        const slowResources = resources
          .filter(resource => resource.duration > 1000)
          .map(resource => ({
            name: resource.name,
            duration: resource.duration,
            size: resource.transferSize || 0
          }));
        
        return {
          totalResources,
          totalSize,
          totalDuration,
          resourcesByType,
          slowResources
        };
      });
      
      console.log('Network metrics captured');
      return networkMetrics;
    } catch (error) {
      console.error('Error capturing network metrics:', error.message);
      return {
        error: error.message
      };
    }
  }

  /**
   * Captures all performance metrics
   * @returns {Promise<Object>} All performance metrics
   */
  async captureAllMetrics() {
    const webVitals = await this.captureWebVitals();
    const networkMetrics = await this.captureNetworkMetrics();
    
    return {
      webVitals,
      networkMetrics,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Analyzes Web Vitals metrics and provides recommendations
   * @param {Object} webVitals - Web Vitals metrics
   * @returns {Object} Analysis and recommendations
   */
  analyzeWebVitals(webVitals) {
    const analysis = {
      scores: {},
      issues: [],
      recommendations: []
    };
    
    // FCP analysis
    if (webVitals.fcp) {
      if (webVitals.fcp < 1000) {
        analysis.scores.fcp = 'good';
      } else if (webVitals.fcp < 3000) {
        analysis.scores.fcp = 'needs-improvement';
        analysis.issues.push('FCP is slower than recommended (1s)');
        analysis.recommendations.push('Optimize critical rendering path, reduce render-blocking resources');
      } else {
        analysis.scores.fcp = 'poor';
        analysis.issues.push('FCP is very slow (>3s)');
        analysis.recommendations.push('Reduce server response time, eliminate render-blocking resources, optimize CSS');
      }
    }
    
    // LCP analysis
    if (webVitals.lcp) {
      if (webVitals.lcp < 2500) {
        analysis.scores.lcp = 'good';
      } else if (webVitals.lcp < 4000) {
        analysis.scores.lcp = 'needs-improvement';
        analysis.issues.push('LCP is slower than recommended (2.5s)');
        analysis.recommendations.push('Optimize largest image or text block, improve server response time');
      } else {
        analysis.scores.lcp = 'poor';
        analysis.issues.push('LCP is very slow (>4s)');
        analysis.recommendations.push('Implement lazy loading, optimize images, use CDN, preload critical resources');
      }
    }
    
    // CLS analysis
    if (webVitals.cls !== undefined) {
      if (webVitals.cls < 0.1) {
        analysis.scores.cls = 'good';
      } else if (webVitals.cls < 0.25) {
        analysis.scores.cls = 'needs-improvement';
        analysis.issues.push('CLS is higher than recommended (0.1)');
        analysis.recommendations.push('Set size attributes on images and videos, avoid inserting content above existing content');
      } else {
        analysis.scores.cls = 'poor';
        analysis.issues.push('CLS is very high (>0.25)');
        analysis.recommendations.push('Always include size attributes on images/videos, reserve space for ads, avoid adding dynamic content');
      }
    }
    
    // FID analysis
    if (webVitals.fid) {
      if (webVitals.fid < 100) {
        analysis.scores.fid = 'good';
      } else if (webVitals.fid < 300) {
        analysis.scores.fid = 'needs-improvement';
        analysis.issues.push('FID is slower than recommended (100ms)');
        analysis.recommendations.push('Break up long tasks, optimize JavaScript execution');
      } else {
        analysis.scores.fid = 'poor';
        analysis.issues.push('FID is very slow (>300ms)');
        analysis.recommendations.push('Minimize main thread work, reduce JavaScript execution time, defer non-critical JavaScript');
      }
    }
    
    return analysis;
  }
}
