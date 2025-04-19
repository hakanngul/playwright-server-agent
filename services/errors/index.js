/**
 * Custom error classes for the application
 */

/**
 * Base error class for the application
 */
export class AppError extends Error {
  /**
   * Creates a new AppError instance
   * @param {string} message - Error message
   * @param {string} code - Error code
   * @param {boolean} isRetryable - Whether the error is retryable
   */
  constructor(message, code = 'INTERNAL_ERROR', isRetryable = false) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.isRetryable = isRetryable;
    this.timestamp = new Date().toISOString();
    
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  /**
   * Converts the error to a JSON object
   * @returns {Object} JSON representation of the error
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      isRetryable: this.isRetryable,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }
}

/**
 * Error class for validation errors
 */
export class ValidationError extends AppError {
  /**
   * Creates a new ValidationError instance
   * @param {string} message - Error message
   * @param {Object} validationErrors - Validation errors
   */
  constructor(message, validationErrors = {}) {
    super(message, 'VALIDATION_ERROR', false);
    this.validationErrors = validationErrors;
  }
  
  /**
   * Converts the error to a JSON object
   * @returns {Object} JSON representation of the error
   */
  toJSON() {
    return {
      ...super.toJSON(),
      validationErrors: this.validationErrors
    };
  }
}

/**
 * Error class for not found errors
 */
export class NotFoundError extends AppError {
  /**
   * Creates a new NotFoundError instance
   * @param {string} message - Error message
   * @param {string} resource - Resource that was not found
   */
  constructor(message, resource = '') {
    super(message, 'NOT_FOUND', false);
    this.resource = resource;
  }
  
  /**
   * Converts the error to a JSON object
   * @returns {Object} JSON representation of the error
   */
  toJSON() {
    return {
      ...super.toJSON(),
      resource: this.resource
    };
  }
}

/**
 * Error class for browser errors
 */
export class BrowserError extends AppError {
  /**
   * Creates a new BrowserError instance
   * @param {string} message - Error message
   * @param {string} browserType - Browser type
   * @param {boolean} isRetryable - Whether the error is retryable
   */
  constructor(message, browserType = '', isRetryable = true) {
    super(message, 'BROWSER_ERROR', isRetryable);
    this.browserType = browserType;
  }
  
  /**
   * Converts the error to a JSON object
   * @returns {Object} JSON representation of the error
   */
  toJSON() {
    return {
      ...super.toJSON(),
      browserType: this.browserType
    };
  }
}

/**
 * Error class for element errors
 */
export class ElementError extends AppError {
  /**
   * Creates a new ElementError instance
   * @param {string} message - Error message
   * @param {string} selector - Element selector
   * @param {string} action - Action that was being performed
   * @param {boolean} isRetryable - Whether the error is retryable
   */
  constructor(message, selector = '', action = '', isRetryable = true) {
    super(message, 'ELEMENT_ERROR', isRetryable);
    this.selector = selector;
    this.action = action;
  }
  
  /**
   * Converts the error to a JSON object
   * @returns {Object} JSON representation of the error
   */
  toJSON() {
    return {
      ...super.toJSON(),
      selector: this.selector,
      action: this.action
    };
  }
}

/**
 * Error class for navigation errors
 */
export class NavigationError extends AppError {
  /**
   * Creates a new NavigationError instance
   * @param {string} message - Error message
   * @param {string} url - URL that was being navigated to
   * @param {boolean} isRetryable - Whether the error is retryable
   */
  constructor(message, url = '', isRetryable = true) {
    super(message, 'NAVIGATION_ERROR', isRetryable);
    this.url = url;
  }
  
  /**
   * Converts the error to a JSON object
   * @returns {Object} JSON representation of the error
   */
  toJSON() {
    return {
      ...super.toJSON(),
      url: this.url
    };
  }
}

/**
 * Error class for timeout errors
 */
export class TimeoutError extends AppError {
  /**
   * Creates a new TimeoutError instance
   * @param {string} message - Error message
   * @param {string} operation - Operation that timed out
   * @param {number} timeout - Timeout in milliseconds
   */
  constructor(message, operation = '', timeout = 0) {
    super(message, 'TIMEOUT_ERROR', true);
    this.operation = operation;
    this.timeout = timeout;
  }
  
  /**
   * Converts the error to a JSON object
   * @returns {Object} JSON representation of the error
   */
  toJSON() {
    return {
      ...super.toJSON(),
      operation: this.operation,
      timeout: this.timeout
    };
  }
}

/**
 * Error class for network errors
 */
export class NetworkError extends AppError {
  /**
   * Creates a new NetworkError instance
   * @param {string} message - Error message
   * @param {string} url - URL that was being accessed
   * @param {number} statusCode - HTTP status code
   */
  constructor(message, url = '', statusCode = 0) {
    super(message, 'NETWORK_ERROR', true);
    this.url = url;
    this.statusCode = statusCode;
  }
  
  /**
   * Converts the error to a JSON object
   * @returns {Object} JSON representation of the error
   */
  toJSON() {
    return {
      ...super.toJSON(),
      url: this.url,
      statusCode: this.statusCode
    };
  }
}
