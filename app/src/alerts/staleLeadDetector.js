/**
 * staleLeadDetector.js
 * Detects leads that have gone stale beyond their segment benchmark.
 *
 * Benchmarks (from Q3 EDA findings):
 * - Hatchback : 14.4 days avg → alert at 1.5× = 22 days
 * - Sedan     : 22.0 days avg → alert at 1.5× = 33 days
 * - SUV       : 15.3 days avg → alert at 1.5× = 23 days
 * - MUV       : 16.9 days avg → alert at 1.5× = 25 days
 * - EV        : 16.4 days avg → alert at 1.5× = 25 days
 * - Luxury    : 15.6 days avg → alert at 1.5× = 23 days
 * - Hypercar  : 17.7 days avg → alert at 1.5× = 27 days
 * - Default   : 20.0 days avg → alert at 1.5× = 30 days
 */

const { db } = require('../config/database');

// ── Segment Benchmarks from Q3 EDA (Day 9) ───────────────────
const SEGMENT_BENCHMARKS = {
  'Hatchback': { avg_days: 14.4, alert_threshold: 22 },
  'Sedan':     { avg_days: 22.0, alert_threshold: 33 },
  'SUV':       { avg_days: 15.3, alert_threshold: 23 },
  'MUV':       { avg_days: 16.9, alert_threshold: 25 },
  'EV':        { avg_days: 16.4, alert_threshold: 25 },
  'Luxury':    { avg_days: 15.6, alert_threshold: 23 },
  'Hypercar':  { avg_days: 17.7, alert_threshold: 27 },
  'Default':   { avg_days: 20.0, alert_threshold: 30 },
};

function getThreshold(segment) {
  return SEGMENT_BENCHMARKS[segment] || SEGMENT_BENCHMARKS['Default'];
}

function getDaysSince(dateStr) {
  const enquiry = new Date(dateStr);
  const now     = new Date();
  const diff    = Math.floor((now - enquiry) / (1000 * 60 * 60 * 24));
  return diff;
}

// ── Main Detection Function ───────────────────────────────────
function detectStaleLeads() {
  console.log('\n🔍 Scanning for stalled leads...');

  // Fetch all open leads with customer and vehicle details
  const openLeads = db.prepare(`
    SELECT
      l.lead_id,
      l.customer_id,
      l.vehicle_id,
      l.enquiry_date,
      l.status,
      l.dealer_name,
      l.state,
      l.notes,
      c.full_name     AS customer_name,
      c.email         AS customer_email,
      c.phone         AS customer_phone,
      v.make,
      v.model,
      v.segment,
      v.price_local,
      v.currency_code
    FROM leads l
    JOIN customers c ON l.customer_id = c.customer_id
    JOIN vehicles  v ON l.vehicle_id  = v.vehicle_id
    WHERE l.status IN ('New', 'In-Progress', 'On-Hold')
    ORDER BY l.enquiry_date ASC
  `).all();

  console.log(`   Total open leads: ${openLeads.length}`);

  const staleLeads = [];
  const okLeads    = [];

  openLeads.forEach(lead => {
    const days_stale    = getDaysSince(lead.enquiry_date);
    const benchmark     = getThreshold(lead.segment);
    const threshold     = benchmark.alert_threshold;
    const overage_days  = days_stale - threshold;

    const enriched = {
      ...lead,
      vehicle:        `${lead.make} ${lead.model}`,
      days_stale,
      benchmark_days: threshold,
      avg_days:       benchmark.avg_days,
      overage_days,
      is_stale:       days_stale > threshold,
    };

    if (days_stale > threshold) {
      staleLeads.push(enriched);
    } else {
      okLeads.push(enriched);
    }
  });

  // Sort by most overdue first
  staleLeads.sort((a, b) => b.overage_days - a.overage_days);

  console.log(`   ✅ Healthy leads   : ${okLeads.length}`);
  console.log(`   ⚠️  Stalled leads  : ${staleLeads.length}`);

  if (staleLeads.length > 0) {
    console.log('\n   Stalled Lead Details:');
    staleLeads.forEach(lead => {
      console.log(
        `   Lead #${lead.lead_id} | ${lead.customer_name} | ` +
        `${lead.vehicle} (${lead.segment}) | ` +
        `${lead.days_stale}d open | ` +
        `Threshold: ${lead.benchmark_days}d | ` +
        `Overdue: +${lead.overage_days}d`
      );
    });
  }

  return { staleLeads, okLeads, total: openLeads.length };
}

// ── Stale Lead Stats ──────────────────────────────────────────
function getStaleStats() {
  const { staleLeads, okLeads, total } = detectStaleLeads();

  const bySegment = {};
  staleLeads.forEach(lead => {
    if (!bySegment[lead.segment]) bySegment[lead.segment] = 0;
    bySegment[lead.segment]++;
  });

  const byStatus = {};
  staleLeads.forEach(lead => {
    if (!byStatus[lead.status]) byStatus[lead.status] = 0;
    byStatus[lead.status]++;
  });

  return {
    total_open:    total,
    total_stale:   staleLeads.length,
    total_healthy: okLeads.length,
    stale_rate:    total > 0 ? (staleLeads.length / total * 100).toFixed(1) : '0',
    by_segment:    bySegment,
    by_status:     byStatus,
    leads:         staleLeads,
  };
}

module.exports = { detectStaleLeads, getStaleStats, SEGMENT_BENCHMARKS };