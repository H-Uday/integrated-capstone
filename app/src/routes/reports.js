const express = require('express');
const router  = express.Router();
const {
  generateMonthlyReport,
  previewReportData,
  getQuickStatsRoute,
} = require('../controllers/reportsController');

router.get('/monthly',     generateMonthlyReport);
router.get('/preview',     previewReportData);
router.get('/quick-stats', getQuickStatsRoute);

module.exports = router;