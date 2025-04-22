/**
 * Browser pool manager module
 * Manages multiple browser pools for different browser types
 */

import { BrowserPool } from './BrowserPool.js';
import { EventEmitter } from 'events';

/**
 * Manages multiple browser pools for different browser types
 */
export class BrowserPoolManager extends EventEmitter {
  /**
   * Creates a new BrowserPoolManager instance
   * @param {Object} options - Manager options
   */
  constructor(options = {}) {
    super();

    // Default configuration
    this.defaultPoolOptions = {
      maxSize: options.maxSize || 5,
      minSize: options.minSize || 1,
      idleTimeout: options.idleTimeout || 300000, // 5 minutes
      headless: options.headless !== undefined ? options.headless : true
    };

    // Create pools for different browser types
    this.pools = {
      chromium: new BrowserPool({
        ...this.defaultPoolOptions,
        browserType: 'chromium'
      }),
      firefox: new BrowserPool({
        ...this.defaultPoolOptions,
        browserType: 'firefox',
        maxSize: options.firefoxMaxSize || this.defaultPoolOptions.maxSize
      })
      // Edge için ayrı havuz oluşturmuyoruz, Chromium havuzunu kullanacağız
      // çünkü Edge, Chromium tabanlıdır
    };

    // Forward events from pools
    Object.keys(this.pools).forEach(browserType => {
      const pool = this.pools[browserType];

      pool.on('browserCreated', (data) => {
        this.emit('browserCreated', { ...data, browserType });
      });

      pool.on('browserAcquired', (data) => {
        this.emit('browserAcquired', { ...data, browserType });
      });

      pool.on('browserReleased', (data) => {
        this.emit('browserReleased', { ...data, browserType });
      });

      pool.on('browserClosed', (data) => {
        this.emit('browserClosed', { ...data, browserType });
      });

      pool.on('waitingForBrowser', (data) => {
        this.emit('waitingForBrowser', { ...data, browserType });
      });
    });

    console.log('BrowserPoolManager created');
  }

  /**
   * Initializes all browser pools
   * @returns {Promise<void>}
   */
  async initialize() {
    console.log('Initializing all browser pools...');

    const initPromises = Object.values(this.pools).map(pool => pool.initialize());
    await Promise.all(initPromises);

    // Havuz istatistiklerini göster
    const stats = this.getStats();
    console.log(`Browser pools initialized: ${stats.overall.totalBrowsers} total browsers, ${stats.overall.activeBrowsers} active`);
    Object.keys(stats.pools).forEach(browserType => {
      const poolStats = stats.pools[browserType];
      console.log(`- ${browserType}: ${poolStats.poolSize} browsers (${poolStats.available} available)`);
    });

    this.emit('initialized');
  }

  /**
   * Acquires a browser from the specified pool
   * @param {string} browserType - Type of browser to acquire (chromium, firefox, webkit)
   * @param {Object} options - Browser acquisition options
   * @param {boolean} options.headless - Whether to run browser in headless mode
   * @returns {Promise<Object>} Object containing browser manager and ID
   */
  async acquireBrowser(browserType = 'chromium', options = {}) {
    // Headless modunu kontrol et - eğer belirtilmişse kullan, belirtilmemişse havuzun varsayılan değerini kullan
    const headless = options.headless !== undefined ? options.headless : this.defaultPoolOptions.headless;
    console.log(`Acquiring ${browserType} browser with headless: ${headless}...`);

    // Edge için Chromium havuzunu kullan
    if (browserType === 'edge') {
      console.log('Edge seçildi, Chromium havuzu kullanılıyor');
      browserType = 'chromium';
    }

    if (!this.pools[browserType]) {
      throw new Error(`Unsupported browser type: ${browserType}`);
    }

    return await this.pools[browserType].acquireBrowser({ headless });
  }

  /**
   * Releases a browser back to its pool
   * @param {string} browserId - ID of the browser to release
   * @param {string} browserType - Type of browser to release
   * @returns {Promise<boolean>} True if browser was released
   */
  async releaseBrowser(browserId, browserType = 'chromium') {
    console.log(`Releasing ${browserType} browser ${browserId}...`);

    // Edge için Chromium havuzunu kullan
    if (browserType === 'edge') {
      console.log('Edge seçildi, Chromium havuzu kullanılıyor');
      browserType = 'chromium';
    }

    if (!this.pools[browserType]) {
      throw new Error(`Unsupported browser type: ${browserType}`);
    }

    return await this.pools[browserType].releaseBrowser(browserId);
  }

  /**
   * Closes all browser pools
   * @returns {Promise<void>}
   */
  async close() {
    console.log('Closing all browser pools...');

    const closePromises = Object.values(this.pools).map(pool => pool.close());
    await Promise.all(closePromises);

    console.log('All browser pools closed');
    this.emit('closed');
  }

  /**
   * Gets statistics for all browser pools
   * @returns {Object} Statistics for all pools
   */
  getStats() {
    const stats = {
      overall: {
        totalBrowsers: Object.values(this.pools).reduce((sum, pool) => sum + pool.getTotalCount(), 0),
        activeBrowsers: Object.values(this.pools).reduce((sum, pool) => sum + pool.getActiveCount(), 0),
        waitingRequests: Object.values(this.pools).reduce((sum, pool) => sum + pool.getWaitingCount(), 0)
      },
      pools: {}
    };

    // Add stats for each pool
    Object.keys(this.pools).forEach(browserType => {
      stats.pools[browserType] = this.pools[browserType].getStats();
    });

    // Edge için Chromium havuzunun istatistiklerini kullan
    stats.pools.edge = {
      ...stats.pools.chromium,
      browserType: 'edge',
      note: 'Edge uses Chromium pool'
    };

    return stats;
  }

  /**
   * Warms up all browser pools
   * @returns {Promise<void>}
   */
  async warmup() {
    console.log('Warming up all browser pools...');

    // Make sure pools are initialized first
    if (!this.pools.chromium.initialized) {
      console.log('Initializing pools before warmup...');
      await this.initialize();
    }

    // Warm up each pool by creating browsers up to minSize
    const warmupPromises = Object.values(this.pools).map(pool => pool.warmup());
    await Promise.all(warmupPromises);

    // Log pool statistics after warmup
    const stats = this.getStats();
    console.log(`Browser pools warmed up: ${stats.overall.totalBrowsers} total browsers ready`);
    Object.keys(stats.pools).forEach(browserType => {
      if (browserType !== 'edge') { // Skip edge since it uses chromium pool
        const poolStats = stats.pools[browserType];
        console.log(`- ${browserType}: ${poolStats.poolSize} browsers (${poolStats.available} available)`);
      }
    });

    console.log('All browser pools warmed up and ready for use');
  }

  /**
   * Updates configuration for a specific browser pool
   * @param {string} browserType - Type of browser pool to update
   * @param {Object} options - New pool options
   * @returns {Promise<void>}
   */
  async updatePoolConfig(browserType, options) {
    if (!this.pools[browserType]) {
      throw new Error(`Unsupported browser type: ${browserType}`);
    }

    console.log(`Updating configuration for ${browserType} pool...`);

    // Close the existing pool
    await this.pools[browserType].close();

    // Create a new pool with updated options
    this.pools[browserType] = new BrowserPool({
      ...this.defaultPoolOptions,
      ...options,
      browserType
    });

    // Initialize the new pool
    await this.pools[browserType].initialize();

    console.log(`${browserType} pool configuration updated`);
  }
}
