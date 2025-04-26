/**
 * Network monitor interface
 * Defines methods for monitoring network activity
 */

/**
 * Interface for network monitoring
 * @interface
 */
export class INetworkMonitor {
  /**
   * Gets network statistics
   * @returns {Object} Network statistics
   */
  getNetworkStats() {
    throw new Error('Method not implemented');
  }
}
