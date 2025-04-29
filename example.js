/**
 * Example usage of Playwright Server Agent
 */

import { createTestAgent, createAgentManager } from './src/index.js';

// Example test plan
const testPlan = {
  name: 'Example Test',
  description: 'Example test plan',
  browserPreference: 'chromium',
  headless: false,
  steps: [
    {
      action: 'navigate',
      value: 'https://example.com',
      description: 'Navigate to example.com'
    },
    {
      action: 'screenshot',
      value: 'example-page',
      description: 'Take a screenshot of the page'
    }
  ]
};

// Example 1: Run a test directly
async function runTestDirectly() {
  console.log('Running test directly...');
  
  const agent = createTestAgent('chromium', { headless: false });
  
  try {
    await agent.initialize();
    
    // Listen for events
    agent.on('step:completed', (step) => {
      console.log(`Step completed: ${step.description}`);
    });
    
    agent.on('test:completed', (result) => {
      console.log(`Test completed: ${result.name}`);
    });
    
    // Run the test
    const result = await agent.runTest(testPlan);
    
    console.log('Test result:', result);
  } catch (error) {
    console.error('Error running test:', error);
  } finally {
    await agent.close();
  }
}

// Example 2: Use agent manager
async function useAgentManager() {
  console.log('Using agent manager...');
  
  const agentManager = createAgentManager({
    maxAgents: 2,
    headless: false,
    closeAgentAfterTest: true
  });
  
  try {
    // Listen for events
    agentManager.on('request:queued', ({ requestId, position }) => {
      console.log(`Request ${requestId} queued at position ${position}`);
    });
    
    agentManager.on('request:processing', ({ requestId }) => {
      console.log(`Request ${requestId} processing`);
    });
    
    agentManager.on('request:completed', ({ requestId, result }) => {
      console.log(`Request ${requestId} completed:`, result.success ? 'Success' : 'Failed');
    });
    
    agentManager.on('request:failed', ({ requestId, error }) => {
      console.log(`Request ${requestId} failed:`, error);
    });
    
    // Submit multiple test requests
    const requestId1 = await agentManager.submitRequest(testPlan, { priority: 1 });
    const requestId2 = await agentManager.submitRequest(testPlan, { priority: 2 });
    
    // Wait for all requests to complete
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    console.log('All requests processed');
  } catch (error) {
    console.error('Error using agent manager:', error);
  } finally {
    await agentManager.close();
  }
}

// Run examples
async function runExamples() {
  await runTestDirectly();
  console.log('\n---\n');
  await useAgentManager();
}

runExamples().catch(console.error);
