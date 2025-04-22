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
        errorText: null,
        headers: request.headers(),
        isNavigationRequest: request.isNavigationRequest(),
        frame: request.frame() ? request.frame().name() : 'unknown',
        timing: {}
      };

      this.requests.push(requestData);
    });

    // Track request finish
    this.page.on('response', async response => {
      const request = response.request();
      const requestData = this.requests.find(r => r.url === request.url());

      if (requestData) {
        const endTime = Date.now();
        requestData.status = response.status();
        requestData.duration = endTime - requestData.startTime;
        requestData.endTime = endTime;

        // Get response headers
        requestData.responseHeaders = response.headers();

        // Get content type
        requestData.contentType = response.headers()['content-type'] || '';

        // Check if resource is cacheable
        const cacheControl = response.headers()['cache-control'] || '';
        requestData.cacheable = !(cacheControl.includes('no-store') || cacheControl.includes('no-cache'));

        // Get server timing if available
        if (response.headers()['server-timing']) {
          requestData.serverTiming = response.headers()['server-timing'];
        }

        // Get response timing if available
        try {
          const timing = await this.page.evaluate(() => {
            const entries = performance.getEntriesByType('resource');
            return entries;
          });

          // Find matching resource timing entry
          const timingEntry = timing.find(entry => entry.name === requestData.url);
          if (timingEntry) {
            requestData.timing = {
              connectStart: timingEntry.connectStart,
              connectEnd: timingEntry.connectEnd,
              domainLookupStart: timingEntry.domainLookupStart,
              domainLookupEnd: timingEntry.domainLookupEnd,
              fetchStart: timingEntry.fetchStart,
              redirectStart: timingEntry.redirectStart,
              redirectEnd: timingEntry.redirectEnd,
              requestStart: timingEntry.requestStart,
              responseStart: timingEntry.responseStart,
              responseEnd: timingEntry.responseEnd,
              secureConnectionStart: timingEntry.secureConnectionStart,
              transferSize: timingEntry.transferSize,
              encodedBodySize: timingEntry.encodedBodySize,
              decodedBodySize: timingEntry.decodedBodySize
            };
          }
        } catch (error) {
          console.debug(`Could not get timing for ${request.url()}: ${error.message}`);
        }

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
        size: req.responseSize,
        status: req.status,
        contentType: req.contentType
      }));

    // Find failed requests
    const failedRequests = this.requests
      .filter(req => req.failed)
      .map(req => ({
        url: req.url,
        errorText: req.errorText,
        resourceType: req.resourceType
      }));

    // Find uncacheable requests
    const uncacheableRequests = this.requests
      .filter(req => req.cacheable === false)
      .map(req => ({
        url: req.url,
        resourceType: req.resourceType,
        cacheControl: req.responseHeaders ? req.responseHeaders['cache-control'] : null
      }));

    // Find large resources (>500KB)
    const largeResources = this.requests
      .filter(req => req.responseSize > 500 * 1024)
      .map(req => ({
        url: req.url,
        resourceType: req.resourceType,
        size: req.responseSize
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
          : 0,
        slowCount: requests.filter(req => req.duration > 1000).length,
        largeCount: requests.filter(req => req.responseSize > 500 * 1024).length
      };
    }

    // Calculate timing metrics
    const timingMetrics = {
      dnsLookup: 0,
      tcpConnect: 0,
      sslHandshake: 0,
      ttfb: 0,
      download: 0
    };

    let timingCount = 0;

    for (const req of this.requests) {
      if (req.timing && Object.keys(req.timing).length > 0) {
        timingCount++;

        // DNS lookup time
        if (req.timing.domainLookupEnd && req.timing.domainLookupStart) {
          timingMetrics.dnsLookup += req.timing.domainLookupEnd - req.timing.domainLookupStart;
        }

        // TCP connect time
        if (req.timing.connectEnd && req.timing.connectStart) {
          timingMetrics.tcpConnect += req.timing.connectEnd - req.timing.connectStart;
        }

        // SSL handshake time
        if (req.timing.secureConnectionStart && req.timing.connectEnd) {
          timingMetrics.sslHandshake += req.timing.connectEnd - req.timing.secureConnectionStart;
        }

        // Time to first byte
        if (req.timing.responseStart && req.timing.requestStart) {
          timingMetrics.ttfb += req.timing.responseStart - req.timing.requestStart;
        }

        // Download time
        if (req.timing.responseEnd && req.timing.responseStart) {
          timingMetrics.download += req.timing.responseEnd - req.timing.responseStart;
        }
      }
    }

    // Calculate averages
    if (timingCount > 0) {
      timingMetrics.dnsLookup /= timingCount;
      timingMetrics.tcpConnect /= timingCount;
      timingMetrics.sslHandshake /= timingCount;
      timingMetrics.ttfb /= timingCount;
      timingMetrics.download /= timingCount;
    }

    return {
      totalRequests,
      totalSize,
      averageDuration,
      slowRequests,
      failedRequests,
      uncacheableRequests,
      largeResources,
      statsByType,
      timingMetrics,
      requestTimeline: this.requests.map(req => ({
        url: req.url,
        resourceType: req.resourceType,
        startTime: req.startTime,
        endTime: req.endTime || req.startTime + req.duration,
        duration: req.duration,
        size: req.responseSize,
        status: req.status,
        failed: req.failed
      })).sort((a, b) => a.startTime - b.startTime)
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

      // Check for slow CSS
      const slowCss = stats.slowRequests.filter(req => req.resourceType === 'stylesheet');
      if (slowCss.length > 0) {
        analysis.issues.push(`Found ${slowCss.length} slow CSS requests`);
        analysis.recommendations.push('Inline critical CSS, defer non-critical CSS');
      }

      // Check for slow fonts
      const slowFonts = stats.slowRequests.filter(req => req.resourceType === 'font');
      if (slowFonts.length > 0) {
        analysis.issues.push(`Found ${slowFonts.length} slow font requests`);
        analysis.recommendations.push('Use font-display: swap, preload critical fonts');
      }
    }

    // Check for failed requests
    if (stats.failedRequests.length > 0) {
      analysis.issues.push(`Found ${stats.failedRequests.length} failed requests`);
      analysis.recommendations.push('Fix failed resource requests to improve page reliability');
    }

    // Check for uncacheable resources
    if (stats.uncacheableRequests && stats.uncacheableRequests.length > 0) {
      analysis.issues.push(`Found ${stats.uncacheableRequests.length} uncacheable resources`);
      analysis.recommendations.push('Add proper cache headers to static resources');
    }

    // Check for large resources
    if (stats.largeResources && stats.largeResources.length > 0) {
      analysis.issues.push(`Found ${stats.largeResources.length} large resources (>500KB)`);
      analysis.recommendations.push('Optimize large resources, consider lazy loading');

      // Check for large images
      const largeImages = stats.largeResources.filter(req => req.resourceType === 'image');
      if (largeImages.length > 0) {
        analysis.issues.push(`Found ${largeImages.length} large image resources`);
        analysis.recommendations.push('Compress images, use responsive images with srcset');
      }
    }

    // Check total page size
    if (stats.totalSize > 5000000) { // 5MB
      analysis.issues.push(`Page is too large (${(stats.totalSize / 1024 / 1024).toFixed(2)}MB)`);
      analysis.recommendations.push('Reduce page size by optimizing images and minifying resources');
    } else if (stats.totalSize > 2000000) { // 2MB
      analysis.issues.push(`Page is quite large (${(stats.totalSize / 1024 / 1024).toFixed(2)}MB)`);
      analysis.recommendations.push('Consider optimizing page resources for better performance');
    }

    // Check number of requests
    if (stats.totalRequests > 100) {
      analysis.issues.push(`Too many requests (${stats.totalRequests})`);
      analysis.recommendations.push('Reduce number of requests by bundling resources, using sprites, or implementing HTTP/2');
    } else if (stats.totalRequests > 50) {
      analysis.issues.push(`Moderate number of requests (${stats.totalRequests})`);
      analysis.recommendations.push('Consider reducing the number of requests for better performance');
    }

    // Check timing metrics
    if (stats.timingMetrics) {
      if (stats.timingMetrics.ttfb > 600) {
        analysis.issues.push(`Slow Time to First Byte (${stats.timingMetrics.ttfb.toFixed(2)}ms)`);
        analysis.recommendations.push('Improve server response time, use CDN, optimize backend');
      }

      if (stats.timingMetrics.dnsLookup > 100) {
        analysis.issues.push(`Slow DNS lookup (${stats.timingMetrics.dnsLookup.toFixed(2)}ms)`);
        analysis.recommendations.push('Use DNS prefetching, consider a faster DNS provider');
      }

      if (stats.timingMetrics.tcpConnect > 200) {
        analysis.issues.push(`Slow TCP connection (${stats.timingMetrics.tcpConnect.toFixed(2)}ms)`);
        analysis.recommendations.push('Use a CDN to reduce connection distance');
      }
    }

    return {
      stats,
      analysis
    };
  }
}
