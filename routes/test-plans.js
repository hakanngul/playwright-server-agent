/**
 * Test Plans API Routes
 * Handles test plan-related API endpoints
 */

import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Test plans directory
const TEST_PLANS_DIR = path.join(__dirname, '..', 'test-run-with-curl-scripts', 'test-plans');

// Ensure test plans directory exists
if (!fs.existsSync(TEST_PLANS_DIR)) {
  fs.mkdirSync(TEST_PLANS_DIR, { recursive: true });
}

// Get all test plans
router.get('/', (req, res) => {
  try {
    const testPlans = [];
    const files = fs.readdirSync(TEST_PLANS_DIR);

    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(TEST_PLANS_DIR, file);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        try {
          const testPlan = JSON.parse(fileContent);
          testPlans.push({
            id: path.basename(file, '.json'),
            name: testPlan.name,
            description: testPlan.description,
            browserPreference: testPlan.browserPreference,
            headless: testPlan.headless,
            stepsCount: testPlan.steps ? testPlan.steps.length : 0
          });
        } catch (parseError) {
          console.error(`Error parsing test plan file ${file}:`, parseError);
        }
      }
    }

    res.json({
      success: true,
      testPlans
    });
  } catch (error) {
    console.error('Error getting test plans:', error);
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get a specific test plan
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const filePath = path.join(TEST_PLANS_DIR, `${id}.json`);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: `Test plan ${id} not found`
      });
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');
    const testPlan = JSON.parse(fileContent);

    res.json({
      success: true,
      testPlan
    });
  } catch (error) {
    console.error('Error getting test plan:', error);
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Create a new test plan
router.post('/', (req, res) => {
  try {
    const testPlan = req.body;

    if (!testPlan || !testPlan.name || !testPlan.steps || !Array.isArray(testPlan.steps)) {
      return res.status(400).json({
        error: 'Invalid test plan format. Test plan must include name and steps array.'
      });
    }

    // Generate a unique ID for the test plan
    const id = uuidv4();
    const filePath = path.join(TEST_PLANS_DIR, `${id}.json`);

    // Save the test plan to a file
    fs.writeFileSync(filePath, JSON.stringify(testPlan, null, 2), 'utf8');

    res.json({
      success: true,
      id,
      message: 'Test plan created successfully'
    });
  } catch (error) {
    console.error('Error creating test plan:', error);
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Update an existing test plan
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const testPlan = req.body;
    const filePath = path.join(TEST_PLANS_DIR, `${id}.json`);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: `Test plan ${id} not found`
      });
    }

    if (!testPlan || !testPlan.name || !testPlan.steps || !Array.isArray(testPlan.steps)) {
      return res.status(400).json({
        error: 'Invalid test plan format. Test plan must include name and steps array.'
      });
    }

    // Save the updated test plan to a file
    fs.writeFileSync(filePath, JSON.stringify(testPlan, null, 2), 'utf8');

    res.json({
      success: true,
      message: 'Test plan updated successfully'
    });
  } catch (error) {
    console.error('Error updating test plan:', error);
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Delete a test plan
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const filePath = path.join(TEST_PLANS_DIR, `${id}.json`);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: `Test plan ${id} not found`
      });
    }

    // Delete the test plan file
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      message: 'Test plan deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting test plan:', error);
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

export default router;
