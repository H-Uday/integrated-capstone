/**
 * pdfGenerator.js
 * Generates professional PDF reports for CarIQ using PDFKit.
 *
 * Creates a branded, multi-section report with:
 * - Cover page with CarIQ branding
 * - Executive summary with KPIs
 * - Transaction table for the period
 * - Segment performance breakdown
 * - Payment mode analysis
 * - Stalled leads requiring attention
 * - Footer with page numbers
 */

const PDFDocument = require('pdfkit');

// ── Brand Colors ──────────────────────────────────────────────
const COLORS = {
  primary:    '#1a1a2e',
  accent:     '#00d9d9',
  white:      '#ffffff',
  grey:       '#a0a0b0',
  dark:       '#16213e',
  success:    '#2ecc71',
  warning:    '#f39c12',
  danger:     '#e74c3c',
  text:       '#333333',
  lightGrey:  '#f5f5f5',
  border:     '#e0e0e0',
};

function hexToRGB(hex) {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  return [r, g, b];
}

function generateMonthlyPDF(data, res) {
  const doc = new PDFDocument({
    size:    'A4',
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
    info: {
      Title:    `CarIQ Monthly Report — ${data.report_period.month_name} ${data.report_period.year}`,
      Author:   'CarIQ Analytics Engine',
      Subject:  'Automotive Sales & Affordability Report',
      Keywords: 'CarIQ, automotive, sales, EMI, affordability',
    },
  });

  // Pipe directly to response
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition',
    `attachment; filename="CarIQ_Report_${data.report_period.year}_${String(data.report_period.month).padStart(2,'0')}.pdf"`
  );
  doc.pipe(res);

  let pageNum = 1;

  // ── Page 1: Cover ─────────────────────────────────────────
  // Dark background
  doc.rect(0, 0, doc.page.width, doc.page.height)
     .fill(hexToRGB(COLORS.primary));

  // Accent bar
  doc.rect(0, 0, 8, doc.page.height)
     .fill(hexToRGB(COLORS.accent));

  // CarIQ title
  doc.fillColor(hexToRGB(COLORS.accent))
     .font('Helvetica-Bold')
     .fontSize(52)
     .text('CarIQ', 60, 180);

  doc.fillColor(hexToRGB(COLORS.white))
     .font('Helvetica')
     .fontSize(18)
     .text('Global & India Car Sales + Affordability Intelligence', 60, 250);

  // Report type box
  doc.rect(60, 300, 300, 60)
     .fill(hexToRGB(COLORS.dark));
  doc.fillColor(hexToRGB(COLORS.accent))
     .font('Helvetica-Bold')
     .fontSize(11)
     .text('MONTHLY PERFORMANCE REPORT', 75, 315);
  doc.fillColor(hexToRGB(COLORS.white))
     .font('Helvetica')
     .fontSize(14)
     .text(`${data.report_period.month_name} ${data.report_period.year}`, 75, 332);

  // KPI boxes on cover
  const kpis = [
    { label: 'Transactions',      value: String(data.summary.total_transactions) },
    { label: 'Leads',             value: String(data.summary.total_leads) },
    { label: 'Affordability',     value: `${data.summary.affordability_rate}%` },
    { label: 'Stalled Leads',     value: String(data.summary.stalled_leads) },
  ];

  kpis.forEach((kpi, i) => {
    const x = 60 + (i % 2) * 240;
    const y = 390 + Math.floor(i / 2) * 90;
    doc.rect(x, y, 220, 75).fill(hexToRGB(COLORS.dark));
    doc.fillColor(hexToRGB(COLORS.accent))
       .font('Helvetica-Bold').fontSize(28)
       .text(kpi.value, x + 15, y + 10);
    doc.fillColor(hexToRGB(COLORS.grey))
       .font('Helvetica').fontSize(10)
       .text(kpi.label.toUpperCase(), x + 15, y + 50);
  });

  // Footer on cover
  doc.fillColor(hexToRGB(COLORS.grey))
     .font('Helvetica').fontSize(9)
     .text(`Generated: ${new Date(data.generated_at).toLocaleString('en-IN')}`, 60, 720)
     .text(data.generated_by, 60, 734);

  // ── Page 2: Executive Summary ─────────────────────────────
  doc.addPage();
  pageNum++;

  drawPageHeader(doc, 'Executive Summary', data.report_period);
  let y = 120;

  // Summary stats table
  const summaryItems = [
    ['Total Transactions',    data.summary.total_transactions,   null],
    ['Total Leads Created',   data.summary.total_leads,          null],
    ['Total Revenue (₹)',     `₹${data.summary.total_revenue_inr.toLocaleString('en-IN')}`, null],
    ['Loan Transactions',     data.summary.loan_count,           null],
    ['Affordable Loans',      data.summary.affordable_count,     null],
    ['Affordability Rate',    `${data.summary.affordability_rate}%`,
      data.summary.affordability_rate >= 50 ? 'good' : 'warning'],
    ['Avg EMI (Loan)',        `₹${data.summary.avg_emi.toLocaleString('en-IN')}`, null],
    ['Stalled Leads',         data.summary.stalled_leads,
      data.summary.stalled_leads > 5 ? 'warning' : 'good'],
  ];

  summaryItems.forEach(([label, value, status], i) => {
    const rowY  = y + i * 32;
    const isEven = i % 2 === 0;
    doc.rect(50, rowY, 495, 30)
       .fill(isEven ? hexToRGB(COLORS.lightGrey) : hexToRGB(COLORS.white));
    doc.fillColor(hexToRGB(COLORS.text))
       .font('Helvetica').fontSize(11)
       .text(label, 65, rowY + 9, { width: 280 });

    const valColor = status === 'good'    ? hexToRGB(COLORS.success)
                   : status === 'warning' ? hexToRGB(COLORS.warning)
                   : hexToRGB(COLORS.text);
    doc.fillColor(valColor)
       .font('Helvetica-Bold').fontSize(11)
       .text(String(value), 350, rowY + 9, { width: 180, align: 'right' });
  });

  y += summaryItems.length * 32 + 30;

  // System totals
  doc.fillColor(hexToRGB(COLORS.text))
     .font('Helvetica-Bold').fontSize(13)
     .text('System Totals (All-Time)', 50, y);
  y += 25;

  const totals = data.system_totals;
  const totalItems = [
    ['Total Customers',    totals.customers],
    ['Total Vehicles',     totals.vehicles],
    ['Total Leads',        totals.leads],
    ['Total Transactions', totals.transactions],
  ];

  totalItems.forEach(([label, value], i) => {
    const tx = 50 + (i % 2) * 255;
    const ty = y + Math.floor(i / 2) * 55;
    doc.rect(tx, ty, 235, 45)
       .fill(hexToRGB(COLORS.dark));
    doc.fillColor(hexToRGB(COLORS.accent))
       .font('Helvetica-Bold').fontSize(22)
       .text(String(value), tx + 10, ty + 5);
    doc.fillColor(hexToRGB(COLORS.grey))
       .font('Helvetica').fontSize(9)
       .text(label.toUpperCase(), tx + 10, ty + 30);
  });

  drawPageFooter(doc, pageNum);

  // ── Page 3: Segment & Payment Analysis ───────────────────
  doc.addPage();
  pageNum++;

  drawPageHeader(doc, 'Segment & Payment Analysis', data.report_period);
  y = 120;

  // Segment breakdown
  doc.fillColor(hexToRGB(COLORS.text))
     .font('Helvetica-Bold').fontSize(13)
     .text('Transactions by Vehicle Segment', 50, y);
  y += 25;

  if (data.segment_breakdown.length > 0) {
    // Table header
    doc.rect(50, y, 495, 28).fill(hexToRGB(COLORS.accent));
    doc.fillColor(hexToRGB(COLORS.primary))
       .font('Helvetica-Bold').fontSize(10);
    doc.text('Segment', 65, y + 9);
    doc.text('Transactions', 250, y + 9);
    doc.text('Avg Price (₹)', 380, y + 9);
    y += 28;

    data.segment_breakdown.forEach((row, i) => {
      doc.rect(50, y, 495, 26)
         .fill(i % 2 === 0 ? hexToRGB(COLORS.lightGrey) : hexToRGB(COLORS.white));
      doc.fillColor(hexToRGB(COLORS.text))
         .font('Helvetica').fontSize(10)
         .text(row.segment, 65, y + 8)
         .text(String(row.count), 270, y + 8)
         .text(`₹${Math.round(row.avg_price || 0).toLocaleString('en-IN')}`, 380, y + 8);
      y += 26;
    });
  } else {
    doc.fillColor(hexToRGB(COLORS.grey))
       .font('Helvetica').fontSize(11)
       .text('No transactions in this period', 50, y);
    y += 30;
  }

  y += 30;

  // Payment mode breakdown
  doc.fillColor(hexToRGB(COLORS.text))
     .font('Helvetica-Bold').fontSize(13)
     .text('Transactions by Payment Mode', 50, y);
  y += 25;

  if (data.payment_breakdown.length > 0) {
    doc.rect(50, y, 495, 28).fill(hexToRGB(COLORS.accent));
    doc.fillColor(hexToRGB(COLORS.primary))
       .font('Helvetica-Bold').fontSize(10)
       .text('Payment Mode', 65, y + 9)
       .text('Count', 300, y + 9)
       .text('Share', 430, y + 9);
    y += 28;

    const total = data.payment_breakdown.reduce((s, r) => s + r.count, 0);
    data.payment_breakdown.forEach((row, i) => {
      const share = total > 0 ? Math.round(row.count / total * 100) : 0;
      doc.rect(50, y, 495, 26)
         .fill(i % 2 === 0 ? hexToRGB(COLORS.lightGrey) : hexToRGB(COLORS.white));
      doc.fillColor(hexToRGB(COLORS.text))
         .font('Helvetica').fontSize(10)
         .text(row.payment_mode, 65, y + 8)
         .text(String(row.count), 310, y + 8)
         .text(`${share}%`, 440, y + 8);
      y += 26;
    });
  }

  drawPageFooter(doc, pageNum);

  // ── Page 4: Transaction Detail ────────────────────────────
  if (data.transactions.length > 0) {
    doc.addPage();
    pageNum++;
    drawPageHeader(doc, 'Transaction Details', data.report_period);
    y = 120;

    // Table header
    doc.rect(50, y, 495, 28).fill(hexToRGB(COLORS.accent));
    doc.fillColor(hexToRGB(COLORS.primary))
       .font('Helvetica-Bold').fontSize(8.5);
    doc.text('Date',      60,  y + 9);
    doc.text('Customer',  130, y + 9);
    doc.text('Vehicle',   240, y + 9);
    doc.text('Segment',   340, y + 9);
    doc.text('Mode',      400, y + 9);
    doc.text('EMI (₹)',   450, y + 9);
    y += 28;

    const maxRows = 20;
    data.transactions.slice(0, maxRows).forEach((txn, i) => {
      if (y > 700) {
        drawPageFooter(doc, pageNum);
        doc.addPage();
        pageNum++;
        drawPageHeader(doc, 'Transaction Details (cont.)', data.report_period);
        y = 120;
      }

      doc.rect(50, y, 495, 24)
         .fill(i % 2 === 0 ? hexToRGB(COLORS.lightGrey) : hexToRGB(COLORS.white));
      doc.fillColor(hexToRGB(COLORS.text))
         .font('Helvetica').fontSize(8);
      doc.text(txn.transaction_date?.slice(0,10) || '—', 60,  y + 8);
      doc.text((txn.full_name || '—').slice(0,14),        130, y + 8);
      doc.text(`${txn.make} ${txn.model}`.slice(0,14),    240, y + 8);
      doc.text(txn.segment || '—',                         340, y + 8);
      doc.text(txn.payment_mode || '—',                    400, y + 8);
      doc.text(txn.emi_amount
        ? `₹${Math.round(txn.emi_amount).toLocaleString('en-IN')}`
        : 'N/A',                                           450, y + 8);
      y += 24;
    });

    if (data.transactions.length > maxRows) {
      doc.fillColor(hexToRGB(COLORS.grey))
         .font('Helvetica').fontSize(9)
         .text(`... and ${data.transactions.length - maxRows} more transactions`, 50, y + 10);
    }

    drawPageFooter(doc, pageNum);
  }

  // ── Page 5: Stalled Leads ─────────────────────────────────
  doc.addPage();
  pageNum++;
  drawPageHeader(doc, 'Stalled Leads — Action Required', data.report_period);
  y = 120;

  if (data.stalled_leads.length === 0) {
    doc.rect(50, y, 495, 60).fill(hexToRGB(COLORS.success));
    doc.fillColor(hexToRGB(COLORS.white))
       .font('Helvetica-Bold').fontSize(14)
       .text('✅  No stalled leads — all pipelines healthy!', 65, y + 20);
    y += 80;
  } else {
    doc.rect(50, y, 495, 35).fill(hexToRGB(COLORS.danger));
    doc.fillColor(hexToRGB(COLORS.white))
       .font('Helvetica-Bold').fontSize(12)
       .text(
         `⚠️  ${data.stalled_leads.length} lead(s) exceed their segment benchmark`,
         65, y + 11
       );
    y += 45;

    // Table header
    doc.rect(50, y, 495, 28).fill(hexToRGB(COLORS.dark));
    doc.fillColor(hexToRGB(COLORS.accent))
       .font('Helvetica-Bold').fontSize(9);
    doc.text('Lead ID',  60,  y + 9);
    doc.text('Customer', 110, y + 9);
    doc.text('Vehicle',  230, y + 9);
    doc.text('Segment',  330, y + 9);
    doc.text('Days Open',400, y + 9);
    doc.text('Status',   460, y + 9);
    y += 28;

    data.stalled_leads.forEach((lead, i) => {
      doc.rect(50, y, 495, 26)
         .fill(i % 2 === 0 ? hexToRGB(COLORS.lightGrey) : hexToRGB(COLORS.white));
      const daysColor = lead.days_open > 30
        ? hexToRGB(COLORS.danger)
        : hexToRGB(COLORS.warning);
      doc.fillColor(hexToRGB(COLORS.text))
         .font('Helvetica').fontSize(9);
      doc.text(`#${lead.lead_id}`,              60,  y + 8);
      doc.text((lead.full_name||'—').slice(0,16), 110, y + 8);
      doc.text(`${lead.make} ${lead.model}`.slice(0,14), 230, y + 8);
      doc.text(lead.segment || '—',             330, y + 8);
      doc.fillColor(daysColor)
         .font('Helvetica-Bold')
         .text(`${Math.round(lead.days_open)}d`, 415, y + 8);
      doc.fillColor(hexToRGB(COLORS.text))
         .font('Helvetica')
         .text(lead.status || '—',              460, y + 8);
      y += 26;
    });

    y += 20;
    doc.fillColor(hexToRGB(COLORS.text))
       .font('Helvetica').fontSize(10)
       .text(
         'Recommendation: Contact each customer within 24 hours. ' +
         'Leads open beyond 1.5× segment benchmark have a significantly ' +
         'lower conversion probability.',
         50, y, { width: 495 }
       );
  }

  drawPageFooter(doc, pageNum);

  doc.end();
}

// ── Helper Functions ──────────────────────────────────────────
function drawPageHeader(doc, title, period) {
  // Header bar
  doc.rect(0, 0, doc.page.width, 80).fill(hexToRGB(COLORS.primary));
  doc.rect(0, 0, 6, 80).fill(hexToRGB(COLORS.accent));

  doc.fillColor(hexToRGB(COLORS.accent))
     .font('Helvetica-Bold').fontSize(11)
     .text('CarIQ', 20, 20);
  doc.fillColor(hexToRGB(COLORS.white))
     .font('Helvetica-Bold').fontSize(16)
     .text(title, 20, 38);
  doc.fillColor(hexToRGB(COLORS.grey))
     .font('Helvetica').fontSize(9)
     .text(
       `${period.month_name} ${period.year}  |  ` +
       `${period.start_date} to ${period.end_date}`,
       20, 60
     );
}

function drawPageFooter(doc, pageNum) {
  const footerY = doc.page.height - 40;
  doc.rect(0, footerY, doc.page.width, 40)
     .fill(hexToRGB(COLORS.primary));
  doc.fillColor(hexToRGB(COLORS.grey))
     .font('Helvetica').fontSize(8)
     .text('CarIQ Analytics Engine — Confidential', 50, footerY + 14)
     .text(`Page ${pageNum}`, 500, footerY + 14);
}

module.exports = { generateMonthlyPDF };