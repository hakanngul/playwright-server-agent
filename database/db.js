import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get current file path and directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure database directory exists
const dbDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'agent_database.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables if they don't exist
function initDatabase() {
  // Elements table
  db.exec(`
    CREATE TABLE IF NOT EXISTS elements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      selector TEXT NOT NULL,
      selector_type TEXT NOT NULL,
      description TEXT,
      page_name TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Test scenarios table
  db.exec(`
    CREATE TABLE IF NOT EXISTS test_scenarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Test steps table
  db.exec(`
    CREATE TABLE IF NOT EXISTS test_steps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scenario_id INTEGER NOT NULL,
      step_order INTEGER NOT NULL,
      action TEXT NOT NULL,
      selector TEXT,
      selector_type TEXT,
      value TEXT,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (scenario_id) REFERENCES test_scenarios(id) ON DELETE CASCADE
    )
  `);

  // Test results table
  db.exec(`
    CREATE TABLE IF NOT EXISTS test_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scenario_id INTEGER NOT NULL,
      status TEXT NOT NULL,
      start_time TIMESTAMP NOT NULL,
      end_time TIMESTAMP NOT NULL,
      duration INTEGER NOT NULL,
      browser TEXT NOT NULL,
      screenshot_path TEXT,
      error_message TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (scenario_id) REFERENCES test_scenarios(id) ON DELETE CASCADE
    )
  `);

  // Test step results table
  db.exec(`
    CREATE TABLE IF NOT EXISTS test_step_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      result_id INTEGER NOT NULL,
      step_id INTEGER NOT NULL,
      status TEXT NOT NULL,
      start_time TIMESTAMP NOT NULL,
      end_time TIMESTAMP NOT NULL,
      duration INTEGER NOT NULL,
      screenshot_path TEXT,
      error_message TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (result_id) REFERENCES test_results(id) ON DELETE CASCADE,
      FOREIGN KEY (step_id) REFERENCES test_steps(id) ON DELETE CASCADE
    )
  `);

  console.log('Database initialized successfully');
}

// Initialize the database
initDatabase();

export default db;
