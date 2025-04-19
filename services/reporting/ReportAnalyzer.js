/**
 * Report Analyzer module
 * Analyzes test reports
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ReportManager } from './ReportManager.js';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Report Analyzer class
 */
export class ReportAnalyzer {
  /**
   * Creates a new ReportAnalyzer instance
   * @param {ReportManager} reportManager - Report manager
   */
  constructor(reportManager) {
    this.reportManager = reportManager;
  }
  
  /**
   * Analyzes test results for a specific period and date
   * @param {string} period - Period (daily, weekly, monthly)
   * @param {string} date - Date (YYYY-MM-DD for daily, YYYY-MM-DD for weekly, YYYY-MM for monthly)
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeTestResults(period = 'daily', date = null) {
    try {
      const summary = await this.reportManager.getSummary(period, date);
      
      if (!summary) {
        return {
          period,
          date: date || new Date().toISOString().split('T')[0],
          totalTests: 0,
          successRate: 0,
          averageDuration: 0,
          browserDistribution: {},
          stepSuccessRates: {},
          commonFailures: [],
          trends: {
            successRate: [],
            duration: []
          }
        };
      }
      
      // Get all reports for the period
      const reports = await this.reportManager.getReports(period, date);
      
      // Calculate step success rates
      const stepCounts = {};
      const stepFailures = {};
      
      for (const report of reports) {
        for (const step of report.steps) {
          const stepKey = step.action;
          
          stepCounts[stepKey] = (stepCounts[stepKey] || 0) + 1;
          
          if (!step.success) {
            stepFailures[stepKey] = (stepFailures[stepKey] || 0) + 1;
            
            // Track failure details
            const failureKey = `${step.action}: ${step.error || 'Unknown error'}`;
            const existingFailure = commonFailures.find(f => f.error === failureKey);
            
            if (existingFailure) {
              existingFailure.count++;
            } else {
              commonFailures.push({
                error: failureKey,
                count: 1,
                step: step.action,
                description: step.description
              });
            }
          }
        }
      }
      
      const stepSuccessRates = {};
      for (const [step, count] of Object.entries(stepCounts)) {
        const failures = stepFailures[step] || 0;
        stepSuccessRates[step] = {
          total: count,
          success: count - failures,
          failure: failures,
          rate: ((count - failures) / count) * 100
        };
      }
      
      // Sort common failures by count
      const commonFailures = Object.values(stepFailures)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // Top 10 failures
      
      // Get trends (last 7 days for daily, last 10 weeks for weekly, last 12 months for monthly)
      const trends = await this.getTrends(period, date);
      
      return {
        period,
        date: summary.date,
        totalTests: summary.totalTests,
        successfulTests: summary.successfulTests,
        failedTests: summary.failedTests,
        successRate: summary.successRate,
        averageDuration: summary.averageDuration,
        browserDistribution: summary.browsers,
        stepSuccessRates,
        commonFailures,
        trends
      };
    } catch (error) {
      console.error(`Error analyzing test results: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Gets trends for a specific period
   * @param {string} period - Period (daily, weekly, monthly)
   * @param {string} date - Date (YYYY-MM-DD for daily, YYYY-MM-DD for weekly, YYYY-MM for monthly)
   * @returns {Promise<Object>} Trends
   * @private
   */
  async getTrends(period, date) {
    try {
      const summaries = await this.reportManager.getAllSummaries(period);
      
      // Sort by date (oldest first)
      summaries.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      // Limit to last N entries
      let limit;
      if (period === 'daily') {
        limit = 7; // Last 7 days
      } else if (period === 'weekly') {
        limit = 10; // Last 10 weeks
      } else {
        limit = 12; // Last 12 months
      }
      
      const recentSummaries = summaries.slice(-limit);
      
      const successRateTrend = recentSummaries.map(s => ({
        date: s.date,
        value: s.successRate
      }));
      
      const durationTrend = recentSummaries.map(s => ({
        date: s.date,
        value: s.averageDuration
      }));
      
      return {
        successRate: successRateTrend,
        duration: durationTrend
      };
    } catch (error) {
      console.error(`Error getting trends: ${error.message}`);
      return {
        successRate: [],
        duration: []
      };
    }
  }
  
  /**
   * Gets success rate for a specific period and date
   * @param {string} period - Period (daily, weekly, monthly)
   * @param {string} date - Date (YYYY-MM-DD for daily, YYYY-MM-DD for weekly, YYYY-MM for monthly)
   * @returns {Promise<number>} Success rate
   */
  async getSuccessRate(period = 'daily', date = null) {
    try {
      const summary = await this.reportManager.getSummary(period, date);
      
      if (!summary) {
        return 0;
      }
      
      return summary.successRate;
    } catch (error) {
      console.error(`Error getting success rate: ${error.message}`);
      return 0;
    }
  }
  
  /**
   * Gets average duration for a specific period and date
   * @param {string} period - Period (daily, weekly, monthly)
   * @param {string} date - Date (YYYY-MM-DD for daily, YYYY-MM-DD for weekly, YYYY-MM for monthly)
   * @returns {Promise<number>} Average duration
   */
  async getAverageDuration(period = 'daily', date = null) {
    try {
      const summary = await this.reportManager.getSummary(period, date);
      
      if (!summary) {
        return 0;
      }
      
      return summary.averageDuration;
    } catch (error) {
      console.error(`Error getting average duration: ${error.message}`);
      return 0;
    }
  }
  
  /**
   * Gets browser distribution for a specific period and date
   * @param {string} period - Period (daily, weekly, monthly)
   * @param {string} date - Date (YYYY-MM-DD for daily, YYYY-MM-DD for weekly, YYYY-MM for monthly)
   * @returns {Promise<Object>} Browser distribution
   */
  async getBrowserDistribution(period = 'daily', date = null) {
    try {
      const summary = await this.reportManager.getSummary(period, date);
      
      if (!summary) {
        return {};
      }
      
      return summary.browsers;
    } catch (error) {
      console.error(`Error getting browser distribution: ${error.message}`);
      return {};
    }
  }
}
