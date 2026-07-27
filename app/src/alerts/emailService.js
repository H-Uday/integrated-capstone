/**
 * emailService.js
 * Handles email sending for CarIQ dealer alerts.
 * 
 * Runs in LOG-ONLY mode by default (ALERT_ENABLED=false).
 * Set ALERT_ENABLED=true and configure Gmail credentials
 * to send real emails via Gmail SMTP.
 */

require('dotenv').config();
const nodemailer = require('nodemailer');

const ALERT_ENABLED = process.env.ALERT_ENABLED === 'true';

// ── Transporter ───────────────────────────────────────────────
function createTransporter() {
  if (!ALERT_ENABLED) return null;

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });
}

// ── Email Templates ───────────────────────────────────────────
function buildStaleLeadEmail(staleLead) {
  const {
    lead_id, customer_name, vehicle, segment,
    dealer_name, state, days_stale, benchmark_days,
    overage_days, status, enquiry_date
  } = staleLead;

  const subject = `🚨 CarIQ Alert — Stalled Lead #${lead_id} (${overage_days} days overdue)`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1a1a2e; padding: 20px; text-align: center;">
        <h1 style="color: #00d9d9; margin: 0;">🚗 CarIQ Alert</h1>
        <p style="color: #a0a0b0; margin: 5px 0;">Stalled Lead Detection System</p>
      </div>
      
      <div style="background: #16213e; padding: 20px; border-left: 4px solid #e74c3c;">
        <h2 style="color: #e74c3c; margin-top: 0;">⚠️ Lead Requires Immediate Follow-Up</h2>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; color: #a0a0b0; width: 40%;">Lead ID</td>
            <td style="padding: 8px; color: #ffffff; font-weight: bold;">#${lead_id}</td>
          </tr>
          <tr style="background: #0f3460;">
            <td style="padding: 8px; color: #a0a0b0;">Customer</td>
            <td style="padding: 8px; color: #ffffff;">${customer_name}</td>
          </tr>
          <tr>
            <td style="padding: 8px; color: #a0a0b0;">Vehicle</td>
            <td style="padding: 8px; color: #ffffff;">${vehicle} (${segment})</td>
          </tr>
          <tr style="background: #0f3460;">
            <td style="padding: 8px; color: #a0a0b0;">Dealer</td>
            <td style="padding: 8px; color: #ffffff;">${dealer_name} — ${state}</td>
          </tr>
          <tr>
            <td style="padding: 8px; color: #a0a0b0;">Status</td>
            <td style="padding: 8px; color: #f39c12;">${status}</td>
          </tr>
          <tr style="background: #0f3460;">
            <td style="padding: 8px; color: #a0a0b0;">Enquiry Date</td>
            <td style="padding: 8px; color: #ffffff;">${enquiry_date}</td>
          </tr>
          <tr>
            <td style="padding: 8px; color: #a0a0b0;">Days Open</td>
            <td style="padding: 8px; color: #e74c3c; font-weight: bold;">${days_stale} days</td>
          </tr>
          <tr style="background: #0f3460;">
            <td style="padding: 8px; color: #a0a0b0;">Segment Benchmark</td>
            <td style="padding: 8px; color: #ffffff;">${benchmark_days} days</td>
          </tr>
          <tr>
            <td style="padding: 8px; color: #a0a0b0;">Overdue By</td>
            <td style="padding: 8px; color: #e74c3c; font-weight: bold; font-size: 18px;">${overage_days} days</td>
          </tr>
        </table>
        
        <div style="margin-top: 20px; padding: 15px; background: #1a1a2e; border-radius: 8px;">
          <p style="color: #00d9d9; margin: 0; font-weight: bold;">Recommended Action:</p>
          <p style="color: #ffffff; margin: 8px 0 0 0;">
            Contact the customer immediately. This ${segment} lead has exceeded 
            the ${benchmark_days}-day benchmark by ${overage_days} days. 
            Risk of losing the sale increases significantly beyond 1.5× benchmark.
          </p>
        </div>
      </div>
      
      <div style="background: #0f3460; padding: 15px; text-align: center;">
        <p style="color: #a0a0b0; margin: 0; font-size: 12px;">
          CarIQ Dealer Alert System | Automated by CarIQ Analytics Pipeline
        </p>
      </div>
    </div>
  `;

  return { subject, html };
}

function buildSummaryEmail(staleLeads, timestamp) {
  const subject = `📊 CarIQ Daily Alert Summary — ${staleLeads.length} Stalled Lead${staleLeads.length !== 1 ? 's' : ''} Detected`;

  const rows = staleLeads.map(lead => `
    <tr>
      <td style="padding: 8px; color: #ffffff;">#${lead.lead_id}</td>
      <td style="padding: 8px; color: #ffffff;">${lead.customer_name}</td>
      <td style="padding: 8px; color: #ffffff;">${lead.segment}</td>
      <td style="padding: 8px; color: #ffffff;">${lead.dealer_name}</td>
      <td style="padding: 8px; color: #e74c3c; font-weight: bold;">${lead.days_stale}d</td>
      <td style="padding: 8px; color: #f39c12; font-weight: bold;">+${lead.overage_days}d</td>
    </tr>
  `).join('');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
      <div style="background: #1a1a2e; padding: 20px; text-align: center;">
        <h1 style="color: #00d9d9; margin: 0;">🚗 CarIQ Daily Summary</h1>
        <p style="color: #a0a0b0;">${timestamp}</p>
      </div>
      <div style="background: #16213e; padding: 20px;">
        <h2 style="color: #e74c3c;">${staleLeads.length} Stalled Lead${staleLeads.length !== 1 ? 's' : ''} Require Attention</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #00d9d9;">
              <th style="padding: 8px; color: #1a1a2e; text-align: left;">Lead ID</th>
              <th style="padding: 8px; color: #1a1a2e; text-align: left;">Customer</th>
              <th style="padding: 8px; color: #1a1a2e; text-align: left;">Segment</th>
              <th style="padding: 8px; color: #1a1a2e; text-align: left;">Dealer</th>
              <th style="padding: 8px; color: #1a1a2e; text-align: left;">Days Open</th>
              <th style="padding: 8px; color: #1a1a2e; text-align: left;">Overdue</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <div style="background: #0f3460; padding: 15px; text-align: center;">
        <p style="color: #a0a0b0; margin: 0; font-size: 12px;">CarIQ Dealer Alert System</p>
      </div>
    </div>
  `;

  return { subject, html };
}

// ── Send Functions ────────────────────────────────────────────
async function sendAlert(staleLead) {
  const { subject, html } = buildStaleLeadEmail(staleLead);

  if (!ALERT_ENABLED) {
    console.log(`   [LOG-ONLY] Would send: "${subject}"`);
    return { success: true, mode: 'log-only', subject };
  }

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from:    process.env.ALERT_EMAIL_FROM,
      to:      process.env.ALERT_EMAIL_TO,
      subject,
      html,
    });
    console.log(`   ✅ Email sent: Lead #${staleLead.lead_id}`);
    return { success: true, mode: 'email', subject };
  } catch (err) {
    console.error(`   ❌ Email failed: ${err.message}`);
    return { success: false, error: err.message };
  }
}

async function sendSummary(staleLeads) {
  if (!staleLeads.length) return;

  const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const { subject, html } = buildSummaryEmail(staleLeads, timestamp);

  if (!ALERT_ENABLED) {
    console.log(`   [LOG-ONLY] Would send summary: "${subject}"`);
    return { success: true, mode: 'log-only', subject };
  }

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from:    process.env.ALERT_EMAIL_FROM,
      to:      process.env.ALERT_EMAIL_TO,
      subject,
      html,
    });
    console.log(`   ✅ Summary email sent for ${staleLeads.length} stalled leads`);
    return { success: true, mode: 'email' };
  } catch (err) {
    console.error(`   ❌ Summary email failed: ${err.message}`);
    return { success: false, error: err.message };
  }
}

module.exports = { sendAlert, sendSummary };