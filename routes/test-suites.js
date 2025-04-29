/**
 * Test Suites API Routes
 * Handles test suite-related API endpoints
 */

import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Test suites directory
const TEST_SUITES_DIR = path.join(__dirname, '..', 'test-run-with-curl-scripts', 'test-plans');

// Ensure test suites directory exists
if (!fs.existsSync(TEST_SUITES_DIR)) {
  fs.mkdirSync(TEST_SUITES_DIR, { recursive: true });
}

// Get all test suites
router.get('/', (req, res) => {
  try {
    const testSuites = [];
    const files = fs.readdirSync(TEST_SUITES_DIR);

    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(TEST_SUITES_DIR, file);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        try {
          const testSuite = JSON.parse(fileContent);

          // Check if it's a test suite (has testPlans array)
          if (testSuite.testPlans && Array.isArray(testSuite.testPlans)) {
            testSuites.push({
              id: path.basename(file, '.json'),
              name: testSuite.name,
              description: testSuite.description,
              category: testSuite.category,
              parallelExecution: testSuite.parallelExecution,
              maxWorkers: testSuite.maxWorkers,
              defaultBrowserPreference: testSuite.defaultBrowserPreference,
              defaultHeadless: testSuite.defaultHeadless,
              testPlansCount: testSuite.testPlans.length
            });
          }
        } catch (parseError) {
          console.error(`Error parsing test suite file ${file}:`, parseError);
        }
      }
    }

    res.json({
      success: true,
      testSuites
    });
  } catch (error) {
    console.error('Error getting test suites:', error);
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get a specific test suite
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const filePath = path.join(TEST_SUITES_DIR, `${id}.json`);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: `Test suite ${id} not found`
      });
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');
    const testSuite = JSON.parse(fileContent);

    res.json({
      success: true,
      testSuite
    });
  } catch (error) {
    console.error('Error getting test suite:', error);
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Create a new test suite
router.post('/', (req, res) => {
  try {
    const testSuite = req.body;

    if (!testSuite || !testSuite.name || !testSuite.testPlans || !Array.isArray(testSuite.testPlans)) {
      return res.status(400).json({
        error: 'Invalid test suite format. Test suite must include name and testPlans array.'
      });
    }

    // Generate a unique ID for the test suite
    const id = uuidv4();
    const filePath = path.join(TEST_SUITES_DIR, `${id}.json`);

    // Save the test suite to a file
    fs.writeFileSync(filePath, JSON.stringify(testSuite, null, 2), 'utf8');

    res.json({
      success: true,
      id,
      message: 'Test suite created successfully'
    });
  } catch (error) {
    console.error('Error creating test suite:', error);
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Update an existing test suite
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const testSuite = req.body;
    const filePath = path.join(TEST_SUITES_DIR, `${id}.json`);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: `Test suite ${id} not found`
      });
    }

    if (!testSuite || !testSuite.name || !testSuite.testPlans || !Array.isArray(testSuite.testPlans)) {
      return res.status(400).json({
        error: 'Invalid test suite format. Test suite must include name and testPlans array.'
      });
    }

    // Save the updated test suite to a file
    fs.writeFileSync(filePath, JSON.stringify(testSuite, null, 2), 'utf8');

    res.json({
      success: true,
      message: 'Test suite updated successfully'
    });
  } catch (error) {
    console.error('Error updating test suite:', error);
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Delete a test suite
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const filePath = path.join(TEST_SUITES_DIR, `${id}.json`);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: `Test suite ${id} not found`
      });
    }

    // Delete the test suite file
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      message: 'Test suite deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting test suite:', error);
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Run a test suite
router.post('/:id/run', (req, res) => {
  try {
    const { id } = req.params;
    const { maxWorkers, headless } = req.body;
    const filePath = path.join(TEST_SUITES_DIR, `${id}.json`);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: `Test suite ${id} not found`
      });
    }

    let fileContent;
    try {
      fileContent = fs.readFileSync(filePath, 'utf8');
      console.log(`Read test suite file: ${filePath}`);
    } catch (readError) {
      console.error(`Error reading test suite file: ${filePath}`, readError);
      return res.status(500).json({
        error: `Error reading test suite file: ${readError.message}`
      });
    }

    let testSuite;
    try {
      testSuite = JSON.parse(fileContent);
      console.log(`Parsed test suite: ${testSuite.name}`);
    } catch (parseError) {
      console.error(`Error parsing test suite JSON: ${filePath}`, parseError);
      return res.status(500).json({
        error: `Error parsing test suite JSON: ${parseError.message}`
      });
    }

    // Validate test suite structure
    if (!testSuite.testPlans || !Array.isArray(testSuite.testPlans) || testSuite.testPlans.length === 0) {
      console.error(`Invalid test suite structure: No test plans found in ${filePath}`);
      return res.status(400).json({
        error: 'Invalid test suite structure: No test plans found'
      });
    }

    // Check if parallel execution is enabled
    if (testSuite.parallelExecution) {
      // Set maximum number of agents to use
      const maxAgentsToUse = maxWorkers || testSuite.maxWorkers || 5;
      console.log(`Using maximum ${maxAgentsToUse} agents for parallel execution`);

      // Set headless mode if specified
      if (headless !== undefined) {
        testSuite.testPlans.forEach(plan => {
          plan.headless = headless;
        });
      }

      // Forward to agent-based endpoint
      const requestIds = [];

      // Import agent manager
      const agentManager = req.app.get('agentManager');
      console.log('Agent manager from app:', agentManager ? 'Available' : 'Not available');

      if (!agentManager) {
        return res.status(500).json({
          error: 'Agent manager not available'
        });
      }

      // Submit all test plans to the agent manager
      for (const testPlan of testSuite.testPlans) {
        if (!testPlan || !testPlan.steps || !Array.isArray(testPlan.steps)) {
          console.warn(`Skipping invalid test plan: ${testPlan?.name || 'unnamed'}`);
          continue;
        }

        // Ensure each step has the required fields
        const validatedSteps = testPlan.steps.map(step => {
          // Convert target to value for navigate action if needed
          if (step.action === 'navigate' && step.target && !step.value) {
            return { ...step, value: step.target };
          }

          // Convert value to string if it's a number
          if (step.value && typeof step.value === 'number') {
            return { ...step, value: step.value.toString() };
          }

          return step;
        });

        // Create a validated test plan
        const validatedTestPlan = {
          ...testPlan,
          steps: validatedSteps,
          // Ensure these fields are present
          browserPreference: testPlan.browserPreference || testSuite.defaultBrowserPreference || 'chromium',
          headless: headless !== undefined ? headless : (testPlan.headless !== undefined ? testPlan.headless : testSuite.defaultHeadless)
        };

        // Submit the request to the agent manager
        console.log(`Submitting test plan: ${JSON.stringify(validatedTestPlan, null, 2)}`);
        const requestId = agentManager.submitRequest(validatedTestPlan);
        requestIds.push({ id: requestId, name: testPlan.name });
        console.log(`Test plan "${testPlan.name}" submitted with ID: ${requestId}`);
      }

      // Set agent limit temporarily for this batch
      agentManager.setAgentLimit(maxAgentsToUse);

      // Start processing immediately
      agentManager.processQueue();

      res.json({
        success: true,
        message: `${requestIds.length} test requests submitted for parallel execution`,
        requestIds: requestIds
      });
    } else {
      // Run tests sequentially
      const requestIds = [];

      // Import agent manager
      const agentManager = req.app.get('agentManager');
      console.log('Agent manager from app (sequential):', agentManager ? 'Available' : 'Not available');

      if (!agentManager) {
        return res.status(500).json({
          error: 'Agent manager not available'
        });
      }

      // Set headless mode if specified
      if (headless !== undefined) {
        testSuite.testPlans.forEach(plan => {
          plan.headless = headless;
        });
      }

      // Submit test plans one by one
      for (const testPlan of testSuite.testPlans) {
        if (!testPlan || !testPlan.steps || !Array.isArray(testPlan.steps)) {
          console.warn(`Skipping invalid test plan: ${testPlan?.name || 'unnamed'}`);
          continue;
        }

        // Ensure each step has the required fields
        const validatedSteps = testPlan.steps.map(step => {
          // Convert target to value for navigate action if needed
          if (step.action === 'navigate' && step.target && !step.value) {
            return { ...step, value: step.target };
          }

          // Convert value to string if it's a number
          if (step.value && typeof step.value === 'number') {
            return { ...step, value: step.value.toString() };
          }

          return step;
        });

        // Create a validated test plan
        const validatedTestPlan = {
          ...testPlan,
          steps: validatedSteps,
          // Ensure these fields are present
          browserPreference: testPlan.browserPreference || testSuite.defaultBrowserPreference || 'chromium',
          headless: headless !== undefined ? headless : (testPlan.headless !== undefined ? testPlan.headless : testSuite.defaultHeadless)
        };

        // Submit the request to the agent manager
        console.log(`Submitting test plan: ${JSON.stringify(validatedTestPlan, null, 2)}`);
        const requestId = agentManager.submitRequest(validatedTestPlan);
        requestIds.push({ id: requestId, name: testPlan.name });
        console.log(`Test plan "${testPlan.name}" submitted with ID: ${requestId}`);
      }

      // Start processing immediately
      agentManager.processQueue();

      res.json({
        success: true,
        message: `${requestIds.length} test requests submitted for sequential execution`,
        requestIds: requestIds
      });
    }
  } catch (error) {
    console.error('Error running test suite:', error);
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

export default router;
