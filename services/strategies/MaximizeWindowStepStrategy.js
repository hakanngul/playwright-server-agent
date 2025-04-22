/**
 * MaximizeWindow step strategy
 * Handles maximizing browser window
 */

import { StepStrategy } from './StepStrategy.js';

/**
 * Strategy for executing maximize window steps
 */
export class MaximizeWindowStepStrategy extends StepStrategy {
  /**
   * Executes a maximize window step
   * @param {Object} step - Test step to execute
   * @param {Object} context - Execution context (page, helpers, etc.)
   * @returns {Promise<Object>} Step result
   */
  async execute(step, context) {
    const { page } = context;
    
    console.log('Maximizing browser window');
    try {
      // Tarayıcı tipini belirle
      const browserType = page.context().browser()._initializer.name.toLowerCase();
      console.log(`Browser type detected: ${browserType}`);

      // Ekran boyutlarını al
      const { width, height } = await page.evaluate(() => {
        return {
          width: window.screen.availWidth,
          height: window.screen.availHeight
        };
      });

      console.log(`Screen dimensions: ${width}x${height}`);

      // Firefox için özel tam ekran modu
      if (browserType === 'firefox') {
        console.log('Using Firefox-specific fullscreen method');

        // Firefox için önce viewport'u ayarla
        await page.setViewportSize({ width, height });
        console.log(`Firefox viewport size set to ${width}x${height}`);

        // Firefox için tam ekran API'sini kullan
        await page.evaluate(() => {
          // Firefox'ta pencereyi maximize et
          window.moveTo(0, 0);
          window.resizeTo(window.screen.availWidth, window.screen.availHeight);

          // Firefox'ta tam ekran API'sini kullan
          if (document.documentElement.mozRequestFullScreen) {
            document.documentElement.mozRequestFullScreen();
          } else if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
          }
        });
        console.log('Firefox fullscreen API called');

        // Firefox'ta tam ekran modunun uygulanması için daha uzun bir bekleme
        await page.waitForTimeout(1000);
      }
      // Chromium tabanlı tarayıcılar için
      else {
        // Tarayıcı penceresini maximize et
        await page.evaluate(() => {
          window.moveTo(0, 0);
          window.resizeTo(window.screen.availWidth, window.screen.availHeight);
        });
        console.log('Browser window maximized using JavaScript');

        // Tam ekran API'sini kullan
        await page.evaluate(() => {
          if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
          } else if (document.documentElement.webkitRequestFullscreen) {
            document.documentElement.webkitRequestFullscreen();
          } else if (document.documentElement.msRequestFullscreen) {
            document.documentElement.msRequestFullscreen();
          }
        });
        console.log('Used requestFullscreen API for Chromium');
      }
    } catch (error) {
      console.error(`Error maximizing window: ${error.message}`);
      throw error;
    }
    
    return { success: true };
  }
}
