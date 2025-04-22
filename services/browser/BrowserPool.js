/**
 * Browser pool module
 * Manages a pool of browser instances for efficient resource usage and parallel testing
 */

import { BrowserManager } from './BrowserManager.js';
import { EventEmitter } from 'events';

/**
 * Browser pool for managing multiple browser instances
 */
export class BrowserPool extends EventEmitter {
  /**
   * Creates a new BrowserPool instance
   * @param {Object} options - Pool options
   */
  constructor(options = {}) {
    super();

    // Pool configuration
    this.maxSize = options.maxSize || 5;
    this.minSize = options.minSize || 1;
    this.idleTimeout = options.idleTimeout || 300000; // 5 minutes
    this.browserType = options.browserType || 'chromium';
    this.headless = options.headless !== undefined ? options.headless : true;

    // Pool state
    this.browsers = [];
    this.waitingQueue = [];
    this.initialized = false;
    this.maintenanceInterval = null;

    console.log(`BrowserPool created with maxSize: ${this.maxSize}, browserType: ${this.browserType}, headless: ${this.headless}`);
  }

  /**
   * Initializes the browser pool
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    console.log('Initializing browser pool...');

    // Create initial browsers
    await this.ensureMinimumBrowsers();

    // Start maintenance interval
    this.maintenanceInterval = setInterval(() => this.performMaintenance(), 30000); // Her 30 saniyede bir

    this.initialized = true;
    console.log(`Browser pool initialized with ${this.browsers.length} browsers`);

    this.emit('initialized', { poolSize: this.browsers.length });
  }

  /**
   * Ensures the minimum number of browsers are available
   * @private
   */
  async ensureMinimumBrowsers() {
    const availableBrowsers = this.browsers.filter(b => !b.inUse).length;
    const browsersToCreate = Math.max(0, this.minSize - availableBrowsers);

    if (browsersToCreate > 0) {
      console.log(`Creating ${browsersToCreate} browsers to maintain minimum pool size`);

      const promises = [];
      for (let i = 0; i < browsersToCreate; i++) {
        promises.push(this.createBrowser());
      }

      await Promise.all(promises);
    }
  }

  /**
   * Creates a new browser and adds it to the pool
   * @param {Object} options - Browser creation options
   * @param {boolean} options.headless - Whether to run browser in headless mode
   * @returns {Promise<Object>} Browser object
   * @private
   */
  async createBrowser(options = {}) {
    try {
      // Headless modunu kontrol et - eğer belirtilmişse kullan, belirtilmemişse havuzun varsayılan değerini kullan
      const headless = options.headless !== undefined ? options.headless : this.headless;
      console.log(`Creating new ${this.browserType} browser instance with headless: ${headless}...`);

      const browserManager = new BrowserManager(this.browserType, {
        headless: headless
      });

      await browserManager.initialize();

      const browser = {
        id: `browser-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        manager: browserManager,
        inUse: false,
        createdAt: Date.now(),
        lastUsed: Date.now()
      };

      this.browsers.push(browser);
      console.log(`Browser ${browser.id} created and added to pool with headless: ${headless}`);

      this.emit('browserCreated', { browserId: browser.id });

      return browser;
    } catch (error) {
      console.error('Error creating browser:', error);
      throw error;
    }
  }

  /**
   * Acquires a browser from the pool
   * @param {Object} options - Browser acquisition options
   * @param {boolean} options.headless - Whether to run browser in headless mode
   * @returns {Promise<Object>} Object containing browser manager and ID
   */
  async acquireBrowser(options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    // Headless modunu kontrol et - eğer belirtilmişse kullan, belirtilmemişse havuzun varsayılan değerini kullan
    const headless = options.headless !== undefined ? options.headless : this.headless;
    console.log(`Acquiring browser from pool with headless: ${headless}...`);

    // Check for available browser
    const availableBrowser = this.browsers.find(b => !b.inUse);

    if (availableBrowser) {
      availableBrowser.inUse = true;
      availableBrowser.lastUsed = Date.now();

      console.log(`Browser ${availableBrowser.id} acquired from pool (reusing existing browser)`);
      this.emit('browserAcquired', { browserId: availableBrowser.id });

      // Tarayıcı zaten başlatılmış, ancak headless modu farklı olabilir
      if (availableBrowser.manager && availableBrowser.manager.isInitialized()) {
        console.log(`Browser ${availableBrowser.id} is already initialized with headless: ${availableBrowser.manager.headless}`);

        // Headless modu farklıysa, tarayıcıyı yeniden başlat
        if (availableBrowser.manager.headless !== headless) {
          console.log(`Headless mode mismatch (current: ${availableBrowser.manager.headless}, requested: ${headless}), reinitializing browser...`);

          // Mevcut tarayıcıyı kapat
          try {
            await availableBrowser.manager.close();
            console.log(`Closed browser ${availableBrowser.id} due to headless mode change`);
          } catch (e) {
            console.warn(`Error closing browser: ${e.message}`);
          }

          // Yeni headless modu ile tarayıcıyı yeniden başlat
          availableBrowser.manager.headless = headless;
          await availableBrowser.manager.initialize();
          console.log(`Reinitialized browser ${availableBrowser.id} with headless: ${headless}`);

          return {
            id: availableBrowser.id,
            manager: availableBrowser.manager
          };
        }

        // Tarayıcı sayfasının durumunu kontrol et ve gerekirse yenile
        if (availableBrowser.manager.page) {
          try {
            // Sayfa durumunu kontrol et
            const url = await availableBrowser.manager.page.url().catch(() => null);
            console.log(`Current page URL: ${url || 'unknown'}`);

            // Sayfa yanıt vermiyorsa veya hata varsa, yeni bir sayfa oluştur
            if (!url) {
              console.log(`Page for browser ${availableBrowser.id} is not responsive, creating a new page`);
              try {
                await availableBrowser.manager.page.close().catch(e => console.warn(`Error closing page: ${e.message}`));
              } catch (e) {
                console.warn(`Error closing page: ${e.message}`);
              }

              availableBrowser.manager.page = await availableBrowser.manager.context.newPage();
              console.log(`Created new page for browser ${availableBrowser.id}`);
            }
          } catch (error) {
            console.warn(`Error checking page state: ${error.message}`);
            // Hata durumunda yeni bir sayfa oluşturmaya çalış
            try {
              availableBrowser.manager.page = await availableBrowser.manager.context.newPage();
              console.log(`Created new page for browser ${availableBrowser.id} after error`);
            } catch (e) {
              console.error(`Failed to create new page: ${e.message}`);
            }
          }
        } else {
          // Sayfa yoksa yeni bir sayfa oluştur
          try {
            availableBrowser.manager.page = await availableBrowser.manager.context.newPage();
            console.log(`Created new page for browser ${availableBrowser.id} (no page existed)`);
          } catch (e) {
            console.error(`Failed to create new page: ${e.message}`);
          }
        }
      } else {
        console.warn(`Browser ${availableBrowser.id} is not initialized, initializing with headless: ${headless}`);
        // Tarayıcı başlatılmamışsa, headless modunu ayarla ve başlat
        availableBrowser.manager.headless = headless;
        try {
          await availableBrowser.manager.initialize();
          console.log(`Browser ${availableBrowser.id} initialized successfully with headless: ${headless}`);
        } catch (error) {
          console.error(`Failed to initialize browser ${availableBrowser.id}: ${error.message}`);
          // Başlatma başarısız olursa, bu tarayıcıyı havuzdan çıkar ve yeni bir tane oluştur
          this.browsers = this.browsers.filter(b => b.id !== availableBrowser.id);
          return this.acquireBrowser({ headless }); // Yeniden dene
        }
      }

      return {
        id: availableBrowser.id,
        manager: availableBrowser.manager
      };
    }

    // Create new browser if pool is not at max capacity
    if (this.browsers.length < this.maxSize) {
      // Yeni tarayıcı oluştururken headless modunu belirt
      const newBrowser = await this.createBrowser({ headless });
      newBrowser.inUse = true;

      console.log(`New browser ${newBrowser.id} created and acquired with headless: ${headless} (pool size: ${this.browsers.length}/${this.maxSize})`);
      this.emit('browserAcquired', { browserId: newBrowser.id });

      return {
        id: newBrowser.id,
        manager: newBrowser.manager
      };
    }

    // Wait for a browser to become available
    console.log('All browsers in use, waiting for one to become available...');

    return new Promise((resolve, reject) => {
      const waiter = {
        headless, // Bekleme sırasına headless modunu da ekle
        resolve: async (browser) => {
          console.log(`Browser ${browser.id} became available and was acquired`);

          // Headless modu farklıysa, tarayıcıyı yeniden başlat
          if (browser.manager.headless !== headless) {
            console.log(`Headless mode mismatch (current: ${browser.manager.headless}, requested: ${headless}), reinitializing browser...`);

            try {
              await browser.manager.close();
              browser.manager.headless = headless;
              await browser.manager.initialize();
              console.log(`Reinitialized browser ${browser.id} with headless: ${headless}`);
            } catch (error) {
              console.error(`Error reinitializing browser: ${error.message}`);
              // Hata durumunda yeni bir tarayıcı oluştur
              this.browsers = this.browsers.filter(b => b.id !== browser.id);
              const newBrowser = await this.createBrowser({ headless });
              newBrowser.inUse = true;
              browser = newBrowser;
            }
          }

          this.emit('browserAcquired', { browserId: browser.id });

          resolve({
            id: browser.id,
            manager: browser.manager
          });
        },
        reject: (error) => {
          console.error(`Error acquiring browser: ${error.message}`);
          reject(error);
        }
      };

      this.waitingQueue.push(waiter);
      this.emit('waitingForBrowser', { queueLength: this.waitingQueue.length });
    });
  }

  /**
   * Releases a browser back to the pool
   * @param {string} browserId - ID of the browser to release
   * @returns {Promise<boolean>} True if browser was released
   */
  async releaseBrowser(browserId) {
    console.log(`Releasing browser ${browserId} back to pool...`);

    const browser = this.browsers.find(b => b.id === browserId);

    if (!browser) {
      console.warn(`Browser ${browserId} not found in pool`);
      return false;
    }

    // Tarayıcının durumunu kontrol et
    if (browser.manager && browser.manager.browser) {
      try {
        // Tarayıcı hala açık mı kontrol et
        const contexts = browser.manager.browser.contexts();
        console.log(`Browser ${browserId} has ${contexts.length} open contexts`);

        // Mevcut sayfayı kapat ve yeni bir sayfa aç
        if (browser.manager.page) {
          try {
            // Sayfayı temizle - önce URL'yi about:blank'e yönlendir
            await browser.manager.page.goto('about:blank').catch(e => console.warn(`Error navigating to blank page: ${e.message}`));

            // Sonra sayfayı kapat
            await browser.manager.page.close().catch(e => console.warn(`Error closing page: ${e.message}`));
          } catch (e) {
            console.warn(`Error closing page: ${e.message}`);
          }

          // Yeni bir sayfa aç
          try {
            browser.manager.page = await browser.manager.context.newPage();
            console.log(`Created new page for browser ${browserId}`);
            // Sayfa oluşturulduktan sonra tarayıcı yöneticisinin initialized durumunu güncelle
            browser.manager.initialized = true;
          } catch (e) {
            console.warn(`Error creating new page: ${e.message}`);
          }
        }
      } catch (error) {
        console.warn(`Error checking browser state: ${error.message}`);

        // Hata durumunda tarayıcıyı yeniden başlatmayı dene
        try {
          console.log(`Attempting to reinitialize browser ${browserId} after error...`);
          await browser.manager.close();
          await browser.manager.initialize();
          console.log(`Successfully reinitialized browser ${browserId}`);
        } catch (reinitError) {
          console.error(`Failed to reinitialize browser ${browserId}: ${reinitError.message}`);
        }
      }
    }

    browser.inUse = false;
    browser.lastUsed = Date.now();

    // Check if there are waiting requests
    if (this.waitingQueue.length > 0) {
      const waiter = this.waitingQueue.shift();
      browser.inUse = true;

      // Bekleme sırasındaki istekte headless modu belirtilmiş mi kontrol et
      const requestedHeadless = waiter.headless !== undefined ? waiter.headless : this.headless;

      // Headless modu farklıysa, tarayıcıyı yeniden başlat
      if (browser.manager.headless !== requestedHeadless) {
        console.log(`Headless mode mismatch for waiting request (current: ${browser.manager.headless}, requested: ${requestedHeadless}), reinitializing browser...`);

        try {
          await browser.manager.close();
          browser.manager.headless = requestedHeadless;
          await browser.manager.initialize();
          console.log(`Reinitialized browser ${browserId} with headless: ${requestedHeadless}`);
        } catch (error) {
          console.error(`Error reinitializing browser for waiting request: ${error.message}`);
          // Hata durumunda yeni bir tarayıcı oluştur
          this.browsers = this.browsers.filter(b => b.id !== browser.id);
          const newBrowser = await this.createBrowser({ headless: requestedHeadless });
          newBrowser.inUse = true;
          browser = newBrowser;
        }
      }

      console.log(`Browser ${browserId} immediately reassigned to a waiting request with headless: ${requestedHeadless}`);
      waiter.resolve(browser);
    } else {
      console.log(`Browser ${browserId} released back to pool (available: ${this.browsers.filter(b => !b.inUse).length}/${this.browsers.length})`);
      this.emit('browserReleased', { browserId });
    }

    return true;
  }

  /**
   * Performs maintenance on the browser pool
   * @private
   */
  async performMaintenance() {
    console.log('Performing browser pool maintenance...');

    // Close idle browsers if we have more than the minimum
    const now = Date.now();
    const idleBrowsers = this.browsers.filter(b => !b.inUse);

    if (idleBrowsers.length > this.minSize) {
      // Sort by last used time (oldest first)
      idleBrowsers.sort((a, b) => a.lastUsed - b.lastUsed);

      // Close browsers that have been idle for too long, but keep at least minSize browsers
      const browsersToClose = idleBrowsers.slice(0, idleBrowsers.length - this.minSize);

      for (const browser of browsersToClose) {
        // Daha agresif kapatma - idleTimeout'tan bağımsız olarak fazla tarayıcıları kapat
        const idleTime = now - browser.lastUsed;
        console.log(`Closing idle browser ${browser.id} (idle for ${idleTime / 1000}s)`);

        try {
          await browser.manager.close();
          this.browsers = this.browsers.filter(b => b.id !== browser.id);
          this.emit('browserClosed', { browserId: browser.id, reason: 'idle' });
        } catch (error) {
          console.error(`Error closing browser ${browser.id}:`, error);
        }
      }
    }

    // Ayrıca, idleTimeout'u geçen tüm tarayıcıları kapat (minSize'dan bağımsız olarak)
    const remainingIdleBrowsers = this.browsers.filter(b => !b.inUse);
    if (remainingIdleBrowsers.length > this.minSize) {
      for (const browser of remainingIdleBrowsers) {
        const idleTime = now - browser.lastUsed;
        if (idleTime > this.idleTimeout) {
          console.log(`Closing timeout exceeded browser ${browser.id} (idle for ${idleTime / 1000}s)`);

          try {
            await browser.manager.close();
            this.browsers = this.browsers.filter(b => b.id !== browser.id);
            this.emit('browserClosed', { browserId: browser.id, reason: 'timeout' });
          } catch (error) {
            console.error(`Error closing browser ${browser.id}:`, error);
          }
        }
      }
    }

    // Ensure we have the minimum number of browsers
    await this.ensureMinimumBrowsers();

    console.log(`Maintenance complete. Pool size: ${this.browsers.length}, Available: ${this.browsers.filter(b => !b.inUse).length}`);
  }

  /**
   * Closes all browsers in the pool
   * @returns {Promise<void>}
   */
  async close() {
    console.log('Closing all browsers in the pool...');

    // Clear maintenance interval
    if (this.maintenanceInterval) {
      clearInterval(this.maintenanceInterval);
      this.maintenanceInterval = null;
    }

    // Close all browsers
    const closePromises = this.browsers.map(async (browser) => {
      try {
        await browser.manager.close();
        this.emit('browserClosed', { browserId: browser.id, reason: 'pool_closing' });
      } catch (error) {
        console.error(`Error closing browser ${browser.id}:`, error);
      }
    });

    await Promise.all(closePromises);

    // Clear arrays
    this.browsers = [];

    // Reject any waiting requests
    for (const waiter of this.waitingQueue) {
      if (waiter.reject) {
        waiter.reject(new Error('Browser pool is closing'));
      }
    }
    this.waitingQueue = [];

    this.initialized = false;
    console.log('Browser pool closed');

    this.emit('closed');
  }

  /**
   * Gets pool statistics
   * @returns {Object} Pool statistics
   */
  getStats() {
    const stats = {
      enabled: true,
      poolSize: this.browsers.length,
      maxSize: this.maxSize,
      minSize: this.minSize,
      available: this.browsers.filter(b => !b.inUse).length,
      inUse: this.browsers.filter(b => b.inUse).length,
      waitingRequests: this.waitingQueue.length,
      browserType: this.browserType,
      headless: this.headless,
      browsers: this.browsers.map(b => ({
        id: b.id,
        inUse: b.inUse,
        createdAt: b.createdAt,
        lastUsed: b.lastUsed,
        idleTime: b.inUse ? 0 : (Date.now() - b.lastUsed)
      }))
    };

    return stats;
  }

  /**
   * Gets the number of active browsers
   * @returns {number} Number of active browsers
   */
  getActiveCount() {
    return this.browsers.filter(b => b.inUse).length;
  }

  /**
   * Gets the total number of browsers in the pool
   * @returns {number} Total number of browsers
   */
  getTotalCount() {
    return this.browsers.length;
  }

  /**
   * Gets the number of waiting requests
   * @returns {number} Number of waiting requests
   */
  getWaitingCount() {
    return this.waitingQueue.length;
  }

  /**
   * Gets the utilization percentage of the pool
   * @returns {number} Utilization percentage (0-100)
   */
  getUtilizationPercentage() {
    if (this.browsers.length === 0) return 0;
    return (this.browsers.filter(b => b.inUse).length / this.browsers.length) * 100;
  }

  /**
   * Warms up the pool by creating the minimum number of browsers
   * @returns {Promise<void>}
   */
  async warmup() {
    console.log(`Warming up ${this.browserType} browser pool...`);

    if (!this.initialized) {
      console.log(`Initializing ${this.browserType} pool first...`);
      await this.initialize();
    } else {
      console.log(`Ensuring minimum browsers for ${this.browserType} pool...`);
      await this.ensureMinimumBrowsers();
    }

    // Verify all browsers are properly initialized
    for (const browser of this.browsers) {
      if (!browser.manager.isInitialized()) {
        console.log(`Reinitializing browser ${browser.id} in ${this.browserType} pool...`);
        try {
          await browser.manager.initialize();
        } catch (error) {
          console.error(`Failed to initialize browser ${browser.id}: ${error.message}`);
        }
      }
    }

    console.log(`${this.browserType} browser pool warmed up with ${this.browsers.length} browsers`);
  }
}
