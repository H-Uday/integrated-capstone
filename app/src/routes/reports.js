const express = require('express');
const router  = express.Router();
const {
  generateMonthlyReport,
  previewReportData,
  getQuickStatsRoute,
  downloadAnalyticsPDF,
} = require('../controllers/reportsController');

router.get('/monthly',       generateMonthlyReport);
router.get('/preview',       previewReportData);
router.get('/quick-stats',   getQuickStatsRoute);
router.get('/analytics-pdf', downloadAnalyticsPDF);

module.exports = router;