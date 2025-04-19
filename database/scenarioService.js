import db from './db.js';

// Test scenario CRUD operations
const scenarioService = {
  // Create a new test scenario with steps
  createScenario(scenario) {
    // Start a transaction
    const result = db.transaction(() => {
      // Insert scenario
      const scenarioStmt = db.prepare(`
        INSERT INTO test_scenarios (name, description)
        VALUES (?, ?)
      `);
      
      const scenarioInfo = scenarioStmt.run(
        scenario.name,
        scenario.description || null
      );
      
      const scenarioId = scenarioInfo.lastInsertRowid;
      
      // Insert steps if provided
      if (scenario.steps && scenario.steps.length > 0) {
        const stepStmt = db.prepare(`
          INSERT INTO test_steps (scenario_id, step_order, action, selector, selector_type, value, description)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        
        scenario.steps.forEach((step, index) => {
          stepStmt.run(
            scenarioId,
            index + 1,
            step.action,
            step.target || null,
            step.strategy || null,
            step.value || null,
            step.description || null
          );
        });
      }
      
      return {
        id: scenarioId,
        ...scenario
      };
    })();
    
    return result;
  },
  
  // Get all test scenarios
  getAllScenarios() {
    const stmt = db.prepare('SELECT * FROM test_scenarios ORDER BY name');
    return stmt.all();
  },
  
  // Get test scenario by ID with steps
  getScenarioById(id) {
    const scenarioStmt = db.prepare('SELECT * FROM test_scenarios WHERE id = ?');
    const scenario = scenarioStmt.get(id);
    
    if (!scenario) return null;
    
    const stepsStmt = db.prepare('SELECT * FROM test_steps WHERE scenario_id = ? ORDER BY step_order');
    const steps = stepsStmt.all(id);
    
    // Convert database format to API format
    const formattedSteps = steps.map(step => ({
      id: step.id,
      action: step.action,
      target: step.selector,
      strategy: step.selector_type,
      value: step.value,
      description: step.description
    }));
    
    return {
      ...scenario,
      steps: formattedSteps
    };
  },
  
  // Update a test scenario with steps
  updateScenario(id, scenario) {
    // Start a transaction
    const result = db.transaction(() => {
      // Update scenario
      const scenarioStmt = db.prepare(`
        UPDATE test_scenarios
        SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      
      const scenarioInfo = scenarioStmt.run(
        scenario.name,
        scenario.description || null,
        id
      );
      
      if (scenarioInfo.changes === 0) {
        throw new Error('Scenario not found');
      }
      
      // Delete existing steps
      const deleteStepsStmt = db.prepare('DELETE FROM test_steps WHERE scenario_id = ?');
      deleteStepsStmt.run(id);
      
      // Insert new steps if provided
      if (scenario.steps && scenario.steps.length > 0) {
        const stepStmt = db.prepare(`
          INSERT INTO test_steps (scenario_id, step_order, action, selector, selector_type, value, description)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        
        scenario.steps.forEach((step, index) => {
          stepStmt.run(
            id,
            index + 1,
            step.action,
            step.target || null,
            step.strategy || null,
            step.value || null,
            step.description || null
          );
        });
      }
      
      return true;
    })();
    
    return result;
  },
  
  // Delete a test scenario
  deleteScenario(id) {
    const stmt = db.prepare('DELETE FROM test_scenarios WHERE id = ?');
    const info = stmt.run(id);
    return info.changes > 0;
  }
};

export default scenarioService;
