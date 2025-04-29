/**
 * Edge browser factory
 * Creates Edge browser instances
 */

import { chromium } from 'playwright';
import { BrowserFactory } from './BrowserFactory.js';

/**
 * Factory for creating Edge browser instances
 */
export class EdgeFactory extends BrowserFactory {
  /**
   * Creates an Edge browser instance
   * @param {Object} options - Browser options
   * @returns {Promise<Browser>} Edge browser instance
   */
  async createBrowser(options) {
    console.log('Using Microsoft Edge browser');
    // Edge için özel seçenekler (Chromium tabanlı olduğu için chromium kullanıyoruz)

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

    const edgeOptions = {
      headless: headlessMode,
      channel: 'msedge', // Microsoft Edge kanalını kullan
      args: headlessMode ? [] : ['--start-maximized', '--edge-webdriver'],
      ignoreDefaultArgs: ['--enable-automation']
    };

    console.log(`Launching Edge with headless mode: ${headlessMode ? 'true (invisible)' : 'false (visible)'}`);
    console.log(`Launch options: ${JSON.stringify({ ...edgeOptions, headless: headlessMode }, null, 2)}`);

    return await chromium.launch(edgeOptions);
  }

  /**
   * Creates Edge context options
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
        'sec-ch-ua': '"Microsoft Edge";v="120", "Chromium";v="120", "Not-A.Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'none',
        'sec-fetch-user': '?1',
        'upgrade-insecure-requests': '1'
      },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0'
    };

    return contextOptions;
  }
}
