import express from 'express';
import { elementService, scenarioService, resultService } from '../database/index.js';

const router = express.Router();

// Element routes
router.get('/elements/list', (req, res) => {
  try {
    console.log('GET /elements/list API call received');
    const elements = elementService.getAllElements();
    console.log('Returning elements:', elements);
    res.json(elements);
  } catch (error) {
    console.error('Error fetching elements:', error);
    res.status(500).json({ error: 'Failed to fetch elements' });
  }
});

router.get('/elements/:id', (req, res) => {
  try {
    const element = elementService.getElementById(req.params.id);
    if (!element) {
      return res.status(404).json({ error: 'Element not found' });
    }
    res.json(element);
  } catch (error) {
    console.error('Error fetching element:', error);
    res.status(500).json({ error: 'Failed to fetch element' });
  }
});

router.post('/elements/save', (req, res) => {
  try {
    console.log('POST /elements/save API call received');
    console.log('Received element data:', req.body);

    // Adapt frontend format to database format
    const elementData = {
      name: req.body.name,
      selector: req.body.locator,
      selector_type: req.body.strategy,
      description: req.body.description || '',
      page_name: req.body.screen || 'Default Screen'
    };

    console.log('Converted element data for database:', elementData);

    let result;
    if (req.body.id) {
      // Update existing element
      console.log('Updating existing element with ID:', req.body.id);
      const success = elementService.updateElement(req.body.id, elementData);
      if (!success) {
        console.error('Element not found for update:', req.body.id);
        return res.status(404).json({ error: 'Element not found' });
      }
      result = { ...elementData, id: req.body.id };
    } else {
      // Create new element
      console.log('Creating new element');
      result = elementService.createElement(elementData);
      console.log('Created element with ID:', result.id);
    }

    // Convert back to frontend format
    const responseElement = {
      id: result.id,
      name: result.name,
      strategy: result.selector_type,
      locator: result.selector,
      screen: result.page_name,
      description: result.description,
      createdAt: result.created_at,
      updatedAt: result.updated_at || result.created_at
    };

    console.log('Sending response element:', responseElement);
    res.status(201).json(responseElement);
  } catch (error) {
    console.error('Error saving element:', error);
    res.status(500).json({ error: 'Failed to save element' });
  }
});

router.delete('/elements/delete/:id', (req, res) => {
  try {
    const success = elementService.deleteElement(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Element not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting element:', error);
    res.status(500).json({ error: 'Failed to delete element' });
  }
});

// Scenario routes
router.get('/scenarios', (req, res) => {
  try {
    const scenarios = scenarioService.getAllScenarios();
    res.json(scenarios);
  } catch (error) {
    console.error('Error fetching scenarios:', error);
    res.status(500).json({ error: 'Failed to fetch scenarios' });
  }
});

router.get('/scenarios/:id', (req, res) => {
  try {
    const scenario = scenarioService.getScenarioById(req.params.id);
    if (!scenario) {
      return res.status(404).json({ error: 'Scenario not found' });
    }
    res.json(scenario);
  } catch (error) {
    console.error('Error fetching scenario:', error);
    res.status(500).json({ error: 'Failed to fetch scenario' });
  }
});

router.post('/scenarios', (req, res) => {
  try {
    const scenario = scenarioService.createScenario(req.body);
    res.status(201).json(scenario);
  } catch (error) {
    console.error('Error creating scenario:', error);
    res.status(500).json({ error: 'Failed to create scenario' });
  }
});

router.put('/scenarios/:id', (req, res) => {
  try {
    const success = scenarioService.updateScenario(req.params.id, req.body);
    if (!success) {
      return res.status(404).json({ error: 'Scenario not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating scenario:', error);
    res.status(500).json({ error: 'Failed to update scenario' });
  }
});

router.delete('/scenarios/:id', (req, res) => {
  try {
    const success = scenarioService.deleteScenario(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Scenario not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting scenario:', error);
    res.status(500).json({ error: 'Failed to delete scenario' });
  }
});

// Test result routes
router.get('/results', (req, res) => {
  try {
    const results = resultService.getAllTestResults();
    res.json(results);
  } catch (error) {
    console.error('Error fetching test results:', error);
    res.status(500).json({ error: 'Failed to fetch test results' });
  }
});

router.get('/results/recent', (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const results = resultService.getRecentTestResults(limit);
    res.json(results);
  } catch (error) {
    console.error('Error fetching recent test results:', error);
    res.status(500).json({ error: 'Failed to fetch recent test results' });
  }
});

router.get('/results/stats', (req, res) => {
  try {
    const stats = resultService.getTestResultStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching test result stats:', error);
    res.status(500).json({ error: 'Failed to fetch test result stats' });
  }
});

router.get('/results/:id', (req, res) => {
  try {
    const result = resultService.getTestResultById(req.params.id);
    if (!result) {
      return res.status(404).json({ error: 'Test result not found' });
    }
    res.json(result);
  } catch (error) {
    console.error('Error fetching test result:', error);
    res.status(500).json({ error: 'Failed to fetch test result' });
  }
});

router.post('/results', (req, res) => {
  try {
    const result = resultService.createTestResult(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating test result:', error);
    res.status(500).json({ error: 'Failed to create test result' });
  }
});

router.delete('/results/:id', (req, res) => {
  try {
    const success = resultService.deleteTestResult(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Test result not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting test result:', error);
    res.status(500).json({ error: 'Failed to delete test result' });
  }
});

export default router;
