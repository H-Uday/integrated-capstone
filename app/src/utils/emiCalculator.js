/**
 * Calculates monthly EMI using the standard reducing-balance formula.
 * EMI = P * r * (1+r)^n / ((1+r)^n - 1)
 *
 * @param {number} principal - loan_amount
 * @param {number} annualInterestRate - e.g. 9.5 (percent)
 * @param {number} tenureMonths - e.g. 60
 * @returns {number} EMI rounded to 2 decimal places
 */
function calculateEMI(principal, annualInterestRate, tenureMonths) {
  if (!principal || !annualInterestRate || !tenureMonths) {
    throw new Error('principal, annualInterestRate, and tenureMonths are required');
  }

  const monthlyRate = annualInterestRate / 12 / 100;
  const n = tenureMonths;

  const numerator = principal * monthlyRate * Math.pow(1 + monthlyRate, n);
  const denominator = Math.pow(1 + monthlyRate, n) - 1;

  const emi = numerator / denominator;

  return Math.round(emi * 100) / 100;
}

module.exports = { calculateEMI };