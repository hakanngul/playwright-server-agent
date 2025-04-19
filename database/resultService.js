import db from './db.js';

// Test result CRUD operations
const resultService = {
  // Create a new test result
  createTestResult(result) {
    // Start a transaction
    const savedResult = db.transaction(() => {
      // Insert test result
      const resultStmt = db.prepare(`
        INSERT INTO test_results (
          scenario_id, status, start_time, end_time, duration, browser, screenshot_path, error_message
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const resultInfo = resultStmt.run(
        result.scenarioId,
        result.success ? 'success' : 'failure',
        result.startTime,
        result.endTime,
        result.duration,
        result.browser || 'chromium',
        result.screenshot || null,
        result.error || null
      );
      
      const resultId = resultInfo.lastInsertRowid;
      
      // Insert step results if provided
      if (result.steps && result.steps.length > 0) {
        const stepResultStmt = db.prepare(`
          INSERT INTO test_step_results (
            result_id, step_id, status, start_time, end_time, duration, screenshot_path, error_message
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        result.steps.forEach((step) => {
          stepResultStmt.run(
            resultId,
            step.id || null,
            step.success ? 'success' : 'failure',
            step.startTime || result.startTime,
            step.endTime || result.endTime,
            step.duration || 0,
            step.screenshot || null,
            step.message || null
          );
        });
      }
      
      return {
        id: resultId,
        ...result
      };
    })();
    
    return savedResult;
  },
  
  // Get all test results
  getAllTestResults() {
    const stmt = db.prepare(`
      SELECT r.*, s.name as scenario_name
      FROM test_results r
      LEFT JOIN test_scenarios s ON r.scenario_id = s.id
      ORDER BY r.start_time DESC
    `);
    return stmt.all();
  },
  
  // Get recent test results
  getRecentTestResults(limit = 10) {
    const stmt = db.prepare(`
      SELECT r.*, s.name as scenario_name
      FROM test_results r
      LEFT JOIN test_scenarios s ON r.scenario_id = s.id
      ORDER BY r.start_time DESC
      LIMIT ?
    `);
    return stmt.all(limit);
  },
  
  // Get test result statistics
  getTestResultStats() {
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
  },
  
  // Get test result by ID with step results
  getTestResultById(id) {
    const resultStmt = db.prepare(`
      SELECT r.*, s.name as scenario_name
      FROM test_results r
      LEFT JOIN test_scenarios s ON r.scenario_id = s.id
      WHERE r.id = ?
    `);
    const result = resultStmt.get(id);
    
    if (!result) return null;
    
    const stepResultsStmt = db.prepare(`
      SELECT sr.*, ts.action, ts.selector, ts.selector_type, ts.value, ts.description
      FROM test_step_results sr
      LEFT JOIN test_steps ts ON sr.step_id = ts.id
      WHERE sr.result_id = ?
      ORDER BY ts.step_order
    `);
    const stepResults = stepResultsStmt.all(id);
    
    return {
      ...result,
      steps: stepResults
    };
  },
  
  // Delete a test result
  deleteTestResult(id) {
    const stmt = db.prepare('DELETE FROM test_results WHERE id = ?');
    const info = stmt.run(id);
    return info.changes > 0;
  }
};

export default resultService;
