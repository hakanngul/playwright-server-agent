/**
 * Firefox browser factory
 * Creates Firefox browser instances
 */

import { firefox } from 'playwright';
import { BrowserFactory } from './BrowserFactory.js';

/**
 * Factory for creating Firefox browser instances
 */
export class FirefoxFactory extends BrowserFactory {
  /**
   * Creates a Firefox browser instance
   * @param {Object} options - Browser options
   * @returns {Promise<Browser>} Firefox browser instance
   */
  async createBrowser(options) {
    console.log('Using Firefox browser');
    // Firefox için özel seçenekler

    // Yeni Playwright sürümlerinde headless modu için yeni yaklaşım
    let headlessMode;
    if (options.headless === false || options.headless === 'false') {
      headlessMode = false;
    } else {
      headlessMode = true; // Boolean değer olarak true kullan
    }

    const firefoxOptions = {
      headless: headlessMode,
      args: [], // Firefox için tam ekran komutlarını kaldırdık
      firefoxUserPrefs: {
        // Otomasyon algılamasını devre dışı bırakma
        'dom.webdriver.enabled': false,
        'dom.automation.enabled': false,

        // Gizli mod için ayarlar
        'browser.privatebrowsing.autostart': true,

        // CAPTCHA algılamasını azaltmak için izleme koruması ve çerez ayarları
        'privacy.trackingprotection.enabled': false,
        'network.cookie.cookieBehavior': 0,
        'network.cookie.lifetimePolicy': 0,

        // Önbellek ayarları
        'browser.cache.disk.enable': true,
        'browser.cache.memory.enable': true,

        // Medya ve WebRTC ayarları
        'media.navigator.enabled': false,
        'media.peerconnection.enabled': false,

        // Pencere boyutu için varsayılan ayarlar - tam ekran için 0 değerleri kullanılır
        'browser.window.width': 0,
        'browser.window.height': 0,
        'browser.window.screenX': 0,
        'browser.window.screenY': 0,

        // Otomatik doldurma ve form geçmişi
        'signon.autofillForms': false,
        'browser.formfill.enable': false,

        // Gerçekçi kullanıcı ajanı
        'general.useragent.override': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',

        // İndirme ayarları
        'browser.download.folderList': 2,
        'browser.download.manager.showWhenStarting': false,
        'browser.helperApps.alwaysAsk.force': false,

        // Ek performans ayarları
        'gfx.webrender.all': true,
        'layers.acceleration.force-enabled': true,

        // Bildirimleri devre dışı bırakma
        'dom.push.enabled': false,
        'permissions.default.desktop-notification': 2
      },
      ignoreDefaultArgs: ['--enable-automation'],
      firefoxOptions: {
        prefs: {},
        log: {
          level: 'warn'
        }
      }
    };

    console.log(`Launching Firefox with headless mode: ${headlessMode ? 'true (invisible)' : 'false (visible)'}`);
    console.log(`Launch options: ${JSON.stringify({ headless: headlessMode }, null, 2)}`);

    return await firefox.launch(firefoxOptions);
  }

  /**
   * Creates Firefox context options
   * @returns {Object} Browser context options
   */
  createContextOptions() {
    const contextOptions = {
      viewport: null, // Firefox için tam ekran modu için null viewport kullan
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
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'none',
        'sec-fetch-user': '?1',
        'upgrade-insecure-requests': '1'
      },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0'
    };

    return contextOptions;
  }
}
