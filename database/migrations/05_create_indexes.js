/**
 * Tüm tablolar için indeksleri oluşturan migration dosyası
 */

import db from '../db.js';

export function createIndexes() {
  console.log('Creating indexes...');

  // Test run tabloları için indeksler
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_test_runs_status ON test_runs(status);
    CREATE INDEX IF NOT EXISTS idx_test_runs_browser ON test_runs(browser);
    CREATE INDEX IF NOT EXISTS idx_test_runs_environment ON test_runs(environment);
  `);

  // Test results tabloları için indeksler
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_test_results_status ON test_results(status);
    CREATE INDEX IF NOT EXISTS idx_test_results_test_run_id ON test_results(test_run_id);
  `);

  // Test steps tabloları için indeksler
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_test_steps_test_result_id ON test_steps(test_result_id);
  `);

  console.log('Indexes created successfully');
}

export function dropIndexes() {
  console.log('Dropping indexes...');

  // İndeksleri sil
  db.exec(`
    DROP INDEX IF EXISTS idx_test_runs_status;
    DROP INDEX IF EXISTS idx_test_runs_browser;
    DROP INDEX IF EXISTS idx_test_runs_environment;
    DROP INDEX IF EXISTS idx_test_results_status;
    DROP INDEX IF EXISTS idx_test_results_test_run_id;
    DROP INDEX IF EXISTS idx_test_steps_test_result_id;
  `);

  console.log('Indexes dropped successfully');
}
