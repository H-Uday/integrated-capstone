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

module.exports = { validateCustomer };