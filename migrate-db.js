/**
 * Veritabanı migration işlemlerini çalıştıran script
 * 
 * Kullanım:
 * node migrate-db.js up   - Tabloları oluşturur
 * node migrate-db.js down - Tabloları siler
 */

import { migrateUp, migrateDown } from './database/migrations/index.js';

const command = process.argv[2] || 'up';

if (command === 'down') {
  console.log('Veritabanı tablolarını silme işlemi başlatılıyor...');
  migrateDown();
} else {
  console.log('Veritabanı tablolarını oluşturma işlemi başlatılıyor...');
  migrateUp();
}
