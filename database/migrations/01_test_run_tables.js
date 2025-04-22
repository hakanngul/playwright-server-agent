/**
 * Test çalıştırma ve sonuç tablolarını oluşturan migration dosyası
 * Bu dosya TestRun, TestResult ve TestStep tablolarını oluşturur
 */

import db from '../db.js';

export function createTestRunTables() {
  console.log('Creating test run tables...');

  // TestRun tablosu
  db.exec(`
    CREATE TABLE IF NOT EXISTS test_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL CHECK (status IN ('PASSED', 'FAILED', 'SKIPPED', 'IN_PROGRESS', 'ABORTED')),
      start_time TIMESTAMP NOT NULL,
      end_time TIMESTAMP,
      duration_ms INTEGER,
      browser TEXT NOT NULL,
      browser_version TEXT,
      operating_system TEXT,
      viewport_size TEXT,
      environment TEXT CHECK (environment IN ('DEV', 'TEST', 'STAGING', 'PROD')),
      build_number TEXT,
      created_by TEXT,
      tags TEXT, -- JSON formatında etiketler
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // TestResult tablosu
  db.exec(`
    CREATE TABLE IF NOT EXISTS test_results_extended (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      test_run_id INTEGER NOT NULL,
      test_suite_id INTEGER,
      test_case_id INTEGER,
      status TEXT NOT NULL CHECK (status IN ('PASSED', 'FAILED', 'SKIPPED', 'BLOCKED')),
      start_time TIMESTAMP NOT NULL,
      end_time TIMESTAMP,
      duration_ms INTEGER,
      error_message TEXT,
      error_stack TEXT,
      screenshot_path TEXT,
      video_path TEXT,
      trace_path TEXT,
      retry_count INTEGER DEFAULT 0,
      custom_data TEXT, -- JSON formatında özel veriler
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (test_run_id) REFERENCES test_runs(id) ON DELETE CASCADE
    )
  `);

  // TestStep tablosu
  db.exec(`
    CREATE TABLE IF NOT EXISTS test_steps_extended (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      test_result_id INTEGER NOT NULL,
      test_case_id INTEGER,
      order_number INTEGER NOT NULL,
      description TEXT,
      status TEXT NOT NULL CHECK (status IN ('PASSED', 'FAILED', 'SKIPPED')),
      start_time TIMESTAMP,
      end_time TIMESTAMP,
      duration_ms INTEGER,
      screenshot_path TEXT,
      error_message TEXT,
      expected_result TEXT,
      actual_result TEXT,
      action_type TEXT,
      action_target TEXT,
      action_value TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (test_result_id) REFERENCES test_results_extended(id) ON DELETE CASCADE
    )
  `);

  // İndeksler
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_test_runs_status ON test_runs(status);
    CREATE INDEX IF NOT EXISTS idx_test_runs_browser ON test_runs(browser);
    CREATE INDEX IF NOT EXISTS idx_test_runs_environment ON test_runs(environment);
    CREATE INDEX IF NOT EXISTS idx_test_results_extended_status ON test_results_extended(status);
    CREATE INDEX IF NOT EXISTS idx_test_results_extended_test_run_id ON test_results_extended(test_run_id);
    CREATE INDEX IF NOT EXISTS idx_test_steps_extended_test_result_id ON test_steps_extended(test_result_id);
  `);

  console.log('Test run tables created successfully');
}

export function dropTestRunTables() {
  console.log('Dropping test run tables...');
  
  // Tabloları ters sırada sil (foreign key kısıtlamaları nedeniyle)
  db.exec(`
    DROP TABLE IF EXISTS test_steps_extended;
    DROP TABLE IF EXISTS test_results_extended;
    DROP TABLE IF EXISTS test_runs;
  `);
  
  console.log('Test run tables dropped successfully');
}
