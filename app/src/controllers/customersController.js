const { db } = require('../config/database');

function createCustomer(req, res) {
  const {
    full_name, email, phone, city, state,
    annual_income, credit_score, employment_type
  } = req.body;

  try {
    const stmt = db.prepare(`
      INSERT INTO customers
        (full_name, email, phone, city, state,
         annual_income, credit_score, employment_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      full_name.trim(),
      email.trim().toLowerCase(),
      phone || null,
      city.trim(),
      state.trim(),
      Number(annual_income),
      Number(credit_score),
      employment_type
    );

    return res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      customer_id: result.lastInsertRowid
    });

  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({
        success: false,
        error: 'A customer with this email already exists'
      });
    }
    console.error('createCustomer error:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

function getCustomerById(req, res) {
  const { id } = req.params;

  if (isNaN(id)) {
    return res.status(400).json({
      success: false,
      error: 'Customer ID must be a number'
    });
  }

  try {
    const customer = db.prepare(
      'SELECT * FROM customers WHERE customer_id = ?'
    ).get(Number(id));

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: `No customer found with ID ${id}`
      });
    }

    return res.status(200).json({ success: true, data: customer });

  } catch (err) {
    console.error('getCustomerById error:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

module.exports = { createCustomer, getCustomerById };