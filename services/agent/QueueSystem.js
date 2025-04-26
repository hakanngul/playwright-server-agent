/**
 * Queue System
 * Manages test request queue and distribution
 */

import EventEmitter from 'events';

export class QueueSystem extends EventEmitter {
  constructor(options = {}) {
    super();
    this.queue = [];
    this.processing = new Map(); // Map of requestId -> request being processed
    this.options = {
      maxQueueSize: options.maxQueueSize || 100,
      requestTimeout: options.requestTimeout || 30 * 60 * 1000, // 30 minutes default
    };
    
    // Setup periodic queue check
    this._setupPeriodicCheck();
  }

  /**
   * Add a test request to the queue
   * @param {Object} request - Test request object
   * @returns {string} Request ID
   */
  enqueue(request) {
    if (this.queue.length >= this.options.maxQueueSize) {
      throw new Error('Queue is full. Please try again later.');
    }

    // Generate a unique request ID
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Add metadata to the request
    const queuedRequest = {
      ...request,
      id: requestId,
      status: 'queued',
      priority: request.priority || 1, // Default priority is 1 (lower number = higher priority)
      queuedAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null
    };
    
    // Add to queue
    this.queue.push(queuedRequest);
    
    // Sort queue by priority
    this._sortQueue();
    
    // Emit event
    this.emit('request:queued', queuedRequest);
    
    return requestId;
  }

  /**
   * Get the next request from the queue
   * @returns {Object|null} Next request or null if queue is empty
   */
  dequeue() {
    if (this.queue.length === 0) {
      return null;
    }
    
    // Get the next request (highest priority first)
    const request = this.queue.shift();
    
    // Update request status
    request.status = 'processing';
    request.startedAt = new Date().toISOString();
    
    // Add to processing map
    this.processing.set(request.id, request);
    
    // Emit event
    this.emit('request:processing', request);
    
    return request;
  }

  /**
   * Mark a request as completed
   * @param {string} requestId - Request ID
   * @param {Object} result - Test result
   */
  complete(requestId, result) {
    if (!this.processing.has(requestId)) {
      throw new Error(`Request ${requestId} is not being processed`);
    }
    
    const request = this.processing.get(requestId);
    
    // Update request status
    request.status = 'completed';
    request.completedAt = new Date().toISOString();
    request.result = result;
    
    // Remove from processing map
    this.processing.delete(requestId);
    
    // Emit event
    this.emit('request:completed', request);
    
    return request;
  }

  /**
   * Mark a request as failed
   * @param {string} requestId - Request ID
   * @param {Error} error - Error object
   */
  fail(requestId, error) {
    if (!this.processing.has(requestId)) {
      throw new Error(`Request ${requestId} is not being processed`);
    }
    
    const request = this.processing.get(requestId);
    
    // Update request status
    request.status = 'failed';
    request.completedAt = new Date().toISOString();
    request.error = {
      message: error.message,
      stack: error.stack
    };
    
    // Remove from processing map
    this.processing.delete(requestId);
    
    // Emit event
    this.emit('request:failed', request);
    
    return request;
  }

  /**
   * Get queue status
   * @returns {Object} Queue status
   */
  getStatus() {
    return {
      queuedRequests: this.queue.length,
      processingRequests: this.processing.size,
      totalRequests: this.queue.length + this.processing.size
    };
  }

  /**
   * Get all queued requests
   * @returns {Array} Queued requests
   */
  getQueuedRequests() {
    return [...this.queue];
  }

  /**
   * Get all processing requests
   * @returns {Array} Processing requests
   */
  getProcessingRequests() {
    return Array.from(this.processing.values());
  }

  /**
   * Check if there are any requests in the queue
   * @returns {boolean} True if queue has requests
   */
  hasQueuedRequests() {
    return this.queue.length > 0;
  }

  /**
   * Sort queue by priority
   * @private
   */
  _sortQueue() {
    this.queue.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Setup periodic check for timed out requests
   * @private
   */
  _setupPeriodicCheck() {
    setInterval(() => {
      const now = Date.now();
      
      // Check for timed out processing requests
      for (const [requestId, request] of this.processing.entries()) {
        const startTime = new Date(request.startedAt).getTime();
        if (now - startTime > this.options.requestTimeout) {
          // Request has timed out
          this.fail(requestId, new Error('Request timed out'));
        }
      }
    }, 60000); // Check every minute
  }

  /**
   * Clear the queue
   */
  clear() {
    this.queue = [];
    this.emit('queue:cleared');
  }
}

export default QueueSystem;
