/**
 * reportData.js
 * Fetches and structures all data needed for PDF reports.
 * Pulls from SQLite database and computes summary statistics.
 */

const { db } = require('../config/database');

function getMonthlyReportData(year, month) {
  const monthStr  = String(month).padStart(2, '0');
  const startDate = `${year}-${monthStr}-01`;
  const endDate   = `${year}-${monthStr}-31`;

  // Monthly transactions
  const transactions = db.prepare(`
    SELECT
      t.*,
      c.full_name, c.city, c.state, c.country,
      c.annual_income_local, c.credit_score,
      v.make, v.model, v.segment, v.fuel_type,
      v.price_local, v.currency_code
    FROM transactions t
    JOIN customers c ON t.customer_id = c.customer_id
    JOIN vehicles  v ON t.vehicle_id  = v.vehicle_id
    WHERE t.transaction_date BETWEEN ? AND ?
    ORDER BY t.transaction_date ASC
  `).all(startDate, endDate);

  // Monthly leads
  const leads = db.prepare(`
    SELECT
      l.*,
      c.full_name,
      v.make, v.model, v.segment
    FROM leads l
    JOIN customers c ON l.customer_id = c.customer_id
    JOIN vehicles  v ON l.vehicle_id  = v.vehicle_id
    WHERE l.enquiry_date BETWEEN ? AND ?
    ORDER BY l.enquiry_date ASC
  `).all(startDate, endDate);

  // Segment breakdown
  const segmentBreakdown = db.prepare(`
    SELECT
      v.segment,
      COUNT(*) as count,
      AVG(t.final_price_inr) as avg_price
    FROM transactions t
    JOIN vehicles v ON t.vehicle_id = v.vehicle_id
    WHERE t.transaction_date BETWEEN ? AND ?
    GROUP BY v.segment
    ORDER BY count DESC
  `).all(startDate, endDate);

  // Payment mode breakdown
  const paymentBreakdown = db.prepare(`
    SELECT payment_mode, COUNT(*) as count
    FROM transactions
    WHERE transaction_date BETWEEN ? AND ?
    GROUP BY payment_mode
  `).all(startDate, endDate);

  // Stalled leads
  const stalledLeads = db.prepare(`
    SELECT
      l.lead_id, l.status, l.enquiry_date,
      l.dealer_name, l.state,
      c.full_name,
      v.make, v.model, v.segment,
      julianday('now') - julianday(l.enquiry_date) as days_open
    FROM leads l
    JOIN customers c ON l.customer_id = c.customer_id
    JOIN vehicles  v ON l.vehicle_id  = v.vehicle_id
    WHERE l.status IN ('New', 'In-Progress', 'On-Hold')
      AND (julianday('now') - julianday(l.enquiry_date)) > 20
    ORDER BY days_open DESC
    LIMIT 10
  `).all();

  // Overall stats
  const totalCustomers    = db.prepare('SELECT COUNT(*) as c FROM customers').get().c;
  const totalVehicles     = db.prepare('SELECT COUNT(*) as c FROM vehicles').get().c;
  const totalLeads        = db.prepare('SELECT COUNT(*) as c FROM leads').get().c;
  const totalTransactions = db.prepare('SELECT COUNT(*) as c FROM transactions').get().c;

  // Loan affordability
  const loanTxns      = transactions.filter(t => t.payment_mode === 'Loan');
  const affordableCount = loanTxns.filter(t => {
    if (!t.emi_amount || !t.annual_income_local) return false;
    const monthly = t.annual_income_local / 12;
    return (t.emi_amount / monthly) <= 0.40;
  }).length;

  const totalRevenue  = transactions.reduce((sum, t) =>
    sum + (t.final_price_inr || 0), 0);
  const avgEMI        = loanTxns.length > 0
    ? loanTxns.reduce((s, t) => s + (t.emi_amount || 0), 0) / loanTxns.length
    : 0;

  const monthNames = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ];

  return {
    report_period: {
      month:      month,
      year:       year,
      month_name: monthNames[month - 1],
      start_date: startDate,
      end_date:   endDate,
    },
    summary: {
      total_transactions:   transactions.length,
      total_leads:          leads.length,
      total_revenue_inr:    Math.round(totalRevenue),
      avg_emi:              Math.round(avgEMI),
      loan_count:           loanTxns.length,
      affordable_count:     affordableCount,
      affordability_rate:   loanTxns.length > 0
        ? Math.round(affordableCount / loanTxns.length * 100)
        : 0,
      stalled_leads:        stalledLeads.length,
    },
    system_totals: {
      customers: totalCustomers,
      vehicles:  totalVehicles,
      leads:     totalLeads,
      transactions: totalTransactions,
    },
    transactions,
    leads,
    segment_breakdown:  segmentBreakdown,
    payment_breakdown:  paymentBreakdown,
    stalled_leads:      stalledLeads,
    generated_at:       new Date().toISOString(),
    generated_by:       'CarIQ Analytics Engine v1.0',
  };
}

function getQuickStats() {
  const customers    = db.prepare('SELECT COUNT(*) as c FROM customers').get().c;
  const vehicles     = db.prepare('SELECT COUNT(*) as c FROM vehicles').get().c;
  const leads        = db.prepare('SELECT COUNT(*) as c FROM leads').get().c;
  const transactions = db.prepare('SELECT COUNT(*) as c FROM transactions').get().c;

  const loanTxns = db.prepare(
    "SELECT * FROM transactions WHERE payment_mode = 'Loan'"
  ).all();

  return { customers, vehicles, leads, transactions, loan_count: loanTxns.length };
}

module.exports = { getMonthlyReportData, getQuickStats };