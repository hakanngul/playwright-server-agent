/**
 * Element helper module
 * Provides utilities for interacting with page elements
 */

/**
 * Helper class for element interactions
 */
export class ElementHelper {
  /**
   * Creates a new ElementHelper instance
   * @param {Page} page - Playwright page object
   */
  constructor(page) {
    this.page = page;
  }

  /**
   * Gets an element by strategy and target
   * @param {string} target - Element target (selector, xpath, etc.)
   * @param {string} strategy - Selection strategy (css, xpath, id, etc.)
   * @returns {Promise<ElementHandle|null>} Element handle or null if not found
   */
  async getElementByStrategy(target, strategy) {
    console.log(`Getting element by strategy: ${strategy}, target: ${target}`);
    try {
      // Playwright uses a unified selector engine, but we'll maintain compatibility
      // with the existing strategy-based approach
      switch (strategy) {
        case 'css':
          return await this.page.$(target);
        case 'xpath':
          console.log(`Looking for element with XPath: ${target}`);
          return await this.page.$(`xpath=${target}`);
        case 'id':
          console.log(`Looking for element with ID: #${target}`);
          return await this.page.$(`#${target}`);
        case 'name':
          return await this.page.$(`[name="${target}"]`);
        case 'class':
          return await this.page.$(`.${target}`);
        case 'text':
          // Playwright's text selector
          return await this.page.$(`text=${target}`);
        case 'role':
          // Playwright's role selector (accessibility)
          return await this.page.$(`role=${target}`);
        default:
          throw new Error(`Unsupported selector strategy: ${strategy}`);
      }
    } catch (error) {
      console.error(`Error in getElementByStrategy: ${error.message}`);
      return null;
    }
  }

  /**
   * Waits for an element to be visible
   * @param {string} target - Element target (selector, xpath, etc.)
   * @param {string} strategy - Selection strategy (css, xpath, id, etc.)
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<boolean>} True if element is visible, false otherwise
   */
  async waitForElementByStrategy(target, strategy, timeout = 10000) {
    console.log(`Waiting for element by strategy: ${strategy}, target: ${target}`);
    try {
      const selector = this.convertToSelector(target, strategy);

      // Wait for the element to be visible
      await this.page.waitForSelector(selector, {
        state: 'visible',
        timeout
      });

      return true;
    } catch (error) {
      console.error(`Error waiting for element: ${error.message}`);
      return false;
    }
  }

  /**
   * Converts strategy and target to a Playwright selector
   * @param {string} target - Element target (selector, xpath, etc.)
   * @param {string} strategy - Selection strategy (css, xpath, id, etc.)
   * @returns {string} Playwright selector
   */
  convertToSelector(target, strategy) {
    switch (strategy) {
      case 'css':
        return target;
      case 'xpath':
        return `xpath=${target}`;
      case 'id':
        return `#${target}`;
      case 'name':
        return `[name="${target}"]`;
      case 'class':
        return `.${target}`;
      case 'text':
        return `text=${target}`;
      case 'role':
        return `role=${target}`;
      default:
        throw new Error(`Unsupported selector strategy: ${strategy}`);
    }
  }

  /**
   * Clicks on an element
   * @param {string} target - Element target (selector, xpath, etc.)
   * @param {string} strategy - Selection strategy (css, xpath, id, etc.)
   * @param {Object} options - Click options
   * @returns {Promise<boolean>} True if click was successful
   */
  async clickElement(target, strategy, options = {}) {
    console.log(`Finding element to click: ${target} using ${strategy}`);

    // Playwright has built-in waiting, but we'll keep our explicit wait for compatibility
    const clickElementVisible = await this.waitForElementByStrategy(target, strategy, 10000);
    if (!clickElementVisible) {
      throw new Error(`Element not visible or not found: ${target} using ${strategy}`);
    }

    const clickSelector = this.convertToSelector(target, strategy);

    // Click with force:true to ensure the click happens even if the element
    // is covered by another element
    await this.page.click(clickSelector, {
      force: options.force || false,
      timeout: options.timeout || 10000,
      delay: options.delay || 100 // Small delay for more human-like interaction
    });

    console.log('Click performed successfully');
    return true;
  }

  /**
   * Types text into an element
   * @param {string} target - Element target (selector, xpath, etc.)
   * @param {string} strategy - Selection strategy (css, xpath, id, etc.)
   * @param {string} text - Text to type
   * @param {Object} options - Type options
   * @returns {Promise<boolean>} True if typing was successful
   */
  async typeText(target, strategy, text, options = {}) {
    console.log(`Finding element to type into: ${target} using ${strategy}`);

    // Wait for element to be visible
    const typeElementVisible = await this.waitForElementByStrategy(target, strategy, 10000);
    if (!typeElementVisible) {
      throw new Error(`Element not visible or not found: ${target} using ${strategy}`);
    }

    const typeSelector = this.convertToSelector(target, strategy);

    // Clear the field first (Playwright doesn't have a direct clear method)
    await this.page.fill(typeSelector, '');

    // Type the text with a delay for more human-like typing
    await this.page.fill(typeSelector, text, { delay: options.delay || 50 });

    console.log(`Typed text: ${text}`);
    return true;
  }

  /**
   * Selects an option from a dropdown
   * @param {string} target - Element target (selector, xpath, etc.)
   * @param {string} strategy - Selection strategy (css, xpath, id, etc.)
   * @param {string} value - Option value to select
   * @returns {Promise<boolean>} True if selection was successful
   */
  async selectOption(target, strategy, value) {
    console.log(`Finding select element: ${target} using ${strategy}`);

    // Wait for element to be visible
    const selectElementVisible = await this.waitForElementByStrategy(target, strategy, 10000);
    if (!selectElementVisible) {
      throw new Error(`Element not visible or not found: ${target} using ${strategy}`);
    }

    const selectSelector = this.convertToSelector(target, strategy);

    // Select the option
    await this.page.selectOption(selectSelector, value);

    console.log(`Selected option: ${value}`);
    return true;
  }
}
