/**
 * Test runner module
 * Runs test plans and manages test execution
 */

import { BrowserManager } from './BrowserManager.js';
import { StepExecutor } from './StepExecutor.js';
import { JsonReporter } from '../reporting/index.js';
import { ElementHelper } from './ElementHelper.js';
import { ScreenshotManager } from './ScreenshotManager.js';

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

    // Dependencies (can be injected)
    this.browserManager = options.browserManager || null;
    this.stepExecutor = options.stepExecutor || null;
    this.jsonReporter = options.jsonReporter || new JsonReporter({
      reportsDir: options.reportsDir || './data/reports',
      screenshotsDir: this.screenshotsDir
    });

    console.log(`TestRunner created with browserType: ${this.browserType}, headless: ${this.headless}`);
  }

  /**
   * Initializes the test runner
   * @returns {Promise<void>}
   */
  async initialize() {
    if (!this.browserManager) {
      // Create new browser manager
      console.log(`Creating new ${this.browserType} browser`);
      this.browserManager = new BrowserManager(this.browserType, {
        headless: this.headless
      });

      // Initialize browser
      await this.browserManager.initialize();
    }

    // Create step executor if not provided
    if (!this.stepExecutor) {
      const page = this.browserManager.getPage();

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
    }

    console.log('TestRunner initialized');
  }

  /**
   * Runs a test plan
   * @param {Object} testPlan - Test plan to run
   * @returns {Promise<Object>} Test results
   */
  async runTest(testPlan) {
    console.log(`Running test plan: ${testPlan.name}`);

    // Initialize if not already initialized
    if (!this.browserManager || !this.browserManager.isInitialized()) {
      await this.initialize();
    } else if (this.browserManager) {
      // Update last used timestamp
      this.browserManager.updateLastUsed();
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

    if (this.browserManager) {
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
