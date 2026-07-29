const { getMonthlyReportData, getQuickStats } = require('../reports/reportData');
const { generateMonthlyPDF }                  = require('../reports/pdfGenerator');

// GET /api/reports/monthly?year=2026&month=7
function generateMonthlyReport(req, res) {
  const now   = new Date();
  const year  = parseInt(req.query.year  || now.getFullYear());
  const month = parseInt(req.query.month || now.getMonth() + 1);

  if (year < 2020 || year > 2030) {
    return res.status(400).json({ success: false, error: 'Invalid year' });
  }
  if (month < 1 || month > 12) {
    return res.status(400).json({ success: false, error: 'Invalid month (1-12)' });
  }

  try {
    console.log(`📄 Generating PDF report for ${year}-${month}`);
    const data = getMonthlyReportData(year, month);
    generateMonthlyPDF(data, res);
  } catch (err) {
    console.error('generateMonthlyReport error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: 'PDF generation failed' });
    }
  }
}

// GET /api/reports/preview?year=2026&month=7
function previewReportData(req, res) {
  const now   = new Date();
  const year  = parseInt(req.query.year  || now.getFullYear());
  const month = parseInt(req.query.month || now.getMonth() + 1);

  try {
    const data = getMonthlyReportData(year, month);
    return res.status(200).json({
      success: true,
      data:    {
        report_period:    data.report_period,
        summary:          data.summary,
        system_totals:    data.system_totals,
        segment_breakdown:data.segment_breakdown,
        payment_breakdown:data.payment_breakdown,
        stalled_count:    data.stalled_leads.length,
        transaction_count:data.transactions.length,
        generated_at:     data.generated_at,
      },
    });
  } catch (err) {
    console.error('previewReportData error:', err.message);
    return res.status(500).json({ success: false, error: 'Data fetch failed' });
  }
}

// GET /api/reports/quick-stats
function getQuickStatsRoute(req, res) {
  try {
    const stats = getQuickStats();
    return res.status(200).json({ success: true, stats });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Stats fetch failed' });
  }
}

module.exports = { generateMonthlyReport, previewReportData, getQuickStatsRoute };