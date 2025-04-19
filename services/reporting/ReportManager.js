/**
 * Report Manager module
 * Manages test reports
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { JsonReporter } from './JsonReporter.js';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Report Manager class
 */
export class ReportManager {
  /**
   * Creates a new ReportManager instance
   * @param {Object} options - Manager options
   */
  constructor(options = {}) {
    this.reportsDir = options.reportsDir || path.join(process.cwd(), 'data/reports');
    this.jsonReporter = new JsonReporter(options);
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
   * Gets all reports for a specific period and date
   * @param {string} period - Period (daily, weekly, monthly)
   * @param {string} date - Date (YYYY-MM-DD for daily, YYYY-MM-DD for weekly, YYYY-MM for monthly)
   * @returns {Promise<Array>} List of reports
   */
  async getReports(period = 'daily', date = null) {
    try {
      if (!date) {
        date = this.formatDate();
      }
      
      let reportsPath;
      
      if (period === 'daily') {
        reportsPath = path.join(this.reportsDir, 'daily', date);
      } else {
        // For weekly and monthly, get the summary
        const summaryPath = path.join(this.reportsDir, period, `${date}.json`);
        
        if (fs.existsSync(summaryPath)) {
          const summaryContent = await fs.promises.readFile(summaryPath, 'utf8');
          const summary = JSON.parse(summaryContent);
          
          // Get all report IDs from the summary
          const reportIds = summary.tests.map(test => test.id);
          
          // Find and load all reports
          const reports = [];
          
          for (const reportId of reportIds) {
            const report = await this.getReport(reportId);
            if (report) {
              reports.push(report);
            }
          }
          
          return reports;
        }
        
        return [];
      }
      
      if (!fs.existsSync(reportsPath)) {
        return [];
      }
      
      const files = await fs.promises.readdir(reportsPath);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      
      const reports = await Promise.all(jsonFiles.map(async (file) => {
        const filePath = path.join(reportsPath, file);
        const content = await fs.promises.readFile(filePath, 'utf8');
        return JSON.parse(content);
      }));
      
      return reports;
    } catch (error) {
      console.error(`Error getting reports: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Gets a specific report by ID
   * @param {string} id - Report ID
   * @returns {Promise<Object|null>} Report or null if not found
   */
  async getReport(id) {
    try {
      // Search in all daily directories
      const dailyDir = path.join(this.reportsDir, 'daily');
      
      if (!fs.existsSync(dailyDir)) {
        return null;
      }
      
      const dates = await fs.promises.readdir(dailyDir);
      
      for (const date of dates) {
        const dateDir = path.join(dailyDir, date);
        const reportPath = path.join(dateDir, `${id}.json`);
        
        if (fs.existsSync(reportPath)) {
          const content = await fs.promises.readFile(reportPath, 'utf8');
          return JSON.parse(content);
        }
      }
      
      return null;
    } catch (error) {
      console.error(`Error getting report: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Deletes a specific report by ID
   * @param {string} id - Report ID
   * @returns {Promise<boolean>} True if deleted, false otherwise
   */
  async deleteReport(id) {
    try {
      // Search in all daily directories
      const dailyDir = path.join(this.reportsDir, 'daily');
      
      if (!fs.existsSync(dailyDir)) {
        return false;
      }
      
      const dates = await fs.promises.readdir(dailyDir);
      
      for (const date of dates) {
        const dateDir = path.join(dailyDir, date);
        const reportPath = path.join(dateDir, `${id}.json`);
        
        if (fs.existsSync(reportPath)) {
          // Get report to find its date
          const content = await fs.promises.readFile(reportPath, 'utf8');
          const report = JSON.parse(content);
          
          // Delete the report file
          await fs.promises.unlink(reportPath);
          
          // Update summaries
          await this.removeFromSummary('daily', new Date(report.timestamp), id);
          await this.removeFromSummary('weekly', new Date(report.timestamp), id);
          await this.removeFromSummary('monthly', new Date(report.timestamp), id);
          
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error(`Error deleting report: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Removes a report from a summary
   * @param {string} period - Period (daily, weekly, monthly)
   * @param {Date} date - Date
   * @param {string} reportId - Report ID
   * @returns {Promise<void>}
   * @private
   */
  async removeFromSummary(period, date, reportId) {
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
      
      const summaryPath = path.join(this.reportsDir, period, `${summaryDate}.json`);
      
      if (fs.existsSync(summaryPath)) {
        const summaryContent = await fs.promises.readFile(summaryPath, 'utf8');
        const summary = JSON.parse(summaryContent);
        
        // Remove the report from the summary
        const reportIndex = summary.tests.findIndex(test => test.id === reportId);
        
        if (reportIndex !== -1) {
          const report = summary.tests[reportIndex];
          summary.tests.splice(reportIndex, 1);
          
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
          
          // Update browser count
          if (summary.browsers[report.browserType] > 1) {
            summary.browsers[report.browserType]--;
          } else {
            delete summary.browsers[report.browserType];
          }
          
          // Save updated summary
          await fs.promises.writeFile(summaryPath, JSON.stringify(summary, null, 2));
          
          console.log(`Removed report ${reportId} from ${period} summary at: ${summaryPath}`);
        }
      }
    } catch (error) {
      console.error(`Error removing report from ${period} summary: ${error.message}`);
    }
  }
  
  /**
   * Gets a summary for a specific period and date
   * @param {string} period - Period (daily, weekly, monthly)
   * @param {string} date - Date (YYYY-MM-DD for daily, YYYY-MM-DD for weekly, YYYY-MM for monthly)
   * @returns {Promise<Object|null>} Summary or null if not found
   */
  async getSummary(period = 'daily', date = null) {
    try {
      if (!date) {
        date = this.formatDate();
      }
      
      const summaryPath = path.join(this.reportsDir, period, `${date}.json`);
      
      if (fs.existsSync(summaryPath)) {
        const summaryContent = await fs.promises.readFile(summaryPath, 'utf8');
        return JSON.parse(summaryContent);
      }
      
      return null;
    } catch (error) {
      console.error(`Error getting summary: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Gets all available summaries for a specific period
   * @param {string} period - Period (daily, weekly, monthly)
   * @returns {Promise<Array>} List of summaries
   */
  async getAllSummaries(period = 'daily') {
    try {
      const summaryDir = path.join(this.reportsDir, period);
      
      if (!fs.existsSync(summaryDir)) {
        return [];
      }
      
      const files = await fs.promises.readdir(summaryDir);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      
      const summaries = await Promise.all(jsonFiles.map(async (file) => {
        const filePath = path.join(summaryDir, file);
        const content = await fs.promises.readFile(filePath, 'utf8');
        return JSON.parse(content);
      }));
      
      // Sort by date (newest first)
      return summaries.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (error) {
      console.error(`Error getting all summaries: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Cleans up old reports
   * @param {number} maxAgeDays - Maximum age in days
   * @returns {Promise<number>} Number of deleted reports
   */
  async cleanupOldReports(maxAgeDays = 30) {
    try {
      const dailyDir = path.join(this.reportsDir, 'daily');
      
      if (!fs.existsSync(dailyDir)) {
        return 0;
      }
      
      const dates = await fs.promises.readdir(dailyDir);
      let deletedCount = 0;
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);
      
      for (const date of dates) {
        const dateObj = new Date(date);
        
        if (dateObj < cutoffDate) {
          const dateDir = path.join(dailyDir, date);
          const files = await fs.promises.readdir(dateDir);
          
          // Delete all report files
          for (const file of files) {
            await fs.promises.unlink(path.join(dateDir, file));
            deletedCount++;
          }
          
          // Delete the date directory
          await fs.promises.rmdir(dateDir);
          
          console.log(`Deleted old reports from ${date}`);
        }
      }
      
      return deletedCount;
    } catch (error) {
      console.error(`Error cleaning up old reports: ${error.message}`);
      return 0;
    }
  }
}
