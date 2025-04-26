/**
 * System monitor interface
 * Defines methods for monitoring system resources
 */

/**
 * Interface for system monitoring
 * @interface
 */
export class ISystemMonitor {
  /**
   * Gets system metrics
   * @returns {Object} System metrics
   */
  getMetrics() {
    throw new Error('Method not implemented');
  }
}
