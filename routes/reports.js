/**
 * Reports API routes
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { ReportManager, ReportAnalyzer } from '../services/reporting/index.js';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create router
const router = express.Router();

// Create report manager and analyzer
const reportManager = new ReportManager();
const reportAnalyzer = new ReportAnalyzer(reportManager);

/**
 * @route GET /api/reports
 * @desc Get all reports for a specific period and date
 */
router.get('/', async (req, res) => {
  try {
    const { period = 'daily', date } = req.query;
    const reports = await reportManager.getReports(period, date);
    res.json(reports);
  } catch (error) {
    console.error('Error getting reports:', error);
    res.status(500).json({ error: 'Failed to get reports' });
  }
});

/**
 * @route GET /api/reports/:id
 * @desc Get a specific report by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const report = await reportManager.getReport(id);

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json(report);
  } catch (error) {
    console.error('Error getting report:', error);
    res.status(500).json({ error: 'Failed to get report' });
  }
});

/**
 * @route GET /api/reports/:id
 * @desc Get a specific report by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const report = await reportManager.getReport(req.params.id);

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json(report);
  } catch (error) {
    console.error('Error getting report:', error);
    res.status(500).json({ error: 'Failed to get report' });
  }
});

/**
 * @route GET /api/reports/summary/:period
 * @desc Get a summary for a specific period and date
 */
router.get('/summary/:period', async (req, res) => {
  try {
    const { period } = req.params;
    const { date } = req.query;

    if (!['daily', 'weekly', 'monthly'].includes(period)) {
      return res.status(400).json({ error: 'Invalid period. Must be daily, weekly, or monthly' });
    }

    const summary = await reportManager.getSummary(period, date);

    if (!summary) {
      return res.status(404).json({ error: 'Summary not found' });
    }

    res.json(summary);
  } catch (error) {
    console.error('Error getting summary:', error);
    res.status(500).json({ error: 'Failed to get summary' });
  }
});

/**
 * @route GET /api/reports/summaries/:period
 * @desc Get all summaries for a specific period
 */
router.get('/summaries/:period', async (req, res) => {
  try {
    const { period } = req.params;

    if (!['daily', 'weekly', 'monthly'].includes(period)) {
      return res.status(400).json({ error: 'Invalid period. Must be daily, weekly, or monthly' });
    }

    const summaries = await reportManager.getAllSummaries(period);
    res.json(summaries);
  } catch (error) {
    console.error('Error getting summaries:', error);
    res.status(500).json({ error: 'Failed to get summaries' });
  }
});

/**
 * @route GET /api/reports/analyze/:period
 * @desc Analyze test results for a specific period and date
 */
router.get('/analyze/:period', async (req, res) => {
  try {
    const { period } = req.params;
    const { date } = req.query;

    if (!['daily', 'weekly', 'monthly'].includes(period)) {
      return res.status(400).json({ error: 'Invalid period. Must be daily, weekly, or monthly' });
    }

    const analysis = await reportAnalyzer.analyzeTestResults(period, date);

    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    res.json(analysis);
  } catch (error) {
    console.error('Error analyzing test results:', error);
    res.status(500).json({ error: 'Failed to analyze test results' });
  }
});

/**
 * @route DELETE /api/reports/:id
 * @desc Delete a specific report by ID
 */
router.delete('/:id', async (req, res) => {
  try {
    const success = await reportManager.deleteReport(req.params.id);

    if (!success) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ error: 'Failed to delete report' });
  }
});

/**
 * @route POST /api/reports/cleanup
 * @desc Clean up old reports
 */
router.post('/cleanup', async (req, res) => {
  try {
    const { maxAgeDays = 30 } = req.body;
    const deletedCount = await reportManager.cleanupOldReports(maxAgeDays);

    res.json({
      message: `${deletedCount} old reports cleaned up successfully`,
      deletedCount
    });
  } catch (error) {
    console.error('Error cleaning up old reports:', error);
    res.status(500).json({ error: 'Failed to clean up old reports' });
  }
});

export default router;
