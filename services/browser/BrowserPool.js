/**
 * Browser pool module
 * Manages multiple browser instances for efficient resource usage
 */

import { BrowserManager } from './BrowserManager.js';

/**
 * Browser pool for managing multiple browser instances
 */
export class BrowserPool {
  /**
   * Creates a new BrowserPool instance
   * @param {Object} options - Pool options
   */
  constructor(options = {}) {
    this.maxSize = options.maxSize || 5; // Maximum number of browsers in the pool
    this.minSize = options.minSize || 2; // Minimum number of browsers to keep ready
    this.idleTimeout = options.idleTimeout || 300000; // 5 minutes idle timeout
    this.browserOptions = options.browserOptions || {}; // Options for browser creation

    this.availableBrowsers = []; // Browsers ready for use
    this.activeBrowsers = new Map(); // Browsers currently in use
    this.browserManagers = []; // All browser managers

    this.initialized = false;
    this.maintenanceInterval = null;
  }

  /**
   * Initializes the browser pool
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.initialized) return;

    console.log(`Initializing browser pool with min=${this.minSize}, max=${this.maxSize}`);

    // Create initial browsers
    for (let i = 0; i < this.minSize; i++) {
      await this.createBrowser();
    }

    // Start maintenance interval
    this.maintenanceInterval = setInterval(() => this.performMaintenance(), 60000); // Run every minute

    this.initialized = true;
    console.log(`Browser pool initialized with ${this.availableBrowsers.length} browsers`);
  }

  /**
   * Creates a new browser and adds it to the pool
   * @param {string} browserType - Type of browser to create
   * @returns {Promise<BrowserManager>} Created browser manager
   * @private
   */
  async createBrowser(browserType = 'chromium') {
    const browserManager = new BrowserManager(browserType, this.browserOptions);
    await browserManager.initialize();

    this.availableBrowsers.push(browserManager);
    this.browserManagers.push(browserManager);

    console.log(`Created new ${browserType} browser, pool size: ${this.browserManagers.length}`);
    return browserManager;
  }

  /**
   * Acquires a browser from the pool
   * @param {string} browserType - Type of browser to acquire
   * @param {Object} options - Browser options
   * @returns {Promise<Object>} Object containing browser manager and ID
   */
  async acquireBrowser(browserType = 'chromium', options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    // Check if headless mode is specified and is false (visible browser)
    const isHeadless = options.headless !== undefined ? options.headless : this.browserOptions.headless;

    // For non-headless (visible) browsers, we'll create a new instance each time
    // This is because visible browsers are more likely to be interacted with by users
    // and might have different states
    if (isHeadless === false) {
      console.log(`Creating new visible ${browserType} browser (not using pool for visible browsers)`);
      const browserManager = new BrowserManager(browserType, { ...this.browserOptions, headless: false });
      await browserManager.initialize();

      // Add to browser managers list but not to available browsers
      this.browserManagers.push(browserManager);

      // Mark as active
      const id = Date.now().toString();
      this.activeBrowsers.set(id, {
        browserManager,
        acquiredAt: Date.now(),
        isVisible: true // Mark as visible for special handling when releasing
      });

      console.log(`Created new visible ${browserType} browser, total=${this.browserManagers.length}, active=${this.activeBrowsers.size}`);
      return { browserManager, id };
    }

    // For headless browsers, use the pool as normal
    // Find an available browser of the requested type
    const index = this.availableBrowsers.findIndex(bm => bm.getBrowserType() === browserType);

    let browserManager;
    if (index >= 0) {
      // Use an existing browser
      browserManager = this.availableBrowsers[index];
      this.availableBrowsers.splice(index, 1);
    } else if (this.browserManagers.length < this.maxSize) {
      // Create a new browser if under max size
      browserManager = await this.createBrowser(browserType);
      this.availableBrowsers.pop(); // Remove from available as we're about to use it
    } else {
      // Wait for a browser to become available
      console.log(`No available ${browserType} browsers, waiting...`);
      browserManager = await new Promise(resolve => {
        const checkInterval = setInterval(() => {
          const index = this.availableBrowsers.findIndex(bm => bm.getBrowserType() === browserType);
          if (index >= 0) {
            clearInterval(checkInterval);
            const bm = this.availableBrowsers[index];
            this.availableBrowsers.splice(index, 1);
            resolve(bm);
          }
        }, 1000);
      });
    }

    // Mark browser as active
    const id = Date.now().toString();
    this.activeBrowsers.set(id, {
      browserManager,
      acquiredAt: Date.now()
    });

    console.log(`Acquired ${browserType} browser, available=${this.availableBrowsers.length}, active=${this.activeBrowsers.size}`);
    return { browserManager, id };
  }

  /**
   * Releases a browser back to the pool
   * @param {string} id - Browser ID to release
   * @returns {Promise<boolean>} True if browser was released
   */
  async releaseBrowser(id) {
    if (!this.activeBrowsers.has(id)) {
      console.warn(`Browser with ID ${id} not found in active browsers`);
      return false;
    }

    const { browserManager, isVisible } = this.activeBrowsers.get(id);
    this.activeBrowsers.delete(id);

    // For visible browsers, just close them and don't add back to the pool
    if (isVisible) {
      console.log('Closing visible browser (not returning to pool)');
      try {
        await browserManager.close();

        // Remove from browser managers list
        const bmIndex = this.browserManagers.indexOf(browserManager);
        if (bmIndex >= 0) {
          this.browserManagers.splice(bmIndex, 1);
        }

        return true;
      } catch (error) {
        console.error(`Error closing visible browser: ${error.message}`);
        return false;
      }
    }

    // For headless browsers, clean up the context and return to pool
    try {
      // Create a fresh context
      await browserManager.close();
      await browserManager.initialize();

      // Add back to available browsers
      this.availableBrowsers.push(browserManager);
      console.log(`Released browser back to pool, available=${this.availableBrowsers.length}, active=${this.activeBrowsers.size}`);
      return true;
    } catch (error) {
      console.error(`Error releasing browser: ${error.message}`);

      // Remove from all collections
      const bmIndex = this.browserManagers.indexOf(browserManager);
      if (bmIndex >= 0) {
        this.browserManagers.splice(bmIndex, 1);
      }

      // Try to create a replacement
      if (this.browserManagers.length < this.minSize) {
        this.createBrowser(browserManager.getBrowserType()).catch(e => {
          console.error(`Failed to create replacement browser: ${e.message}`);
        });
      }

      return false;
    }
  }

  /**
   * Performs maintenance on the browser pool
   * @private
   */
  async performMaintenance() {
    try {
      const now = Date.now();

      // Check if we need to create more browsers to meet minimum size
      if (this.browserManagers.length < this.minSize) {
        console.log(`Browser pool below minimum size (${this.browserManagers.length}/${this.minSize}), creating more browsers`);
        const numToCreate = this.minSize - this.browserManagers.length;
        for (let i = 0; i < numToCreate; i++) {
          await this.createBrowser();
        }
      }

      // Check for idle browsers to close if we're above minimum size
      if (this.availableBrowsers.length > this.minSize) {
        // Sort by least recently used
        this.availableBrowsers.sort((a, b) => a.lastUsed - b.lastUsed);

        // Close excess browsers that have been idle for too long
        const excessBrowsers = this.availableBrowsers.slice(this.minSize);
        for (const browser of excessBrowsers) {
          if (browser.lastUsed && (now - browser.lastUsed > this.idleTimeout)) {
            console.log(`Closing idle browser that has been unused for ${(now - browser.lastUsed) / 1000} seconds`);

            // Remove from collections
            const availableIndex = this.availableBrowsers.indexOf(browser);
            if (availableIndex >= 0) {
              this.availableBrowsers.splice(availableIndex, 1);
            }

            const managerIndex = this.browserManagers.indexOf(browser);
            if (managerIndex >= 0) {
              this.browserManagers.splice(managerIndex, 1);
            }

            // Close the browser
            await browser.close().catch(e => {
              console.error(`Error closing idle browser: ${e.message}`);
            });
          }
        }
      }
    } catch (error) {
      console.error(`Error during browser pool maintenance: ${error.message}`);
    }
  }

  /**
   * Closes all browsers in the pool
   * @returns {Promise<void>}
   */
  async close() {
    console.log('Closing browser pool...');

    // Stop maintenance interval
    if (this.maintenanceInterval) {
      clearInterval(this.maintenanceInterval);
      this.maintenanceInterval = null;
    }

    // Close all browser managers
    const closePromises = this.browserManagers.map(bm => bm.close().catch(e => {
      console.error(`Error closing browser: ${e.message}`);
    }));

    await Promise.all(closePromises);

    this.availableBrowsers = [];
    this.activeBrowsers.clear();
    this.browserManagers = [];
    this.initialized = false;

    console.log('Browser pool closed');
  }

  /**
   * Gets pool statistics
   * @returns {Object} Pool statistics
   */
  getStats() {
    return {
      total: this.browserManagers.length,
      available: this.availableBrowsers.length,
      active: this.activeBrowsers.size,
      browserTypes: this.browserManagers.reduce((acc, bm) => {
        const type = bm.getBrowserType();
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {})
    };
  }
}
