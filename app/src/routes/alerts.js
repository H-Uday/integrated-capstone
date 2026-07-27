const express = require('express');
const router  = express.Router();
const {
  getStalledLeads,
  triggerAlerts,
  getAlertStatus,
  getBenchmarks,
} = require('../controllers/alertsController');

router.get('/stalled',    getStalledLeads);
router.get('/status',     getAlertStatus);
router.get('/benchmarks', getBenchmarks);
router.post('/trigger',   triggerAlerts);

module.exports = router;