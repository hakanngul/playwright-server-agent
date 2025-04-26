/**
 * Performance collector interface
 * Defines methods for collecting performance metrics
 */

/**
 * Interface for performance collection
 * @interface
 */
export class IPerformanceCollector {
  /**
   * Sets up performance observers
   * @returns {Promise<void>}
   */
  async setupPerformanceObservers() {
    throw new Error('Method not implemented');
  }

  /**
   * Captures all performance metrics
   * @param {Object} networkMonitor - Network monitor instance
   * @returns {Promise<Object>} Performance metrics
   */
  async captureAllMetrics(networkMonitor) {
    throw new Error('Method not implemented');
  }
}
