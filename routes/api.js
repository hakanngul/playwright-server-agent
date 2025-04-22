import express from 'express';
import { elementService, scenarioService, resultService, testResultService } from '../database/index.js';
import reportImportService from '../database/reportImportService.js';

const router = express.Router();

// Element routes
router.get('/elements/list', (req, res) => {
  try {
    console.log('GET /elements/list API call received');
    const elements = elementService.getAllElements();
    console.log('Returning elements:', elements);
    res.json(elements);
  } catch (error) {
    console.error('Error fetching elements:', error);
    res.status(500).json({ error: 'Failed to fetch elements' });
  }
});

router.get('/elements/:id', (req, res) => {
  try {
    const element = elementService.getElementById(req.params.id);
    if (!element) {
      return res.status(404).json({ error: 'Element not found' });
    }
    res.json(element);
  } catch (error) {
    console.error('Error fetching element:', error);
    res.status(500).json({ error: 'Failed to fetch element' });
  }
});

router.post('/elements/save', (req, res) => {
  try {
    console.log('POST /elements/save API call received');
    console.log('Received element data:', req.body);

    // Adapt frontend format to database format
    const elementData = {
      name: req.body.name,
      selector: req.body.locator,
      selector_type: req.body.strategy,
      description: req.body.description || '',
      page_name: req.body.screen || 'Default Screen'
    };

    console.log('Converted element data for database:', elementData);

    let result;
    if (req.body.id) {
      // Update existing element
      console.log('Updating existing element with ID:', req.body.id);
      const success = elementService.updateElement(req.body.id, elementData);
      if (!success) {
        console.error('Element not found for update:', req.body.id);
        return res.status(404).json({ error: 'Element not found' });
      }
      result = { ...elementData, id: req.body.id };
    } else {
      // Create new element
      console.log('Creating new element');
      result = elementService.createElement(elementData);
      console.log('Created element with ID:', result.id);
    }

    // Convert back to frontend format
    const responseElement = {
      id: result.id,
      name: result.name,
      strategy: result.selector_type,
      locator: result.selector,
      screen: result.page_name,
      description: result.description,
      createdAt: result.created_at,
      updatedAt: result.updated_at || result.created_at
    };

    console.log('Sending response element:', responseElement);
    res.status(201).json(responseElement);
  } catch (error) {
    console.error('Error saving element:', error);
    res.status(500).json({ error: 'Failed to save element' });
  }
});

router.delete('/elements/delete/:id', (req, res) => {
  try {
    const success = elementService.deleteElement(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Element not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting element:', error);
    res.status(500).json({ error: 'Failed to delete element' });
  }
});

// Scenario routes
router.get('/scenarios', (req, res) => {
  try {
    const scenarios = scenarioService.getAllScenarios();
    res.json(scenarios);
  } catch (error) {
    console.error('Error fetching scenarios:', error);
    res.status(500).json({ error: 'Failed to fetch scenarios' });
  }
});

router.get('/scenarios/:id', (req, res) => {
  try {
    const scenario = scenarioService.getScenarioById(req.params.id);
    if (!scenario) {
      return res.status(404).json({ error: 'Scenario not found' });
    }
    res.json(scenario);
  } catch (error) {
    console.error('Error fetching scenario:', error);
    res.status(500).json({ error: 'Failed to fetch scenario' });
  }
});

router.post('/scenarios', (req, res) => {
  try {
    const scenario = scenarioService.createScenario(req.body);
    res.status(201).json(scenario);
  } catch (error) {
    console.error('Error creating scenario:', error);
    res.status(500).json({ error: 'Failed to create scenario' });
  }
});

router.put('/scenarios/:id', (req, res) => {
  try {
    const success = scenarioService.updateScenario(req.params.id, req.body);
    if (!success) {
      return res.status(404).json({ error: 'Scenario not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating scenario:', error);
    res.status(500).json({ error: 'Failed to update scenario' });
  }
});

router.delete('/scenarios/:id', (req, res) => {
  try {
    const success = scenarioService.deleteScenario(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Scenario not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting scenario:', error);
    res.status(500).json({ error: 'Failed to delete scenario' });
  }
});

// Test result routes
router.get('/results', (req, res) => {
  try {
    const results = resultService.getAllTestResults();
    res.json(results);
  } catch (error) {
    console.error('Error fetching test results:', error);
    res.status(500).json({ error: 'Failed to fetch test results' });
  }
});

router.get('/results/recent', (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;

    // Try to get results from the new testResultService first
    let results;
    try {
      results = testResultService.getAllTestResults({ limit });

      // Performans metriklerini ekle
      if (results && Array.isArray(results)) {
        results = results.map(result => {
          if (result.custom_data) {
            try {
              // custom_data bir string veya nesne olabilir
              const customData = typeof result.custom_data === 'string' ?
                JSON.parse(result.custom_data) : result.custom_data;

              // Tüm custom_data içeriğini result nesnesine ekle
              if (customData) {
                result.metrics = customData.metrics || {};
                result.performance = customData.performance || {};
                result.webVitals = customData.webVitals || customData.performance?.webVitals || null;
                result.networkMetrics = customData.networkMetrics || customData.performance?.networkMetrics || null;
                result.warnings = customData.warnings || customData.performance?.warnings || [];
                result.recommendations = customData.recommendations || [
                  ...(customData.performance?.webVitalsAnalysis?.recommendations || []),
                  ...(customData.performance?.networkAnalysis?.recommendations || [])
                ];
              }
            } catch (parseErr) {
              console.warn('Error parsing custom_data:', parseErr);
            }
          }
          return result;
        });
      }
    } catch (err) {
      console.warn('Error using testResultService, falling back to resultService:', err);
      results = resultService.getRecentTestResults(limit);
    }

    res.json(results);
  } catch (error) {
    console.error('Error fetching recent test results:', error);
    res.status(500).json({ error: 'Failed to fetch recent test results' });
  }
});

router.get('/results/stats', (req, res) => {
  try {
    const stats = resultService.getTestResultStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching test result stats:', error);
    res.status(500).json({ error: 'Failed to fetch test result stats' });
  }
});

router.get('/results/:id', (req, res) => {
  try {
    // Try to get result from the new testResultService first
    let result;
    try {
      result = testResultService.getTestResultById(req.params.id);

      // Performans metriklerini ekle
      if (result && result.custom_data) {
        try {
          // custom_data bir string veya nesne olabilir
          const customData = typeof result.custom_data === 'string' ?
            JSON.parse(result.custom_data) : result.custom_data;

          // Tüm custom_data içeriğini result nesnesine ekle
          if (customData) {
            result.metrics = customData.metrics || {};
            result.performance = customData.performance || {};
            result.webVitals = customData.webVitals || customData.performance?.webVitals || null;
            result.networkMetrics = customData.networkMetrics || customData.performance?.networkMetrics || null;
            result.warnings = customData.warnings || customData.performance?.warnings || [];
            result.recommendations = customData.recommendations || [
              ...(customData.performance?.webVitalsAnalysis?.recommendations || []),
              ...(customData.performance?.networkAnalysis?.recommendations || [])
            ];
          }
        } catch (parseErr) {
          console.warn('Error parsing custom_data:', parseErr);
        }
      }
    } catch (err) {
      console.warn('Error using testResultService:', err);
      // If there's an error with testResultService, try resultService
      try {
        result = resultService.getTestResultById(req.params.id);
      } catch (err2) {
        console.warn('Error using resultService:', err2);
      }
    }

    if (!result) {
      return res.status(404).json({ error: 'Test result not found' });
    }
    res.json(result);
  } catch (error) {
    console.error('Error fetching test result:', error);
    res.status(500).json({ error: 'Failed to fetch test result' });
  }
});

router.post('/results', (req, res) => {
  try {
    const result = resultService.createTestResult(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating test result:', error);
    res.status(500).json({ error: 'Failed to create test result' });
  }
});

router.delete('/results/:id', (req, res) => {
  try {
    const success = resultService.deleteTestResult(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Test result not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting test result:', error);
    res.status(500).json({ error: 'Failed to delete test result' });
  }
});

// Report import routes
router.post('/reports/import/all', async (req, res) => {
  try {
    const result = await reportImportService.importAllDailyReports();
    res.json(result);
  } catch (error) {
    console.error('Error importing all reports:', error);
    res.status(500).json({ error: 'Failed to import all reports' });
  }
});

router.post('/reports/import/:date', async (req, res) => {
  try {
    const date = req.params.date;
    const result = await reportImportService.importReportsForDate(date);
    res.json(result);
  } catch (error) {
    console.error(`Error importing reports for ${req.params.date}:`, error);
    res.status(500).json({ error: `Failed to import reports for ${req.params.date}` });
  }
});

router.get('/reports/file/:date', async (req, res) => {
  try {
    const date = req.params.date;
    const result = await reportImportService.importReportsForDate(date);

    // Raporları veritabanından al
    const testResults = reportImportService.getRecentTestResults(100);
    res.json({
      importResult: result,
      testResults
    });
  } catch (error) {
    console.error(`Error getting reports for ${req.params.date}:`, error);
    res.status(500).json({ error: `Failed to get reports for ${req.params.date}` });
  }
});

// Performans raporu endpoint'i
router.get('/results/:id/performance', async (req, res) => {
  try {
    const resultId = req.params.id;

    // Önce test sonucunu al
    let result;
    try {
      result = testResultService.getTestResultById(resultId);
    } catch (err) {
      console.warn('Error using testResultService:', err);
      return res.status(404).json({ error: 'Test result not found' });
    }

    if (!result) {
      return res.status(404).json({ error: 'Test result not found' });
    }

    // Performans metriklerini çıkar
    let performanceData = null;
    let webVitals = null;
    let networkMetrics = null;

    if (result.custom_data) {
      try {
        // custom_data bir string veya nesne olabilir
        const customData = typeof result.custom_data === 'string' ?
          JSON.parse(result.custom_data) : result.custom_data;
        // Doğrudan performance alanını kontrol et
        if (customData.performance) {
          performanceData = customData.performance;
        }
        // Doğrudan webVitals ve networkMetrics alanlarını kontrol et
        if (customData.webVitals) {
          webVitals = customData.webVitals;
        }
        if (customData.networkMetrics) {
          networkMetrics = customData.networkMetrics;
        }
      } catch (parseErr) {
        console.warn('Error parsing custom_data:', parseErr);
      }
    }

    // Eğer performanceData yoksa ama webVitals veya networkMetrics varsa, performanceData oluştur
    if (!performanceData && (webVitals || networkMetrics)) {
      performanceData = {};
      if (webVitals) performanceData.webVitals = webVitals;
      if (networkMetrics) performanceData.networkMetrics = networkMetrics;
    }

    if (!performanceData) {
      return res.status(404).json({ error: 'Performance data not found for this test result' });
    }

    // URL bilgisini al
    let url = null;
    if (result.steps && Array.isArray(result.steps) && result.steps.length > 0) {
      const navigateStep = result.steps.find(step => step.action_type === 'navigate');
      if (navigateStep) {
        url = navigateStep.action_value;
      }
    }

    res.json({
      id: result.id,
      name: result.name || 'Test Result',
      url: url,
      startTime: result.start_time,
      endTime: result.end_time,
      duration: result.duration_ms,
      performance: performanceData,
      webVitals: webVitals,
      networkMetrics: networkMetrics,
      recommendations: result.recommendations || []
    });
  } catch (error) {
    console.error(`Error getting performance report for ${req.params.id}:`, error);
    res.status(500).json({ error: `Failed to get performance report for ${req.params.id}` });
  }
});

// Rapor ID'si ile ağ performans metriklerine erişim endpoint'i
router.get('/reports/:id/network-metrics', async (req, res) => {
  try {
    const reportId = req.params.id;

    // Rapor dosyasını oku
    let reportData;
    try {
      // Rapor dosyasını bulmak için find komutunu kullan
      const { execSync } = await import('child_process');
      const findCommand = `find data/reports -name "${reportId}.json"`;
      const reportPath = execSync(findCommand).toString().trim();

      if (!reportPath) {
        throw new Error(`Report file not found: ${reportId}.json`);
      }
      const fs = await import('fs');
      const reportContent = fs.readFileSync(reportPath, 'utf8');
      reportData = JSON.parse(reportContent);
    } catch (err) {
      console.warn('Error reading report file:', err);
      return res.status(404).json({ error: 'Report not found' });
    }

    if (!reportData) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Network metriklerini çıkar
    const networkMetrics = reportData.performance?.networkMetrics;
    const networkTimeline = reportData.performance?.networkTimeline || reportData.networkTimeline;
    const networkAnalysis = reportData.performance?.networkAnalysis || reportData.networkAnalysis;
    const uncacheableResources = reportData.performance?.uncacheableResources || reportData.uncacheableResources;
    const largeResources = reportData.performance?.largeResources || reportData.largeResources;
    const timingMetrics = reportData.performance?.timingMetrics || reportData.timingMetrics;

    if (!networkMetrics) {
      return res.status(404).json({ error: 'Network metrics not found for this report' });
    }

    // Kaynak türü istatistiklerini düzenle
    const resourceStats = [];
    if (networkMetrics.statsByType) {
      Object.entries(networkMetrics.statsByType).forEach(([type, stats]) => {
        resourceStats.push({
          type,
          count: stats.count,
          totalSize: stats.totalSize,
          averageDuration: stats.averageDuration,
          slowCount: stats.slowCount || 0,
          largeCount: stats.largeCount || 0
        });
      });
    }

    res.json({
      id: reportId,
      name: reportData.name || 'Test Report',
      url: reportData.steps && reportData.steps.length > 0 ? reportData.steps[0].value : null,
      timestamp: reportData.timestamp,
      networkMetrics: {
        totalRequests: networkMetrics.totalRequests,
        totalSize: networkMetrics.totalSize,
        averageDuration: networkMetrics.averageDuration,
        slowRequests: networkMetrics.slowRequests || [],
        failedRequests: networkMetrics.failedRequests || [],
        resourceStats: resourceStats,
        timingMetrics: timingMetrics || {},
        uncacheableResources: uncacheableResources || [],
        largeResources: largeResources || []
      },
      networkAnalysis: networkAnalysis || { issues: [], recommendations: [] },
      timeline: networkTimeline || [],
      recommendations: reportData.recommendations || []
    });
  } catch (error) {
    console.error(`Error getting network metrics for report ${req.params.id}:`, error);
    res.status(500).json({ error: `Failed to get network metrics for report ${req.params.id}` });
  }
});

// Eski endpoint'i de koru (geriye dönük uyumluluk için)
router.get('/reports/:id/performance', async (req, res) => {
  try {
    // Rapor ID'sini test sonuç ID'sine çevir
    const reportId = req.params.id;

    // Rapor ID'si ile test sonuç ID'sini bul
    let testResultId = null;

    // Veritabanından tüm test sonuçlarını al
    const allResults = testResultService.getAllTestResults({ limit: 100 });

    // Rapor ID'sine sahip test sonucunu bul
    for (const result of allResults) {
      if (result.custom_data) {
        try {
          // custom_data bir string veya nesne olabilir
          const customData = typeof result.custom_data === 'string' ?
            JSON.parse(result.custom_data) : result.custom_data;
          if (customData.reportId === reportId) {
            testResultId = result.id;
            break;
          }
        } catch (parseErr) {
          console.warn('Error parsing custom_data:', parseErr);
        }
      }
    }

    if (!testResultId) {
      return res.status(404).json({ error: 'Test result not found for this report ID' });
    }

    // Test sonuç ID'si ile Performance endpoint'ine yönlendir
    res.redirect(`/api/results/${testResultId}/performance`);
  } catch (error) {
    console.error(`Error getting performance report for ${req.params.id}:`, error);
    res.status(500).json({ error: `Failed to get performance report for ${req.params.id}` });
  }
});

// Network Metrics endpoint'i
router.get('/results/:id/network-metrics', async (req, res) => {
  try {
    const resultId = req.params.id;

    // Önce test sonucunu al
    let result;
    try {
      result = testResultService.getTestResultById(resultId);
    } catch (err) {
      console.warn('Error using testResultService:', err);
      return res.status(404).json({ error: 'Test result not found' });
    }

    if (!result) {
      return res.status(404).json({ error: 'Test result not found' });
    }

    // Network metriklerini çıkar
    let networkMetrics = null;
    let timingMetrics = null;
    let networkTimeline = null;
    let networkAnalysis = null;
    let uncacheableResources = null;
    let largeResources = null;

    if (result.custom_data) {
      try {
        // custom_data bir string veya nesne olabilir
        const customData = typeof result.custom_data === 'string' ?
          JSON.parse(result.custom_data) : result.custom_data;

        // Doğrudan networkMetrics alanını kontrol et
        if (customData.networkMetrics) {
          networkMetrics = customData.networkMetrics;
        }
        // Eğer yoksa, performance.networkMetrics alanını kontrol et
        else if (customData.performance && customData.performance.networkMetrics) {
          networkMetrics = customData.performance.networkMetrics;
        }

        // Diğer ağ metriklerini kontrol et
        if (customData.performance) {
          timingMetrics = customData.performance.timingMetrics;
          networkTimeline = customData.performance.networkTimeline;
          networkAnalysis = customData.performance.networkAnalysis;
          uncacheableResources = customData.performance.uncacheableResources;
          largeResources = customData.performance.largeResources;
        }
      } catch (parseErr) {
        console.warn('Error parsing custom_data:', parseErr);
      }
    }

    if (!networkMetrics) {
      return res.status(404).json({ error: 'Network metrics not found for this test result' });
    }

    // URL bilgisini al
    let url = null;
    if (result.steps && Array.isArray(result.steps) && result.steps.length > 0) {
      const navigateStep = result.steps.find(step => step.action_type === 'navigate');
      if (navigateStep) {
        url = navigateStep.action_value;
      }
    }

    // Kaynak türü istatistiklerini düzenle
    const resourceStats = [];
    if (networkMetrics.statsByType) {
      Object.entries(networkMetrics.statsByType).forEach(([type, stats]) => {
        resourceStats.push({
          type,
          count: stats.count,
          totalSize: stats.totalSize,
          averageDuration: stats.averageDuration,
          slowCount: stats.slowCount || 0,
          largeCount: stats.largeCount || 0
        });
      });
    }

    res.json({
      id: result.id,
      name: result.name || 'Test Result',
      url: url,
      timestamp: result.start_time,
      networkMetrics: {
        totalRequests: networkMetrics.totalRequests,
        totalSize: networkMetrics.totalSize,
        averageDuration: networkMetrics.averageDuration,
        slowRequests: networkMetrics.slowRequests || [],
        failedRequests: networkMetrics.failedRequests || [],
        resourceStats: resourceStats,
        timingMetrics: timingMetrics || {},
        uncacheableResources: uncacheableResources || [],
        largeResources: largeResources || []
      },
      networkAnalysis: networkAnalysis || { issues: [], recommendations: [] },
      timeline: networkTimeline || [],
      recommendations: result.recommendations || []
    });
  } catch (error) {
    console.error(`Error getting network metrics for ${req.params.id}:`, error);
    res.status(500).json({ error: `Failed to get network metrics for ${req.params.id}` });
  }
});

// Performans trend raporu endpoint'i
router.get('/performance/trend/:testName', async (req, res) => {
  try {
    const testName = req.params.testName;
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;

    // services/performance klasöründen PerformanceReporter'ı import et
    const { PerformanceReporter } = await import('../services/performance/PerformanceReporter.js');

    // PerformanceReporter örneği oluştur
    const performanceReporter = new PerformanceReporter();

    // Trend raporunu oluştur
    const trendData = performanceReporter.generateTrendReport(testName, limit);

    res.json({
      testName,
      limit,
      trendData
    });
  } catch (error) {
    console.error(`Error generating trend report for ${req.params.testName}:`, error);
    res.status(500).json({ error: `Failed to generate trend report for ${req.params.testName}` });
  }
});

// Web Vitals endpoint'i
router.get('/results/:id/web-vitals', async (req, res) => {
  try {
    const resultId = req.params.id;

    // Önce test sonucunu al
    let result;
    try {
      result = testResultService.getTestResultById(resultId);
    } catch (err) {
      console.warn('Error using testResultService:', err);
      return res.status(404).json({ error: 'Test result not found' });
    }

    if (!result) {
      return res.status(404).json({ error: 'Test result not found' });
    }

    // Web Vitals metriklerini çıkar
    let webVitals = null;

    if (result.custom_data) {
      try {
        // custom_data bir string veya nesne olabilir
        const customData = typeof result.custom_data === 'string' ?
          JSON.parse(result.custom_data) : result.custom_data;
        // Doğrudan webVitals alanını kontrol et
        if (customData.webVitals) {
          webVitals = customData.webVitals;
        }
        // Eğer yoksa, performance.webVitals alanını kontrol et
        else if (customData.performance && customData.performance.webVitals) {
          webVitals = customData.performance.webVitals;
        }
      } catch (parseErr) {
        console.warn('Error parsing custom_data:', parseErr);
      }
    }

    if (!webVitals) {
      return res.status(404).json({ error: 'Web Vitals data not found for this test result' });
    }

    // Web Vitals skorlarını hesapla
    const scores = {};

    // FCP skoru
    if (webVitals.fcp) {
      if (webVitals.fcp < 1000) {
        scores.fcp = { score: 'good', value: webVitals.fcp };
      } else if (webVitals.fcp < 3000) {
        scores.fcp = { score: 'needs-improvement', value: webVitals.fcp };
      } else {
        scores.fcp = { score: 'poor', value: webVitals.fcp };
      }
    }

    // LCP skoru
    if (webVitals.lcp) {
      if (webVitals.lcp < 2500) {
        scores.lcp = { score: 'good', value: webVitals.lcp };
      } else if (webVitals.lcp < 4000) {
        scores.lcp = { score: 'needs-improvement', value: webVitals.lcp };
      } else {
        scores.lcp = { score: 'poor', value: webVitals.lcp };
      }
    }

    // CLS skoru
    if (webVitals.cls !== undefined) {
      if (webVitals.cls < 0.1) {
        scores.cls = { score: 'good', value: webVitals.cls };
      } else if (webVitals.cls < 0.25) {
        scores.cls = { score: 'needs-improvement', value: webVitals.cls };
      } else {
        scores.cls = { score: 'poor', value: webVitals.cls };
      }
    }

    // FID skoru
    if (webVitals.fid) {
      if (webVitals.fid < 100) {
        scores.fid = { score: 'good', value: webVitals.fid };
      } else if (webVitals.fid < 300) {
        scores.fid = { score: 'needs-improvement', value: webVitals.fid };
      } else {
        scores.fid = { score: 'poor', value: webVitals.fid };
      }
    }

    // TTFB skoru
    if (webVitals.ttfb) {
      if (webVitals.ttfb < 600) {
        scores.ttfb = { score: 'good', value: webVitals.ttfb };
      } else if (webVitals.ttfb < 1000) {
        scores.ttfb = { score: 'needs-improvement', value: webVitals.ttfb };
      } else {
        scores.ttfb = { score: 'poor', value: webVitals.ttfb };
      }
    }

    // Önerileri ekle
    let recommendations = [];

    if (result.recommendations && Array.isArray(result.recommendations)) {
      recommendations = result.recommendations;
    }

    // URL bilgisini al
    let url = null;
    if (result.steps && Array.isArray(result.steps) && result.steps.length > 0) {
      const navigateStep = result.steps.find(step => step.action_type === 'navigate');
      if (navigateStep) {
        url = navigateStep.action_value;
      }
    }

    res.json({
      id: result.id,
      name: result.name || 'Test Result',
      url: url,
      timestamp: result.start_time,
      webVitals,
      scores,
      recommendations: [...new Set(recommendations)] // Duplicate'leri kaldır
    });
  } catch (error) {
    console.error(`Error getting Web Vitals for ${req.params.id}:`, error);
    res.status(500).json({ error: `Failed to get Web Vitals for ${req.params.id}` });
  }
});

// Eski endpoint'i de koru (geriye dönük uyumluluk için)
router.get('/reports/:id/web-vitals', async (req, res) => {
  try {
    // Rapor ID'sini test sonuç ID'sine çevir
    const reportId = req.params.id;

    // Rapor ID'si ile test sonuç ID'sini bul
    let testResultId = null;

    // Veritabanından tüm test sonuçlarını al
    const allResults = testResultService.getAllTestResults({ limit: 100 });

    // Rapor ID'sine sahip test sonucunu bul
    for (const result of allResults) {
      if (result.custom_data) {
        try {
          // custom_data bir string veya nesne olabilir
          const customData = typeof result.custom_data === 'string' ?
            JSON.parse(result.custom_data) : result.custom_data;
          if (customData.reportId === reportId) {
            testResultId = result.id;
            break;
          }
        } catch (parseErr) {
          console.warn('Error parsing custom_data:', parseErr);
        }
      }
    }

    if (!testResultId) {
      return res.status(404).json({ error: 'Test result not found for this report ID' });
    }

    // Test sonuç ID'si ile Web Vitals endpoint'ine yönlendir
    res.redirect(`/api/results/${testResultId}/web-vitals`);
  } catch (error) {
    console.error(`Error getting Web Vitals for report ${req.params.id}:`, error);
    res.status(500).json({ error: `Failed to get Web Vitals for report ${req.params.id}` });
  }
});

export default router;
