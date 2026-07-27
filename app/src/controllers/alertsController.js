const { detectStaleLeads, getStaleStats, SEGMENT_BENCHMARKS } = require('../alerts/staleLeadDetector');
const { runAlertCheck, getSchedulerStatus }                    = require('../alerts/alertScheduler');

// GET /api/alerts/stalled
function getStalledLeads(req, res) {
  try {
    const stats = getStaleStats();
    return res.status(200).json({
      success:   true,
      summary: {
        total_open:    stats.total_open,
        total_stale:   stats.total_stale,
        total_healthy: stats.total_healthy,
        stale_rate:    `${stats.stale_rate}%`,
        by_segment:    stats.by_segment,
        by_status:     stats.by_status,
      },
      benchmarks: SEGMENT_BENCHMARKS,
      stalled_leads: stats.leads.map(l => ({
        lead_id:        l.lead_id,
        customer_name:  l.customer_name,
        vehicle:        l.vehicle,
        segment:        l.segment,
        dealer_name:    l.dealer_name,
        state:          l.state,
        status:         l.status,
        enquiry_date:   l.enquiry_date,
        days_open:      l.days_stale,
        benchmark_days: l.benchmark_days,
        overdue_days:   l.overage_days,
      })),
    });
  } catch (err) {
    console.error('getStalledLeads error:', err.message);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

// POST /api/alerts/trigger
async function triggerAlerts(req, res) {
  try {
    console.log('\n📣 Manual alert trigger via API');
    const result = await runAlertCheck('manual-api');
    return res.status(200).json({
      success:     true,
      message:     `Alert check complete — ${result.stale_count} stalled lead(s) found`,
      stale_count: result.stale_count,
      stats:       result.stats,
    });
  } catch (err) {
    console.error('triggerAlerts error:', err.message);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

// GET /api/alerts/status
function getAlertStatus(req, res) {
  try {
    const status = getSchedulerStatus();
    return res.status(200).json({
      success: true,
      scheduler: status,
      benchmarks: SEGMENT_BENCHMARKS,
      alert_mode: process.env.ALERT_ENABLED === 'true' ? 'EMAIL' : 'LOG-ONLY',
    });
  } catch (err) {
    console.error('getAlertStatus error:', err.message);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

// GET /api/alerts/benchmarks
function getBenchmarks(req, res) {
  return res.status(200).json({
    success:    true,
    benchmarks: SEGMENT_BENCHMARKS,
    description: 'Alert threshold = 1.5× segment average close time from Q3 EDA analysis',
  });
}

module.exports = { getStalledLeads, triggerAlerts, getAlertStatus, getBenchmarks };