/**
 * Network Monitor module
 * Monitors network requests and responses
 */

/**
 * Helper class for monitoring network activity
 */
export class NetworkMonitor {
  /**
   * Creates a new NetworkMonitor instance
   * @param {Page} page - Playwright page object
   */
  constructor(page) {
    this.page = page;
    this.requests = [];
    this.setupListeners();
  }

  /**
   * Sets up network request listeners
   */
  setupListeners() {
    // Track request start
    this.page.on('request', request => {
      const requestData = {
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType(),
        startTime: Date.now(),
        status: null,
        responseSize: 0,
        duration: 0,
        failed: false,
        errorText: null
      };
      
      this.requests.push(requestData);
    });
    
    // Track request finish
    this.page.on('response', async response => {
      const request = response.request();
      const requestData = this.requests.find(r => r.url === request.url());
      
      if (requestData) {
        requestData.status = response.status();
        requestData.duration = Date.now() - requestData.startTime;
        
        try {
          // Try to get response size
          const buffer = await response.body().catch(() => null);
          if (buffer) {
            requestData.responseSize = buffer.length;
          }
        } catch (error) {
          // Some responses can't be converted to buffer
          console.debug(`Could not get response size for ${request.url()}: ${error.message}`);
        }
      }
    });
    
    // Track request failures
    this.page.on('requestfailed', request => {
      const requestData = this.requests.find(r => r.url === request.url());
      
      if (requestData) {
        requestData.failed = true;
        requestData.errorText = request.failure().errorText;
        requestData.duration = Date.now() - requestData.startTime;
      }
    });
  }

  /**
   * Gets network statistics
   * @returns {Object} Network statistics
   */
  getNetworkStats() {
    // Calculate total requests
    const totalRequests = this.requests.length;
    
    // Calculate total size
    const totalSize = this.requests.reduce((sum, req) => sum + (req.responseSize || 0), 0);
    
    // Calculate average duration
    const completedRequests = this.requests.filter(req => req.duration > 0);
    const averageDuration = completedRequests.length > 0 
      ? completedRequests.reduce((sum, req) => sum + req.duration, 0) / completedRequests.length 
      : 0;
    
    // Find slow requests (taking more than 1 second)
    const slowRequests = this.requests
      .filter(req => req.duration > 1000)
      .map(req => ({
        url: req.url,
        duration: req.duration,
        resourceType: req.resourceType,
        size: req.responseSize
      }));
    
    // Find failed requests
    const failedRequests = this.requests
      .filter(req => req.failed)
      .map(req => ({
        url: req.url,
        errorText: req.errorText,
        resourceType: req.resourceType
      }));
    
    // Group by resource type
    const requestsByType = this.requests.reduce((acc, req) => {
      const type = req.resourceType || 'other';
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(req);
      return acc;
    }, {});
    
    // Calculate stats by resource type
    const statsByType = {};
    for (const [type, requests] of Object.entries(requestsByType)) {
      statsByType[type] = {
        count: requests.length,
        totalSize: requests.reduce((sum, req) => sum + (req.responseSize || 0), 0),
        averageDuration: requests.filter(req => req.duration > 0).length > 0
          ? requests.filter(req => req.duration > 0).reduce((sum, req) => sum + req.duration, 0) / requests.filter(req => req.duration > 0).length
          : 0
      };
    }
    
    return {
      totalRequests,
      totalSize,
      averageDuration,
      slowRequests,
      failedRequests,
      statsByType
    };
  }

  /**
   * Resets the monitor
   */
  reset() {
    this.requests = [];
  }
  
  /**
   * Analyzes network performance and provides recommendations
   * @returns {Object} Analysis and recommendations
   */
  analyzeNetworkPerformance() {
    const stats = this.getNetworkStats();
    const analysis = {
      issues: [],
      recommendations: []
    };
    
    // Check for slow requests
    if (stats.slowRequests.length > 0) {
      analysis.issues.push(`Found ${stats.slowRequests.length} slow requests (>1s)`);
      analysis.recommendations.push('Optimize slow resources, consider using CDN, implement caching');
      
      // Check for slow images
      const slowImages = stats.slowRequests.filter(req => req.resourceType === 'image');
      if (slowImages.length > 0) {
        analysis.issues.push(`Found ${slowImages.length} slow image requests`);
        analysis.recommendations.push('Optimize images, use WebP format, implement lazy loading');
      }
      
      // Check for slow scripts
      const slowScripts = stats.slowRequests.filter(req => req.resourceType === 'script');
      if (slowScripts.length > 0) {
        analysis.issues.push(`Found ${slowScripts.length} slow script requests`);
        analysis.recommendations.push('Defer non-critical JavaScript, use code splitting');
      }
    }
    
    // Check for failed requests
    if (stats.failedRequests.length > 0) {
      analysis.issues.push(`Found ${stats.failedRequests.length} failed requests`);
      analysis.recommendations.push('Fix failed resource requests to improve page reliability');
    }
    
    // Check total page size
    if (stats.totalSize > 5000000) { // 5MB
      analysis.issues.push(`Page is too large (${(stats.totalSize / 1024 / 1024).toFixed(2)}MB)`);
      analysis.recommendations.push('Reduce page size by optimizing images and minifying resources');
    }
    
    // Check number of requests
    if (stats.totalRequests > 100) {
      analysis.issues.push(`Too many requests (${stats.totalRequests})`);
      analysis.recommendations.push('Reduce number of requests by bundling resources, using sprites, or implementing HTTP/2');
    }
    
    return {
      stats,
      analysis
    };
  }
}
