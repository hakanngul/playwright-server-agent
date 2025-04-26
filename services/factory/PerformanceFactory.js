/**
 * Performance factory
 * Creates performance-related components
 */

import { PerformanceCollector } from '../performance/implementations/PerformanceCollector.js';
import { NetworkMonitor } from '../performance/implementations/NetworkMonitor.js';
import { PerformanceReporter } from '../performance/implementations/PerformanceReporter.js';

export class PerformanceFactory {
  /**
   * Creates a performance collector
   * @param {Object} page - Playwright page object
   * @returns {IPerformanceCollector} Performance collector
   */
  static createPerformanceCollector(page) {
    return new PerformanceCollector(page);
  }

  /**
   * Creates a network monitor
   * @param {Object} page - Playwright page object
   * @returns {INetworkMonitor} Network monitor
   */
  static createNetworkMonitor(page) {
    return new NetworkMonitor(page);
  }

  /**
   * Creates a performance reporter
   * @param {Object} options - Performance reporter options
   * @returns {Object} Performance reporter
   */
  static createPerformanceReporter(options = {}) {
    return new PerformanceReporter(options);
  }
}
