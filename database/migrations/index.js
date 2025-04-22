/**
 * Tüm veritabanı migration işlemlerini yöneten ana dosya
 */

import { createTestRunTables, dropTestRunTables } from './01_test_run_tables.js';
import { createTestOrganizationTables, dropTestOrganizationTables } from './02_test_organization_tables.js';
import { createWebElementTables, dropWebElementTables } from './03_web_element_tables.js';
import { createBugAndConfigTables, dropBugAndConfigTables } from './04_bug_and_config_tables.js';

/**
 * Tüm tabloları oluşturur
 */
export function migrateUp() {
  console.log('Starting database migration...');
  
  try {
    // Tabloları sırayla oluştur
    createTestRunTables();
    createTestOrganizationTables();
    createWebElementTables();
    createBugAndConfigTables();
    
    console.log('Database migration completed successfully');
  } catch (error) {
    console.error('Database migration failed:', error);
    throw error;
  }
}

/**
 * Tüm tabloları siler
 */
export function migrateDown() {
  console.log('Starting database rollback...');
  
  try {
    // Tabloları ters sırada sil (foreign key kısıtlamaları nedeniyle)
    dropBugAndConfigTables();
    dropWebElementTables();
    dropTestOrganizationTables();
    dropTestRunTables();
    
    console.log('Database rollback completed successfully');
  } catch (error) {
    console.error('Database rollback failed:', error);
    throw error;
  }
}

// Doğrudan çalıştırıldığında migration işlemini başlat
if (process.argv[1].endsWith('index.js')) {
  const command = process.argv[2];
  
  if (command === 'down') {
    migrateDown();
  } else {
    migrateUp();
  }
}
