/**
 * Performance API routes
 * NOT: Performans raporlama özelliği geçici olarak devre dışı bırakıldı
 */

import express from 'express';

// Create router
const router = express.Router();

/**
 * @route GET /api/performance/report/:id
 * @desc Get performance report for a specific test result
 * NOT: Performans raporlama özelliği geçici olarak devre dışı bırakıldı
 */
router.get('/report/:id', async (req, res) => {
  res.status(503).json({
    error: 'Performance reporting feature is temporarily disabled',
    message: 'This feature has been temporarily disabled and will be available in a future update.'
  });
});

/**
 * @route GET /api/performance/web-vitals/:id
 * @desc Get Web Vitals metrics for a specific test result
 * NOT: Performans raporlama özelliği geçici olarak devre dışı bırakıldı
 */
router.get('/web-vitals/:id', async (req, res) => {
  res.status(503).json({
    error: 'Performance reporting feature is temporarily disabled',
    message: 'This feature has been temporarily disabled and will be available in a future update.'
  });
});

/**
 * @route GET /api/performance/network/:id
 * @desc Get network metrics for a specific test result
 * NOT: Performans raporlama özelliği geçici olarak devre dışı bırakıldı
 */
router.get('/network/:id', async (req, res) => {
  res.status(503).json({
    error: 'Performance reporting feature is temporarily disabled',
    message: 'This feature has been temporarily disabled and will be available in a future update.'
  });
});

/**
 * @route GET /api/performance/trend
 * @desc Get performance trend data for a specific test name
 * NOT: Performans raporlama özelliği geçici olarak devre dışı bırakıldı
 */
router.get('/trend', (req, res) => {
  res.status(503).json({
    error: 'Performance reporting feature is temporarily disabled',
    message: 'This feature has been temporarily disabled and will be available in a future update.'
  });
});

/**
 * @route GET /api/performance/optimize/:id
 * @desc Get optimization recommendations for a specific test result
 * NOT: Performans raporlama özelliği geçici olarak devre dışı bırakıldı
 */
router.get('/optimize/:id', async (req, res) => {
  res.status(503).json({
    error: 'Performance reporting feature is temporarily disabled',
    message: 'This feature has been temporarily disabled and will be available in a future update.'
  });
});

export default router;
