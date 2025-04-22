/**
 * Browser management module
 * Handles browser initialization, configuration and cleanup
 */

import { chromium, firefox } from 'playwright';
import { applyAntiDetectionMeasures } from './AntiDetection.js';

/**
 * Manages browser instances and configurations
 */
export class BrowserManager {
  /**
   * Creates a new BrowserManager instance
   * @param {string} browserType - Type of browser to use (chromium, firefox, edge)
   * @param {Object} options - Browser configuration options
   */
  constructor(browserType = 'chromium', options = {}) {
    this.browserType = browserType;
    this.headless = options.headless !== undefined ? options.headless : true;
    this.browser = null;
    this.context = null;
    this.page = null;
    this.initialized = false;
    this.lastUsed = Date.now(); // Track when the browser was last used

    console.log(`BrowserManager created with browserType: ${browserType}, headless: ${this.headless}`);
  }

  /**
   * Initializes the browser, context and page
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    console.log(`Initializing browser (type: ${this.browserType})...`);
    try {
      // Launch the browser
      this.browser = await this.launchBrowser();
      console.log('Browser launched successfully');

      // Create browser context
      this.context = await this.createBrowserContext();

      // Create a new page
      this.page = await this.context.newPage();

      // Set timeouts
      this.page.setDefaultTimeout(30000); // 30 seconds timeout for operations

      // Apply anti-detection measures
      await applyAntiDetectionMeasures(this.page, this.browserType);

      this.initialized = true;
      console.log('Browser page initialized with anti-detection measures');
    } catch (error) {
      console.error('Failed to initialize browser:', error);
      throw error;
    }
  }

  /**
   * Launches the appropriate browser based on browserType
   * @returns {Promise<Browser>} Playwright browser instance
   * @private
   */
  async launchBrowser() {
    const launchOptions = this.getLaunchOptions();

    // Headless modunu log'a yaz
    console.log(`Launching browser with headless mode: ${this.headless ? 'true (invisible)' : 'false (visible)'}`);
    console.log(`Launch options: ${JSON.stringify(launchOptions, null, 2)}`);

    switch (this.browserType) {
      case 'firefox':
        console.log('Using Firefox browser');
        // Firefox için özel seçenekler
        const firefoxOptions = {
          headless: this.headless, // Headless modunu açıkça belirt
          args: this.headless ? [] : ['--start-maximized', '--kiosk', '--full-screen'],
          firefoxUserPrefs: {
            // Firefox'un otomasyon belirteçlerini gizle
            'dom.webdriver.enabled': false,
            'privacy.trackingprotection.enabled': false,
            'network.cookie.cookieBehavior': 0,
            'browser.cache.disk.enable': true,
            'browser.cache.memory.enable': true,
            'permissions.default.image': 1,
            // Tam ekran izinlerini ayarla
            'full-screen-api.enabled': true,
            'full-screen-api.allow-trusted-requests-only': false,
            'full-screen-api.warning.timeout': 0,
            // Kullanıcı ajanını ayarla
            'general.useragent.override': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0'
          },
          ignoreDefaultArgs: ['--enable-automation']
        };
        return await firefox.launch(firefoxOptions);

      case 'edge':
        console.log('Using Microsoft Edge browser');
        // Edge için özel seçenekler (Chromium tabanlı olduğu için chromium kullanıyoruz)
        const edgeOptions = {
          headless: this.headless, // Headless modunu açıkça belirt
          channel: 'msedge', // Microsoft Edge kanalını kullan
          args: this.headless ? [] : ['--start-maximized', '--edge-webdriver'],
          ignoreDefaultArgs: ['--enable-automation']
        };
        return await chromium.launch(edgeOptions);

      case 'chromium':
      default:
        console.log('Using Chromium browser');
        const chromiumOptions = {
          headless: this.headless, // Headless modunu açıkça belirt
          args: this.headless ? [] : ['--start-maximized'],
          ignoreDefaultArgs: ['--enable-automation']
        };
        return await chromium.launch(chromiumOptions);
    }
  }

  /**
   * Creates browser context with appropriate options
   * @returns {Promise<BrowserContext>} Playwright browser context
   * @private
   */
  async createBrowserContext() {
    const contextOptions = {
      viewport: null, // Viewport null olarak ayarlanarak tarayıcı penceresinin tam boyutunu kullanmasını sağlıyoruz
      locale: 'en-US',
      geolocation: { longitude: -122.084, latitude: 37.422 }, // Silicon Valley
      permissions: ['geolocation'],
      colorScheme: 'light',
      hasTouch: false,
      isMobile: false,
      javaScriptEnabled: true,
      // Avoid bot detection
      bypassCSP: true,
      ignoreHTTPSErrors: true,
      extraHTTPHeaders: {
        'Accept-Language': 'en-US,en;q=0.9,tr;q=0.8',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'sec-ch-ua': '"Google Chrome";v="120", "Chromium";v="120", "Not-A.Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'none',
        'sec-fetch-user': '?1',
        'upgrade-insecure-requests': '1'
      }
    };

    console.log('Creating browser context with viewport: null (for maximized window)');

    // Set user agent and browser-specific options based on browser type
    if (this.browserType === 'firefox') {
      contextOptions.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0';

      // Firefox için özel ayarlar
      if (!this.headless) {
        // Firefox için tam ekran modunu desteklemek için viewport'u null olarak ayarla
        contextOptions.viewport = null;
        console.log('Firefox viewport set to null for fullscreen support');
      }
    } else if (this.browserType === 'edge') {
      contextOptions.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0';
    } else {
      contextOptions.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    }

    return await this.browser.newContext(contextOptions);
  }

  /**
   * Gets launch options for the browser
   * @returns {Object} Browser launch options
   * @private
   */
  getLaunchOptions() {
    // Bu metod artık kullanılmıyor, doğrudan tarayıcı başlatma seçeneklerini kullanıyoruz
    // Geriye dönük uyumluluk için boş bir nesne döndürüyoruz
    return {};
  }

  /**
   * Closes the browser and cleans up resources
   * @returns {Promise<void>}
   */
  async close() {
    console.log('Closing browser and cleaning up resources...');
    if (this.browser) {
      try {
        // First close the page
        if (this.page) {
          await this.page.close().catch(e => console.error('Error closing page:', e));
          this.page = null;
        }

        // Then close the context
        if (this.context) {
          await this.context.close().catch(e => console.error('Error closing context:', e));
          this.context = null;
        }

        // Finally close the browser
        await this.browser.close().catch(e => console.error('Error closing browser:', e));
        console.log('Browser closed successfully');
      } catch (error) {
        console.error('Error during browser cleanup:', error);
      } finally {
        this.browser = null;
        this.initialized = false;
      }
    }
  }

  /**
   * Gets the current page
   * @returns {Page|null} Playwright page object
   */
  getPage() {
    return this.page;
  }

  /**
   * Gets the browser type
   * @returns {string} Browser type
   */
  getBrowserType() {
    return this.browserType;
  }

  /**
   * Checks if the browser is initialized
   * @returns {boolean} True if initialized
   */
  isInitialized() {
    return this.initialized;
  }

  /**
   * Updates the last used timestamp
   */
  updateLastUsed() {
    this.lastUsed = Date.now();
  }

  /**
   * Gets the last used timestamp
   * @returns {number} Last used timestamp
   */
  getLastUsed() {
    return this.lastUsed;
  }
}
