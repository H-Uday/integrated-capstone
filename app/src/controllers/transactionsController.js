const { db } = require('../config/database');
const { calculateEMI } = require('../utils/emiCalculator');

function createTransaction(req, res) {
  const {
    lead_id, customer_id, vehicle_id, transaction_date,
    final_price_inr, loan_amount, loan_tenure_months,
    interest_rate, payment_mode
  } = req.body;

  try {
    // Verify customer exists
    const customer = db.prepare(
      'SELECT customer_id FROM customers WHERE customer_id = ?'
    ).get(Number(customer_id));

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: `Customer ID ${customer_id} not found`
      });
    }

    // Verify vehicle exists
    const vehicle = db.prepare(
      'SELECT vehicle_id FROM vehicles WHERE vehicle_id = ?'
    ).get(Number(vehicle_id));

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: `Vehicle ID ${vehicle_id} not found`
      });
    }

    // lead_id is optional (walk-in cash sales allowed) — verify only if provided
    if (lead_id) {
      const lead = db.prepare(
        'SELECT lead_id FROM leads WHERE lead_id = ?'
      ).get(Number(lead_id));

      if (!lead) {
        return res.status(404).json({
          success: false,
          error: `Lead ID ${lead_id} not found`
        });
      }
    }

    // Compute EMI only for Loan payment mode
    let computedEmi = null;
    let finalLoanAmount = null;
    let finalTenure = null;
    let finalRate = null;

    if (payment_mode === 'Loan') {
      if (!loan_amount || !loan_tenure_months || !interest_rate) {
        return res.status(400).json({
          success: false,
          error: 'loan_amount, loan_tenure_months, and interest_rate are required when payment_mode is Loan'
        });
      }

      computedEmi = calculateEMI(
        Number(loan_amount),
        Number(interest_rate),
        Number(loan_tenure_months)
      );
      finalLoanAmount = Number(loan_amount);
      finalTenure = Number(loan_tenure_months);
      finalRate = Number(interest_rate);
    }

    const stmt = db.prepare(`
      INSERT INTO transactions
        (lead_id, customer_id, vehicle_id, transaction_date,
         final_price_inr, loan_amount, loan_tenure_months,
         interest_rate, emi_amount, payment_mode)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      lead_id ? Number(lead_id) : null,
      Number(customer_id),
      Number(vehicle_id),
      transaction_date,
      Number(final_price_inr),
      finalLoanAmount,
      finalTenure,
      finalRate,
      computedEmi,
      payment_mode
    );

    // Auto-update lead status to Converted if linked
    if (lead_id) {
      db.prepare(
        `UPDATE leads SET status = 'Converted' WHERE lead_id = ?`
      ).run(Number(lead_id));
    }

    return res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      transaction_id: result.lastInsertRowid,
      emi_amount: computedEmi
    });

  } catch (err) {
    console.error('createTransaction error:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

function getTransactionByLead(req, res) {
  const { leadId } = req.params;

  if (!leadId || isNaN(Number(leadId))) {
    return res.status(400).json({
      success: false,
      error: 'Lead ID must be a number'
    });
  }

  try {
    const transaction = db.prepare(`
      SELECT
        t.*,
        c.full_name, c.annual_income, c.credit_score,
        v.make, v.model, v.segment
      FROM transactions t
      JOIN customers c ON t.customer_id = c.customer_id
      JOIN vehicles v ON t.vehicle_id = v.vehicle_id
      WHERE t.lead_id = ?
    `).get(Number(leadId));

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: `No transaction found for lead ID ${leadId}`
      });
    }

    return res.status(200).json({ success: true, data: transaction });

  } catch (err) {
    console.error('getTransactionByLead error:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

module.exports = { createTransaction, getTransactionByLead };