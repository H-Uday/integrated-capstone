/**
 * pdfGenerator.js
 * Generates professional PDF reports for CarIQ using PDFKit.
 * Dynamically adjusts total page count based on monthly data volume.
 */

const PDFDocument = require('pdfkit');

const COLORS = {
  primary:   '#1a1a2e',
  accent:    '#00d9d9',
  white:     '#ffffff',
  grey:      '#a0a0b0',
  dark:      '#16213e',
  success:   '#2ecc71',
  warning:   '#f39c12',
  danger:    '#e74c3c',
  text:      '#333333',
  lightGrey: '#f5f5f5',
};

function hexToRGB(hex) {
  return [
    parseInt(hex.slice(1,3), 16),
    parseInt(hex.slice(3,5), 16),
    parseInt(hex.slice(5,7), 16)
  ];
}

function generateMonthlyPDF(data, res) {
  const doc = new PDFDocument({
    size:          'A4',
    margins:       { top: 75, bottom: 50, left: 50, right: 50 },
    bufferPages:   true,
    autoFirstPage: false,
    info: {
      Title:  `CarIQ Monthly Report — ${data.report_period.month_name} ${data.report_period.year}`,
      Author: 'CarIQ Analytics Engine',
    },
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="CarIQ_Report_${data.report_period.year}_${String(data.report_period.month).padStart(2,'0')}.pdf"`
  );
  doc.pipe(res);

  // ── 1. COVER PAGE ───────────────────────────────────────────
  doc.addPage();
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(hexToRGB(COLORS.primary));
  doc.rect(0, 0, 8, doc.page.height).fill(hexToRGB(COLORS.accent));

  doc.fillColor(hexToRGB(COLORS.accent)).font('Helvetica-Bold').fontSize(52).text('CarIQ', 60, 180);
  doc.fillColor(hexToRGB(COLORS.white)).font('Helvetica').fontSize(18).text('Global & India Car Sales + Affordability Intelligence', 60, 250);

  doc.rect(60, 300, 300, 60).fill(hexToRGB(COLORS.dark));
  doc.fillColor(hexToRGB(COLORS.accent)).font('Helvetica-Bold').fontSize(11).text('MONTHLY PERFORMANCE REPORT', 75, 315);
  doc.fillColor(hexToRGB(COLORS.white)).font('Helvetica').fontSize(14).text(`${data.report_period.month_name} ${data.report_period.year}`, 75, 332);

  const kpis = [
    { label: 'Transactions',  value: String(data.summary.total_transactions) },
    { label: 'Leads',         value: String(data.summary.total_leads) },
    { label: 'Affordability', value: `${data.summary.affordability_rate}%` },
    { label: 'Stalled Leads', value: String(data.summary.stalled_leads) },
  ];

  kpis.forEach((kpi, i) => {
    const x = 60 + (i % 2) * 240;
    const yKpi = 390 + Math.floor(i / 2) * 90;
    doc.rect(x, yKpi, 220, 75).fill(hexToRGB(COLORS.dark));
    doc.fillColor(hexToRGB(COLORS.accent)).font('Helvetica-Bold').fontSize(28).text(kpi.value, x + 15, yKpi + 10);
    doc.fillColor(hexToRGB(COLORS.grey)).font('Helvetica').fontSize(10).text(kpi.label.toUpperCase(), x + 15, yKpi + 50);
  });

  doc.fillColor(hexToRGB(COLORS.grey)).font('Helvetica').fontSize(9)
     .text(`Generated: ${new Date(data.generated_at).toLocaleString('en-IN')}`, 60, 720)
     .text(data.generated_by, 60, 734);

  // ── 2. EXECUTIVE SUMMARY & BREAKDOWNS ────────────────────────
  doc.addPage();
  let y = 90;
  doc.fillColor(hexToRGB(COLORS.text)).font('Helvetica-Bold').fontSize(14).text('Executive Performance Summary', 50, y);
  y += 22;

  const summaryItems = [
    ['Total Transactions',    data.summary.total_transactions,   null],
    ['Total Leads Created',   data.summary.total_leads,          null],
    ['Total Revenue (₹)',     `₹${data.summary.total_revenue_inr.toLocaleString('en-IN')}`, null],
    ['Loan Transactions',     data.summary.loan_count,           null],
    ['Affordable Loans',      data.summary.affordable_count,     null],
    ['Affordability Rate',    `${data.summary.affordability_rate}%`, data.summary.affordability_rate >= 50 ? 'good' : 'warning'],
    ['Avg EMI (Loan)',        `₹${data.summary.avg_emi.toLocaleString('en-IN')}`, null],
    ['Stalled Leads',         data.summary.stalled_leads, data.summary.stalled_leads > 5 ? 'warning' : 'good'],
  ];

  summaryItems.forEach(([label, value, status], i) => {
    const rowY = y + i * 22;
    doc.rect(50, rowY, 495, 20).fill(i % 2 === 0 ? hexToRGB(COLORS.lightGrey) : hexToRGB(COLORS.white));
    doc.fillColor(hexToRGB(COLORS.text)).font('Helvetica').fontSize(9.5).text(label, 65, rowY + 5, { width: 280, lineBreak: false });

    const valColor = status === 'good' ? hexToRGB(COLORS.success) : status === 'warning' ? hexToRGB(COLORS.warning) : hexToRGB(COLORS.text);
    doc.fillColor(valColor).font('Helvetica-Bold').fontSize(9.5).text(String(value), 350, rowY + 5, { width: 180, align: 'right', lineBreak: false });
  });

  y += summaryItems.length * 22 + 20;

  doc.fillColor(hexToRGB(COLORS.text)).font('Helvetica-Bold').fontSize(12).text('Transactions by Vehicle Segment', 50, y);
  y += 18;

  if (data.segment_breakdown.length > 0) {
    doc.rect(50, y, 495, 20).fill(hexToRGB(COLORS.accent));
    doc.fillColor(hexToRGB(COLORS.primary)).font('Helvetica-Bold').fontSize(8.5);
    doc.text('Segment', 65, y + 6, { lineBreak: false });
    doc.text('Transactions', 250, y + 6, { lineBreak: false });
    doc.text('Avg Price (₹)', 380, y + 6, { lineBreak: false });
    y += 20;

    data.segment_breakdown.forEach((row, i) => {
      doc.rect(50, y, 495, 18).fill(i % 2 === 0 ? hexToRGB(COLORS.lightGrey) : hexToRGB(COLORS.white));
      doc.fillColor(hexToRGB(COLORS.text)).font('Helvetica').fontSize(8.5)
         .text(row.segment, 65, y + 5, { lineBreak: false })
         .text(String(row.count), 270, y + 5, { lineBreak: false })
         .text(`₹${Math.round(row.avg_price || 0).toLocaleString('en-IN')}`, 380, y + 5, { lineBreak: false });
      y += 18;
    });
  } else {
    doc.fillColor(hexToRGB(COLORS.grey)).font('Helvetica').fontSize(9).text('No transactions in this period', 50, y);
    y += 20;
  }

  y += 15;
  doc.fillColor(hexToRGB(COLORS.text)).font('Helvetica-Bold').fontSize(12).text('Transactions by Payment Mode', 50, y);
  y += 18;

  if (data.payment_breakdown.length > 0) {
    doc.rect(50, y, 495, 20).fill(hexToRGB(COLORS.accent));
    doc.fillColor(hexToRGB(COLORS.primary)).font('Helvetica-Bold').fontSize(8.5)
       .text('Payment Mode', 65, y + 6, { lineBreak: false })
       .text('Count', 300, y + 6, { lineBreak: false })
       .text('Share', 430, y + 6, { lineBreak: false });
    y += 20;

    const total = data.payment_breakdown.reduce((s, r) => s + r.count, 0);
    data.payment_breakdown.forEach((row, i) => {
      const share = total > 0 ? Math.round(row.count / total * 100) : 0;
      doc.rect(50, y, 495, 18).fill(i % 2 === 0 ? hexToRGB(COLORS.lightGrey) : hexToRGB(COLORS.white));
      doc.fillColor(hexToRGB(COLORS.text)).font('Helvetica').fontSize(8.5)
         .text(row.payment_mode, 65, y + 5, { lineBreak: false })
         .text(String(row.count), 310, y + 5, { lineBreak: false })
         .text(`${share}%`, 440, y + 5, { lineBreak: false });
      y += 18;
    });
  }

  // ── 3. DYNAMIC TRANSACTIONS TABLE ─────────────────────────
  if (data.transactions.length > 0) {
    doc.addPage();
    y = 90;
    doc.fillColor(hexToRGB(COLORS.text)).font('Helvetica-Bold').fontSize(13).text('Monthly Transaction Details', 50, y);
    y += 20;

    function drawTxTableHeader(currentY) {
      doc.rect(50, currentY, 495, 22).fill(hexToRGB(COLORS.accent));
      doc.fillColor(hexToRGB(COLORS.primary)).font('Helvetica-Bold').fontSize(8.5);
      doc.text('Date',      60,  currentY + 6, { lineBreak: false });
      doc.text('Customer',  130, currentY + 6, { lineBreak: false });
      doc.text('Vehicle',   240, currentY + 6, { lineBreak: false });
      doc.text('Segment',   340, currentY + 6, { lineBreak: false });
      doc.text('Mode',      400, currentY + 6, { lineBreak: false });
      doc.text('EMI (₹)',   450, currentY + 6, { lineBreak: false });
      return currentY + 22;
    }

    y = drawTxTableHeader(y);

    data.transactions.forEach((txn, i) => {
      // Dynamic page break when table hits bottom threshold
      if (y > 730) {
        doc.addPage();
        y = 90;
        doc.fillColor(hexToRGB(COLORS.text)).font('Helvetica-Bold').fontSize(11).text('Monthly Transaction Details (Cont.)', 50, y);
        y += 18;
        y = drawTxTableHeader(y);
      }

      doc.rect(50, y, 495, 20).fill(i % 2 === 0 ? hexToRGB(COLORS.lightGrey) : hexToRGB(COLORS.white));
      doc.fillColor(hexToRGB(COLORS.text)).font('Helvetica').fontSize(8);
      doc.text(txn.transaction_date?.slice(0,10) || '—', 60,  y + 5, { lineBreak: false });
      doc.text((txn.full_name || '—').slice(0,14),        130, y + 5, { lineBreak: false });
      doc.text(`${txn.make} ${txn.model}`.slice(0,14),    240, y + 5, { lineBreak: false });
      doc.text(txn.segment || '—',                        340, y + 5, { lineBreak: false });
      doc.text(txn.payment_mode || '—',                    400, y + 5, { lineBreak: false });
      doc.text(txn.emi_amount ? `₹${Math.round(txn.emi_amount).toLocaleString('en-IN')}` : 'N/A', 450, y + 5, { lineBreak: false });
      y += 20;
    });
  }

  // ── 4. DYNAMIC STALLED LEADS TABLE ────────────────────────
  doc.addPage();
  y = 90;
  doc.fillColor(hexToRGB(COLORS.text)).font('Helvetica-Bold').fontSize(13).text('Stalled Leads — Action Required', 50, y);
  y += 20;

  if (data.stalled_leads.length === 0) {
    doc.rect(50, y, 495, 50).fill(hexToRGB(COLORS.success));
    doc.fillColor(hexToRGB(COLORS.white)).font('Helvetica-Bold').fontSize(12)
       .text('✅  No stalled leads — all pipelines are moving healthy!', 65, y + 18);
  } else {
    doc.rect(50, y, 495, 28).fill(hexToRGB(COLORS.danger));
    doc.fillColor(hexToRGB(COLORS.white)).font('Helvetica-Bold').fontSize(11)
       .text(`⚠️  ${data.stalled_leads.length} lead(s) exceed their segment benchmark`, 65, y + 8);
    y += 35;

    function drawStalledTableHeader(currentY) {
      doc.rect(50, currentY, 495, 22).fill(hexToRGB(COLORS.dark));
      doc.fillColor(hexToRGB(COLORS.accent)).font('Helvetica-Bold').fontSize(8.5);
      doc.text('Lead ID',  60,  currentY + 6, { lineBreak: false });
      doc.text('Customer', 110, currentY + 6, { lineBreak: false });
      doc.text('Vehicle',  230, currentY + 6, { lineBreak: false });
      doc.text('Segment',  330, currentY + 6, { lineBreak: false });
      doc.text('Days Open',400, currentY + 6, { lineBreak: false });
      doc.text('Status',   460, currentY + 6, { lineBreak: false });
      return currentY + 22;
    }

    y = drawStalledTableHeader(y);

    data.stalled_leads.forEach((lead, i) => {
      // Dynamic page break when lead table hits bottom threshold
      if (y > 720) {
        doc.addPage();
        y = 90;
        doc.fillColor(hexToRGB(COLORS.text)).font('Helvetica-Bold').fontSize(11).text('Stalled Leads (Cont.)', 50, y);
        y += 18;
        y = drawStalledTableHeader(y);
      }

      doc.rect(50, y, 495, 20).fill(i % 2 === 0 ? hexToRGB(COLORS.lightGrey) : hexToRGB(COLORS.white));
      const daysColor = lead.days_open > 30 ? hexToRGB(COLORS.danger) : hexToRGB(COLORS.warning);

      doc.fillColor(hexToRGB(COLORS.text)).font('Helvetica').fontSize(8.5);
      doc.text(`#${lead.lead_id}`,              60,  y + 5, { lineBreak: false });
      doc.text((lead.full_name||'—').slice(0,16), 110, y + 5, { lineBreak: false });
      doc.text(`${lead.make} ${lead.model}`.slice(0,14), 230, y + 5, { lineBreak: false });
      doc.text(lead.segment || '—',             330, y + 5, { lineBreak: false });
      doc.fillColor(daysColor).font('Helvetica-Bold').text(`${Math.round(lead.days_open)}d`, 412, y + 5, { lineBreak: false });
      doc.fillColor(hexToRGB(COLORS.text)).font('Helvetica').text(lead.status || '—', 460, y + 5, { lineBreak: false });
      y += 20;
    });

    if (y + 40 > 750) {
      doc.addPage();
      y = 90;
    } else {
      y += 15;
    }

    doc.fillColor(hexToRGB(COLORS.text)).font('Helvetica').fontSize(9)
       .text(
         'Recommendation: Contact each customer within 24 hours. Leads open beyond 1.5× benchmark have lower conversion rate.',
         50, y, { width: 495 }
       );
  }

  // ── 5. DYNAMIC HEADERS & FOOTERS PASS (ALL PAGES) ──────────
  const range = doc.bufferedPageRange();
  const totalPages = range.count; // Automatically detects total pages generated!

  for (let i = range.start; i < range.start + totalPages; i++) {
    doc.switchToPage(i);

    if (i === 0) continue; // Skip cover page

    // Header
    doc.rect(0, 0, doc.page.width, 55).fill(hexToRGB(COLORS.primary));
    doc.rect(0, 0, 6, 55).fill(hexToRGB(COLORS.accent));
    doc.fillColor(hexToRGB(COLORS.accent)).font('Helvetica-Bold').fontSize(10).text('CarIQ', 20, 10, { lineBreak: false });
    doc.fillColor(hexToRGB(COLORS.white)).font('Helvetica-Bold').fontSize(11).text(`Monthly Performance Report — ${data.report_period.month_name} ${data.report_period.year}`, 20, 22, { lineBreak: false });
    doc.fillColor(hexToRGB(COLORS.grey)).font('Helvetica').fontSize(8).text(`Period: ${data.report_period.start_date} to ${data.report_period.end_date}`, 20, 36, { lineBreak: false });

    // Footer
    const footerY = doc.page.height - 30;
    doc.rect(0, footerY, doc.page.width, 30).fill(hexToRGB(COLORS.primary));
    doc.fillColor(hexToRGB(COLORS.grey)).font('Helvetica').fontSize(8)
       .text('CarIQ Analytics Engine — Confidential', 50, footerY + 10, { lineBreak: false })
       .text(`Page ${i + 1} of ${totalPages}`, 480, footerY + 10, { lineBreak: false });
  }

  doc.end();
}

module.exports = { generateMonthlyPDF };