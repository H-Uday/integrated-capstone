const { db } = require('../config/database');

function createVehicle(req, res) {
  const {
    make, model, variant, year, price_inr,
    segment, fuel_type, country_origin
  } = req.body;

  try {
    const stmt = db.prepare(`
      INSERT INTO vehicles
        (make, model, variant, year, price_inr,
         segment, fuel_type, country_origin)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      make.trim(),
      model.trim(),
      variant ? variant.trim() : null,
      Number(year),
      Number(price_inr),
      segment,
      fuel_type,
      country_origin.trim()
    );

    return res.status(201).json({
      success: true,
      message: 'Vehicle created successfully',
      vehicle_id: result.lastInsertRowid
    });

  } catch (err) {
    console.error('createVehicle error:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

function getAllVehicles(req, res) {
  const { segment, fuel_type, min_price, max_price } = req.query;

  try {
    let query = 'SELECT * FROM vehicles WHERE 1=1';
    const params = [];

    if (segment) {
      query += ' AND segment = ?';
      params.push(segment);
    }
    if (fuel_type) {
      query += ' AND fuel_type = ?';
      params.push(fuel_type);
    }
    if (min_price) {
      query += ' AND price_inr >= ?';
      params.push(Number(min_price));
    }
    if (max_price) {
      query += ' AND price_inr <= ?';
      params.push(Number(max_price));
    }

    query += ' ORDER BY price_inr ASC';

    const vehicles = db.prepare(query).all(...params);

    return res.status(200).json({
      success: true,
      count: vehicles.length,
      data: vehicles
    });

  } catch (err) {
    console.error('getAllVehicles error:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

module.exports = { createVehicle, getAllVehicles };