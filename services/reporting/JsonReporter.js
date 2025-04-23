/**
 * JSON Reporter module
 * Generates and saves test reports in JSON format
 * NOT: Performans raporlama özelliği geçici olarak devre dışı bırakıldı
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

// Veritabanı desteği kaldırıldı

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * JSON Reporter class
 */
export class JsonReporter {
  /**
   * Creates a new JsonReporter instance
   * @param {Object} options - Reporter options
   */
  constructor(options = {}) {
    this.reportsDir = options.reportsDir || path.join(process.cwd(), 'data/reports');
    this.screenshotsDir = options.screenshotsDir || path.join(process.cwd(), 'screenshots');

    // Ensure directories exist
    this.ensureDirectoryExists(this.reportsDir);
    this.ensureDirectoryExists(path.join(this.reportsDir, 'daily'));
    this.ensureDirectoryExists(path.join(this.reportsDir, 'weekly'));
    this.ensureDirectoryExists(path.join(this.reportsDir, 'monthly'));
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
   * Generates a unique ID for a report
   * @returns {string} Unique ID
   * @private
   */
  generateReportId() {
    return `test-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  }

  /**
   * Formats a date as YYYY-MM-DD
   * @param {Date} date - Date to format
   * @returns {string} Formatted date
   * @private
   */
  formatDate(date = new Date()) {
    return date.toISOString().split('T')[0];
  }

  /**
   * Calculates test metrics
   * @param {Object} testResult - Test result
   * @returns {Object} Test metrics
   * @private
   */
  calculateMetrics(testResult) {
    const totalSteps = testResult.steps.length;
    const successfulSteps = testResult.steps.filter(step => step.success).length;
    const failedSteps = totalSteps - successfulSteps;
    const successRate = totalSteps > 0 ? (successfulSteps / totalSteps) * 100 : 0;
    const totalDuration = testResult.steps.reduce((sum, step) => sum + step.duration, 0);
    const averageStepDuration = totalSteps > 0 ? totalDuration / totalSteps : 0;

    // Adım sürelerine göre en yavaş adımı bul
    let slowestStepIndex = -1;
    let maxDuration = 0;

    testResult.steps.forEach((step, index) => {
      if (step.duration > maxDuration) {
        maxDuration = step.duration;
        slowestStepIndex = index;
      }
    });

    return {
      totalSteps,
      successfulSteps,
      failedSteps,
      successRate,
      averageStepDuration,
      slowestStepIndex: slowestStepIndex >= 0 ? slowestStepIndex : null,
      maxStepDuration: maxDuration
    };
  }

  /**
   * Generates a report for a test result
   * @param {Object} testResult - Test result object
   * @returns {Promise<string>} Report ID
   */
  async generateReport(testResult) {
    console.log('Generating JSON report...');

    try {
      // Generate a unique ID for the report
      const reportId = this.generateReportId();

      // Calculate metrics
      const metrics = this.calculateMetrics(testResult);

      // Create report object
      const report = {
        id: reportId,
        name: testResult.name,
        description: testResult.description,
        browserType: testResult.browserType,
        headless: testResult.headless,
        timestamp: testResult.startTime,
        duration: testResult.duration,
        success: testResult.success,
        error: testResult.error,
        steps: testResult.steps.map(step => ({
          step: step.step,
          action: step.action,
          target: step.target,
          strategy: step.strategy,
          value: step.value,
          description: step.description,
          success: step.success,
          error: step.error,
          duration: step.duration,
          screenshot: step.screenshot
          // Performans raporlama özelliği geçici olarak devre dışı bırakıldı
          // performance: step.performance || null
        })),
        metrics,
        // Performans raporlama özelliği geçici olarak devre dışı bırakıldı
        // performance: testResult.performance || null,
        tags: [] // Can be populated later
      };

      // Save report to daily directory
      const date = new Date(testResult.startTime);
      const formattedDate = this.formatDate(date);
      const dailyDir = path.join(this.reportsDir, 'daily', formattedDate);
      this.ensureDirectoryExists(dailyDir);

      const reportPath = path.join(dailyDir, `${reportId}.json`);
      await fs.promises.writeFile(reportPath, JSON.stringify(report, null, 2));

      console.log(`JSON report saved to: ${reportPath}`);

      // Update daily summary
      await this.updateSummary('daily', date, report);

      // Update weekly summary
      await this.updateSummary('weekly', date, report);

      // Update monthly summary
      await this.updateSummary('monthly', date, report);

      // Veritabanı desteği kaldırıldı
      console.log('Database support has been removed, skipping database save');

      return reportId;
    } catch (error) {
      console.error(`Error generating JSON report: ${error.message}`);
      throw error;
    }
  }

  /**
   * Updates a summary report
   * @param {string} period - Period (daily, weekly, monthly)
   * @param {Date} date - Date
   * @param {Object} report - Test report
   * @returns {Promise<void>}
   * @private
   */
  async updateSummary(period, date, report) {
    try {
      let summaryDate;

      if (period === 'daily') {
        summaryDate = this.formatDate(date);
      } else if (period === 'weekly') {
        // Get the Monday of the week
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
        summaryDate = this.formatDate(new Date(date.setDate(diff)));
      } else if (period === 'monthly') {
        // Get the first day of the month
        summaryDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      const summaryDir = path.join(this.reportsDir, period);
      this.ensureDirectoryExists(summaryDir);

      const summaryPath = path.join(summaryDir, `${summaryDate}.json`);

      let summary = {
        period,
        date: summaryDate,
        totalTests: 0,
        successfulTests: 0,
        failedTests: 0,
        successRate: 0,
        averageDuration: 0,
        tests: [],
        browsers: {}
      };

      // Load existing summary if it exists
      if (fs.existsSync(summaryPath)) {
        const summaryContent = await fs.promises.readFile(summaryPath, 'utf8');
        summary = JSON.parse(summaryContent);
      }

      // Add test to summary
      summary.tests.push({
        id: report.id,
        name: report.name,
        success: report.success,
        duration: report.duration
      });

      // Update browser count
      summary.browsers[report.browserType] = (summary.browsers[report.browserType] || 0) + 1;

      // Update summary metrics
      summary.totalTests = summary.tests.length;
      summary.successfulTests = summary.tests.filter(test => test.success).length;
      summary.failedTests = summary.totalTests - summary.successfulTests;
      summary.successRate = summary.totalTests > 0
        ? (summary.successfulTests / summary.totalTests) * 100
        : 0;

      const totalDuration = summary.tests.reduce((sum, test) => sum + test.duration, 0);
      summary.averageDuration = summary.totalTests > 0
        ? totalDuration / summary.totalTests
        : 0;

      // Save updated summary
      await fs.promises.writeFile(summaryPath, JSON.stringify(summary, null, 2));

      console.log(`Updated ${period} summary at: ${summaryPath}`);
    } catch (error) {
      console.error(`Error updating ${period} summary: ${error.message}`);
    }
  }

  // Veritabanı desteği kaldırıldı
}
