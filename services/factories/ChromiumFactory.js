/**
 * Chromium browser factory
 * Creates Chromium browser instances
 */

import { chromium } from 'playwright';
import { BrowserFactory } from './BrowserFactory.js';

/**
 * Factory for creating Chromium browser instances
 */
export class ChromiumFactory extends BrowserFactory {
  /**
   * Creates a Chromium browser instance
   * @param {Object} options - Browser options
   * @returns {Promise<Browser>} Chromium browser instance
   */
  async createBrowser(options) {
    console.log('Using Chromium browser');
    const chromiumOptions = {
      headless: options.headless, // Headless modunu açıkça belirt
      args: options.headless ? [] : ['--start-maximized'],
      ignoreDefaultArgs: ['--enable-automation']
    };
    
    console.log(`Launching Chromium with headless mode: ${options.headless ? 'true (invisible)' : 'false (visible)'}`);
    console.log(`Launch options: ${JSON.stringify(chromiumOptions, null, 2)}`);
    
    return await chromium.launch(chromiumOptions);
  }

  /**
   * Creates Chromium context options
   * @returns {Object} Browser context options
   */
  createContextOptions() {
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
      },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    };

    return contextOptions;
  }
}
