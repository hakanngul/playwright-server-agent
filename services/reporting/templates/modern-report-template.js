/**
 * Modern HTML Report Template with Dark Mode and Embedded Video
 */

import path from 'path';

/**
 * Generates a modern HTML report for a test result
 * @param {Object} result - Test result
 * @returns {string} HTML report content
 */
export function generateModernHtmlReport(result) {
  // Yardımcı fonksiyonlar
  const formatDuration = (ms) => {
    if (ms === undefined || ms === null) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString();
  };

  const getStatusClass = (success) => {
    return success ? 'success' : 'failure';
  };

  const getStatusIcon = (success) => {
    return success ? '✅' : '❌';
  };

  // Karmaşık nesneleri biçimlendirme fonksiyonları
  const formatBytes = (bytes) => {
    if (bytes === 0 || bytes === undefined || bytes === null) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatObject = (obj, depth = 0, maxDepth = 2) => {
    if (obj === null || obj === undefined) return 'N/A';
    if (typeof obj !== 'object') return String(obj);
    if (depth >= maxDepth) return '{...}';

    if (Array.isArray(obj)) {
      if (obj.length === 0) return '[]';
      if (depth === maxDepth - 1) return `[${obj.length} items]`;
      return `[${obj.map(item => formatObject(item, depth + 1, maxDepth)).join(', ')}]`;
    }

    const entries = Object.entries(obj);
    if (entries.length === 0) return '{}';
    if (depth === maxDepth - 1) return `{${entries.length} properties}`;

    return `{${entries.map(([key, value]) => `${key}: ${formatObject(value, depth + 1, maxDepth)}`).join(', ')}}`;
  };

  const formatMemory = (memory) => {
    if (!memory) return 'N/A';
    return `RSS: ${formatBytes(memory.rss)}, Heap: ${formatBytes(memory.heapUsed)}/${formatBytes(memory.heapTotal)}`;
  };

  const formatCpuUsage = (cpu) => {
    if (!cpu) return 'N/A';
    return `User: ${formatDuration(cpu.user / 1000)}, System: ${formatDuration(cpu.system / 1000)}`;
  };

  const formatPerformanceValue = (key, value) => {
    // Özel biçimlendirme kuralları
    if (value === null || value === undefined) return 'N/A';

    // Bellek ile ilgili alanlar
    if (key.includes('memory') || key.includes('Memory')) {
      return formatMemory(value);
    }

    // CPU kullanımı
    if (key.includes('cpuUsage') || key.includes('cpu')) {
      return formatCpuUsage(value);
    }

    // Süre ile ilgili alanlar
    if (key.includes('duration') || key.includes('time') || key.includes('fcp') ||
        key.includes('lcp') || key.includes('fid') || key.includes('ttfb') ||
        key.includes('tti') || key.includes('load')) {
      if (typeof value === 'number') {
        return formatDuration(value);
      }
    }

    // Boyut ile ilgili alanlar
    if (key.includes('size') || key.includes('bytes')) {
      if (typeof value === 'number') {
        return formatBytes(value);
      }
    }

    // Diğer karmaşık nesneler
    if (typeof value === 'object') {
      return formatObject(value);
    }

    // Varsayılan biçimlendirme
    return String(value);
  };

  // Generate steps HTML
  const stepsHtml = result.steps.map((step, index) => {
    let screenshotHtml = '';
    if (step.screenshot) {
      const screenshotFilename = path.basename(step.screenshot);
      screenshotHtml = `
        <div class="screenshot">
          <h4>Ekran Görüntüsü</h4>
          <img src="../screenshots/${screenshotFilename}" alt="Adım ${index + 1} Ekran Görüntüsü" loading="lazy" />
        </div>
      `;
    }

    let errorHtml = '';
    if (step.error) {
      errorHtml = `
        <div class="error">
          <h4>Hata</h4>
          <pre>${step.error}</pre>
        </div>
      `;
    }

    let performanceHtml = '';
    if (step.performance) {
      const performanceEntries = Object.entries(step.performance);
      if (performanceEntries.length > 0) {
        performanceHtml = `
          <div class="step-performance">
            <h4>Adım Performans Metrikleri</h4>
            <table>
              <tr>
                <th>Metrik</th>
                <th>Değer</th>
              </tr>
              ${performanceEntries.map(([key, value]) => `
                <tr>
                  <td>${key}</td>
                  <td>${formatPerformanceValue(key, value)}</td>
                </tr>
              `).join('')}
            </table>
          </div>
        `;
      }
    }

    return `
      <div class="step ${getStatusClass(step.success)}">
        <div class="step-header">
          <span class="step-status">${getStatusIcon(step.success)}</span>
          <span class="step-number">#${index + 1}</span>
          <span class="step-action">${step.action}</span>
          <span class="step-description">${step.description || ''}</span>
          <span class="step-duration">${formatDuration(step.duration)}</span>
          <span class="step-toggle">▼</span>
        </div>
        <div class="step-details">
          <div class="step-info">
            <div><strong>Hedef:</strong> ${step.target || 'N/A'}</div>
            <div><strong>Strateji:</strong> ${step.strategy || 'N/A'}</div>
            <div><strong>Değer:</strong> ${step.value || 'N/A'}</div>
            <div><strong>Süre:</strong> ${formatDuration(step.duration)}</div>
          </div>
          ${errorHtml}
          ${performanceHtml}
          ${screenshotHtml}
        </div>
      </div>
    `;
  }).join('');

  // Generate artifacts HTML
  let artifactsHtml = '';

  // Generate performance metrics HTML
  let performanceHtml = '';
  if (result.performance) {
    // Ana performans metrikleri
    const mainMetrics = [];
    const detailedMetrics = [];

    // Web Vitals
    if (result.performance.webVitals) {
      mainMetrics.push({
        title: 'Web Vitals',
        metrics: Object.entries(result.performance.webVitals).map(([key, value]) => ({ key, value }))
      });
    }

    // Bellek kullanımı
    if (result.performance.initialMemory && result.performance.finalMemory) {
      mainMetrics.push({
        title: 'Bellek Kullanımı',
        metrics: [
          { key: 'Başlangıç Bellek', value: result.performance.initialMemory },
          { key: 'Bitiş Bellek', value: result.performance.finalMemory },
          { key: 'Bellek Farkı', value: result.performance.memoryDiff }
        ]
      });
    }

    // Adım istatistikleri
    if (result.performance.stepStats) {
      mainMetrics.push({
        title: 'Adım İstatistikleri',
        metrics: Object.entries(result.performance.stepStats).map(([key, value]) => ({ key, value }))
      });
    }

    // Network metrikleri
    if (result.performance.networkMetrics) {
      const networkMetrics = result.performance.networkMetrics;

      // Temel network metrikleri
      if (networkMetrics.totalRequests || networkMetrics.totalSize) {
        mainMetrics.push({
          title: 'Network Metrikleri',
          metrics: [
            { key: 'Toplam İstek Sayısı', value: networkMetrics.totalRequests },
            { key: 'Toplam Boyut', value: networkMetrics.totalSize },
            { key: 'Ortalama İstek Süresi', value: networkMetrics.averageDuration }
          ]
        });
      }

      // Detaylı network metrikleri
      if (networkMetrics.statsByType) {
        detailedMetrics.push({
          title: 'Kaynak Türüne Göre İstatistikler',
          metrics: Object.entries(networkMetrics.statsByType).map(([key, value]) => ({ key, value }))
        });
      }
    }

    // Zamanlama metrikleri
    if (result.performance.timingMetrics) {
      mainMetrics.push({
        title: 'Zamanlama Metrikleri',
        metrics: Object.entries(result.performance.timingMetrics).map(([key, value]) => ({ key, value }))
      });
    }

    // Uyarılar
    if (result.performance.warnings && result.performance.warnings.length > 0) {
      mainMetrics.push({
        title: 'Performans Uyarıları',
        metrics: result.performance.warnings.map((warning, index) => ({
          key: `Uyarı ${index + 1}`,
          value: warning.message || warning.type || warning
        }))
      });
    }

    // Öneriler
    if (result.performance.networkAnalysis && result.performance.networkAnalysis.recommendations) {
      detailedMetrics.push({
        title: 'Performans Önerileri',
        metrics: result.performance.networkAnalysis.recommendations.map((rec, index) => ({
          key: `Öneri ${index + 1}`,
          value: rec
        }))
      });
    }

    // Diğer performans metrikleri
    const otherMetrics = Object.entries(result.performance)
      .filter(([key, _]) => {
        const excludedKeys = ['webVitals', 'initialMemory', 'finalMemory', 'memoryDiff', 'stepStats',
                             'networkMetrics', 'timingMetrics', 'warnings', 'networkAnalysis'];
        return !excludedKeys.includes(key);
      })
      .map(([key, value]) => ({ key, value }));

    if (otherMetrics.length > 0) {
      detailedMetrics.push({
        title: 'Diğer Metrikler',
        metrics: otherMetrics
      });
    }

    // Grafik için veri hazırlama
    const chartData = {
      labels: [],
      values: []
    };

    // Web Vitals metriklerini grafiğe ekle
    if (result.performance.webVitals) {
      Object.entries(result.performance.webVitals).forEach(([key, value]) => {
        if (typeof value === 'number') {
          chartData.labels.push(key.toUpperCase());
          chartData.values.push(value);
        }
      });
    }

    // Performans HTML'ini oluştur
    performanceHtml = `
      <div class="performance collapsible-section">
        <div class="collapsible-header">
          <h3>Performans Metrikleri</h3>
          <button class="toggle-btn"><i class="fas fa-chevron-down"></i></button>
        </div>
        <div class="collapsible-content" style="display: none;">
          <div class="metrics-container">
            <div class="metrics-table">
              ${mainMetrics.map(section => `
                <div class="metrics-section">
                  <h4>${section.title}</h4>
                  <table>
                    <tr>
                      <th>Metrik</th>
                      <th>Değer</th>
                    </tr>
                    ${section.metrics.map(({ key, value }) => `
                      <tr>
                        <td>${key}</td>
                        <td>${formatPerformanceValue(key, value)}</td>
                      </tr>
                    `).join('')}
                  </table>
                </div>
              `).join('')}
            </div>
            <div class="metrics-chart">
              <canvas id="performanceChart"></canvas>
            </div>
          </div>

          ${detailedMetrics.length > 0 ? `
            <div class="detailed-metrics">
              <h4>Detaylı Metrikler</h4>
              <div class="accordion">
                ${detailedMetrics.map((section, index) => `
                  <div class="accordion-item">
                    <div class="accordion-header" id="heading-${index}">
                      <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${index}" aria-expanded="false" aria-controls="collapse-${index}">
                        ${section.title}
                      </button>
                    </div>
                    <div id="collapse-${index}" class="accordion-collapse collapse" aria-labelledby="heading-${index}">
                      <div class="accordion-body">
                        <table>
                          <tr>
                            <th>Metrik</th>
                            <th>Değer</th>
                          </tr>
                          ${section.metrics.map(({ key, value }) => `
                            <tr>
                              <td>${key}</td>
                              <td>${formatPerformanceValue(key, value)}</td>
                            </tr>
                          `).join('')}
                        </table>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      </div>
      <script>
        // Create performance chart when section is expanded
        document.querySelector('.performance .toggle-btn').addEventListener('click', function() {
          const content = this.closest('.collapsible-section').querySelector('.collapsible-content');
          if (content.style.display === 'block') {
            return; // Chart already initialized
          }

          // Initialize chart
          setTimeout(() => {
            const ctx = document.getElementById('performanceChart').getContext('2d');
            new Chart(ctx, {
              type: 'bar',
              data: {
                labels: ${JSON.stringify(chartData.labels)},
                datasets: [{
                  label: 'Web Vitals (ms)',
                  data: ${JSON.stringify(chartData.values)},
                  backgroundColor: 'var(--chart-color)',
                  borderColor: 'var(--chart-border)',
                  borderWidth: 1
                }]
              },
              options: {
                responsive: true,
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: {
                      color: 'var(--chart-grid)'
                    },
                    ticks: {
                      color: 'var(--text-color)'
                    }
                  },
                  x: {
                    grid: {
                      color: 'var(--chart-grid)'
                    },
                    ticks: {
                      color: 'var(--text-color)'
                    }
                  }
                },
                plugins: {
                  legend: {
                    labels: {
                      color: 'var(--text-color)'
                    }
                  }
                }
              }
            });
          }, 100);
        });

        // Accordion functionality
        document.querySelectorAll('.accordion-button').forEach(button => {
          button.addEventListener('click', () => {
            const target = document.querySelector(button.getAttribute('data-bs-target'));
            if (target) {
              const isExpanded = button.getAttribute('aria-expanded') === 'true';
              button.setAttribute('aria-expanded', !isExpanded);
              button.classList.toggle('collapsed', isExpanded);
              target.classList.toggle('show', !isExpanded);
            }
          });
        });
      </script>
    `;
  }
  if (result.artifacts) {
    const sections = [];

    // Screenshots
    if (result.artifacts.screenshots && result.artifacts.screenshots.length > 0) {
      sections.push(`
        <div class="artifact-section">
          <h4>Ekran Görüntüleri</h4>
          <div class="screenshot-gallery">
            ${result.artifacts.screenshots.map(screenshot => {
              const filename = path.basename(screenshot);
              return `<a href="../screenshots/${filename}" target="_blank" class="screenshot-thumbnail">
                <img src="../screenshots/${filename}" alt="${filename}" loading="lazy" />
                <span>${filename}</span>
              </a>`;
            }).join('')}
          </div>
        </div>
      `);
    }

    // Videos
    if (result.artifacts.videos && result.artifacts.videos.length > 0) {
      sections.push(`
        <div class="artifact-section">
          <h4>Videolar</h4>
          <div class="video-container">
            ${result.artifacts.videos.map(video => {
              const filename = path.basename(video);
              return `
                <div class="video-player">
                  <h5>${filename}</h5>
                  <video controls autoplay="false" preload="metadata">
                    <source src="../videos/${filename}" type="video/webm">
                    <source src="../videos/${filename}" type="video/mp4">
                    Tarayıcınız video etiketini desteklemiyor.
                  </video>
                  <div class="video-controls">
                    <button class="video-btn play-pause" data-action="play"><i class="fas fa-play"></i></button>
                    <button class="video-btn restart" data-action="restart"><i class="fas fa-redo"></i></button>
                    <button class="video-btn fullscreen" data-action="fullscreen"><i class="fas fa-expand"></i></button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `);
    }

    // Traces
    if (result.artifacts.traces && result.artifacts.traces.length > 0) {
      sections.push(`
        <div class="artifact-section">
          <h4>İzler</h4>
          <ul>
            ${result.artifacts.traces.map(trace => {
              const filename = path.basename(trace);
              return `<li><a href="../traces/${filename}" target="_blank">${filename}</a></li>`;
            }).join('')}
          </ul>
        </div>
      `);
    }

    if (sections.length > 0) {
      artifactsHtml = `
        <div class="artifacts collapsible-section">
          <div class="collapsible-header">
            <h3>Artifactlar</h3>
            <button class="toggle-btn active"><i class="fas fa-chevron-down"></i></button>
          </div>
          <div class="collapsible-content" style="display: block;">
            ${sections.join('')}
          </div>
        </div>
      `;
    }
  }

  // Generate HTML report
  return `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Test Raporu: ${result.name}</title>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      <style>
        :root {
          --bg-color: #f8f9fa;
          --bg-secondary: #ffffff;
          --text-color: #333333;
          --text-secondary: #6c757d;
          --border-color: #dee2e6;
          --success-color: #28a745;
          --failure-color: #dc3545;
          --warning-color: #ffc107;
          --info-color: #17a2b8;
          --primary-color: #007bff;
          --primary-color-rgb: 0, 123, 255;
          --secondary-color: #6c757d;
          --chart-color: rgba(0, 123, 255, 0.5);
          --chart-border: rgba(0, 123, 255, 1);
          --chart-grid: rgba(0, 0, 0, 0.1);
          --shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          --transition: all 0.3s ease;
        }

        [data-theme="dark"] {
          --bg-color: #121212;
          --bg-secondary: #1e1e1e;
          --text-color: #e0e0e0;
          --text-secondary: #aaaaaa;
          --border-color: #333333;
          --success-color: #4caf50;
          --failure-color: #f44336;
          --warning-color: #ff9800;
          --info-color: #03a9f4;
          --primary-color: #2196f3;
          --primary-color-rgb: 33, 150, 243;
          --secondary-color: #9e9e9e;
          --chart-color: rgba(33, 150, 243, 0.5);
          --chart-border: rgba(33, 150, 243, 1);
          --chart-grid: rgba(255, 255, 255, 0.1);
          --shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: var(--text-color);
          background-color: var(--bg-color);
          transition: var(--transition);
          padding: 0;
          margin: 0;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .header {
          background-color: var(--bg-secondary);
          border-bottom: 1px solid var(--border-color);
          padding: 20px;
          margin-bottom: 20px;
          border-radius: 8px;
          box-shadow: var(--shadow);
          position: relative;
        }

        .theme-toggle {
          position: absolute;
          top: 20px;
          right: 20px;
          background: none;
          border: none;
          color: var(--text-color);
          font-size: 1.5rem;
          cursor: pointer;
          transition: var(--transition);
        }

        .theme-toggle:hover {
          transform: scale(1.1);
        }

        h1, h2, h3, h4, h5, h6 {
          color: var(--text-color);
          margin-bottom: 1rem;
        }

        .test-info {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }

        .test-info-card {
          background-color: var(--bg-secondary);
          padding: 15px;
          border-radius: 8px;
          box-shadow: var(--shadow);
          transition: var(--transition);
        }

        .test-info-card:hover {
          transform: translateY(-5px);
        }

        .test-info-card h4 {
          margin-bottom: 10px;
          color: var(--primary-color);
          font-size: 1rem;
        }

        .test-info-card p {
          font-size: 1.1rem;
          font-weight: 500;
        }

        .test-summary {
          background-color: var(--bg-secondary);
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
          box-shadow: var(--shadow);
        }

        .success {
          color: var(--success-color);
        }

        .failure {
          color: var(--failure-color);
        }

        .warning {
          color: var(--warning-color);
        }

        .steps-container {
          background-color: var(--bg-secondary);
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
          box-shadow: var(--shadow);
        }

        .step {
          border: 1px solid var(--border-color);
          border-radius: 8px;
          margin-bottom: 15px;
          overflow: hidden;
          transition: var(--transition);
        }

        .step:hover {
          box-shadow: var(--shadow);
        }

        .step-header {
          padding: 15px;
          display: flex;
          align-items: center;
          cursor: pointer;
          background-color: var(--bg-secondary);
          transition: var(--transition);
        }

        .step.success .step-header {
          border-left: 5px solid var(--success-color);
        }

        .step.failure .step-header {
          border-left: 5px solid var(--failure-color);
        }

        .step-status {
          margin-right: 10px;
          font-size: 1.2rem;
        }

        .step-number {
          background-color: var(--primary-color);
          color: white;
          padding: 3px 8px;
          border-radius: 4px;
          margin-right: 10px;
          font-size: 0.8rem;
        }

        .step-action {
          font-weight: bold;
          margin-right: 10px;
        }

        .step-description {
          flex-grow: 1;
          color: var(--text-secondary);
        }

        .step-duration {
          margin-right: 10px;
          color: var(--text-secondary);
          font-size: 0.9rem;
        }

        .step-toggle {
          transition: transform 0.3s ease;
        }

        .step-details {
          padding: 15px;
          border-top: 1px solid var(--border-color);
          background-color: var(--bg-secondary);
        }

        .step-info {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 10px;
          margin-bottom: 15px;
        }

        .step-info div {
          padding: 5px 0;
        }

        .error {
          background-color: rgba(220, 53, 69, 0.1);
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 15px;
        }

        .error pre {
          white-space: pre-wrap;
          word-break: break-word;
          color: var(--failure-color);
        }

        .screenshot {
          margin-top: 15px;
        }

        .screenshot img {
          max-width: 100%;
          border-radius: 8px;
          box-shadow: var(--shadow);
        }

        .step-performance {
          margin-top: 15px;
        }

        .performance {
          background-color: var(--bg-secondary);
          border-radius: 8px;
          margin-bottom: 20px;
          box-shadow: var(--shadow);
          overflow: hidden;
        }

        .collapsible-section {
          background-color: var(--bg-secondary);
          border-radius: 8px;
          margin-bottom: 20px;
          box-shadow: var(--shadow);
          overflow: hidden;
        }

        .collapsible-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 20px;
          background-color: var(--bg-secondary);
          border-bottom: 1px solid var(--border-color);
          cursor: pointer;
        }

        .collapsible-header h3 {
          margin: 0;
        }

        .toggle-btn {
          background: none;
          border: none;
          color: var(--primary-color);
          font-size: 1.2rem;
          cursor: pointer;
          transition: transform 0.3s ease;
        }

        .toggle-btn.active {
          transform: rotate(180deg);
        }

        .collapsible-content {
          padding: 20px;
          background-color: var(--bg-secondary);
        }

        .metrics-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        @media (max-width: 768px) {
          .metrics-container {
            grid-template-columns: 1fr;
          }
        }

        .metrics-table {
          overflow-x: auto;
        }

        .metrics-section {
          margin-bottom: 20px;
          background-color: var(--bg-secondary);
          border-radius: 8px;
          padding: 15px;
          box-shadow: var(--shadow);
        }

        .metrics-section h4 {
          color: var(--primary-color);
          margin-bottom: 10px;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 5px;
        }

        .detailed-metrics {
          margin-top: 30px;
        }

        .accordion {
          margin-top: 15px;
        }

        .accordion-item {
          margin-bottom: 10px;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          overflow: hidden;
        }

        .accordion-header {
          background-color: var(--bg-secondary);
        }

        .accordion-button {
          width: 100%;
          text-align: left;
          padding: 15px;
          background-color: var(--bg-secondary);
          color: var(--text-color);
          border: none;
          cursor: pointer;
          font-weight: bold;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: var(--transition);
        }

        .accordion-button:hover {
          background-color: rgba(var(--primary-color-rgb), 0.1);
        }

        .accordion-button::after {
          content: '\u25BC';
          font-size: 0.8rem;
          transition: transform 0.3s ease;
        }

        .accordion-button.collapsed::after {
          transform: rotate(-90deg);
        }

        .accordion-collapse {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease;
        }

        .accordion-collapse.show {
          max-height: 1000px;
        }

        .accordion-body {
          padding: 15px;
          background-color: var(--bg-secondary);
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th, td {
          padding: 12px 15px;
          text-align: left;
          border-bottom: 1px solid var(--border-color);
        }

        th {
          background-color: var(--primary-color);
          color: white;
        }

        tr:nth-child(even) {
          background-color: rgba(0, 0, 0, 0.05);
        }

        [data-theme="dark"] tr:nth-child(even) {
          background-color: rgba(255, 255, 255, 0.05);
        }

        .artifacts {
          background-color: var(--bg-secondary);
          border-radius: 8px;
          margin-bottom: 20px;
          box-shadow: var(--shadow);
          overflow: hidden;
        }

        .artifact-section {
          margin-bottom: 20px;
        }

        .artifact-section h4 {
          margin-bottom: 15px;
          color: var(--primary-color);
        }

        .artifact-section ul {
          list-style-type: none;
        }

        .artifact-section li {
          margin-bottom: 10px;
        }

        .artifact-section a {
          color: var(--primary-color);
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          transition: var(--transition);
        }

        .artifact-section a:hover {
          text-decoration: underline;
        }

        .artifact-section a::before {
          content: '📎';
          margin-right: 5px;
        }

        .screenshot-gallery {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 15px;
        }

        .screenshot-thumbnail {
          display: block;
          text-decoration: none;
          color: var(--text-color);
          transition: var(--transition);
        }

        .screenshot-thumbnail:hover {
          transform: scale(1.05);
        }

        .screenshot-thumbnail img {
          width: 100%;
          height: 150px;
          object-fit: cover;
          border-radius: 8px;
          box-shadow: var(--shadow);
          margin-bottom: 5px;
        }

        .screenshot-thumbnail span {
          display: block;
          text-align: center;
          font-size: 0.9rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .video-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }

        .video-player {
          margin-bottom: 30px;
          position: relative;
          background-color: var(--bg-secondary);
          border-radius: 8px;
          overflow: hidden;
          box-shadow: var(--shadow);
        }

        .video-player h5 {
          margin-bottom: 10px;
          padding: 10px;
          background-color: var(--primary-color);
          color: white;
          border-radius: 8px 8px 0 0;
        }

        .video-player video {
          width: 100%;
          display: block;
          background-color: #000;
        }

        .video-controls {
          display: flex;
          justify-content: center;
          padding: 10px;
          background-color: rgba(0, 0, 0, 0.05);
          border-top: 1px solid var(--border-color);
        }

        [data-theme="dark"] .video-controls {
          background-color: rgba(255, 255, 255, 0.05);
        }

        .video-btn {
          background-color: var(--primary-color);
          color: white;
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          margin: 0 5px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: var(--transition);
        }

        .video-btn:hover {
          transform: scale(1.1);
          background-color: var(--info-color);
        }

        .video-btn i {
          font-size: 1rem;
        }

        footer {
          text-align: center;
          padding: 20px;
          margin-top: 20px;
          color: var(--text-secondary);
          font-size: 0.9rem;
        }

        /* Animations */
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .fade-in {
          animation: fadeIn 0.5s ease-in-out;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .container {
            padding: 10px;
          }

          .test-info {
            grid-template-columns: 1fr;
          }

          .step-header {
            flex-wrap: wrap;
          }

          .step-description {
            width: 100%;
            margin-top: 5px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container fade-in">
        <div class="header">
          <h1>${result.name}</h1>
          <p>${result.description || 'Test raporu'}</p>
          <button class="theme-toggle" id="themeToggle" aria-label="Tema değiştir">
            <i class="fas fa-moon"></i>
          </button>
        </div>

        <div class="test-info">
          <div class="test-info-card">
            <h4>Durum</h4>
            <p class="${getStatusClass(result.success)}">
              ${result.success ? 'Başarılı ✅' : 'Başarısız ❌'}
            </p>
          </div>
          <div class="test-info-card">
            <h4>Tarayıcı</h4>
            <p>${result.browserType}</p>
          </div>
          <div class="test-info-card">
            <h4>Headless</h4>
            <p>${result.headless ? 'Evet' : 'Hayır'}</p>
          </div>
          <div class="test-info-card">
            <h4>Başlangıç Zamanı</h4>
            <p>${formatDate(result.startTime)}</p>
          </div>
          <div class="test-info-card">
            <h4>Süre</h4>
            <p>${formatDuration(result.duration)}</p>
          </div>
        </div>

        <div class="test-summary">
          <h3>Test Özeti</h3>
          <div class="test-info">
            <div class="test-info-card">
              <h4>Toplam Adım</h4>
              <p>${result.steps.length}</p>
            </div>
            <div class="test-info-card">
              <h4>Başarılı Adım</h4>
              <p class="success">${result.steps.filter(step => step.success).length}</p>
            </div>
            <div class="test-info-card">
              <h4>Başarısız Adım</h4>
              <p class="failure">${result.steps.filter(step => !step.success).length}</p>
            </div>
          </div>
          ${result.error ? `
            <div class="error">
              <h4>Test Hatası</h4>
              <pre>${result.error}</pre>
            </div>
          ` : ''}
        </div>

        <div class="steps-container">
          <h3>Test Adımları</h3>
          ${stepsHtml}
        </div>

        ${artifactsHtml}

        ${performanceHtml}

        <footer>
          <p>Playwright Server Agent tarafından oluşturuldu - ${new Date().toLocaleDateString()}</p>
        </footer>
      </div>

      <script>
        // Theme toggle functionality
        const themeToggle = document.getElementById('themeToggle');
        const icon = themeToggle.querySelector('i');

        // Check for saved theme preference or use preferred color scheme
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
          document.documentElement.setAttribute('data-theme', 'dark');
          icon.classList.replace('fa-moon', 'fa-sun');
        }

        // Toggle theme
        themeToggle.addEventListener('click', () => {
          const currentTheme = document.documentElement.getAttribute('data-theme');
          const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

          document.documentElement.setAttribute('data-theme', newTheme);
          localStorage.setItem('theme', newTheme);

          // Toggle icon
          if (newTheme === 'dark') {
            icon.classList.replace('fa-moon', 'fa-sun');
          } else {
            icon.classList.replace('fa-sun', 'fa-moon');
          }
        });

        // Add click handler to toggle step details
        document.querySelectorAll('.step-header').forEach(header => {
          header.addEventListener('click', () => {
            const details = header.nextElementSibling;
            const toggle = header.querySelector('.step-toggle');

            if (details.style.display === 'none' || !details.style.display) {
              details.style.display = 'block';
              toggle.style.transform = 'rotate(180deg)';
            } else {
              details.style.display = 'none';
              toggle.style.transform = 'rotate(0deg)';
            }
          });
        });

        // Hide all step details initially
        document.querySelectorAll('.step-details').forEach(details => {
          details.style.display = 'none';
        });

        // Show details for failed steps
        document.querySelectorAll('.step.failure .step-details').forEach(details => {
          details.style.display = 'block';
          const toggle = details.previousElementSibling.querySelector('.step-toggle');
          if (toggle) toggle.style.transform = 'rotate(180deg)';
        });

        // Collapsible sections functionality
        document.querySelectorAll('.collapsible-header').forEach(header => {
          header.addEventListener('click', function() {
            const section = this.closest('.collapsible-section');
            const content = section.querySelector('.collapsible-content');
            const toggleBtn = this.querySelector('.toggle-btn');

            if (content.style.display === 'none' || !content.style.display) {
              content.style.display = 'block';
              toggleBtn.classList.add('active');
            } else {
              content.style.display = 'none';
              toggleBtn.classList.remove('active');
            }
          });
        });

        // Video player functionality
        document.querySelectorAll('.video-player').forEach(player => {
          const video = player.querySelector('video');
          const controls = player.querySelector('.video-controls');

          if (video && controls) {
            controls.querySelectorAll('.video-btn').forEach(button => {
              button.addEventListener('click', () => {
                const action = button.getAttribute('data-action');

                switch (action) {
                  case 'play':
                    if (video.paused) {
                      video.play();
                      button.innerHTML = '<i class="fas fa-pause"></i>';
                      button.setAttribute('data-action', 'pause');
                    } else {
                      video.pause();
                      button.innerHTML = '<i class="fas fa-play"></i>';
                      button.setAttribute('data-action', 'play');
                    }
                    break;
                  case 'pause':
                    video.pause();
                    button.innerHTML = '<i class="fas fa-play"></i>';
                    button.setAttribute('data-action', 'play');
                    break;
                  case 'restart':
                    video.currentTime = 0;
                    video.play();
                    const playButton = controls.querySelector('.play-pause');
                    if (playButton) {
                      playButton.innerHTML = '<i class="fas fa-pause"></i>';
                      playButton.setAttribute('data-action', 'pause');
                    }
                    break;
                  case 'fullscreen':
                    if (video.requestFullscreen) {
                      video.requestFullscreen();
                    } else if (video.webkitRequestFullscreen) { /* Safari */
                      video.webkitRequestFullscreen();
                    } else if (video.msRequestFullscreen) { /* IE11 */
                      video.msRequestFullscreen();
                    }
                    break;
                }
              });
            });

            // Update play/pause button when video ends
            video.addEventListener('ended', () => {
              const playButton = controls.querySelector('.play-pause');
              if (playButton) {
                playButton.innerHTML = '<i class="fas fa-play"></i>';
                playButton.setAttribute('data-action', 'play');
              }
            });

            // Update play/pause button when video plays or pauses
            video.addEventListener('play', () => {
              const playButton = controls.querySelector('.play-pause');
              if (playButton) {
                playButton.innerHTML = '<i class="fas fa-pause"></i>';
                playButton.setAttribute('data-action', 'pause');
              }
            });

            video.addEventListener('pause', () => {
              const playButton = controls.querySelector('.play-pause');
              if (playButton) {
                playButton.innerHTML = '<i class="fas fa-play"></i>';
                playButton.setAttribute('data-action', 'play');
              }
            });
          }
        });
      </script>
    </body>
    </html>
  `;
}
