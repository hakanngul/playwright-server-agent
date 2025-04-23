/**
 * Script to generate a modern HTML report from a JSON report
 *
 * Usage: node generate-modern-report.js <report-id>
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateModernHtmlReport } from './services/reporting/templates/modern-report-template.js';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get report ID from command line arguments
const reportId = process.argv[2];

if (!reportId) {
  console.error('Error: Report ID is required');
  console.error('Usage: node generate-modern-report.js <report-id>');
  process.exit(1);
}

// Find the JSON report
const dataDir = path.join(__dirname, 'data', 'reports', 'daily');
let jsonReportPath = null;
let jsonReport = null;

// Get all date directories
const dateDirs = fs.readdirSync(dataDir);

// Search for the report in each date directory
for (const dateDir of dateDirs) {
  const dirPath = path.join(dataDir, dateDir);
  if (fs.statSync(dirPath).isDirectory()) {
    const reportPath = path.join(dirPath, `${reportId}.json`);
    if (fs.existsSync(reportPath)) {
      jsonReportPath = reportPath;
      const reportContent = fs.readFileSync(reportPath, 'utf8');
      jsonReport = JSON.parse(reportContent);
      break;
    }
  }
}

if (!jsonReport) {
  console.error(`Error: Report with ID ${reportId} not found`);
  process.exit(1);
}

// Artifacts yoksa oluştur
if (!jsonReport.artifacts) {
  jsonReport.artifacts = {};
}

// Videos dizisi yoksa oluştur
if (!jsonReport.artifacts.videos) {
  jsonReport.artifacts.videos = [];
}

// Gerçek test videosunu kontrol et
const testVideoPath = `videos/${reportId}.webm`;
const testVideoFullPath = path.join(__dirname, testVideoPath);

if (fs.existsSync(testVideoFullPath)) {
  // Gerçek test videosu varsa, artifacts.videos dizisini temizle ve gerçek videoyu ekle
  jsonReport.artifacts.videos = [];
  jsonReport.artifacts.videos.push(testVideoPath);
  console.log(`Added test video: ${testVideoPath}`);
} else {
  // Gerçek test videosu yoksa, örnek videoyu ekle
  const exampleVideo = 'videos/example.webm';
  if (fs.existsSync(path.join(__dirname, exampleVideo))) {
    jsonReport.artifacts.videos = [];
    jsonReport.artifacts.videos.push(exampleVideo);
    console.log(`Added example video: ${exampleVideo}`);
  }
}

// Artifacts.screenshots dizisini oluştur veya temizle
if (!jsonReport.artifacts.screenshots) {
  jsonReport.artifacts.screenshots = [];
}

// Artifacts.traces dizisini oluştur veya temizle
if (!jsonReport.artifacts.traces) {
  jsonReport.artifacts.traces = [];
}

// Generate HTML report
try {
  const htmlReportContent = generateModernHtmlReport(jsonReport);
  const htmlReportPath = path.join(__dirname, 'reports', `${reportId}.html`);

  // Ensure reports directory exists
  const reportsDir = path.join(__dirname, 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  // Write HTML report
  fs.writeFileSync(htmlReportPath, htmlReportContent);

  console.log(`Modern HTML report generated: ${htmlReportPath}`);
  console.log(`Report URL: http://localhost:3002/reports/${reportId}.html`);
} catch (error) {
  console.error('Error generating HTML report:', error);
  process.exit(1);
}
