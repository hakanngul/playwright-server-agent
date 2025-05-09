/**
 * Browser factory producer
 * Creates appropriate browser factory based on browser type
 */

import { ChromiumFactory } from './ChromiumFactory.js';
import { FirefoxFactory } from './FirefoxFactory.js';
import { EdgeFactory } from './EdgeFactory.js';
import { WebKitFactory } from './WebKitFactory.js';

/**
 * Produces browser factories based on browser type
 */
export class BrowserFactoryProducer {
  /**
   * Gets the appropriate factory for a browser type
   * @param {string} browserType - Type of browser (chromium, firefox, edge, webkit)
   * @returns {BrowserFactory} Factory for creating the browser
   */
  static getFactory(browserType) {
    switch (browserType) {
      case 'firefox':
        return new FirefoxFactory();
      case 'edge':
        return new EdgeFactory();
      case 'webkit':
        return new WebKitFactory();
      case 'chromium':
      default:
        return new ChromiumFactory();
    }
  }
}
