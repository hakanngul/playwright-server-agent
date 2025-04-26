/**
 * Element finder interface
 * Defines methods for finding elements
 */

/**
 * Interface for element finding
 * @interface
 */
export class IElementFinder {
  /**
   * Finds an element
   * @param {string} target - Element target (selector, xpath, etc.)
   * @param {string} strategy - Selection strategy (css, xpath, id, etc.)
   * @returns {Promise<Object>} Element handle
   */
  async findElement(target, strategy) {
    throw new Error('Method not implemented');
  }

  /**
   * Checks if an element exists
   * @param {string} target - Element target (selector, xpath, etc.)
   * @param {string} strategy - Selection strategy (css, xpath, id, etc.)
   * @returns {Promise<boolean>} True if element exists
   */
  async elementExists(target, strategy) {
    throw new Error('Method not implemented');
  }
}
