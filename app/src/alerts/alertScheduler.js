/**
 * alertScheduler.js
 * Runs stale lead detection on a schedule using node-cron.
 *
 * Default schedule: Every day at midnight (00:00)
 * Also runs once on server startup for immediate visibility.
 *
 * Cron format: second minute hour day month weekday
 */

const cron                          = require('node-cron');
const { detectStaleLeads, getStaleStats } = require('./staleLeadDetector');
const { sendAlert, sendSummary }    = require('./emailService');

let isSchedulerRunning = false;
let lastRunResult      = null;
let lastRunTime        = null;

// ── Main Alert Run ────────────────────────────────────────────
async function runAlertCheck(source = 'scheduled') {
  console.log(`\n🔔 CarIQ Alert Check — triggered by: ${source}`);
  console.log(`   Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);

  try {
    const stats = getStaleStats();
    lastRunTime   = new Date().toISOString();
    lastRunResult = stats;

    if (stats.total_stale === 0) {
      console.log('   ✅ No stalled leads — all pipelines healthy');
      return { success: true, stale_count: 0, stats };
    }

    console.log(`\n📧 Sending alerts for ${stats.total_stale} stalled lead(s)...`);

    // Send individual alerts for most overdue leads (top 5)
    const topLeads = stats.leads.slice(0, 5);
    for (const lead of topLeads) {
      await sendAlert(lead);
    }

    // Send summary email
    await sendSummary(stats.leads);

    console.log(`\n✅ Alert check complete — ${stats.total_stale} alerts sent`);
    return { success: true, stale_count: stats.total_stale, stats };

  } catch (err) {
    console.error('❌ Alert check failed:', err.message);
    return { success: false, error: err.message };
  }
}

// ── Start Scheduler ───────────────────────────────────────────
function startScheduler() {
  if (isSchedulerRunning) {
    console.log('⚠️  Alert scheduler already running');
    return;
  }

  console.log('\n⏰ CarIQ Alert Scheduler starting...');

  // Run once immediately on startup
  runAlertCheck('startup').then(result => {
    console.log(`\n   Startup check: ${result.stale_count} stalled lead(s) found`);
  });

  // Schedule: every day at midnight
  cron.schedule('0 0 * * *', () => {
    runAlertCheck('midnight-cron');
  }, {
    timezone: 'Asia/Kolkata'
  });

  // Also run every hour for demo purposes (comment out in production)
  cron.schedule('0 * * * *', () => {
    console.log('\n⏰ Hourly alert check...');
    runAlertCheck('hourly-cron');
  });

  isSchedulerRunning = true;
  console.log('✅ Alert scheduler active — runs at midnight IST daily');
  console.log('   Also runs hourly for demo visibility\n');
}

function getSchedulerStatus() {
  return {
    is_running:      isSchedulerRunning,
    last_run_time:   lastRunTime,
    last_run_result: lastRunResult,
  };
}

module.exports = { startScheduler, runAlertCheck, getSchedulerStatus };