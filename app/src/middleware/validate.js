function validateCustomer(req, res, next) {
  const {
    full_name, email, city, state,
    annual_income, credit_score, employment_type
  } = req.body;

  const errors = [];

  if (!full_name || full_name.trim().length < 2)
    errors.push('full_name must be at least 2 characters');

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.push('email must be a valid email address');

  if (!city || city.trim().length < 2)
    errors.push('city is required');

  if (!state || state.trim().length < 2)
    errors.push('state is required');

  if (!annual_income || isNaN(annual_income) || Number(annual_income) <= 0)
    errors.push('annual_income must be a positive number');

  if (!credit_score || isNaN(credit_score) ||
      Number(credit_score) < 300 || Number(credit_score) > 900)
    errors.push('credit_score must be between 300 and 900');

  const validEmployment = ['Salaried','Self-Employed','Business','Retired'];
  if (!employment_type || !validEmployment.includes(employment_type))
    errors.push(`employment_type must be one of: ${validEmployment.join(', ')}`);

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  next();
}

function validateVehicle(req, res, next) {
  const {
    make, model, year,price_inr,segment, fuel_type, country_origin
  } = req.body;

  const errors = [];

  if (!make || make.trim().length < 2)
    errors.push('make must be at least 2 characters');

  if (!model || model.trim().length < 2)
    errors.push('model must be at least 2 characters');

  if (!year || isNaN(year) || Number(year) < 2015 || Number(year) > 2026)
    errors.push('year must be between 2015 and 2026');

  if (!price_inr || isNaN(price_inr) || Number(price_inr) <= 0)
    errors.push('price_inr must be a positive number');

  const validSegments = ['Hatchback', 'Sedan', 'SUV', 'Luxary','EV','MUV'];
  if (!segment || !validSegments.includes(segment))
    errors.push(`segment must be one of: ${validSegments.join(', ')}`);

  const validFuelTypes = ['Petrol', 'Diesel', 'Electric', 'Hybrid','CNG'];
  if (!fuel_type || !validFuelTypes.includes(fuel_type))
    errors.push(`fuel_type must be one of: ${validFuelTypes.join(', ')}`);

  if (!country_origin || country_origin.trim().length < 2)
    errors.push('country_origin is required');

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  next();
}

function validateLead(req, res, next) {
  const { customer_id, vehicle_id, enquiry_date, status, state } = req.body;

  const errors = [];

  if (!customer_id || isNaN(customer_id) || Number(customer_id) <= 0)
    errors.push('customer_id must be a positive number');

  if (!vehicle_id || isNaN(vehicle_id) || Number(vehicle_id) <= 0)
    errors.push('vehicle_id must be a positive number');

  if (!enquiry_date || isNaN(Date.parse(enquiry_date)))
    errors.push('enquiry_date must be a valid date (YYYY-MM-DD)');

  const validStatuses = ['New','In-Progress','Converted','Rejected','On-Hold'];
  if (!status || !validStatuses.includes(status))
    errors.push(`status must be one of: ${validStatuses.join(', ')}`);

  if (!state || state.trim().length < 2)
    errors.push('state is required');

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  next();
}

function validateTransaction(req, res, next) {
  const {
    customer_id, vehicle_id, transaction_date,
    final_price_inr, payment_mode
  } = req.body;

  const errors = [];

  if (!customer_id || isNaN(customer_id) || Number(customer_id) <= 0)
    errors.push('customer_id must be a positive number');

  if (!vehicle_id || isNaN(vehicle_id) || Number(vehicle_id) <= 0)
    errors.push('vehicle_id must be a positive number');

  if (!transaction_date || isNaN(Date.parse(transaction_date)))
    errors.push('transaction_date must be a valid date (YYYY-MM-DD)');

  if (!final_price_inr || isNaN(final_price_inr) || Number(final_price_inr) <= 0)
    errors.push('final_price_inr must be a positive number');

  const validModes = ['Full Cash', 'Loan', 'Lease'];
  if (!payment_mode || !validModes.includes(payment_mode))
    errors.push(`payment_mode must be one of: ${validModes.join(', ')}`);

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  next();
}

module.exports = { validateCustomer, validateVehicle, validateLead, validateTransaction };