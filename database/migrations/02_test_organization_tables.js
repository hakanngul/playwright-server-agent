/**
 * Test organizasyon tablolarını oluşturan migration dosyası
 * Bu dosya TestSuite ve TestCase tablolarını oluşturur
 */

import db from '../db.js';

export function createTestOrganizationTables() {
  console.log('Creating test organization tables...');

  // TestSuite tablosu
  db.exec(`
    CREATE TABLE IF NOT EXISTS test_suites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      tags TEXT, -- JSON formatında etiketler
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // TestCase tablosu
  db.exec(`
    CREATE TABLE IF NOT EXISTS test_cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      test_suite_id INTEGER,
      name TEXT NOT NULL,
      description TEXT,
      priority TEXT CHECK (priority IN ('P0', 'P1', 'P2', 'P3')),
      automation_status TEXT CHECK (automation_status IN ('AUTOMATED', 'MANUAL', 'IN_PROGRESS')),
      expected_result TEXT,
      prerequisites TEXT,
      author TEXT,
      tags TEXT, -- JSON formatında etiketler
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (test_suite_id) REFERENCES test_suites(id) ON DELETE SET NULL
    )
  `);

  // İndeksler
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_test_suites_name ON test_suites(name);
    CREATE INDEX IF NOT EXISTS idx_test_cases_name ON test_cases(name);
    CREATE INDEX IF NOT EXISTS idx_test_cases_test_suite_id ON test_cases(test_suite_id);
    CREATE INDEX IF NOT EXISTS idx_test_cases_priority ON test_cases(priority);
    CREATE INDEX IF NOT EXISTS idx_test_cases_automation_status ON test_cases(automation_status);
  `);

  console.log('Test organization tables created successfully');
}

export function dropTestOrganizationTables() {
  console.log('Dropping test organization tables...');
  
  // Tabloları ters sırada sil (foreign key kısıtlamaları nedeniyle)
  db.exec(`
    DROP TABLE IF EXISTS test_cases;
    DROP TABLE IF EXISTS test_suites;
  `);
  
  console.log('Test organization tables dropped successfully');
}
