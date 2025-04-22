/**
 * Test runner module
 * Runs test plans and manages test execution
 */

import { BrowserManager } from './BrowserManager.js';
import { StepExecutor } from './StepExecutor.js';
import { JsonReporter } from '../reporting/index.js';
import { ElementHelper } from './ElementHelper.js';
import { ScreenshotManager } from './ScreenshotManager.js';
import { PerformanceHelper, NetworkMonitor, PerformanceReporter } from '../performance/index.js';
import { BrowserPoolManager } from './BrowserPoolManager.js';

/**
 * Runs test plans
 */
export class TestRunner {
  /**
   * Creates a new TestRunner instance
   * @param {Object} options - Test runner options
   */
  constructor(options = {}) {
    this.browserType = options.browserType || 'chromium';
    this.headless = options.headless !== undefined ? options.headless : true;
    this.screenshotsDir = options.screenshotsDir;
    this.onStepCompleted = options.onStepCompleted || null;
    this.onTestCompleted = options.onTestCompleted || null;

    // Performance monitoring options
    this.collectPerformanceMetrics = options.collectPerformanceMetrics !== undefined ? options.collectPerformanceMetrics : true;
    this.performanceReportsDir = options.performanceReportsDir || './data/performance-reports';

    // Browser pool options
    this.useBrowserPool = options.useBrowserPool !== undefined ? options.useBrowserPool : true;
    this.browserPoolManager = options.browserPoolManager || null;
    this.acquiredBrowser = null;

    // Dependencies (can be injected)
    this.browserManager = options.browserManager || null;
    this.stepExecutor = options.stepExecutor || null;
    this.jsonReporter = options.jsonReporter || new JsonReporter({
      reportsDir: options.reportsDir || './data/reports',
      screenshotsDir: this.screenshotsDir
    });

    // Performance monitoring components
    this.performanceHelper = null;
    this.networkMonitor = null;
    this.performanceReporter = new PerformanceReporter({
      reportsDir: this.performanceReportsDir,
      thresholds: options.performanceThresholds
    });

    console.log(`TestRunner created with browserType: ${this.browserType}, headless: ${this.headless}, useBrowserPool: ${this.useBrowserPool}`);
  }

  /**
   * Initializes the test runner
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.useBrowserPool) {
      // Use browser pool
      if (!this.browserPoolManager) {
        console.log('Creating browser pool manager');
        this.browserPoolManager = new BrowserPoolManager({
          maxSize: 5,
          minSize: 1,
          headless: this.headless
        });

        await this.browserPoolManager.initialize();
      }

      if (!this.acquiredBrowser) {
        console.log(`Acquiring ${this.browserType} browser from pool with headless: ${this.headless}...`);
        this.acquiredBrowser = await this.browserPoolManager.acquireBrowser(this.browserType, { headless: this.headless });
        this.browserManager = this.acquiredBrowser.manager;
        console.log(`Acquired browser ${this.acquiredBrowser.id} from pool with headless: ${this.browserManager.headless}`);

        // Browser zaten initialize edilmiş olmalı, tekrar initialize etmeye gerek yok
        if (!this.browserManager.isInitialized()) {
          console.warn('Browser manager is not initialized, initializing now...');
          await this.browserManager.initialize();
        } else {
          console.log(`Using already initialized browser from pool with headless: ${this.browserManager.headless}`);
        }
      }
    } else if (!this.browserManager) {
      // Create new browser manager directly (no pool)
      console.log(`Creating new ${this.browserType} browser`);
      this.browserManager = new BrowserManager(this.browserType, {
        headless: this.headless
      });

      // Initialize browser
      await this.browserManager.initialize();
    }

    // Create step executor if not provided
    if (!this.stepExecutor) {
      await this.initializeStepExecutor();
    }

    console.log('TestRunner initialized');
  }

  /**
   * Initializes the step executor and performance monitoring components
   * @returns {Promise<void>}
   * @private
   */
  async initializeStepExecutor() {
    if (!this.browserManager || !this.browserManager.isInitialized()) {
      console.warn('Browser manager not initialized, cannot initialize step executor');
      return;
    }

    const page = this.browserManager.getPage();
    if (!page) {
      console.warn('Browser page not available, cannot initialize step executor');
      return;
    }

    // Create helper components
    const elementHelper = new ElementHelper(page);
    const screenshotManager = new ScreenshotManager(page, this.screenshotsDir);

    // Create step executor with dependencies
    this.stepExecutor = new StepExecutor(
      page,
      this.screenshotsDir,
      this.onStepCompleted,
      elementHelper,
      screenshotManager
    );

    // Initialize performance monitoring components if enabled
    if (this.collectPerformanceMetrics) {
      this.performanceHelper = new PerformanceHelper(page);
      this.networkMonitor = new NetworkMonitor(page);

      // Set up performance observers
      await this.performanceHelper.setupPerformanceObservers();
      console.log('Performance monitoring initialized');
    }

    console.log('Step executor initialized successfully');
  }

  /**
   * Runs a test plan
   * @param {Object} testPlan - Test plan to run
   * @returns {Promise<Object>} Test results
   */
  async runTest(testPlan) {
    console.log(`Running test plan: ${testPlan.name} with browser type: ${this.browserType}`);

    // Initialize if not already initialized
    if (!this.browserManager || !this.browserManager.isInitialized()) {
      console.log('Browser manager not initialized, initializing now...');
      await this.initialize();
    } else if (this.browserManager) {
      // Update last used timestamp
      this.browserManager.updateLastUsed();
      console.log(`Using existing browser manager (initialized: ${this.browserManager.isInitialized()}, headless: ${this.browserManager.headless})`);

      // Headless modu farklıysa, tarayıcıyı yeniden başlat
      if (this.browserManager.headless !== this.headless) {
        console.log(`Headless mode mismatch (current: ${this.browserManager.headless}, requested: ${this.headless}), reinitializing browser...`);

        // Tarayıcı havuzundan alındıysa, havuza geri ver ve yeni bir tarayıcı al
        if (this.useBrowserPool && this.browserPoolManager && this.acquiredBrowser) {
          console.log(`Releasing browser ${this.acquiredBrowser.id} back to pool due to headless mode change...`);
          await this.browserPoolManager.releaseBrowser(this.acquiredBrowser.id, this.browserType);
          this.acquiredBrowser = null;
          this.browserManager = null;

          // Yeni bir tarayıcı al
          console.log(`Acquiring new browser with headless: ${this.headless}...`);
          this.acquiredBrowser = await this.browserPoolManager.acquireBrowser(this.browserType, { headless: this.headless });
          this.browserManager = this.acquiredBrowser.manager;
          console.log(`Acquired browser ${this.acquiredBrowser.id} from pool with headless: ${this.browserManager.headless}`);
        } else {
          // Havuz kullanılmıyorsa, mevcut tarayıcıyı kapat ve yeniden başlat
          await this.browserManager.close();
          this.browserManager.headless = this.headless;
          await this.browserManager.initialize();
          console.log(`Reinitialized browser with headless: ${this.headless}`);
        }

        // StepExecutor'u yeniden oluştur
        this.stepExecutor = null;
        await this.initializeStepExecutor();
      }

      // Tarayıcı havuzundan alındıysa, havuz istatistiklerini göster
      if (this.useBrowserPool && this.browserPoolManager) {
        const stats = this.browserPoolManager.getStats();
        console.log(`Browser pool stats: ${stats.overall.activeBrowsers}/${stats.overall.totalBrowsers} browsers active`);
      }
    }

    const startTime = Date.now();
    const initialMemory = process.memoryUsage();

    const results = {
      name: testPlan.name,
      description: testPlan.description,
      browserType: this.browserType,
      headless: this.headless,
      startTime: new Date().toISOString(),
      endTime: null,
      duration: 0,
      steps: [],
      success: false,
      error: null,
      performance: {
        initialMemory: {
          rss: initialMemory.rss,
          heapTotal: initialMemory.heapTotal,
          heapUsed: initialMemory.heapUsed,
          external: initialMemory.external
        },
        finalMemory: null,
        memoryDiff: null,
        cpuUsage: null
      }
    };

    try {
      // Execute each step in the test plan
      for (let i = 0; i < testPlan.steps.length; i++) {
        const step = testPlan.steps[i];
        const stepResult = await this.stepExecutor.executeStep(step, i);
        results.steps.push(stepResult);

        // If a step fails, stop execution
        if (!stepResult.success) {
          results.error = `Step ${i + 1} failed: ${stepResult.error}`;
          break;
        }
      }

      // If all steps succeeded, mark the test as successful
      if (!results.error) {
        results.success = true;
      }
    } catch (error) {
      console.error(`Error running test plan: ${error.message}`);
      results.success = false;
      results.error = error.message;
    }

    // Calculate duration and set end time
    const endTime = Date.now();
    const finalMemory = process.memoryUsage();

    results.endTime = new Date().toISOString();
    results.duration = endTime - startTime;

    // Add final memory metrics
    results.performance.finalMemory = {
      rss: finalMemory.rss,
      heapTotal: finalMemory.heapTotal,
      heapUsed: finalMemory.heapUsed,
      external: finalMemory.external
    };

    // Calculate memory differences
    results.performance.memoryDiff = {
      rss: finalMemory.rss - initialMemory.rss,
      heapTotal: finalMemory.heapTotal - initialMemory.heapTotal,
      heapUsed: finalMemory.heapUsed - initialMemory.heapUsed,
      external: finalMemory.external - initialMemory.external
    };

    // Add CPU usage if available
    try {
      if (typeof process.cpuUsage === 'function') {
        results.performance.cpuUsage = process.cpuUsage();
      }
    } catch (e) {
      console.warn('CPU usage metrics not available:', e.message);
    }

    // Calculate performance statistics for steps
    if (results.steps.length > 0) {
      const stepDurations = results.steps.map(step => step.duration);
      results.performance.stepStats = {
        totalSteps: results.steps.length,
        averageStepDuration: stepDurations.reduce((a, b) => a + b, 0) / stepDurations.length,
        minStepDuration: Math.min(...stepDurations),
        maxStepDuration: Math.max(...stepDurations),
        slowestStepIndex: stepDurations.indexOf(Math.max(...stepDurations))
      };
    }

    // Collect Web Vitals and network metrics if enabled
    if (this.collectPerformanceMetrics && this.performanceHelper) {
      try {
        console.log('Collecting Web Vitals and network metrics...');

        // Capture all performance metrics (Web Vitals and network metrics)
        const performanceData = await this.performanceHelper.captureAllMetrics(this.networkMonitor);

        // Add performance data to results
        results.performance.webVitals = performanceData.webVitals;
        results.performance.networkMetrics = performanceData.networkMetrics;
        results.performance.webVitalsAnalysis = performanceData.webVitalsAnalysis;

        // Add network analysis if available
        if (performanceData.networkMetrics && performanceData.networkMetrics.networkAnalysis) {
          results.performance.networkAnalysis = performanceData.networkMetrics.networkAnalysis;
        }

        // Add warnings
        if (performanceData.warnings && performanceData.warnings.length > 0) {
          results.performance.warnings = performanceData.warnings;
        }

        // Add detailed network metrics
        if (this.networkMonitor) {
          // Get detailed network timeline
          results.performance.networkTimeline = this.networkMonitor.getNetworkStats().requestTimeline;

          // Get timing metrics
          results.performance.timingMetrics = this.networkMonitor.getNetworkStats().timingMetrics;

          // Get uncacheable resources
          results.performance.uncacheableResources = this.networkMonitor.getNetworkStats().uncacheableRequests;

          // Get large resources
          results.performance.largeResources = this.networkMonitor.getNetworkStats().largeResources;
        }

        // Save performance report
        const reportResult = this.performanceReporter.saveReport(testPlan.name, {
          testDuration: results.duration,
          webVitals: performanceData.webVitals,
          networkMetrics: performanceData.networkMetrics,
          webVitalsAnalysis: performanceData.webVitalsAnalysis,
          warnings: performanceData.warnings,
          systemMetrics: {
            memory: {
              initial: results.performance.initialMemory,
              final: results.performance.finalMemory,
              diff: results.performance.memoryDiff
            },
            cpu: results.performance.cpuUsage
          },
          stepStats: results.performance.stepStats,
          timingMetrics: results.performance.timingMetrics,
          steps: results.steps // Test adımlarını da gönder (optimizasyon önerileri için)
        });

        // Add warnings to results if not already added
        if (reportResult.warnings.length > 0 && (!results.performance.warnings || results.performance.warnings.length === 0)) {
          results.performance.warnings = reportResult.warnings;
        }

        if (results.performance.warnings && results.performance.warnings.length > 0) {
          console.warn(`Found ${results.performance.warnings.length} performance warnings`);
        }

        // Add optimization recommendations to results
        if (reportResult.recommendations && reportResult.recommendations.length > 0) {
          results.recommendations = reportResult.recommendations;
          console.log(`Generated ${results.recommendations.length} optimization recommendations`);
        }
      } catch (error) {
        console.error('Error collecting performance metrics:', error.message);
      }
    }

    // Generate JSON report
    try {
      const reportId = await this.jsonReporter.generateReport(results);
      results.reportId = reportId;
      console.log(`JSON report generated with ID: ${reportId}`);
    } catch (error) {
      console.error(`Error generating JSON report: ${error.message}`);
    }

    // Log performance metrics
    this.logPerformanceMetrics(results);

    // Call the test completed callback if provided
    if (this.onTestCompleted) {
      this.onTestCompleted(results);
    }

    return results;
  }

  /**
   * Closes the test runner and releases resources
   * @returns {Promise<void>}
   */
  async close() {
    console.log('Closing test runner and releasing resources...');

    if (this.useBrowserPool && this.acquiredBrowser) {
      // Release browser back to pool
      try {
        if (this.browserPoolManager) {
          await this.browserPoolManager.releaseBrowser(this.acquiredBrowser.id, this.browserType);
          console.log(`Browser ${this.acquiredBrowser.id} released back to pool`);
        }
      } catch (error) {
        console.error('Error releasing browser to pool:', error);
      } finally {
        this.acquiredBrowser = null;
        this.browserManager = null;
        this.stepExecutor = null;
      }
    } else if (this.browserManager) {
      // Close browser directly
      try {
        await this.browserManager.close();
        console.log('Browser manager closed successfully');
      } catch (error) {
        console.error('Error closing browser manager:', error);
      } finally {
        this.browserManager = null;
        this.stepExecutor = null;
      }
    }
  }

  /**
   * Logs performance metrics to console
   * @param {Object} results - Test results with performance metrics
   */
  logPerformanceMetrics(results) {
    if (!results.performance) return;

    console.log('\n===== Performance Metrics =====');
    console.log(`Test Duration: ${results.duration}ms`);

    // Test süresi eşiği kontrolü
    if (this.performanceReporter && this.performanceReporter.thresholds && this.performanceReporter.thresholds.testDuration) {
      if (results.duration > this.performanceReporter.thresholds.testDuration) {
        console.warn(`\n\u26A0️ Test süresi eşiği aşıldı: ${results.duration}ms > ${this.performanceReporter.thresholds.testDuration}ms`);
      }
    }

    // Log Web Vitals if available
    if (results.performance.webVitals) {
      const webVitals = results.performance.webVitals;
      console.log('\nWeb Vitals:');
      if (webVitals.fcp) console.log(`First Contentful Paint (FCP): ${webVitals.fcp.toFixed(2)}ms`);
      if (webVitals.lcp) console.log(`Largest Contentful Paint (LCP): ${webVitals.lcp.toFixed(2)}ms`);
      if (webVitals.cls !== undefined) console.log(`Cumulative Layout Shift (CLS): ${webVitals.cls.toFixed(3)}`);
      if (webVitals.fid) console.log(`First Input Delay (FID): ${webVitals.fid.toFixed(2)}ms`);
      if (webVitals.ttfb) console.log(`Time to First Byte (TTFB): ${webVitals.ttfb.toFixed(2)}ms`);

      // Sayfa yükleme süresi eşiği kontrolü (LCP kullanarak)
      if (this.performanceReporter && this.performanceReporter.thresholds && this.performanceReporter.thresholds.pageDuration) {
        if (webVitals.lcp && webVitals.lcp > this.performanceReporter.thresholds.pageDuration) {
          console.warn(`\n\u26A0️ Sayfa yükleme süresi eşiği aşıldı: ${webVitals.lcp.toFixed(2)}ms > ${this.performanceReporter.thresholds.pageDuration}ms`);
        }
      }
    }

    // Log network metrics if available
    if (results.performance.networkMetrics) {
      const networkMetrics = results.performance.networkMetrics;
      console.log('\nNetwork Metrics:');
      console.log(`Total Requests: ${networkMetrics.totalRequests}`);
      console.log(`Total Size: ${this.formatBytes(networkMetrics.totalSize)}`);
      console.log(`Average Request Duration: ${networkMetrics.averageDuration.toFixed(2)}ms`);

      // Log resource type statistics
      if (networkMetrics.statsByType) {
        const statsByType = networkMetrics.statsByType;
        Object.entries(statsByType).forEach(([type, stats]) => {
          if (stats.count > 0) {
            console.log(`${type}: ${stats.count} requests, ${this.formatBytes(stats.totalSize)}`);
          }
        });
      }

      if (networkMetrics.slowRequests && networkMetrics.slowRequests.length > 0) {
        console.log(`Slow Requests (>1s): ${networkMetrics.slowRequests.length}`);
      }

      if (networkMetrics.failedRequests && networkMetrics.failedRequests.length > 0) {
        console.log(`Failed Requests: ${networkMetrics.failedRequests.length}`);
      }

      if (results.performance.timingMetrics) {
        const timing = results.performance.timingMetrics;
        console.log('\nTiming Metrics:');
        if (timing.dnsLookup) console.log(`DNS Lookup: ${timing.dnsLookup.toFixed(2)}ms`);
        if (timing.tcpConnect) console.log(`TCP Connect: ${timing.tcpConnect.toFixed(2)}ms`);
        if (timing.sslHandshake) console.log(`SSL Handshake: ${timing.sslHandshake.toFixed(2)}ms`);
        if (timing.ttfb) console.log(`TTFB: ${timing.ttfb.toFixed(2)}ms`);
        if (timing.download) console.log(`Download: ${timing.download.toFixed(2)}ms`);
      }
    }

    // Log step statistics
    if (results.performance.stepStats) {
      const stats = results.performance.stepStats;
      console.log('\nStep Statistics:');
      console.log(`Total Steps: ${stats.totalSteps}`);
      console.log(`Average Step Duration: ${stats.averageStepDuration.toFixed(2)}ms`);
      console.log(`Min Step Duration: ${stats.minStepDuration}ms`);
      console.log(`Max Step Duration: ${stats.maxStepDuration}ms`);

      // Log slowest step
      if (stats.slowestStepIndex >= 0 && results.steps[stats.slowestStepIndex]) {
        const slowestStep = results.steps[stats.slowestStepIndex];
        console.log(`\nSlowest Step: #${slowestStep.step} - ${slowestStep.action} (${slowestStep.duration}ms)`);
        console.log(`Description: ${slowestStep.description || 'N/A'}`);
      }
    }

    // Log memory usage
    if (results.performance.memoryDiff) {
      const memDiff = results.performance.memoryDiff;
      console.log('\nMemory Usage (bytes):');
      console.log(`RSS Diff: ${this.formatBytes(memDiff.rss)}`);
      console.log(`Heap Total Diff: ${this.formatBytes(memDiff.heapTotal)}`);
      console.log(`Heap Used Diff: ${this.formatBytes(memDiff.heapUsed)}`);
    }

    // Log performance warnings if any
    if (results.performance.warnings && results.performance.warnings.length > 0) {
      console.log('\nPerformance Warnings:');
      results.performance.warnings.forEach(warning => {
        console.log(`- ${warning.message}`);
      });
    }

    // Log optimization recommendations if any
    if (results.recommendations && results.recommendations.length > 0) {
      console.log('\nOptimizasyon Önerileri:');
      results.recommendations.forEach(recommendation => {
        console.log(`- ${recommendation}`);
      });
    }

    console.log('===============================\n');
  }

  /**
   * Formats bytes to a human-readable string
   * @param {number} bytes - Bytes to format
   * @param {number} decimals - Number of decimal places
   * @returns {string} Formatted string
   */
  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}
