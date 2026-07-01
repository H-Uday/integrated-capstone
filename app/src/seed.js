require('dotenv').config();
const { db, runMigrations } = require('./config/database');
const { calculateEMI } = require('./utils/emiCalculator');

runMigrations();

// ── Reference Data ──────────────────────────────────────────────
const firstNames = [
  'Ravi','Priya','Amit','Sunita','Rajesh','Kavya','Vikram','Anitha',
  'Suresh','Deepa','Arjun','Meena','Kiran','Lakshmi','Rahul','Pooja',
  'Sanjay','Divya','Arun','Nisha','Venkat','Swathi','Manoj','Rekha',
  'Prasad','Usha','Ganesh','Padma','Harish','Sridevi'
];

const lastNames = [
  'Kumar','Sharma','Reddy','Patel','Singh','Rao','Nair','Iyer',
  'Mehta','Gupta','Joshi','Pillai','Verma','Shah','Mishra','Chauhan',
  'Bhat','Kulkarni','Hegde','Shetty'
];

const cities = [
  { city: 'Hyderabad', state: 'Telangana' },
  { city: 'Mumbai',    state: 'Maharashtra' },
  { city: 'Delhi',     state: 'Delhi' },
  { city: 'Bengaluru', state: 'Karnataka' },
  { city: 'Chennai',   state: 'Tamil Nadu' },
  { city: 'Pune',      state: 'Maharashtra' },
  { city: 'Kolkata',   state: 'West Bengal' },
  { city: 'Ahmedabad', state: 'Gujarat' },
  { city: 'Jaipur',    state: 'Rajasthan' },
  { city: 'Lucknow',   state: 'Uttar Pradesh' }
];

const employmentTypes = [
  'Salaried','Salaried','Salaried','Salaried',   // 40% Salaried
  'Self-Employed','Self-Employed','Self-Employed', // 30% Self-Employed
  'Business','Business',                           // 20% Business
  'Retired'                                        // 10% Retired
];

const vehicles = [
  // Hatchbacks (~30%)
  { make:'Maruti Suzuki', model:'Swift',    variant:'ZXI',       year:2023, price:850000,  segment:'Hatchback', fuel:'Petrol',   origin:'India' },
  { make:'Maruti Suzuki', model:'Baleno',   variant:'Alpha',     year:2023, price:920000,  segment:'Hatchback', fuel:'Petrol',   origin:'India' },
  { make:'Hyundai',       model:'i20',      variant:'Asta',      year:2024, price:1050000, segment:'Hatchback', fuel:'Petrol',   origin:'South Korea' },
  { make:'Tata',          model:'Tiago',    variant:'XZ+',       year:2023, price:750000,  segment:'Hatchback', fuel:'CNG',      origin:'India' },
  // Sedans (~20%)
  { make:'Honda',         model:'City',     variant:'ZX CVT',    year:2024, price:1550000, segment:'Sedan',     fuel:'Petrol',   origin:'Japan' },
  { make:'Maruti Suzuki', model:'Ciaz',     variant:'Alpha',     year:2023, price:1200000, segment:'Sedan',     fuel:'Petrol',   origin:'India' },
  { make:'Hyundai',       model:'Verna',    variant:'SX(O)',     year:2024, price:1450000, segment:'Sedan',     fuel:'Diesel',   origin:'South Korea' },
  // SUVs (~25%)
  { make:'Tata',          model:'Nexon',    variant:'XZ+ TGDi',  year:2024, price:1650000, segment:'SUV',       fuel:'Petrol',   origin:'India' },
  { make:'Hyundai',       model:'Creta',    variant:'SX(O)',     year:2024, price:1900000, segment:'SUV',       fuel:'Diesel',   origin:'South Korea' },
  { make:'Mahindra',      model:'Scorpio-N',variant:'Z8 L',      year:2024, price:2350000, segment:'SUV',       fuel:'Diesel',   origin:'India' },
  { make:'Kia',           model:'Seltos',   variant:'HTX+',      year:2024, price:1800000, segment:'SUV',       fuel:'Petrol',   origin:'South Korea' },
  // EVs (~10%)
  { make:'Tata',          model:'Nexon EV', variant:'Max',       year:2024, price:1950000, segment:'EV',        fuel:'Electric', origin:'India' },
  { make:'MG',            model:'ZS EV',    variant:'Excite',    year:2023, price:2299000, segment:'EV',        fuel:'Electric', origin:'China' },
  // MUVs (~8%)
  { make:'Maruti Suzuki', model:'Ertiga',   variant:'ZXI+',      year:2023, price:1150000, segment:'MUV',       fuel:'CNG',      origin:'India' },
  { make:'Kia',           model:'Carens',   variant:'Luxury+',   year:2024, price:1950000, segment:'MUV',       fuel:'Diesel',   origin:'South Korea' },
  // Luxury (~7%)
  { make:'BMW',           model:'3 Series', variant:'320d Sport', year:2024, price:5500000, segment:'Luxury',   fuel:'Diesel',   origin:'Germany' },
  { make:'Mercedes-Benz', model:'C-Class',  variant:'C 220d',    year:2024, price:6100000, segment:'Luxury',   fuel:'Diesel',   origin:'Germany' },
];

const dealers = [
  'Hyderabad Motors','Mumbai Auto Hub','Delhi Car Palace',
  'Bengaluru Wheels','Chennai Auto Park','Pune Car World',
  'Kolkata Drive Zone','Ahmedabad Motors','Jaipur Auto Mart'
];

const leadStatuses = ['New','In-Progress','Converted','Rejected','On-Hold'];

// ── Helpers ─────────────────────────────────────────────────────
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min, max, decimals = 1) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomDate(start, end) {
  const d = new Date(start.getTime() +
    Math.random() * (end.getTime() - start.getTime()));
  return d.toISOString().split('T')[0];
}

function generateEmail(first, last, index) {
  const domains = ['gmail.com','yahoo.com','outlook.com','rediffmail.com'];
  return `${first.toLowerCase()}.${last.toLowerCase()}${index}@${pick(domains)}`;
}

// ── Seed Execution ───────────────────────────────────────────────
console.log('🌱 Seeding CarIQ database...\n');

// 1. Insert vehicles
console.log('📦 Inserting vehicles...');
const insertVehicle = db.prepare(`
  INSERT OR IGNORE INTO vehicles
    (make, model, variant, year, price_inr, segment, fuel_type, country_origin)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const v of vehicles) {
  insertVehicle.run(v.make, v.model, v.variant, v.year,
    v.price, v.segment, v.fuel, v.origin);
}

const allVehicles = db.prepare('SELECT * FROM vehicles').all();
console.log(`   ✅ ${allVehicles.length} vehicles inserted\n`);

// 2. Insert 150 customers
console.log('👥 Inserting customers...');
const insertCustomer = db.prepare(`
  INSERT OR IGNORE INTO customers
    (full_name, email, phone, city, state,
     annual_income, credit_score, employment_type)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

for (let i = 1; i <= 150; i++) {
  const first = pick(firstNames);
  const last  = pick(lastNames);
  const loc   = pick(cities);
  const emp   = pick(employmentTypes);

  // Income distribution tied to employment type
  let income;
  if (emp === 'Salaried')      income = randInt(400000, 2500000);
  else if (emp === 'Self-Employed') income = randInt(600000, 5000000);
  else if (emp === 'Business') income = randInt(1000000, 10000000);
  else                         income = randInt(200000, 800000); // Retired

  // Credit score weighted toward healthy range
  const creditScore = randInt(550, 900);

  insertCustomer.run(
    `${first} ${last}`,
    generateEmail(first, last, i),
    `9${randInt(100000000, 999999999)}`,
    loc.city, loc.state,
    income, creditScore, emp
  );
}

const allCustomers = db.prepare('SELECT * FROM customers').all();
console.log(`   ✅ ${allCustomers.length} customers inserted\n`);

// 3. Insert 250 leads
console.log('📋 Inserting leads...');
const insertLead = db.prepare(`
  INSERT INTO leads
    (customer_id, vehicle_id, enquiry_date, status, dealer_name, state, notes)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const startDate = new Date('2024-01-01');
const endDate   = new Date('2026-06-01');

for (let i = 0; i < 250; i++) {
  const customer = pick(allCustomers);
  const vehicle  = pick(allVehicles);

  // Realistic status distribution
  const statusRoll = Math.random();
  let status;
  if      (statusRoll < 0.35) status = 'Converted';
  else if (statusRoll < 0.55) status = 'Rejected';
  else if (statusRoll < 0.70) status = 'In-Progress';
  else if (statusRoll < 0.85) status = 'New';
  else                         status = 'On-Hold';

  insertLead.run(
    customer.customer_id,
    vehicle.vehicle_id,
    randomDate(startDate, endDate),
    status,
    pick(dealers),
    customer.state,
    'Seed data lead'
  );
}

const allLeads = db.prepare('SELECT * FROM leads').all();
console.log(`   ✅ ${allLeads.length} leads inserted\n`);

// 4. Insert transactions for all Converted leads
console.log('💳 Inserting transactions...');
const convertedLeads = db.prepare(
  `SELECT * FROM leads WHERE status = 'Converted'`
).all();

const insertTransaction = db.prepare(`
  INSERT INTO transactions
    (lead_id, customer_id, vehicle_id, transaction_date,
     final_price_inr, loan_amount, loan_tenure_months,
     interest_rate, emi_amount, payment_mode)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const tenureOptions = [24, 36, 48, 60, 72, 84];

for (const lead of convertedLeads) {
  const vehicle  = allVehicles.find(v => v.vehicle_id === lead.vehicle_id);
  const customer = allCustomers.find(c => c.customer_id === lead.customer_id);

  // Transaction date = enquiry date + 3-30 days
  const enquiry  = new Date(lead.enquiry_date);
  const txDate   = new Date(enquiry.getTime() +
    randInt(3, 30) * 24 * 60 * 60 * 1000);
  const txDateStr = txDate.toISOString().split('T')[0];

  // Payment mode distribution
  const modeRoll = Math.random();
  let payment_mode, loan_amount, tenure, rate, emi;

  if (modeRoll < 0.65) {
    // 65% take a loan
    payment_mode = 'Loan';
    const downPayment = vehicle.price_inr * randFloat(0.1, 0.3, 2);
    loan_amount  = Math.round(vehicle.price_inr - downPayment);
    tenure       = pick(tenureOptions);
    rate         = randFloat(7.5, 14.0, 2);
    emi          = calculateEMI(loan_amount, rate, tenure);
  } else if (modeRoll < 0.85) {
    // 20% full cash
    payment_mode = 'Full Cash';
    loan_amount  = null;
    tenure       = null;
    rate         = null;
    emi          = null;
  } else {
    // 15% lease
    payment_mode = 'Lease';
    loan_amount  = null;
    tenure       = null;
    rate         = null;
    emi          = null;
  }

  insertTransaction.run(
    lead.lead_id,
    lead.customer_id,
    lead.vehicle_id,
    txDateStr,
    vehicle.price_inr,
    loan_amount, tenure, rate, emi,
    payment_mode
  );
}

const allTransactions = db.prepare('SELECT * FROM transactions').all();
console.log(`   ✅ ${allTransactions.length} transactions inserted\n`);

// ── Summary ──────────────────────────────────────────────────────
console.log('━'.repeat(45));
console.log('🚗 CarIQ Seed Complete');
console.log('━'.repeat(45));
console.log(`   Vehicles     : ${allVehicles.length}`);
console.log(`   Customers    : ${allCustomers.length}`);
console.log(`   Leads        : ${allLeads.length}`);
console.log(`   Transactions : ${allTransactions.length}`);
console.log('━'.repeat(45));