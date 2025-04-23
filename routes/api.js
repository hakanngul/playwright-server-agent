import express from 'express';

const router = express.Router();

// Veritabanı desteği kaldırıldı
// Geçici olarak boş veriler döndürelim

// Element routes
router.get('/elements/list', (req, res) => {
  console.log('GET /elements/list API call received');
  res.json([]);
});

router.get('/elements/:id', (req, res) => {
  res.status(404).json({ error: 'Element not found' });
});

router.post('/elements/save', (req, res) => {
  console.log('POST /elements/save API call received');
  console.log('Received element data:', req.body);
  res.status(501).json({ error: 'Database support has been removed' });
});

router.delete('/elements/delete/:id', (req, res) => {
  res.status(501).json({ error: 'Database support has been removed' });
});

// Scenario routes
router.get('/scenarios', (req, res) => {
  res.json([]);
});

router.get('/scenarios/:id', (req, res) => {
  res.status(404).json({ error: 'Scenario not found' });
});

router.post('/scenarios', (req, res) => {
  res.status(501).json({ error: 'Database support has been removed' });
});

router.put('/scenarios/:id', (req, res) => {
  res.status(501).json({ error: 'Database support has been removed' });
});

router.delete('/scenarios/:id', (req, res) => {
  res.status(501).json({ error: 'Database support has been removed' });
});

// Test result routes
router.get('/results', (req, res) => {
  res.json([]);
});

router.get('/results/recent', (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit) : 10;
  res.json([]);
});

router.get('/results/stats', (req, res) => {
  res.json({
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    success_rate: 0
  });
});

router.get('/results/:id', (req, res) => {
  res.status(404).json({ error: 'Test result not found' });
});

router.post('/results', (req, res) => {
  res.status(501).json({ error: 'Database support has been removed' });
});

router.delete('/results/:id', (req, res) => {
  res.status(501).json({ error: 'Database support has been removed' });
});

// Report import routes
router.post('/reports/import/all', async (req, res) => {
  res.status(501).json({ error: 'Database support has been removed' });
});

router.post('/reports/import/:date', async (req, res) => {
  res.status(501).json({ error: 'Database support has been removed' });
});

router.get('/reports/file/:date', async (req, res) => {
  res.status(501).json({ error: 'Database support has been removed' });
});

// Performance report endpoints
router.get('/results/:id/performance', async (req, res) => {
  res.status(404).json({ error: 'Performance data not found' });
});

router.get('/reports/:id/network-metrics', async (req, res) => {
  res.status(404).json({ error: 'Network metrics not found' });
});

router.get('/reports/:id/performance', async (req, res) => {
  res.status(404).json({ error: 'Performance data not found' });
});

router.get('/results/:id/network-metrics', async (req, res) => {
  res.status(404).json({ error: 'Network metrics not found' });
});

router.get('/performance/trend/:testName', async (req, res) => {
  res.json({
    testName: req.params.testName,
    limit: req.query.limit || 10,
    trendData: []
  });
});

router.get('/results/:id/optimization-recommendations', async (req, res) => {
  res.status(404).json({ error: 'Optimization recommendations not found' });
});

router.get('/results/:id/web-vitals', async (req, res) => {
  res.status(404).json({ error: 'Web Vitals data not found' });
});

router.get('/reports/:id/web-vitals', async (req, res) => {
  res.status(404).json({ error: 'Web Vitals data not found' });
});

export default router;
