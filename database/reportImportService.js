/**
 * Report Import Service
 *
 * Bu servis, data/reports klasöründeki JSON raporları veritabanına aktarır.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './db.js';

// Get current file path and directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ReportImportService {
  constructor() {
    this.reportsDir = path.join(__dirname, '..', 'data', 'reports');
    this.dailyDir = path.join(this.reportsDir, 'daily');

    // Veritabanı tabloları için hazırlık
    this.prepareDatabase();
  }

  /**
   * Veritabanı tablolarını hazırlar
   */
  prepareDatabase() {
    // Mevcut veritabanı şemasını kontrol et ve gerekli değişiklikleri yap
    try {
      // report_id sütununu kontrol et ve yoksa ekle
      const tableInfo = db.prepare("PRAGMA table_info(test_results)").all();
      const hasReportId = tableInfo.some(column => column.name === 'report_id');

      if (!hasReportId) {
        console.log('Adding report_id column to test_results table');
        db.exec('ALTER TABLE test_results ADD COLUMN report_id TEXT');

        // Ayrı bir adımda UNIQUE index ekle
        try {
          db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_test_results_report_id ON test_results(report_id)');
        } catch (indexError) {
          console.warn('Could not create unique index on report_id:', indexError);
        }
      }

      // name sütununu kontrol et ve yoksa ekle
      const hasName = tableInfo.some(column => column.name === 'name');

      if (!hasName) {
        console.log('Adding name column to test_results table');
        db.exec('ALTER TABLE test_results ADD COLUMN name TEXT');
      }

      // Test özet tablosu
      db.exec(`
        CREATE TABLE IF NOT EXISTS test_summaries (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          period TEXT NOT NULL,
          date TEXT NOT NULL,
          total_tests INTEGER NOT NULL,
          successful_tests INTEGER NOT NULL,
          failed_tests INTEGER NOT NULL,
          success_rate REAL NOT NULL,
          average_duration REAL NOT NULL,
          browser_stats TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(period, date)
        )
      `);

      console.log('Database tables prepared for report import');
    } catch (error) {
      console.error('Error preparing database:', error);
    }
  }

  /**
   * Tüm günlük raporları içe aktarır
   */
  async importAllDailyReports() {
    try {
      // Günlük raporlar dizinini kontrol et
      if (!fs.existsSync(this.dailyDir)) {
        console.error(`Daily reports directory not found: ${this.dailyDir}`);
        return { success: false, message: 'Daily reports directory not found' };
      }

      // Tüm günlük rapor dosyalarını al
      const dailyFiles = fs.readdirSync(this.dailyDir)
        .filter(file => file.endsWith('.json'));

      console.log(`Found ${dailyFiles.length} daily summary files`);

      let importedSummaries = 0;
      let importedTests = 0;

      // Her günlük özet dosyasını işle
      for (const dailyFile of dailyFiles) {
        const dailyPath = path.join(this.dailyDir, dailyFile);
        const dailyData = JSON.parse(fs.readFileSync(dailyPath, 'utf8'));

        // Günlük özeti veritabanına ekle
        const summaryResult = await this.importDailySummary(dailyData);
        if (summaryResult.success) {
          importedSummaries++;
        }

        // Günün test raporlarını içe aktar
        const date = dailyFile.replace('.json', '');
        const testResults = await this.importDailyTestReports(date);
        importedTests += testResults.importedCount;
      }

      return {
        success: true,
        message: `Imported ${importedSummaries} daily summaries and ${importedTests} test reports`,
        importedSummaries,
        importedTests
      };
    } catch (error) {
      console.error('Error importing all daily reports:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Belirli bir günün özetini içe aktarır
   * @param {Object} summaryData - Günlük özet verisi
   */
  async importDailySummary(summaryData) {
    try {
      // Özet verisini kontrol et
      if (!summaryData.period || !summaryData.date) {
        return { success: false, message: 'Invalid summary data' };
      }

      // Veritabanına ekle veya güncelle
      const stmt = db.prepare(`
        INSERT INTO test_summaries (
          period, date, total_tests, successful_tests, failed_tests,
          success_rate, average_duration, browser_stats
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(period, date) DO UPDATE SET
          total_tests = excluded.total_tests,
          successful_tests = excluded.successful_tests,
          failed_tests = excluded.failed_tests,
          success_rate = excluded.success_rate,
          average_duration = excluded.average_duration,
          browser_stats = excluded.browser_stats
      `);

      const result = stmt.run(
        summaryData.period,
        summaryData.date,
        summaryData.totalTests,
        summaryData.successfulTests,
        summaryData.failedTests,
        summaryData.successRate,
        summaryData.averageDuration,
        JSON.stringify(summaryData.browsers || {})
      );

      console.log(`Imported/updated daily summary for ${summaryData.date}`);
      return { success: true, id: result.lastInsertRowid };
    } catch (error) {
      console.error(`Error importing daily summary for ${summaryData.date}:`, error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Belirli bir günün test raporlarını içe aktarır
   * @param {string} date - Tarih (YYYY-MM-DD)
   */
  async importDailyTestReports(date) {
    try {
      const dateDir = path.join(this.dailyDir, date);

      // Tarih dizini yoksa, özet dosyasındaki test ID'lerini kullan
      if (!fs.existsSync(dateDir)) {
        console.log(`Date directory not found: ${dateDir}, using test IDs from summary`);
        const summaryPath = path.join(this.dailyDir, `${date}.json`);

        if (!fs.existsSync(summaryPath)) {
          return { success: false, message: 'Summary file not found', importedCount: 0 };
        }

        const summaryData = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));

        if (!summaryData.tests || !Array.isArray(summaryData.tests)) {
          return { success: false, message: 'No tests found in summary', importedCount: 0 };
        }

        // Özet dosyasındaki test ID'lerini kullanarak içe aktar
        let importedCount = 0;
        for (const test of summaryData.tests) {
          // Test ID'sini kullanarak detaylı raporu bul
          const testId = test.id;
          const testPath = path.join(dateDir, `${testId}.json`);

          // Detaylı rapor yoksa, özet bilgilerle içe aktar
          if (!fs.existsSync(testPath)) {
            const result = await this.importTestFromSummary(test, date);
            if (result.success) {
              importedCount++;
            }
          }
        }

        return { success: true, message: `Imported ${importedCount} tests from summary`, importedCount };
      }

      // Tarih dizinindeki tüm test raporlarını al
      const testFiles = fs.readdirSync(dateDir)
        .filter(file => file.endsWith('.json'));

      console.log(`Found ${testFiles.length} test reports for ${date}`);

      let importedCount = 0;

      // Her test raporunu işle
      for (const testFile of testFiles) {
        const testPath = path.join(dateDir, testFile);
        const testData = JSON.parse(fs.readFileSync(testPath, 'utf8'));

        const result = await this.importTestReport(testData);
        if (result.success) {
          importedCount++;
        }
      }

      return { success: true, message: `Imported ${importedCount} test reports for ${date}`, importedCount };
    } catch (error) {
      console.error(`Error importing test reports for ${date}:`, error);
      return { success: false, message: error.message, importedCount: 0 };
    }
  }

  /**
   * Özet bilgilerden test raporunu içe aktarır
   * @param {Object} testSummary - Test özeti
   * @param {string} date - Tarih (YYYY-MM-DD)
   */
  async importTestFromSummary(testSummary, date) {
    try {
      // Test ID'sini kontrol et
      if (!testSummary.id) {
        return { success: false, message: 'Invalid test summary data' };
      }

      // Veritabanında zaten var mı kontrol et
      const checkStmt = db.prepare('SELECT id FROM test_results WHERE report_id = ?');
      const existing = checkStmt.get(testSummary.id);

      if (existing) {
        console.log(`Test report ${testSummary.id} already exists in database`);
        return { success: true, id: existing.id, alreadyExists: true };
      }

      // Test başlangıç zamanını hesapla
      const startTime = new Date(date);
      // Test bitiş zamanını hesapla
      const endTime = new Date(startTime.getTime() + testSummary.duration);

      // Veritabanına ekle
      const stmt = db.prepare(`
        INSERT INTO test_results (
          report_id, name, status, start_time, end_time, duration, browser_type, headless
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        testSummary.id,
        testSummary.name,
        testSummary.success ? 'success' : 'failure',
        startTime.toISOString(),
        endTime.toISOString(),
        testSummary.duration,
        'unknown', // Özet bilgilerde tarayıcı tipi olmayabilir
        false // Özet bilgilerde headless bilgisi olmayabilir
      );

      console.log(`Imported test report ${testSummary.id} from summary`);
      return { success: true, id: result.lastInsertRowid };
    } catch (error) {
      console.error(`Error importing test from summary ${testSummary.id}:`, error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Detaylı test raporunu içe aktarır
   * @param {Object} testData - Test raporu verisi
   */
  async importTestReport(testData) {
    try {
      // Test ID'sini kontrol et
      if (!testData.id) {
        return { success: false, message: 'Invalid test report data' };
      }

      // Veritabanında zaten var mı kontrol et
      const checkStmt = db.prepare('SELECT id FROM test_results WHERE report_id = ?');
      const existing = checkStmt.get(testData.id);

      if (existing) {
        console.log(`Test report ${testData.id} already exists in database`);
        return { success: true, id: existing.id, alreadyExists: true };
      }

      // Veritabanı işlemini başlat
      const transaction = db.transaction(() => {
        // Senaryo ID'sini al veya oluştur
        let scenarioId = 1; // Varsayılan senaryo ID'si

        try {
          // Senaryo tablosunu kontrol et
          const scenarioCheck = db.prepare('SELECT id FROM test_scenarios WHERE name = ?').get('Default Scenario');

          if (!scenarioCheck) {
            // Varsayılan senaryo oluştur
            const scenarioInsert = db.prepare('INSERT INTO test_scenarios (name, description) VALUES (?, ?)');
            const scenarioResult = scenarioInsert.run('Default Scenario', 'Default scenario for imported tests');
            scenarioId = scenarioResult.lastInsertRowid;
          } else {
            scenarioId = scenarioCheck.id;
          }
        } catch (error) {
          console.warn('Error getting/creating scenario:', error);
          // Hata durumunda varsayılan senaryo ID'sini kullan
        }

        // Test sonucunu ekle
        let testStmt;
        let testResult;

        try {
          // Önce report_id sütununu içeren sorguyu dene
          testStmt = db.prepare(`
            INSERT INTO test_results (
              report_id, scenario_id, name, status, start_time, end_time, duration,
              browser, screenshot_path, error_message
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);

          const endTime = new Date(new Date(testData.timestamp).getTime() + testData.duration);

          testResult = testStmt.run(
            testData.id,
            scenarioId,
            testData.name || 'Unnamed Test',
            testData.success ? 'success' : 'failure',
            testData.timestamp,
            endTime.toISOString(),
            testData.duration,
            testData.browserType || 'unknown',
            testData.steps.find(s => s.screenshot)?.screenshot || null,
            testData.error || null
          );
        } catch (error) {
          console.warn('Error inserting test with report_id, trying without report_id:', error);

          // report_id olmadan dene
          testStmt = db.prepare(`
            INSERT INTO test_results (
              scenario_id, status, start_time, end_time, duration,
              browser, screenshot_path, error_message
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `);

          const endTime = new Date(new Date(testData.timestamp).getTime() + testData.duration);

          testResult = testStmt.run(
            scenarioId,
            testData.success ? 'success' : 'failure',
            testData.timestamp,
            endTime.toISOString(),
            testData.duration,
            testData.browserType || 'unknown',
            testData.steps.find(s => s.screenshot)?.screenshot || null,
            testData.error || null
          );
        }

        const testResultId = testResult.lastInsertRowid;

        // Test adımlarını ekle
        if (testData.steps && Array.isArray(testData.steps)) {
          try {
            // Önce step_id sütununu içeren sorguyu dene
            const stepStmt = db.prepare(`
              INSERT INTO test_step_results (
                result_id, step_id, status, duration, screenshot_path, error_message
              ) VALUES (?, ?, ?, ?, ?, ?)
            `);

            for (const step of testData.steps) {
              stepStmt.run(
                testResultId,
                step.step || 1, // Varsayılan adım ID'si
                step.success ? 'success' : 'failure',
                step.duration || 0,
                step.screenshot || null,
                step.error || null
              );
            }
          } catch (error) {
            console.warn('Error inserting steps with step_id, skipping steps:', error);
          }
        }

        return testResultId;
      });

      // İşlemi gerçekleştir
      const testResultId = transaction();

      console.log(`Imported test report ${testData.id} with ${testData.steps?.length || 0} steps`);
      return { success: true, id: testResultId };
    } catch (error) {
      console.error(`Error importing test report ${testData.id}:`, error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Belirli bir günün raporlarını içe aktarır
   * @param {string} date - Tarih (YYYY-MM-DD)
   */
  async importReportsForDate(date) {
    try {
      // Günlük özet dosyasını kontrol et
      const summaryPath = path.join(this.dailyDir, `${date}.json`);

      if (!fs.existsSync(summaryPath)) {
        return { success: false, message: `Summary file not found for ${date}` };
      }

      // Günlük özeti oku ve içe aktar
      const summaryData = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
      const summaryResult = await this.importDailySummary(summaryData);

      // Günün test raporlarını içe aktar
      const testResults = await this.importDailyTestReports(date);

      return {
        success: true,
        message: `Imported summary and ${testResults.importedCount} test reports for ${date}`,
        summaryResult,
        testResults
      };
    } catch (error) {
      console.error(`Error importing reports for ${date}:`, error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Veritabanındaki test sonuçlarını sorgular
   * @param {number} limit - Maksimum sonuç sayısı
   */
  getRecentTestResults(limit = 10) {
    try {
      const stmt = db.prepare(`
        SELECT
          id, report_id, name, description, browser_type, headless,
          status, start_time, end_time, duration, screenshot_path, error_message
        FROM test_results
        ORDER BY start_time DESC
        LIMIT ?
      `);

      const results = stmt.all(limit);
      return results;
    } catch (error) {
      console.error('Error getting recent test results:', error);
      return [];
    }
  }

  /**
   * Veritabanındaki test sonuçları istatistiklerini alır
   */
  getTestResultStats() {
    try {
      const totalStmt = db.prepare('SELECT COUNT(*) as total FROM test_results');
      const successStmt = db.prepare("SELECT COUNT(*) as success FROM test_results WHERE status = 'success'");
      const failureStmt = db.prepare("SELECT COUNT(*) as failure FROM test_results WHERE status = 'failure'");

      const total = totalStmt.get().total;
      const success = successStmt.get().success;
      const failure = failureStmt.get().failure;

      return {
        total,
        success,
        failure,
        successRate: total > 0 ? (success / total) * 100 : 0
      };
    } catch (error) {
      console.error('Error getting test result stats:', error);
      return { total: 0, success: 0, failure: 0, successRate: 0 };
    }
  }

  /**
   * Belirli bir test sonucunun detaylarını alır
   * @param {string} reportId - Test raporu ID'si
   */
  getTestResultById(reportId) {
    try {
      const testStmt = db.prepare(`
        SELECT
          id, report_id, name, description, browser_type, headless,
          status, start_time, end_time, duration, screenshot_path, error_message
        FROM test_results
        WHERE report_id = ?
      `);

      const test = testStmt.get(reportId);

      if (!test) {
        return null;
      }

      // Test adımlarını al
      const stepsStmt = db.prepare(`
        SELECT
          id, step_number, action, target, strategy, value, description,
          status, duration, screenshot_path, error_message
        FROM test_step_results
        WHERE result_id = ?
        ORDER BY step_number
      `);

      const steps = stepsStmt.all(test.id);

      return {
        ...test,
        steps
      };
    } catch (error) {
      console.error(`Error getting test result ${reportId}:`, error);
      return null;
    }
  }
}

// Servis örneği oluştur
const reportImportService = new ReportImportService();

export default reportImportService;
