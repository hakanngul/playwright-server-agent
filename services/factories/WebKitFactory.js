/**
 * WebKit browser factory
 * Creates WebKit browser instances
 */

import { webkit } from 'playwright';
import { BrowserFactory } from './BrowserFactory.js';

/**
 * Factory for creating WebKit browser instances
 * @implements {BrowserFactory}
 */
export class WebKitFactory extends BrowserFactory {
  /**
   * Creates a new WebKitFactory instance
   */
  constructor() {
    super();
  }

  /**
   * Creates a WebKit browser instance
   * @param {Object} options - Browser options
   * @returns {Promise<Browser>} WebKit browser instance
   */
  async createBrowser(options) {
    console.log('Using WebKit browser');

    // Headless modu yapılandırması
    let headlessMode;
    if (options.headless === false || options.headless === 'false') {
      headlessMode = false;
    } else if (options.headless === true || options.headless === 'true') {
      headlessMode = true;
    } else {
      // Varsayılan olarak true kullan
      headlessMode = true;
    }

    // WebKit için özel seçenekler
    const webkitOptions = {
      headless: headlessMode,
      args: [], // WebKit için tam ekran komutları farklı olabilir
      ignoreDefaultArgs: ['--enable-automation']
    };

    console.log(`Launching WebKit with headless mode: ${headlessMode ? 'true (invisible)' : 'false (visible)'}`);
    console.log(`Launch options: ${JSON.stringify({ ...webkitOptions, headless: headlessMode }, null, 2)}`);

    return await webkit.launch(webkitOptions);
  }

  /**
   * Creates browser context options for WebKit
   * @returns {Object} Browser context options
   */
  createContextOptions() {
    // WebKit için tarayıcı bağlamı seçenekleri
    return {
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: false,
      defaultBrowserType: 'webkit',
      // WebKit için ek seçenekler
      colorScheme: 'light',
      locale: 'en-US',
      permissions: []
    };
  }
}
