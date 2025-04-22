/**
 * Hata takip ve yapılandırma tablolarını oluşturan migration dosyası
 * Bu dosya Bug, TestData ve Configuration tablolarını oluşturur
 */

import db from '../db.js';

export function createBugAndConfigTables() {
  console.log('Creating bug and configuration tables...');

  // Bug tablosu
  db.exec(`
    CREATE TABLE IF NOT EXISTS bugs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      test_result_id INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      severity TEXT CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
      status TEXT CHECK (status IN ('NEW', 'OPEN', 'FIXED', 'REJECTED', 'DUPLICATE')),
      reported_by TEXT,
      assigned_to TEXT,
      screenshot_path TEXT,
      video_path TEXT,
      external_bug_id TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (test_result_id) REFERENCES test_results(id) ON DELETE SET NULL
    )
  `);

  // TestData tablosu
  db.exec(`
    CREATE TABLE IF NOT EXISTS test_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      data_type TEXT NOT NULL,
      value TEXT NOT NULL, -- JSON formatında veri değeri
      is_sensitive BOOLEAN DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Configuration tablosu
  db.exec(`
    CREATE TABLE IF NOT EXISTS configurations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      value TEXT NOT NULL,
      description TEXT,
      environment TEXT CHECK (environment IN ('DEV', 'TEST', 'STAGING', 'PROD')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(name, environment)
    )
  `);

  // İndeksler
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_bugs_test_result_id ON bugs(test_result_id);
    CREATE INDEX IF NOT EXISTS idx_bugs_severity ON bugs(severity);
    CREATE INDEX IF NOT EXISTS idx_bugs_status ON bugs(status);
    CREATE INDEX IF NOT EXISTS idx_test_data_name ON test_data(name);
    CREATE INDEX IF NOT EXISTS idx_test_data_data_type ON test_data(data_type);
    CREATE INDEX IF NOT EXISTS idx_configurations_name ON configurations(name);
    CREATE INDEX IF NOT EXISTS idx_configurations_environment ON configurations(environment);
  `);

  console.log('Bug and configuration tables created successfully');
}

export function dropBugAndConfigTables() {
  console.log('Dropping bug and configuration tables...');

  // Tabloları sil
  db.exec(`
    DROP TABLE IF EXISTS bugs;
    DROP TABLE IF EXISTS test_data;
    DROP TABLE IF EXISTS configurations;
  `);

  console.log('Bug and configuration tables dropped successfully');
}
