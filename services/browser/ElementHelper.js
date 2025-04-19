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
    this.defaultTimeout = 10000; // 10 seconds default timeout
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
}
