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
    CREATE TABLE IF NOT EXISTS test_results (
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
      FOREIGN KEY (test_run_id) REFERENCES test_runs(id) ON DELETE CASCADE,
      FOREIGN KEY (test_suite_id) REFERENCES test_suites(id) ON DELETE SET NULL,
      FOREIGN KEY (test_case_id) REFERENCES test_cases(id) ON DELETE SET NULL
    )
  `);

  // TestStep tablosu
  db.exec(`
    CREATE TABLE IF NOT EXISTS test_steps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      test_result_id INTEGER NOT NULL,
      test_case_id INTEGER,
      order_number INTEGER NOT NULL,
      description TEXT,
      status TEXT NOT NULL CHECK (status IN ('PASSED', 'FAILED', 'SKIPPED')),
      start_time TIMESTAMP NOT NULL,
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
      FOREIGN KEY (test_result_id) REFERENCES test_results(id) ON DELETE CASCADE,
      FOREIGN KEY (test_case_id) REFERENCES test_cases(id) ON DELETE SET NULL
    )
  `);

  // İndeksler daha sonra oluşturulacak

  console.log('Test run tables created successfully');
}

export function dropTestRunTables() {
  console.log('Dropping test run tables...');

  // Tabloları ters sırada sil (foreign key kısıtlamaları nedeniyle)
  db.exec(`
    DROP TABLE IF EXISTS test_steps;
    DROP TABLE IF EXISTS test_results;
    DROP TABLE IF EXISTS test_runs;
  `);

  console.log('Test run tables dropped successfully');
}
