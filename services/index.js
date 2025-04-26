/**
 * Services module
 * Main entry point for all services
 */

// Export factories
export { BrowserFactory } from './factory/BrowserFactory.js';
export { TestFactory } from './factory/TestFactory.js';
export { PerformanceFactory } from './factory/PerformanceFactory.js';
export { AgentFactory } from './factory/AgentFactory.js';

// Export core interfaces
export { IBrowserLauncher } from './core/IBrowserLauncher.js';
export { IBrowserNavigator } from './core/IBrowserNavigator.js';
export { IBrowserCloser } from './core/IBrowserCloser.js';
export { IElementFinder } from './core/IElementFinder.js';
export { IElementInteractor } from './core/IElementInteractor.js';
export { IScreenshotTaker } from './core/IScreenshotTaker.js';
export { ITestExecutor } from './core/ITestExecutor.js';
export { ITestReporter } from './core/ITestReporter.js';
export { IPerformanceCollector } from './core/IPerformanceCollector.js';
export { INetworkMonitor } from './core/INetworkMonitor.js';
export { IAgent } from './core/IAgent.js';
export { IAgentManager } from './core/IAgentManager.js';
export { IQueueSystem } from './core/IQueueSystem.js';
export { ISystemMonitor } from './core/ISystemMonitor.js';

// Export browser implementations
export { BrowserController } from './browser/implementations/BrowserController.js';
export { ElementInteractor } from './browser/implementations/ElementInteractor.js';

// Export agent implementations
export { TestAgent } from './agent/implementations/TestAgent.js';
export { AgentManager } from './agent/implementations/AgentManager.js';
export { QueueSystem } from './agent/implementations/QueueSystem.js';
export { SystemMonitor } from './agent/implementations/SystemMonitor.js';

// Export test implementations
export { TestExecutor } from './test/implementations/TestExecutor.js';
export { TestReporter } from './test/implementations/TestReporter.js';
export { StepExecutor } from './test/implementations/StepExecutor.js';

// Export performance implementations
export { PerformanceCollector } from './performance/implementations/PerformanceCollector.js';
export { NetworkMonitor } from './performance/implementations/NetworkMonitor.js';
export { PerformanceReporter } from './performance/implementations/PerformanceReporter.js';
