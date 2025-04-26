/**
 * Queue System
 * Manages test request queue and distribution
 */

import EventEmitter from 'events';

export class QueueSystem extends EventEmitter {
  constructor(options = {}) {
    super();

    // Kategori bazlı kuyruklar
    this.queues = {
      critical: [],    // Kritik testler - En yüksek öncelik
      security: [],    // Güvenlik testleri
      functional: [],  // Fonksiyonel testler
      regression: [],  // Regresyon testleri
      performance: [], // Performans testleri
      accessibility: [], // Erişilebilirlik testleri
      mobile: [],      // Mobil görünüm testleri
      api: [],         // API testleri
      integration: [], // Entegrasyon testleri
      default: []      // Diğer testler - En düşük öncelik
    };

    this.processing = new Map(); // Map of requestId -> request being processed

    // Tamamlanan ve başarısız istekleri saklamak için diziler
    this.completedRequests = [];
    this.failedRequests = [];

    this.options = {
      maxQueueSize: options.maxQueueSize || 100,
      requestTimeout: options.requestTimeout || 30 * 60 * 1000, // 30 dakika
      queueTimeout: options.queueTimeout || 60 * 60 * 1000, // 1 saat
      timeoutCheckInterval: options.timeoutCheckInterval || 60 * 1000, // 1 dakika
      maxCompletedRequests: options.maxCompletedRequests || 100 // Son 100 tamamlanan isteği sakla
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
    // Tüm kuyrukların toplam boyutunu kontrol et
    const totalQueueSize = Object.values(this.queues).reduce((total, queue) => total + queue.length, 0);
    if (totalQueueSize >= this.options.maxQueueSize) {
      throw new Error('Queue is full. Please try again later.');
    }

    // Generate a unique request ID
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Öncelik hesapla
    const calculatedPriority = this._calculatePriority(request);

    // Add metadata to the request
    const queuedRequest = {
      ...request,
      id: requestId,
      status: 'queued', // Başlangıçta 'queued' durumunda
      priority: calculatedPriority,
      queuedAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null,
      processed: false // İşlenip işlenmediğini takip etmek için
    };

    // Kategori belirle
    const category = request.testPlan.category || 'default';
    if (!this.queues[category]) {
      this.queues[category] = [];
    }

    // İsteği ilgili kuyruğa ekle
    this.queues[category].push(queuedRequest);

    // Tüm kuyrukları sırala
    this._sortAllQueues();

    // Emit event
    this.emit('request:queued', queuedRequest);

    return requestId;
  }

  /**
   * Calculate priority for a request
   * @param {Object} request - Test request
   * @returns {number} Calculated priority (1-10, 1 is highest)
   * @private
   */
  _calculatePriority(request) {
    // Eğer kullanıcı tarafından öncelik belirtilmişse kullan
    if (request.priority !== undefined) {
      return Math.max(1, Math.min(10, request.priority)); // 1-10 arası (1 en yüksek)
    }

    // Temel öncelik (5 = orta)
    let basePriority = 5;

    // Test kategorisine göre öncelik ayarlama
    const category = request.testPlan.category || 'default';
    switch (category) {
      case 'critical':
        basePriority -= 3; // En yüksek öncelik
        break;
      case 'security':
        basePriority -= 2;
        break;
      case 'functional':
        basePriority -= 1;
        break;
      case 'regression':
        basePriority += 1;
        break;
      case 'performance':
        basePriority += 0;
        break;
      case 'accessibility':
        basePriority += 1;
        break;
      case 'mobile':
        basePriority += 1;
        break;
      case 'api':
        basePriority += 0;
        break;
      case 'integration':
        basePriority += 0;
        break;
      default:
        basePriority += 2; // En düşük öncelik
    }

    // Test türüne göre öncelik ayarlama
    if (request.testPlan.type === 'critical') {
      basePriority -= 1; // Kritik testlere daha yüksek öncelik
    } else if (request.testPlan.type === 'regression') {
      basePriority += 1; // Regresyon testlerine daha düşük öncelik
    }

    // Kullanıcı rolüne göre öncelik ayarlama
    if (request.user && request.user.role === 'admin') {
      basePriority -= 1; // Admin kullanıcılara daha yüksek öncelik
    } else if (request.user && request.user.role === 'tester') {
      basePriority -= 0.5; // Test ekibine orta öncelik
    }

    return Math.max(1, Math.min(10, basePriority)); // 1-10 arasında sınırla (1 = en yüksek, 10 = en düşük)
  }

  /**
   * Get the next request from the queue
   * @returns {Object|null} Next request or null if queue is empty
   */
  dequeue() {
    // Öncelikli kategorileri kontrol et (öncelik sırasına göre)
    const categories = [
      'critical',
      'security',
      'functional',
      'api',
      'integration',
      'performance',
      'regression',
      'accessibility',
      'mobile',
      'default'
    ];

    for (const category of categories) {
      if (this.queues[category] && this.queues[category].length > 0) {
        // Kuyruktan bir istek al
        const request = this.queues[category].shift();

        // İstek durumunu güncelle
        request.status = 'processing';
        request.startedAt = new Date().toISOString();

        // İşlenen istekler haritasına ekle
        this.processing.set(request.id, request);

        // Olay tetikle
        this.emit('request:processing', request);

        return request;
      }
    }

    // Hiçbir kuyrukta istek yoksa
    return null;
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

    // Tamamlanan istekler listesine ekle
    this.completedRequests.unshift(request); // En son tamamlanan isteği başa ekle

    // Maksimum sayıyı aşarsa en eski isteği sil
    if (this.completedRequests.length > this.options.maxCompletedRequests) {
      this.completedRequests.pop();
    }

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

    // Başarısız istekler listesine ekle
    this.failedRequests.unshift(request); // En son başarısız olan isteği başa ekle

    // Maksimum sayıyı aşarsa en eski isteği sil
    if (this.failedRequests.length > this.options.maxCompletedRequests) {
      this.failedRequests.pop();
    }

    // Emit event
    this.emit('request:failed', request);

    return request;
  }

  /**
   * Get queue status
   * @returns {Object} Queue status
   */
  getStatus() {
    // Tüm kuyrukların toplam boyutunu hesapla
    const totalQueuedRequests = Object.values(this.queues).reduce((total, queue) => total + queue.length, 0);

    return {
      queuedRequests: totalQueuedRequests,
      processingRequests: this.processing.size,
      totalRequests: totalQueuedRequests + this.processing.size,
      queuesByCategory: this.getQueueStatusByCategory()
    };
  }

  /**
   * Get all queued requests
   * @returns {Array} Queued requests
   */
  getQueuedRequests() {
    // Tüm kuyrukları birleştir
    const allRequests = [];
    for (const category in this.queues) {
      // Sadece 'queued' durumundaki istekleri ekle
      const queuedRequests = this.queues[category].filter(req => req.status === 'queued');
      allRequests.push(...queuedRequests);
    }
    return allRequests;
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
    // Herhangi bir kuyrukta istek var mı kontrol et
    for (const category in this.queues) {
      if (this.queues[category].length > 0) {
        return true;
      }
    }
    return false;
  }

  /**
   * Sort all queues by priority
   * @private
   */
  _sortAllQueues() {
    for (const category in this.queues) {
      this.queues[category].sort((a, b) => {
        // Önce önceliğe göre sırala (düşük sayı = yüksek öncelik)
        const priorityDiff = a.priority - b.priority;
        if (priorityDiff !== 0) return priorityDiff;

        // Öncelikler eşitse, önce eklenen önce çalışsın (FIFO)
        return new Date(a.queuedAt) - new Date(b.queuedAt);
      });
    }
  }

  /**
   * Setup periodic check for timed out requests
   * @private
   */
  _setupPeriodicCheck() {
    setInterval(() => {
      const now = Date.now();

      // İşlenen isteklerin zaman aşımı kontrolü
      for (const [requestId, request] of this.processing.entries()) {
        const startTime = new Date(request.startedAt).getTime();
        if (now - startTime > this.options.requestTimeout) {
          console.log(`Request ${requestId} timed out after ${this.options.requestTimeout/1000} seconds of processing`);
          this.fail(requestId, new Error(`Request timed out after ${this.options.requestTimeout/1000} seconds of processing`));
        }
      }

      // Kuyrukta bekleyen isteklerin zaman aşımı kontrolü
      for (const category in this.queues) {
        const expiredRequests = [];

        for (const request of this.queues[category]) {
          const queueTime = now - new Date(request.queuedAt).getTime();
          if (queueTime > this.options.queueTimeout) {
            expiredRequests.push(request);
          }
        }

        // Zaman aşımına uğrayan istekleri kaldır
        for (const request of expiredRequests) {
          console.log(`Request ${request.id} expired after ${this.options.queueTimeout/1000} seconds in queue`);
          this.queues[category] = this.queues[category].filter(r => r.id !== request.id);
          this.emit('request:expired', request);
        }
      }
    }, this.options.timeoutCheckInterval); // Belirtilen aralıklarla kontrol et
  }

  /**
   * Clear the queue
   */
  clear() {
    // Tüm kuyrukları temizle
    for (const category in this.queues) {
      this.queues[category] = [];
    }
    this.emit('queue:cleared');
  }

  /**
   * Get queue status by category
   * @returns {Object} Queue status by category
   */
  getQueueStatusByCategory() {
    const status = {};

    for (const category in this.queues) {
      status[category] = this.queues[category].length;
    }

    return status;
  }

  /**
   * Get completed and failed requests
   * @returns {Array} Completed and failed requests
   */
  getCompletedRequests() {
    // Tamamlanan ve başarısız istekleri birleştir
    const allCompletedRequests = [...this.completedRequests, ...this.failedRequests];

    // Tamamlanma zamanına göre sırala (en son tamamlanan en üstte)
    allCompletedRequests.sort((a, b) => {
      return new Date(b.completedAt) - new Date(a.completedAt);
    });

    // Maksimum sayıda istek döndür
    return allCompletedRequests.slice(0, this.options.maxCompletedRequests);
  }
}

export default QueueSystem;
