/**
 * Web element ve sayfa tablolarını oluşturan migration dosyası
 * Bu dosya WebElement ve Page tablolarını oluşturur
 */

import db from '../db.js';

export function createWebElementTables() {
  console.log('Creating web element tables...');

  // Page tablosu
  db.exec(`
    CREATE TABLE IF NOT EXISTS pages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      url TEXT,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // WebElement tablosu
  db.exec(`
    CREATE TABLE IF NOT EXISTS web_elements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      page_id INTEGER,
      locator_type TEXT NOT NULL CHECK (locator_type IN ('CSS', 'XPATH', 'TEXT', 'ROLE', 'TEST_ID')),
      locator_value TEXT NOT NULL,
      parent_element_id INTEGER,
      attributes TEXT, -- JSON formatında element özellikleri
      screenshot_path TEXT,
      is_visible BOOLEAN DEFAULT 1,
      is_enabled BOOLEAN DEFAULT 1,
      is_required BOOLEAN DEFAULT 0,
      validation_rules TEXT, -- JSON formatında doğrulama kuralları
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE SET NULL,
      FOREIGN KEY (parent_element_id) REFERENCES web_elements(id) ON DELETE SET NULL
    )
  `);

  // İndeksler
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_pages_name ON pages(name);
    CREATE INDEX IF NOT EXISTS idx_web_elements_name ON web_elements(name);
    CREATE INDEX IF NOT EXISTS idx_web_elements_page_id ON web_elements(page_id);
    CREATE INDEX IF NOT EXISTS idx_web_elements_parent_element_id ON web_elements(parent_element_id);
    CREATE INDEX IF NOT EXISTS idx_web_elements_locator_type ON web_elements(locator_type);
  `);

  console.log('Web element tables created successfully');
}

export function dropWebElementTables() {
  console.log('Dropping web element tables...');
  
  // Tabloları ters sırada sil (foreign key kısıtlamaları nedeniyle)
  db.exec(`
    DROP TABLE IF EXISTS web_elements;
    DROP TABLE IF EXISTS pages;
  `);
  
  console.log('Web element tables dropped successfully');
}
