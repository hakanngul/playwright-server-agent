/**
 * ApiRequest step strategy
 * Handles API request actions
 */

import { StepStrategy } from './StepStrategy.js';

/**
 * Strategy for executing API request steps
 */
export class ApiRequestStepStrategy extends StepStrategy {
  /**
   * Executes an API request step
   * @param {Object} step - Test step to execute
   * @param {Object} context - Execution context (page, helpers, etc.)
   * @returns {Promise<Object>} Step result
   */
  async execute(step, context) {
    const { page } = context;
    
    console.log(`Sending ${step.method} API request to: ${step.target}`);
    
    try {
      // Playwright'ın API request özelliğini kullan
      const apiResponse = await page.request[step.method.toLowerCase()](step.target, {
        headers: step.headers || {},
        data: step.data || undefined
      });

      // API yanıtını işle
      const responseStatus = apiResponse.status();
      const responseHeaders = await apiResponse.headers();
      let responseBody;
      
      try {
        responseBody = await apiResponse.json();
      } catch (e) {
        responseBody = await apiResponse.text();
      }
      
      // Başarı durumunu kontrol et (2xx durum kodları başarılı)
      const success = responseStatus >= 200 && responseStatus < 300;
      
      console.log(`API request completed with status: ${responseStatus}`);
      
      // Sonuç nesnesini oluştur
      return {
        success,
        message: `API request completed with status: ${responseStatus}`,
        apiResponse: {
          status: responseStatus,
          headers: responseHeaders,
          body: responseBody
        }
      };
    } catch (error) {
      console.error(`API request failed: ${error.message}`);
      throw new Error(`API request failed: ${error.message}`);
    }
  }
}
