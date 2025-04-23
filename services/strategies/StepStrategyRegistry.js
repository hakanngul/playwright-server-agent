/**
 * Step strategy registry
 * Manages registration and retrieval of step strategies
 */

/**
 * Registry for step execution strategies
 */
export class StepStrategyRegistry {
  /**
   * Static map to store strategies
   * @private
   */
  static _strategies = new Map();

  /**
   * Registers a strategy for a step type
   * @param {string} stepType - Type of step
   * @param {Function} strategyClass - Strategy class constructor
   */
  static register(stepType, strategyClass) {
    this._strategies.set(stepType, strategyClass);
    console.log(`Registered strategy for step type: ${stepType}`);
  }

  /**
   * Gets the appropriate strategy for a step type
   * @param {string} stepType - Type of step
   * @returns {Object} Strategy instance for executing the step
   * @throws {Error} If no strategy is registered for the step type
   */
  static getStrategy(stepType) {
    const StrategyClass = this._strategies.get(stepType);
    
    if (!StrategyClass) {
      throw new Error(`Unsupported step type: ${stepType}`);
    }
    
    return new StrategyClass();
  }

  /**
   * Checks if a strategy is registered for a step type
   * @param {string} stepType - Type of step
   * @returns {boolean} True if a strategy is registered
   */
  static hasStrategy(stepType) {
    return this._strategies.has(stepType);
  }

  /**
   * Gets all registered step types
   * @returns {Array<string>} Array of registered step types
   */
  static getRegisteredStepTypes() {
    return Array.from(this._strategies.keys());
  }

  /**
   * Clears all registered strategies
   * Use with caution, mainly for testing purposes
   */
  static clear() {
    this._strategies.clear();
  }
}
