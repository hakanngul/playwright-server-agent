/**
 * Performance Reporter module
 * Generates and saves performance reports
 * NOT: Performans raporlama özelliği geçici olarak devre dışı bırakıldı
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Performance Reporter class
 */
export class PerformanceReporter {
  /**
   * Creates a new PerformanceReporter instance
   * @param {Object} options - Reporter options
   */
  constructor(options = {}) {
    this.reportsDir = options.reportsDir || path.join(process.cwd(), 'data/performance-reports');
    this.thresholds = options.thresholds || {
      fcp: 1000,    // 1 second
      lcp: 2500,    // 2.5 seconds
      cls: 0.1,     // 0.1
      fid: 100,     // 100ms
      ttfb: 600,    // 600ms
      requestDuration: 1000, // 1 second
      testDuration: 10000,   // 10 saniye
      pageDuration: 5000     // 5 saniye
    };

    // Ensure reports directory exists
    this.ensureDirectoryExists(this.reportsDir);
  }

  /**
   * Ensures a directory exists
   * @param {string} dir - Directory path
   * @private
   */
  ensureDirectoryExists(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Saves a performance report
   * @param {string} testName - Test name
   * @param {Object} performanceData - Performance data
   * @returns {Object} Report result
   */
  saveReport(testName, performanceData) {
    // Performans raporlama özelliği geçici olarak devre dışı bırakıldı
    console.log('Performance reporting feature is temporarily disabled');

    return {
      filePath: null,
      warnings: [],
      disabled: true
    };
  }

  /**
   * Checks for threshold violations
   * @param {Object} performanceData - Performance data
   * @returns {Array} Warnings
   * @private
   */
  checkThresholds(performanceData) {
    const warnings = [];

    // Check Web Vitals thresholds
    if (performanceData.webVitals) {
      const { webVitals } = performanceData;

      // Check FCP
      if (webVitals.fcp && webVitals.fcp > this.thresholds.fcp) {
        warnings.push({
          type: 'fcp',
          message: `First Contentful Paint (${webVitals.fcp.toFixed(2)}ms) exceeds threshold (${this.thresholds.fcp}ms)`,
          value: webVitals.fcp,
          threshold: this.thresholds.fcp
        });
      }

      // Check LCP
      if (webVitals.lcp && webVitals.lcp > this.thresholds.lcp) {
        warnings.push({
          type: 'lcp',
          message: `Largest Contentful Paint (${webVitals.lcp.toFixed(2)}ms) exceeds threshold (${this.thresholds.lcp}ms)`,
          value: webVitals.lcp,
          threshold: this.thresholds.lcp
        });
      }

      // Check CLS
      if (webVitals.cls !== undefined && webVitals.cls > this.thresholds.cls) {
        warnings.push({
          type: 'cls',
          message: `Cumulative Layout Shift (${webVitals.cls.toFixed(3)}) exceeds threshold (${this.thresholds.cls})`,
          value: webVitals.cls,
          threshold: this.thresholds.cls
        });
      }

      // Check FID
      if (webVitals.fid && webVitals.fid > this.thresholds.fid) {
        warnings.push({
          type: 'fid',
          message: `First Input Delay (${webVitals.fid.toFixed(2)}ms) exceeds threshold (${this.thresholds.fid}ms)`,
          value: webVitals.fid,
          threshold: this.thresholds.fid
        });
      }

      // Check TTFB
      if (webVitals.ttfb && webVitals.ttfb > this.thresholds.ttfb) {
        warnings.push({
          type: 'ttfb',
          message: `Time to First Byte (${webVitals.ttfb.toFixed(2)}ms) exceeds threshold (${this.thresholds.ttfb}ms)`,
          value: webVitals.ttfb,
          threshold: this.thresholds.ttfb
        });
      }
    }

    // Check test duration
    if (performanceData.testDuration && performanceData.testDuration > this.thresholds.testDuration) {
      warnings.push({
        type: 'testDuration',
        message: `Test süresi eşiği aşıldı: ${performanceData.testDuration}ms > ${this.thresholds.testDuration}ms`,
        value: performanceData.testDuration,
        threshold: this.thresholds.testDuration
      });
    }

    // Check page duration (using LCP as an indicator if available)
    if (performanceData.webVitals && performanceData.webVitals.lcp > this.thresholds.pageDuration) {
      warnings.push({
        type: 'pageDuration',
        message: `Sayfa yükleme süresi eşiği aşıldı: ${performanceData.webVitals.lcp}ms > ${this.thresholds.pageDuration}ms`,
        value: performanceData.webVitals.lcp,
        threshold: this.thresholds.pageDuration
      });
    }

    // Check network metrics
    if (performanceData.networkMetrics) {
      const { networkMetrics } = performanceData;

      // Check slow requests
      if (networkMetrics.slowRequests && networkMetrics.slowRequests.length > 0) {
        warnings.push({
          type: 'slowRequests',
          message: `Found ${networkMetrics.slowRequests.length} slow requests (>1000ms)`,
          value: networkMetrics.slowRequests.length,
          details: networkMetrics.slowRequests
        });
      }

      // Check failed requests
      if (networkMetrics.failedRequests && networkMetrics.failedRequests.length > 0) {
        warnings.push({
          type: 'failedRequests',
          message: `Found ${networkMetrics.failedRequests.length} failed requests`,
          value: networkMetrics.failedRequests.length,
          details: networkMetrics.failedRequests
        });
      }

      // Check total page size
      if (networkMetrics.totalSize && networkMetrics.totalSize > 5000000) { // 5MB
        warnings.push({
          type: 'pageSize',
          message: `Page size (${(networkMetrics.totalSize / 1024 / 1024).toFixed(2)}MB) is too large`,
          value: networkMetrics.totalSize,
          threshold: 5000000
        });
      }

      // Check number of requests
      if (networkMetrics.totalRequests && networkMetrics.totalRequests > 100) {
        warnings.push({
          type: 'requestCount',
          message: `Too many requests (${networkMetrics.totalRequests})`,
          value: networkMetrics.totalRequests,
          threshold: 100
        });
      }
    }

    return warnings;
  }

  /**
   * Generates recommendations based on performance data and warnings
   * @param {Object} performanceData - Performance data
   * @param {Array} warnings - Warnings
   * @returns {Array} Recommendations
   * @private
   */
  generateRecommendations(performanceData, warnings) {
    const recommendations = [];

    // Add recommendations based on warnings
    for (const warning of warnings) {
      switch (warning.type) {
        case 'fcp':
          recommendations.push('Optimize critical rendering path, reduce render-blocking resources');
          break;
        case 'lcp':
          recommendations.push('Optimize largest image or text block, improve server response time');
          break;
        case 'cls':
          recommendations.push('Set size attributes on images and videos, avoid inserting content above existing content');
          break;
        case 'fid':
          recommendations.push('Break up long tasks, optimize JavaScript execution');
          break;
        case 'ttfb':
          recommendations.push('Improve server response time, use CDN, optimize backend');
          break;
        case 'testDuration':
          recommendations.push('Test süresini azaltmak için test adımlarını optimize edin veya gereksiz adımları kaldırın');
          break;
        case 'pageDuration':
          recommendations.push('Sayfa yükleme süresini azaltmak için sayfa içeriğini optimize edin, gereksiz kaynakları kaldırın');
          break;
        case 'slowRequests':
          recommendations.push('Optimize slow resources, consider using CDN, implement caching');
          break;
        case 'failedRequests':
          recommendations.push('Fix failed resource requests to improve page reliability');
          break;
        case 'pageSize':
          recommendations.push('Reduce page size by optimizing images and minifying resources');
          break;
        case 'requestCount':
          recommendations.push('Reduce number of requests by bundling resources, using sprites, or implementing HTTP/2');
          break;
      }
    }

    // Add advanced optimization recommendations based on performance data
    if (performanceData) {
      // Analyze step performance if available
      if (performanceData.stepStats) {
        const slowStepRecommendations = this.analyzeSlowSteps(performanceData.stepStats, performanceData.steps);
        recommendations.push(...slowStepRecommendations);
      }

      // Analyze network bottlenecks
      if (performanceData.networkMetrics) {
        const networkRecommendations = this.analyzeNetworkBottlenecks(performanceData.networkMetrics);
        recommendations.push(...networkRecommendations);
      }

      // Analyze memory usage
      if (performanceData.systemMetrics && performanceData.systemMetrics.memory) {
        const memoryRecommendations = this.analyzeMemoryUsage(performanceData.systemMetrics.memory);
        recommendations.push(...memoryRecommendations);
      }

      // Analyze parallelization potential
      if (performanceData.testDuration && performanceData.steps) {
        const parallelizationRecommendations = this.analyzeParallelizationPotential(performanceData);
        recommendations.push(...parallelizationRecommendations);
      }
    }

    // Remove duplicates
    return [...new Set(recommendations)];
  }

  /**
   * Analyzes slow steps and provides recommendations
   * @param {Object} stepStats - Step statistics
   * @param {Array} steps - Test steps
   * @returns {Array} Recommendations
   * @private
   */
  analyzeSlowSteps(stepStats, steps) {
    const recommendations = [];

    if (!stepStats || !steps || !Array.isArray(steps)) {
      return recommendations;
    }

    // Find steps that are significantly slower than average
    const averageDuration = stepStats.averageStepDuration;
    const slowThreshold = averageDuration * 1.5; // 50% slower than average

    // Find slow steps
    const slowSteps = steps.filter(step => step.duration > slowThreshold);

    // Generate recommendations for slow steps
    slowSteps.forEach(step => {
      const percentSlower = Math.round((step.duration / averageDuration - 1) * 100);
      const stepName = step.description || step.action;
      recommendations.push(`"${stepName}" adımı ortalamadan %${percentSlower} daha yavaş çalışıyor, optimize edilmeli`);
    });

    // If there's a particularly slow step
    if (stepStats.slowestStepIndex >= 0 && steps[stepStats.slowestStepIndex]) {
      const slowestStep = steps[stepStats.slowestStepIndex];
      const stepName = slowestStep.description || slowestStep.action;

      // Add specific recommendations based on step type
      if (slowestStep.action === 'navigate') {
        recommendations.push(`En yavaş adım: "${stepName}". Sayfa yükleme süresi optimize edilmeli veya ön yükleme yapılmalı.`);
      } else if (slowestStep.action === 'click' || slowestStep.action === 'type') {
        recommendations.push(`En yavaş adım: "${stepName}". Element seçici optimizasyonu veya bekleme stratejisi gözden geçirilmeli.`);
      } else if (slowestStep.action === 'wait') {
        recommendations.push(`En yavaş adım: "${stepName}". Sabit bekleme süresi yerine koşul bazlı bekleme kullanılmalı.`);
      }
    }

    return recommendations;
  }

  /**
   * Analyzes network bottlenecks and provides recommendations
   * @param {Object} networkMetrics - Network metrics
   * @returns {Array} Recommendations
   * @private
   */
  analyzeNetworkBottlenecks(networkMetrics) {
    const recommendations = [];

    if (!networkMetrics) {
      return recommendations;
    }

    // Check for large resources
    if (networkMetrics.largeResources && networkMetrics.largeResources.length > 0) {
      const largeResourcesCount = networkMetrics.largeResources.length;
      const totalSize = networkMetrics.largeResources.reduce((sum, resource) => sum + (resource.size || 0), 0);
      const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);

      recommendations.push(`Sayfada ${largeResourcesCount} adet büyük boyutlu kaynak (toplam ${totalSizeMB}MB) bulunuyor. Görsel sıkıştırma ve lazy loading uygulanmalı.`);

      // Check for specific resource types
      const largeImages = networkMetrics.largeResources.filter(r => r.resourceType === 'image' || r.contentType?.includes('image'));
      if (largeImages.length > 0) {
        recommendations.push(`${largeImages.length} adet büyük boyutlu görsel bulunuyor. WebP formatı ve uygun boyutlama kullanılmalı.`);
      }

      const largeScripts = networkMetrics.largeResources.filter(r => r.resourceType === 'script' || r.contentType?.includes('javascript'));
      if (largeScripts.length > 0) {
        recommendations.push(`${largeScripts.length} adet büyük boyutlu JavaScript dosyası bulunuyor. Code splitting ve lazy loading uygulanmalı.`);
      }
    }

    // Check for slow requests
    if (networkMetrics.slowRequests && networkMetrics.slowRequests.length > 0) {
      const slowRequestsCount = networkMetrics.slowRequests.length;
      const averageDuration = networkMetrics.slowRequests.reduce((sum, req) => sum + (req.duration || 0), 0) / slowRequestsCount;

      recommendations.push(`${slowRequestsCount} adet yavaş istek (ortalama ${averageDuration.toFixed(0)}ms) bulunuyor. CDN kullanımı ve önbellekleme stratejileri uygulanmalı.`);

      // Check for specific slow resource types
      const slowApiRequests = networkMetrics.slowRequests.filter(r => r.url.includes('/api/') || r.url.includes('/service/'));
      if (slowApiRequests.length > 0) {
        recommendations.push(`${slowApiRequests.length} adet yavaş API isteği bulunuyor. Backend yanıt süresi optimize edilmeli.`);
      }
    }

    // Check for too many requests
    if (networkMetrics.totalRequests > 50) {
      recommendations.push(`Toplam ${networkMetrics.totalRequests} istek bulunuyor. Dosya birleştirme ve HTTP/2 kullanımı ile istek sayısı azaltılmalı.`);
    }

    // Check for uncacheable resources
    if (networkMetrics.uncacheableRequests && networkMetrics.uncacheableRequests.length > 10) {
      recommendations.push(`${networkMetrics.uncacheableRequests.length} adet önbelleklenemeyen kaynak bulunuyor. Cache-Control header'ları düzenlenmeli.`);
    }

    return recommendations;
  }

  /**
   * Analyzes memory usage and provides recommendations
   * @param {Object} memoryMetrics - Memory metrics
   * @returns {Array} Recommendations
   * @private
   */
  analyzeMemoryUsage(memoryMetrics) {
    const recommendations = [];

    if (!memoryMetrics || !memoryMetrics.initial || !memoryMetrics.final || !memoryMetrics.diff) {
      return recommendations;
    }

    // Check for significant memory growth
    const heapGrowthMB = memoryMetrics.diff.heapUsed / (1024 * 1024);
    const rssGrowthMB = memoryMetrics.diff.rss / (1024 * 1024);

    if (heapGrowthMB > 50) {
      recommendations.push(`Test sırasında bellek kullanımı ${heapGrowthMB.toFixed(2)}MB arttı. Bellek sızıntısı olabilir, kaynakların düzgün temizlenmesi sağlanmalı.`);
    }

    // Check for high memory usage
    const finalHeapUsedMB = memoryMetrics.final.heapUsed / (1024 * 1024);
    if (finalHeapUsedMB > 200) {
      recommendations.push(`Yüksek bellek kullanımı: ${finalHeapUsedMB.toFixed(2)}MB. Bellek optimizasyonu yapılmalı.`);
    }

    // Check for memory leak pattern
    if (heapGrowthMB > 20 && rssGrowthMB > 30) {
      recommendations.push(`Test çalıştıkça bellek kullanımı sürekli artıyor. Bellek sızıntısı kontrol edilmeli.`);
    }

    return recommendations;
  }

  /**
   * Analyzes parallelization potential and provides recommendations
   * @param {Object} performanceData - Performance data
   * @returns {Array} Recommendations
   * @private
   */
  analyzeParallelizationPotential(performanceData) {
    const recommendations = [];

    if (!performanceData || !performanceData.testDuration || !performanceData.steps || !Array.isArray(performanceData.steps)) {
      return recommendations;
    }

    // Check if test has enough steps to benefit from parallelization
    if (performanceData.steps.length >= 5) {
      // Estimate potential speedup (simplified model)
      const independentSteps = performanceData.steps.filter(step =>
        !['navigate', 'goBack', 'goForward', 'refresh'].includes(step.action)
      ).length;

      if (independentSteps >= 3) {
        // Estimate potential speedup (very simplified)
        const potentialSpeedup = Math.min(70, Math.round(independentSteps * 10));
        recommendations.push(`Bu test paralel çalıştırılarak yaklaşık %${potentialSpeedup} hızlandırılabilir.`);
      }
    }

    // Check if test duration is long enough to benefit from parallelization
    if (performanceData.testDuration > 10000) { // 10 seconds
      recommendations.push(`Test süresi ${(performanceData.testDuration / 1000).toFixed(1)} saniye. Paralel test koşumu ile süre kısaltılabilir.`);
    }

    return recommendations;
  }

  /**
   * Generates a trend report for a test
   * @param {string} testName - Test name
   * @param {number} limit - Maximum number of reports to include
   * @returns {Array} Trend data
   */
  generateTrendReport(testName, limit = 10) {
    // Performans raporlama özelliği geçici olarak devre dışı bırakıldı
    console.log('Performance reporting feature is temporarily disabled');

    return [];
  }
}
