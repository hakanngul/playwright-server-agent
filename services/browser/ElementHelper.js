/**
 * Element helper module
 * Provides utilities for interacting with page elements
 */

import { ElementError, TimeoutError } from '../errors/index.js';
import { retry } from '../utils/RetryHelper.js';

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
    this.defaultTimeout = 10000; // 10 seconds default timeout

    // Define common role values for role-based selectors
    this.roles = {
      BUTTON: 'button',
      CHECKBOX: 'checkbox',
      COMBOBOX: 'combobox',
      DIALOG: 'dialog',
      LINK: 'link',
      LISTBOX: 'listbox',
      MENU: 'menu',
      MENUITEM: 'menuitem',
      OPTION: 'option',
      RADIO: 'radio',
      SLIDER: 'slider',
      SWITCH: 'switch',
      TAB: 'tab',
      TABPANEL: 'tabpanel',
      TEXTBOX: 'textbox',
      TREE: 'tree',
      TREEITEM: 'treeitem'
    };
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
        case 'testid':
          // Playwright's test ID selector
          return await this.page.$(`[data-testid="${target}"]`);
        default:
          throw new Error(`Unsupported selector strategy: ${strategy}`);
      }
    } catch (error) {
      console.error(`Error in getElementByStrategy: ${error.message}`);
      return null;
    }
  }

  /**
   * Gets an element by role (accessibility API)
   * @param {string} role - ARIA role
   * @param {Object} options - Options for role selection
   * @returns {Promise<ElementHandle|null>} Element handle or null if not found
   */
  async getElementByRole(role, options = {}) {
    console.log(`Getting element by role: ${role}`);
    try {
      // Use Playwright's getByRole locator
      const locator = this.page.getByRole(role, options);
      return await locator.elementHandle();
    } catch (error) {
      console.error(`Error in getElementByRole: ${error.message}`);
      return null;
    }
  }

  /**
   * Gets an element by test ID
   * @param {string} testId - Test ID value
   * @returns {Promise<ElementHandle|null>} Element handle or null if not found
   */
  async getElementByTestId(testId) {
    console.log(`Getting element by test ID: ${testId}`);
    try {
      // Use Playwright's getByTestId locator
      const locator = this.page.getByTestId(testId);
      return await locator.elementHandle();
    } catch (error) {
      console.error(`Error in getElementByTestId: ${error.message}`);
      return null;
    }
  }

  /**
   * Gets an element by text content
   * @param {string} text - Text content to search for
   * @param {Object} options - Options for text matching
   * @returns {Promise<ElementHandle|null>} Element handle or null if not found
   */
  async getElementByText(text, options = {}) {
    console.log(`Getting element by text: ${text}`);
    try {
      // Use Playwright's getByText locator
      const locator = this.page.getByText(text, options);
      return await locator.elementHandle();
    } catch (error) {
      console.error(`Error in getElementByText: ${error.message}`);
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
      case 'testid':
        return `[data-testid="${target}"]`;
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

    const retryOptions = {
      maxRetries: 3,
      initialDelay: 500,
      factor: 1.5,
      onRetry: ({ attempt, error, willRetry }) => {
        console.log(`Retry ${attempt} clicking element: ${target} (${willRetry ? 'will retry' : 'giving up'})`);
        console.error(`Error: ${error.message}`);
      }
    };

    try {
      await retry(async () => {
        try {
          // Playwright has built-in waiting, but we'll keep our explicit wait for compatibility
          const clickElementVisible = await this.waitForElementByStrategy(target, strategy, options.timeout || 10000);
          if (!clickElementVisible) {
            throw new ElementError(
              `Element not visible or not found: ${target}`,
              target,
              'click',
              true
            );
          }

          const clickSelector = this.convertToSelector(target, strategy);

          // Click with appropriate options
          await this.page.click(clickSelector, {
            force: options.force || false,
            timeout: options.timeout || 10000,
            delay: options.delay || 100 // Small delay for more human-like interaction
          });

          console.log('Click performed successfully');
          return true;
        } catch (error) {
          // Convert Playwright errors to our custom errors
          if (error.name === 'TimeoutError') {
            throw new TimeoutError(
              `Timeout waiting for element: ${target}`,
              'clickElement',
              options.timeout || 10000
            );
          }

          // If it's already our custom error, just rethrow it
          if (error instanceof ElementError || error instanceof TimeoutError) {
            throw error;
          }

          // Otherwise, wrap it in our custom error
          throw new ElementError(
            `Failed to click element: ${error.message}`,
            target,
            'click',
            true
          );
        }
      }, retryOptions);

      return true;
    } catch (error) {
      console.error(`Error clicking element after retries: ${error.message}`);
      return false;
    }
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

  /**
   * Hovers over an element
   * @param {string} target - Element target (selector, xpath, etc.)
   * @param {string} strategy - Selection strategy (css, xpath, id, etc.)
   * @param {Object} options - Hover options
   * @returns {Promise<boolean>} True if hover was successful
   */
  async hoverElement(target, strategy, options = {}) {
    console.log(`Finding element to hover: ${target} using ${strategy}`);

    // Wait for element to be visible
    const hoverElementVisible = await this.waitForElementByStrategy(target, strategy, options.timeout || this.defaultTimeout);
    if (!hoverElementVisible) {
      throw new Error(`Element not visible or not found: ${target} using ${strategy}`);
    }

    const hoverSelector = this.convertToSelector(target, strategy);

    // Hover over the element
    await this.page.hover(hoverSelector, {
      position: options.position,
      timeout: options.timeout || this.defaultTimeout
    });

    console.log('Hover performed successfully');
    return true;
  }

  /**
   * Hovers over an element and interacts with a menu item that appears
   * @param {string} menuTriggerTarget - Menu trigger element target
   * @param {string} menuTriggerStrategy - Menu trigger element strategy
   * @param {string} menuItemTarget - Menu item element target
   * @param {string} menuItemStrategy - Menu item element strategy
   * @param {Object} options - Hover menu options
   * @returns {Promise<boolean>} True if hover menu interaction was successful
   */
  async hoverAndClickMenuItem(menuTriggerTarget, menuTriggerStrategy, menuItemTarget, menuItemStrategy, options = {}) {
    console.log(`Hovering over ${menuTriggerTarget} and clicking menu item ${menuItemTarget}`);

    try {
      // First hover over the menu trigger element
      await this.hoverElement(menuTriggerTarget, menuTriggerStrategy, {
        timeout: options.timeout || this.defaultTimeout,
        position: options.triggerPosition
      });

      // Wait for the menu to appear
      const waitTime = options.menuAppearDelay || 500;
      console.log(`Waiting ${waitTime}ms for menu to appear`);
      await this.page.waitForTimeout(waitTime);

      // Wait for the menu item to be visible
      const menuItemSelector = this.convertToSelector(menuItemTarget, menuItemStrategy);
      await this.page.waitForSelector(menuItemSelector, {
        state: 'visible',
        timeout: options.timeout || this.defaultTimeout
      });

      // Click on the menu item
      await this.page.click(menuItemSelector, {
        force: options.force || false,
        timeout: options.timeout || this.defaultTimeout,
        delay: options.delay || 100
      });

      console.log('Hover menu interaction performed successfully');
      return true;
    } catch (error) {
      console.error(`Error in hover menu interaction: ${error.message}`);

      // Convert Playwright errors to our custom errors
      if (error.name === 'TimeoutError') {
        throw new TimeoutError(
          `Timeout during hover menu interaction`,
          'hoverAndClickMenuItem',
          options.timeout || this.defaultTimeout
        );
      }

      // If it's already our custom error, just rethrow it
      if (error instanceof ElementError || error instanceof TimeoutError) {
        throw error;
      }

      // Otherwise, wrap it in our custom error
      throw new ElementError(
        `Failed to perform hover menu interaction: ${error.message}`,
        `${menuTriggerTarget} -> ${menuItemTarget}`,
        'hoverAndClickMenuItem',
        true
      );
    }
  }

  /**
   * Performs a hover and wait operation to check for tooltips or other hover effects
   * @param {string} target - Element target (selector, xpath, etc.)
   * @param {string} strategy - Selection strategy (css, xpath, id, etc.)
   * @param {string} tooltipTarget - Tooltip element target (optional)
   * @param {string} tooltipStrategy - Tooltip element strategy (optional)
   * @param {Object} options - Hover options
   * @returns {Promise<boolean|string>} True if hover was successful, or tooltip text if requested
   */
  async hoverAndVerifyTooltip(target, strategy, tooltipTarget = null, tooltipStrategy = null, options = {}) {
    console.log(`Hovering over ${target} to verify tooltip`);

    try {
      // First hover over the element
      await this.hoverElement(target, strategy, {
        timeout: options.timeout || this.defaultTimeout,
        position: options.position
      });

      // Wait for the tooltip to appear
      const waitTime = options.tooltipAppearDelay || 500;
      console.log(`Waiting ${waitTime}ms for tooltip to appear`);
      await this.page.waitForTimeout(waitTime);

      // If tooltip selector is provided, verify it
      if (tooltipTarget && tooltipStrategy) {
        const tooltipSelector = this.convertToSelector(tooltipTarget, tooltipStrategy);

        // Wait for the tooltip to be visible
        await this.page.waitForSelector(tooltipSelector, {
          state: 'visible',
          timeout: options.timeout || this.defaultTimeout
        });

        // Get tooltip text if requested
        if (options.getTooltipText) {
          const tooltipText = await this.page.$eval(tooltipSelector, el => el.textContent.trim());
          console.log(`Tooltip text: "${tooltipText}"`);
          return tooltipText;
        }
      }

      console.log('Tooltip verification successful');
      return true;
    } catch (error) {
      console.error(`Error in tooltip verification: ${error.message}`);

      // Convert Playwright errors to our custom errors
      if (error.name === 'TimeoutError') {
        throw new TimeoutError(
          `Timeout during tooltip verification`,
          'hoverAndVerifyTooltip',
          options.timeout || this.defaultTimeout
        );
      }

      // If it's already our custom error, just rethrow it
      if (error instanceof ElementError || error instanceof TimeoutError) {
        throw error;
      }

      // Otherwise, wrap it in our custom error
      throw new ElementError(
        `Failed to verify tooltip: ${error.message}`,
        target,
        'hoverAndVerifyTooltip',
        true
      );
    }
  }

  /**
   * Double-clicks on an element
   * @param {string} target - Element target (selector, xpath, etc.)
   * @param {string} strategy - Selection strategy (css, xpath, id, etc.)
   * @param {Object} options - Double-click options
   * @returns {Promise<boolean>} True if double-click was successful
   */
  async doubleClickElement(target, strategy, options = {}) {
    console.log(`Finding element to double-click: ${target} using ${strategy}`);

    // Wait for element to be visible
    const dblClickElementVisible = await this.waitForElementByStrategy(target, strategy, options.timeout || this.defaultTimeout);
    if (!dblClickElementVisible) {
      throw new Error(`Element not visible or not found: ${target} using ${strategy}`);
    }

    const dblClickSelector = this.convertToSelector(target, strategy);

    // Double-click on the element
    await this.page.dblclick(dblClickSelector, {
      button: options.button || 'left',
      delay: options.delay || 100,
      timeout: options.timeout || this.defaultTimeout
    });

    console.log('Double-click performed successfully');
    return true;
  }

  /**
   * Performs drag and drop operation
   * @param {string} sourceTarget - Source element target
   * @param {string} sourceStrategy - Source element strategy
   * @param {string} targetTarget - Target element target
   * @param {string} targetStrategy - Target element strategy
   * @param {Object} options - Drag and drop options
   * @returns {Promise<boolean>} True if drag and drop was successful
   */
  async dragAndDrop(sourceTarget, sourceStrategy, targetTarget, targetStrategy, options = {}) {
    console.log(`Performing drag and drop from ${sourceTarget} to ${targetTarget}`);

    try {
      // Wait for source element to be visible
      const sourceVisible = await this.waitForElementByStrategy(sourceTarget, sourceStrategy, options.timeout || this.defaultTimeout);
      if (!sourceVisible) {
        throw new ElementError(
          `Source element not visible or not found: ${sourceTarget}`,
          sourceTarget,
          'dragAndDrop',
          true
        );
      }

      // Wait for target element to be visible
      const targetVisible = await this.waitForElementByStrategy(targetTarget, targetStrategy, options.timeout || this.defaultTimeout);
      if (!targetVisible) {
        throw new ElementError(
          `Target element not visible or not found: ${targetTarget}`,
          targetTarget,
          'dragAndDrop',
          true
        );
      }

      // Get selectors
      const sourceSelector = this.convertToSelector(sourceTarget, sourceStrategy);
      const targetSelector = this.convertToSelector(targetTarget, targetStrategy);

      // Method 1: Using drag and drop API (preferred)
      if (options.method !== 'manual') {
        await this.page.dragAndDrop(sourceSelector, targetSelector, {
          force: options.force || false,
          timeout: options.timeout || this.defaultTimeout,
          sourcePosition: options.sourcePosition,
          targetPosition: options.targetPosition
        });
      }
      // Method 2: Manual drag and drop (fallback)
      else {
        // Get source element bounding box
        const sourceBoundingBox = await this.page.$eval(sourceSelector, el => {
          const { x, y, width, height } = el.getBoundingClientRect();
          return { x, y, width, height };
        });

        // Get target element bounding box
        const targetBoundingBox = await this.page.$eval(targetSelector, el => {
          const { x, y, width, height } = el.getBoundingClientRect();
          return { x, y, width, height };
        });

        // Calculate source and target positions
        const sourceX = sourceBoundingBox.x + (sourceBoundingBox.width / 2);
        const sourceY = sourceBoundingBox.y + (sourceBoundingBox.height / 2);
        const targetX = targetBoundingBox.x + (targetBoundingBox.width / 2);
        const targetY = targetBoundingBox.y + (targetBoundingBox.height / 2);

        // Perform manual drag and drop
        await this.page.mouse.move(sourceX, sourceY);
        await this.page.mouse.down();
        await this.page.mouse.move(targetX, targetY, { steps: 10 }); // Move in steps for smoother drag
        await this.page.mouse.up();
      }

      console.log('Drag and drop performed successfully');
      return true;
    } catch (error) {
      console.error(`Error performing drag and drop: ${error.message}`);

      // Convert Playwright errors to our custom errors
      if (error.name === 'TimeoutError') {
        throw new TimeoutError(
          `Timeout during drag and drop operation`,
          'dragAndDrop',
          options.timeout || this.defaultTimeout
        );
      }

      // If it's already our custom error, just rethrow it
      if (error instanceof ElementError || error instanceof TimeoutError) {
        throw error;
      }

      // Otherwise, wrap it in our custom error
      throw new ElementError(
        `Failed to perform drag and drop: ${error.message}`,
        `${sourceTarget} to ${targetTarget}`,
        'dragAndDrop',
        true
      );
    }
  }

  /**
   * Checks or unchecks a checkbox or radio button
   * @param {string} target - Element target (selector, xpath, etc.)
   * @param {string} strategy - Selection strategy (css, xpath, id, etc.)
   * @param {boolean} check - Whether to check (true) or uncheck (false) the element
   * @param {Object} options - Check options
   * @returns {Promise<boolean>} True if check/uncheck was successful
   */
  async checkElement(target, strategy, check = true, options = {}) {
    console.log(`Finding checkbox/radio to ${check ? 'check' : 'uncheck'}: ${target} using ${strategy}`);

    // Wait for element to be visible
    const checkElementVisible = await this.waitForElementByStrategy(target, strategy, options.timeout || this.defaultTimeout);
    if (!checkElementVisible) {
      throw new Error(`Element not visible or not found: ${target} using ${strategy}`);
    }

    const checkSelector = this.convertToSelector(target, strategy);

    // Check or uncheck the element
    if (check) {
      await this.page.check(checkSelector, {
        force: options.force || false,
        timeout: options.timeout || this.defaultTimeout
      });
      console.log('Check performed successfully');
    } else {
      await this.page.uncheck(checkSelector, {
        force: options.force || false,
        timeout: options.timeout || this.defaultTimeout
      });
      console.log('Uncheck performed successfully');
    }

    return true;
  }

  /**
   * Uploads a file to a file input element
   * @param {string} target - Element target (selector, xpath, etc.)
   * @param {string} strategy - Selection strategy (css, xpath, id, etc.)
   * @param {string|string[]} filePaths - Path(s) to the file(s) to upload
   * @param {Object} options - Upload options
   * @returns {Promise<boolean>} True if upload was successful
   */
  async uploadFile(target, strategy, filePaths, options = {}) {
    console.log(`Finding file input: ${target} using ${strategy}`);

    // Wait for element to be visible
    const fileInputVisible = await this.waitForElementByStrategy(target, strategy, options.timeout || this.defaultTimeout);
    if (!fileInputVisible) {
      throw new Error(`Element not visible or not found: ${target} using ${strategy}`);
    }

    const fileSelector = this.convertToSelector(target, strategy);

    // Upload the file(s)
    await this.page.setInputFiles(fileSelector, filePaths);

    console.log(`File upload performed successfully: ${Array.isArray(filePaths) ? filePaths.join(', ') : filePaths}`);
    return true;
  }

  /**
   * Gets the text content of an element
   * @param {string} target - Element target (selector, xpath, etc.)
   * @param {string} strategy - Selection strategy (css, xpath, id, etc.)
   * @param {Object} options - Options
   * @returns {Promise<string>} Text content of the element
   */
  async getElementText(target, strategy, options = {}) {
    console.log(`Getting text from element: ${target} using ${strategy}`);

    // Wait for element to be visible
    const elementVisible = await this.waitForElementByStrategy(target, strategy, options.timeout || this.defaultTimeout);
    if (!elementVisible) {
      throw new Error(`Element not visible or not found: ${target} using ${strategy}`);
    }

    const selector = this.convertToSelector(target, strategy);

    // Get the text content
    const text = await this.page.$eval(selector, el => el.textContent.trim());
    console.log(`Element text: "${text}"`);
    return text;
  }

  /**
   * Gets the value of an attribute from an element
   * @param {string} target - Element target (selector, xpath, etc.)
   * @param {string} strategy - Selection strategy (css, xpath, id, etc.)
   * @param {string} attribute - Attribute name
   * @param {Object} options - Options
   * @returns {Promise<string>} Attribute value
   */
  async getElementAttribute(target, strategy, attribute, options = {}) {
    console.log(`Getting attribute '${attribute}' from element: ${target} using ${strategy}`);

    // Wait for element to be visible
    const elementVisible = await this.waitForElementByStrategy(target, strategy, options.timeout || this.defaultTimeout);
    if (!elementVisible) {
      throw new Error(`Element not visible or not found: ${target} using ${strategy}`);
    }

    const selector = this.convertToSelector(target, strategy);

    // Get the attribute value
    const value = await this.page.$eval(selector, (el, attr) => el.getAttribute(attr), attribute);
    console.log(`Attribute '${attribute}' value: "${value}"`);
    return value;
  }

  /**
   * Gets the value of an input element
   * @param {string} target - Element target (selector, xpath, etc.)
   * @param {string} strategy - Selection strategy (css, xpath, id, etc.)
   * @param {Object} options - Options
   * @returns {Promise<string>} Input value
   */
  async getElementValue(target, strategy, options = {}) {
    console.log(`Getting value from input element: ${target} using ${strategy}`);

    // Wait for element to be visible
    const elementVisible = await this.waitForElementByStrategy(target, strategy, options.timeout || this.defaultTimeout);
    if (!elementVisible) {
      throw new Error(`Element not visible or not found: ${target} using ${strategy}`);
    }

    const selector = this.convertToSelector(target, strategy);

    // Get the input value
    const value = await this.page.$eval(selector, el => el.value);
    console.log(`Input value: "${value}"`);
    return value;
  }

  /**
   * Checks if an element is visible
   * @param {string} target - Element target (selector, xpath, etc.)
   * @param {string} strategy - Selection strategy (css, xpath, id, etc.)
   * @param {Object} options - Options
   * @returns {Promise<boolean>} True if element is visible
   */
  async isElementVisible(target, strategy, options = {}) {
    console.log(`Checking if element is visible: ${target} using ${strategy}`);

    try {
      const selector = this.convertToSelector(target, strategy);
      const element = await this.page.$(selector);

      if (!element) {
        console.log('Element not found');
        return false;
      }

      const isVisible = await element.isVisible();
      console.log(`Element visibility: ${isVisible}`);
      return isVisible;
    } catch (error) {
      console.error(`Error checking element visibility: ${error.message}`);
      return false;
    }
  }

  /**
   * Checks if an element exists in the DOM
   * @param {string} target - Element target (selector, xpath, etc.)
   * @param {string} strategy - Selection strategy (css, xpath, id, etc.)
   * @returns {Promise<boolean>} True if element exists
   */
  async doesElementExist(target, strategy) {
    console.log(`Checking if element exists: ${target} using ${strategy}`);

    try {
      const selector = this.convertToSelector(target, strategy);
      const element = await this.page.$(selector);
      const exists = element !== null;
      console.log(`Element existence: ${exists}`);
      return exists;
    } catch (error) {
      console.error(`Error checking element existence: ${error.message}`);
      return false;
    }
  }

  /**
   * Waits for navigation to complete
   * @param {Object} options - Navigation options
   * @returns {Promise<boolean>} True if navigation completed successfully
   */
  async waitForNavigation(options = {}) {
    console.log('Waiting for navigation to complete...');
    try {
      await this.page.waitForNavigation({
        waitUntil: options.waitUntil || 'networkidle',
        timeout: options.timeout || this.defaultTimeout
      });
      console.log('Navigation completed');
      return true;
    } catch (error) {
      console.error(`Error waiting for navigation: ${error.message}`);
      return false;
    }
  }

  /**
   * Waits for a page load state
   * @param {string} state - Load state to wait for ('load', 'domcontentloaded', 'networkidle')
   * @param {Object} options - Options
   * @returns {Promise<boolean>} True if load state was reached
   */
  async waitForLoadState(state = 'networkidle', options = {}) {
    console.log(`Waiting for page load state: ${state}...`);
    try {
      await this.page.waitForLoadState(state, {
        timeout: options.timeout || this.defaultTimeout
      });
      console.log(`Page load state '${state}' reached`);
      return true;
    } catch (error) {
      console.error(`Error waiting for load state: ${error.message}`);
      return false;
    }
  }

  /**
   * Waits for an element to disappear
   * @param {string} target - Element target (selector, xpath, etc.)
   * @param {string} strategy - Selection strategy (css, xpath, id, etc.)
   * @param {Object} options - Options
   * @returns {Promise<boolean>} True if element disappeared
   */
  async waitForElementToDisappear(target, strategy, options = {}) {
    console.log(`Waiting for element to disappear: ${target} using ${strategy}`);
    try {
      const selector = this.convertToSelector(target, strategy);
      await this.page.waitForSelector(selector, {
        state: 'hidden',
        timeout: options.timeout || this.defaultTimeout
      });
      console.log('Element disappeared');
      return true;
    } catch (error) {
      console.error(`Error waiting for element to disappear: ${error.message}`);
      return false;
    }
  }

  /**
   * Waits for a specific URL
   * @param {string|RegExp} urlOrRegExp - URL or RegExp to wait for
   * @param {Object} options - Options
   * @returns {Promise<boolean>} True if URL was reached
   */
  async waitForURL(urlOrRegExp, options = {}) {
    console.log(`Waiting for URL: ${urlOrRegExp}...`);
    try {
      await this.page.waitForURL(urlOrRegExp, {
        waitUntil: options.waitUntil || 'networkidle',
        timeout: options.timeout || this.defaultTimeout
      });
      console.log(`URL reached: ${this.page.url()}`);
      return true;
    } catch (error) {
      console.error(`Error waiting for URL: ${error.message}`);
      return false;
    }
  }

  /**
   * Gets a frame by name
   * @param {string} name - Frame name
   * @returns {Promise<Frame|null>} Playwright Frame object or null if not found
   */
  async getFrameByName(name) {
    console.log(`Getting frame by name: ${name}`);
    try {
      const frame = this.page.frame(name);
      if (!frame) {
        console.log(`Frame not found: ${name}`);
        return null;
      }
      console.log(`Frame found: ${name}`);
      return frame;
    } catch (error) {
      console.error(`Error getting frame: ${error.message}`);
      return null;
    }
  }

  /**
   * Gets an element within a frame
   * @param {string} frameName - Frame name
   * @param {string} target - Element target (selector, xpath, etc.)
   * @param {string} strategy - Selection strategy (css, xpath, id, etc.)
   * @returns {Promise<ElementHandle|null>} Element handle or null if not found
   */
  async getElementInFrame(frameName, target, strategy) {
    console.log(`Getting element in frame: ${frameName}, target: ${target}, strategy: ${strategy}`);
    try {
      const frame = await this.getFrameByName(frameName);
      if (!frame) {
        throw new Error(`Frame not found: ${frameName}`);
      }

      const selector = this.convertToSelector(target, strategy);
      const element = await frame.$(selector);

      if (!element) {
        console.log(`Element not found in frame: ${target}`);
        return null;
      }

      console.log(`Element found in frame: ${target}`);
      return element;
    } catch (error) {
      console.error(`Error getting element in frame: ${error.message}`);
      return null;
    }
  }

  /**
   * Clicks on an element within a frame
   * @param {string} frameName - Frame name
   * @param {string} target - Element target (selector, xpath, etc.)
   * @param {string} strategy - Selection strategy (css, xpath, id, etc.)
   * @param {Object} options - Click options
   * @returns {Promise<boolean>} True if click was successful
   */
  async clickElementInFrame(frameName, target, strategy, options = {}) {
    console.log(`Clicking element in frame: ${frameName}, target: ${target}, strategy: ${strategy}`);
    try {
      const frame = await this.getFrameByName(frameName);
      if (!frame) {
        throw new Error(`Frame not found: ${frameName}`);
      }

      const selector = this.convertToSelector(target, strategy);
      await frame.click(selector, {
        force: options.force || false,
        timeout: options.timeout || this.defaultTimeout,
        delay: options.delay || 100
      });

      console.log(`Click in frame performed successfully`);
      return true;
    } catch (error) {
      console.error(`Error clicking element in frame: ${error.message}`);
      return false;
    }
  }

  /**
   * Waits for a network request matching the given URL pattern
   * @param {string|RegExp} urlOrRegExp - URL or RegExp to match
   * @param {Object} options - Options
   * @returns {Promise<Request|null>} Playwright Request object or null if timeout
   */
  async waitForRequest(urlOrRegExp, options = {}) {
    console.log(`Waiting for request matching: ${urlOrRegExp}...`);
    try {
      const request = await this.page.waitForRequest(urlOrRegExp, {
        timeout: options.timeout || this.defaultTimeout
      });
      console.log(`Request matched: ${request.url()}`);
      return request;
    } catch (error) {
      console.error(`Error waiting for request: ${error.message}`);
      return null;
    }
  }

  /**
   * Waits for a network response matching the given URL pattern
   * @param {string|RegExp} urlOrRegExp - URL or RegExp to match
   * @param {Object} options - Options
   * @returns {Promise<Response|null>} Playwright Response object or null if timeout
   */
  async waitForResponse(urlOrRegExp, options = {}) {
    console.log(`Waiting for response matching: ${urlOrRegExp}...`);
    try {
      const response = await this.page.waitForResponse(urlOrRegExp, {
        timeout: options.timeout || this.defaultTimeout
      });
      console.log(`Response matched: ${response.url()} (status: ${response.status()})`);
      return response;
    } catch (error) {
      console.error(`Error waiting for response: ${error.message}`);
      return null;
    }
  }

  /**
   * Intercepts and modifies network requests
   * @param {string|RegExp} urlOrRegExp - URL or RegExp to match
   * @param {Function} handler - Handler function that receives a Route object and can fulfill, continue or abort the request
   * @returns {Promise<boolean>} True if route was successfully set up
   */
  async interceptRequest(urlOrRegExp, handler) {
    console.log(`Setting up request interception for: ${urlOrRegExp}...`);
    try {
      await this.page.route(urlOrRegExp, handler);
      console.log('Request interception set up successfully');
      return true;
    } catch (error) {
      console.error(`Error setting up request interception: ${error.message}`);
      return false;
    }
  }

  /**
   * Verifies that text is present on the page
   * @param {string} text - Text to verify
   * @param {Object} options - Options
   * @returns {Promise<boolean>} True if text is present
   */
  async verifyTextPresent(text, options = {}) {
    console.log(`Verifying text is present: "${text}"`);
    try {
      const content = await this.page.content();
      const isPresent = content.includes(text);
      console.log(`Text presence: ${isPresent}`);
      return isPresent;
    } catch (error) {
      console.error(`Error verifying text presence: ${error.message}`);
      return false;
    }
  }

  /**
   * Verifies the page title
   * @param {string} expectedTitle - Expected title
   * @param {boolean} exactMatch - Whether to require an exact match
   * @returns {Promise<boolean>} True if title matches
   */
  async verifyTitle(expectedTitle, exactMatch = false) {
    console.log(`Verifying page title${exactMatch ? ' (exact match)' : ''}: "${expectedTitle}"`);
    try {
      const actualTitle = await this.page.title();
      let matches;

      if (exactMatch) {
        matches = actualTitle === expectedTitle;
      } else {
        matches = actualTitle.includes(expectedTitle);
      }

      console.log(`Title verification: ${matches} (actual: "${actualTitle}")`);
      return matches;
    } catch (error) {
      console.error(`Error verifying title: ${error.message}`);
      return false;
    }
  }

  /**
   * Verifies the current URL
   * @param {string|RegExp} expectedUrl - Expected URL or RegExp
   * @param {boolean} exactMatch - Whether to require an exact match (ignored if expectedUrl is RegExp)
   * @returns {Promise<boolean>} True if URL matches
   */
  async verifyURL(expectedUrl, exactMatch = false) {
    console.log(`Verifying URL${exactMatch ? ' (exact match)' : ''}: ${expectedUrl}`);
    try {
      const currentUrl = this.page.url();
      let matches;

      if (expectedUrl instanceof RegExp) {
        matches = expectedUrl.test(currentUrl);
      } else if (exactMatch) {
        matches = currentUrl === expectedUrl;
      } else {
        matches = currentUrl.includes(expectedUrl);
      }

      console.log(`URL verification: ${matches} (actual: ${currentUrl})`);
      return matches;
    } catch (error) {
      console.error(`Error verifying URL: ${error.message}`);
      return false;
    }
  }

  /**
   * Takes a screenshot of a specific element
   * @param {string} target - Element target (selector, xpath, etc.)
   * @param {string} strategy - Selection strategy (css, xpath, id, etc.)
   * @param {string} path - Path to save the screenshot
   * @param {Object} options - Screenshot options
   * @returns {Promise<string|null>} Path to the saved screenshot or null if failed
   */
  async takeElementScreenshot(target, strategy, path, options = {}) {
    console.log(`Taking screenshot of element: ${target} using ${strategy}`);
    try {
      // Wait for element to be visible
      const elementVisible = await this.waitForElementByStrategy(target, strategy, options.timeout || this.defaultTimeout);
      if (!elementVisible) {
        throw new Error(`Element not visible or not found: ${target} using ${strategy}`);
      }

      const selector = this.convertToSelector(target, strategy);
      const element = await this.page.$(selector);

      if (!element) {
        throw new Error(`Element not found: ${target} using ${strategy}`);
      }

      await element.screenshot({
        path,
        type: options.type || 'png',
        quality: options.quality,
        omitBackground: options.omitBackground || false
      });

      console.log(`Element screenshot saved to: ${path}`);
      return path;
    } catch (error) {
      console.error(`Error taking element screenshot: ${error.message}`);
      return null;
    }
  }

  /**
   * Toggles fullscreen mode for the page
   * @returns {Promise<boolean>} True if successful
   */
  async toggleFullScreen() {
    console.log('Toggling fullscreen mode');
    try {
      // Tarayıcı tipini belirle
      const browserType = this.page.context().browser()._initializer.name.toLowerCase();

      if (browserType === 'firefox') {
        // Firefox için JavaScript API kullan
        await this.page.evaluate(() => {
          if (document.exitFullscreen) {
            document.exitFullscreen();
          } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
          }
        });
        console.log('Firefox fullscreen mode toggled using API');
      } else {
        // Diğer tarayıcılar için F11 tuşunu kullan
        await this.page.keyboard.press('F11');
        console.log('Fullscreen mode toggled using F11 key');
      }
      return true;
    } catch (error) {
      console.error(`Error toggling fullscreen mode: ${error.message}`);
      return false;
    }
  }

  /**
   * Exits fullscreen mode
   * @returns {Promise<boolean>} True if successful
   */
  async exitFullScreen() {
    console.log('Exiting fullscreen mode');
    try {
      // Tarayıcı tipini belirle
      const browserType = this.page.context().browser()._initializer.name.toLowerCase();

      if (browserType === 'firefox') {
        // Firefox için JavaScript API kullan
        await this.page.evaluate(() => {
          if (document.exitFullscreen) {
            document.exitFullscreen();
          } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
          }
        });
        console.log('Firefox fullscreen mode exited using API');
      } else {
        // Diğer tarayıcılar için Escape tuşunu kullan
        await this.page.keyboard.press('Escape');
        console.log('Fullscreen mode exited using Escape key');
      }
      return true;
    } catch (error) {
      console.error(`Error exiting fullscreen mode: ${error.message}`);
      return false;
    }
  }
}
