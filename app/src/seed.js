require('dotenv').config();
const { db, runMigrations } = require('./config/database');
const { calculateEMI } = require('./utils/emiCalculator');

runMigrations();

// ── Exchange Rates (FEDAI locked rates — Day 7) ──────────────────
const FX = {
  INR: 0.0107, USD: 1.000, GBP: 1.28,
  AED: 0.27,   EUR: 1.09,  JPY: 0.0067,
  AUD: 0.65,   SGD: 0.74
};

function toUSD(amount, currency) {
  return Math.round(amount * FX[currency] * 100) / 100;
}

// ── Customer Reference Data ──────────────────────────────────────
const indianFirstNames = [
  'Ravi','Priya','Amit','Sunita','Rajesh','Kavya','Vikram','Anitha',
  'Suresh','Deepa','Arjun','Meena','Kiran','Lakshmi','Rahul','Pooja',
  'Sanjay','Divya','Arun','Nisha','Venkat','Swathi','Manoj','Rekha'
];

const indianLastNames = [
  'Kumar','Sharma','Reddy','Patel','Singh','Rao','Nair','Iyer',
  'Mehta','Gupta','Joshi','Pillai','Verma','Shah','Mishra','Chauhan'
];

const intlCustomers = [
  // USA
  { full_name:'James Mitchell',   city:'New York',     state:'New York',        country:'USA',         currency:'USD', income:95000  },
  { full_name:'Sarah Johnson',    city:'Los Angeles',  state:'California',      country:'USA',         currency:'USD', income:120000 },
  { full_name:'Robert Williams',  city:'Houston',      state:'Texas',           country:'USA',         currency:'USD', income:85000  },
  { full_name:'Emily Davis',      city:'Chicago',      state:'Illinois',        country:'USA',         currency:'USD', income:110000 },
  { full_name:'Michael Brown',    city:'Miami',        state:'Florida',         country:'USA',         currency:'USD', income:145000 },
  // UK
  { full_name:'Oliver Thompson',  city:'London',       state:'England',         country:'UK',          currency:'GBP', income:72000  },
  { full_name:'Charlotte Davies', city:'Manchester',   state:'England',         country:'UK',          currency:'GBP', income:58000  },
  { full_name:'Harry Wilson',     city:'Edinburgh',    state:'Scotland',        country:'UK',          currency:'GBP', income:65000  },
  // UAE
  { full_name:'Ahmed Al Rashid',  city:'Dubai',        state:'Dubai',           country:'UAE',         currency:'AED', income:480000 },
  { full_name:'Fatima Al Mazrui', city:'Abu Dhabi',    state:'Abu Dhabi',       country:'UAE',         currency:'AED', income:360000 },
  { full_name:'Khalid Al Maktoum',city:'Dubai',        state:'Dubai',           country:'UAE',         currency:'AED', income:960000 },
  // Germany
  { full_name:'Hans Mueller',     city:'Munich',       state:'Bavaria',         country:'Germany',     currency:'EUR', income:85000  },
  { full_name:'Lena Schmidt',     city:'Berlin',       state:'Berlin',          country:'Germany',     currency:'EUR', income:72000  },
  { full_name:'Klaus Weber',      city:'Frankfurt',    state:'Hesse',           country:'Germany',     currency:'EUR', income:98000  },
  // Japan
  { full_name:'Hiroshi Tanaka',   city:'Tokyo',        state:'Tokyo',           country:'Japan',       currency:'JPY', income:8500000},
  { full_name:'Yuki Yamamoto',    city:'Osaka',        state:'Osaka',           country:'Japan',       currency:'JPY', income:6200000},
  // Australia
  { full_name:'Liam Anderson',    city:'Sydney',       state:'New South Wales', country:'Australia',   currency:'AUD', income:115000 },
  { full_name:'Emma Taylor',      city:'Melbourne',    state:'Victoria',        country:'Australia',   currency:'AUD', income:98000  },
  // Singapore
  { full_name:'Wei Liang Chen',   city:'Singapore',    state:'Singapore',       country:'Singapore',   currency:'SGD', income:180000 },
  { full_name:'Priya Nair',       city:'Singapore',    state:'Singapore',       country:'Singapore',   currency:'SGD', income:144000 },
];

const indianCities = [
  { city:'Hyderabad', state:'Telangana'     },
  { city:'Mumbai',    state:'Maharashtra'   },
  { city:'Delhi',     state:'Delhi'         },
  { city:'Bengaluru', state:'Karnataka'     },
  { city:'Chennai',   state:'Tamil Nadu'    },
  { city:'Pune',      state:'Maharashtra'   },
  { city:'Kolkata',   state:'West Bengal'   },
  { city:'Ahmedabad', state:'Gujarat'       },
  { city:'Jaipur',    state:'Rajasthan'     },
  { city:'Lucknow',   state:'Uttar Pradesh' }
];

const employmentTypes = [
  'Salaried','Salaried','Salaried','Salaried',
  'Self-Employed','Self-Employed','Self-Employed',
  'Business','Business',
  'Retired'
];

// ── Vehicle Reference Data ───────────────────────────────────────
const vehicles = [
  // India — Hatchbacks (INR)
  { make:'Maruti Suzuki', model:'Alto K10',   variant:'VXI',        year:2023, price:350000,    currency:'INR', segment:'Hatchback', fuel:'Petrol',   origin:'India'       },
  { make:'Maruti Suzuki', model:'Swift',      variant:'ZXI Plus',   year:2024, price:850000,    currency:'INR', segment:'Hatchback', fuel:'Petrol',   origin:'India'       },
  { make:'Hyundai',       model:'i20',        variant:'Asta',       year:2024, price:1050000,   currency:'INR', segment:'Hatchback', fuel:'Petrol',   origin:'South Korea' },
  { make:'Tata',          model:'Tiago',      variant:'XZ+',        year:2024, price:750000,    currency:'INR', segment:'Hatchback', fuel:'CNG',      origin:'India'       },
  // India — Sedans (INR)
  { make:'Honda',         model:'City',       variant:'ZX CVT',     year:2024, price:1550000,   currency:'INR', segment:'Sedan',     fuel:'Petrol',   origin:'Japan'       },
  { make:'Hyundai',       model:'Verna',      variant:'SX(O)',      year:2024, price:1450000,   currency:'INR', segment:'Sedan',     fuel:'Diesel',   origin:'South Korea' },
  { make:'Maruti Suzuki', model:'Ciaz',       variant:'Alpha',      year:2023, price:1200000,   currency:'INR', segment:'Sedan',     fuel:'Petrol',   origin:'India'       },
  // India — SUVs (INR)
  { make:'Tata',          model:'Nexon',      variant:'XZ+ TGDi',   year:2024, price:1650000,   currency:'INR', segment:'SUV',       fuel:'Petrol',   origin:'India'       },
  { make:'Hyundai',       model:'Creta',      variant:'SX(O)',      year:2024, price:1900000,   currency:'INR', segment:'SUV',       fuel:'Diesel',   origin:'South Korea' },
  { make:'Mahindra',      model:'Scorpio-N',  variant:'Z8 L',       year:2024, price:2350000,   currency:'INR', segment:'SUV',       fuel:'Diesel',   origin:'India'       },
  { make:'Kia',           model:'Seltos',     variant:'HTX+',       year:2024, price:1800000,   currency:'INR', segment:'SUV',       fuel:'Petrol',   origin:'South Korea' },
  // India — EVs (INR)
  { make:'Tata',          model:'Nexon EV',   variant:'Max',        year:2024, price:1950000,   currency:'INR', segment:'EV',        fuel:'Electric', origin:'India'       },
  { make:'MG',            model:'ZS EV',      variant:'Excite',     year:2024, price:2299000,   currency:'INR', segment:'EV',        fuel:'Electric', origin:'China'       },
  // India — MUVs (INR)
  { make:'Maruti Suzuki', model:'Ertiga',     variant:'ZXI+',       year:2024, price:1150000,   currency:'INR', segment:'MUV',       fuel:'CNG',      origin:'India'       },
  { make:'Kia',           model:'Carens',     variant:'Luxury+',    year:2024, price:1950000,   currency:'INR', segment:'MUV',       fuel:'Diesel',   origin:'South Korea' },
  // Global — Luxury (local currencies)
  { make:'BMW',           model:'3 Series',   variant:'320d Sport', year:2024, price:5500000,   currency:'INR', segment:'Luxury',    fuel:'Diesel',   origin:'Germany'     },
  { make:'Mercedes-Benz', model:'C-Class',    variant:'C 220d',     year:2024, price:6100000,   currency:'INR', segment:'Luxury',    fuel:'Diesel',   origin:'Germany'     },
  { make:'BMW',           model:'5 Series',   variant:'530i',       year:2024, price:65000,     currency:'USD', segment:'Luxury',    fuel:'Petrol',   origin:'Germany'     },
  { make:'Audi',          model:'Q7',         variant:'55 TFSI',    year:2024, price:89000,     currency:'USD', segment:'Luxury',    fuel:'Petrol',   origin:'Germany'     },
  { make:'Mercedes-Benz', model:'E-Class',    variant:'E 300',      year:2024, price:78000,     currency:'GBP', segment:'Luxury',    fuel:'Hybrid',   origin:'Germany'     },
  { make:'Lexus',         model:'RX 500h',    variant:'F Sport',    year:2024, price:9800000,   currency:'JPY', segment:'Luxury',    fuel:'Hybrid',   origin:'Japan'       },
  // Global — Hypercars (USD/EUR)
  { make:'Bugatti',       model:'Chiron',     variant:'Super Sport',year:2024, price:3200000,   currency:'USD', segment:'Hypercar',  fuel:'Petrol',   origin:'France'      },
  { make:'Lamborghini',   model:'Revuelto',   variant:'LP 1001-4',  year:2024, price:620000,    currency:'USD', segment:'Hypercar',  fuel:'Hybrid',   origin:'Italy'       },
  { make:'Ferrari',       model:'SF90',       variant:'Stradale',   year:2024, price:580000,    currency:'EUR', segment:'Hypercar',  fuel:'Hybrid',   origin:'Italy'       },
  { make:'Porsche',       model:'911 GT3',    variant:'RS',         year:2024, price:245000,    currency:'EUR', segment:'Hypercar',  fuel:'Petrol',   origin:'Germany'     },
  { make:'McLaren',       model:'750S',       variant:'Spider',     year:2024, price:380000,    currency:'GBP', segment:'Hypercar',  fuel:'Petrol',   origin:'UK'          },
];

const dealers = [
  'Hyderabad Motors','Mumbai Auto Hub','Delhi Car Palace',
  'Bengaluru Wheels','Chennai Auto Park','Pune Car World',
  'Dubai Luxury Motors','London Premium Cars','New York Auto Group',
  'Singapore Car Centre','Tokyo Motors','Sydney Prestige Cars'
];

// ── Helpers ──────────────────────────────────────────────────────
function pick(arr)              { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max)      { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randFloat(min, max, d) { return parseFloat((Math.random() * (max - min) + min).toFixed(d || 2)); }
function randomDate(start, end) {
  const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return d.toISOString().split('T')[0];
}
function generateEmail(name, idx) {
  const domains = ['gmail.com','yahoo.com','outlook.com','icloud.com'];
  return `${name.toLowerCase().replace(/\s+/g,'.')}${idx}@${pick(domains)}`;
}

// ── Seed Execution ───────────────────────────────────────────────
console.log('🌱 Seeding CarIQ database (Schema v2 — Global Expansion)...\n');

// 1. Insert vehicles
console.log('📦 Inserting vehicles...');
const insertVehicle = db.prepare(`
  INSERT OR IGNORE INTO vehicles
    (make, model, variant, year, price_local, currency_code,
     price_usd_equivalent, segment, fuel_type, country_origin)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const v of vehicles) {
  insertVehicle.run(
    v.make, v.model, v.variant, v.year,
    v.price, v.currency,
    toUSD(v.price, v.currency),
    v.segment, v.fuel, v.origin
  );
}

const allVehicles = db.prepare('SELECT * FROM vehicles').all();
console.log(`   ✅ ${allVehicles.length} vehicles inserted\n`);

// 2. Insert customers — 150 Indian + 20 international
console.log('👥 Inserting customers...');
const insertCustomer = db.prepare(`
  INSERT OR IGNORE INTO customers
    (full_name, email, phone, city, state, country,
     currency_code, annual_income_local, annual_income_usd,
     credit_score, employment_type)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

// Indian customers
for (let i = 1; i <= 150; i++) {
  const first = pick(indianFirstNames);
  const last  = pick(indianLastNames);
  const loc   = pick(indianCities);
  const emp   = pick(employmentTypes);

  let income;
  if      (emp === 'Salaried')      income = randInt(400000,  2500000);
  else if (emp === 'Self-Employed') income = randInt(600000,  5000000);
  else if (emp === 'Business')      income = randInt(1000000, 10000000);
  else                              income = randInt(200000,  800000);

  insertCustomer.run(
    `${first} ${last}`,
    generateEmail(`${first} ${last}`, i),
    `9${randInt(100000000, 999999999)}`,
    loc.city, loc.state, 'India', 'INR',
    income,
    toUSD(income, 'INR'),
    randInt(550, 900),
    emp
  );
}

// International customers
for (let i = 0; i < intlCustomers.length; i++) {
  const c = intlCustomers[i];
  insertCustomer.run(
    c.full_name,
    generateEmail(c.full_name, 200 + i),
    null,
    c.city, c.state, c.country, c.currency,
    c.income,
    toUSD(c.income, c.currency),
    randInt(600, 900),
    pick(['Salaried','Self-Employed','Business'])
  );
}

const allCustomers = db.prepare('SELECT * FROM customers').all();
console.log(`   ✅ ${allCustomers.length} customers inserted (150 India + ${intlCustomers.length} international)\n`);

// 3. Insert 300 leads
console.log('📋 Inserting leads...');
const insertLead = db.prepare(`
  INSERT INTO leads
    (customer_id, vehicle_id, enquiry_date, status, dealer_name, state, notes)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const startDate = new Date('2024-01-01');
const endDate   = new Date('2026-06-01');

for (let i = 0; i < 300; i++) {
  const customer = pick(allCustomers);
  const vehicle  = pick(allVehicles);

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
    'Seed data lead v2'
  );
}

const allLeads = db.prepare('SELECT * FROM leads').all();
console.log(`   ✅ ${allLeads.length} leads inserted\n`);

// 4. Transactions for all Converted leads
console.log('💳 Inserting transactions...');
const convertedLeads = db.prepare(`SELECT * FROM leads WHERE status = 'Converted'`).all();
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
  const enquiry  = new Date(lead.enquiry_date);
  const txDate   = new Date(enquiry.getTime() + randInt(3, 30) * 86400000);
  const txDateStr = txDate.toISOString().split('T')[0];

  // Normalize final price to INR equivalent for transaction record
  const finalPriceINR = Math.round(vehicle.price_usd_equivalent / FX['INR']);

  const modeRoll = Math.random();
  let payment_mode, loan_amount, tenure, rate, emi;

  if (modeRoll < 0.65) {
    payment_mode = 'Loan';
    const down   = vehicle.price_usd_equivalent * randFloat(0.1, 0.3);
    loan_amount  = Math.round((vehicle.price_usd_equivalent - down) / FX['INR']);
    tenure       = pick(tenureOptions);
    rate         = randFloat(7.5, 14.0);
    emi          = calculateEMI(loan_amount, rate, tenure);
  } else if (modeRoll < 0.85) {
    payment_mode = 'Full Cash';
    loan_amount = tenure = rate = emi = null;
  } else {
    payment_mode = 'Lease';
    loan_amount = tenure = rate = emi = null;
  }

  insertTransaction.run(
    lead.lead_id, lead.customer_id, lead.vehicle_id,
    txDateStr, finalPriceINR,
    loan_amount, tenure, rate, emi,
    payment_mode
  );
}

const allTransactions = db.prepare('SELECT * FROM transactions').all();
console.log(`   ✅ ${allTransactions.length} transactions inserted\n`);

// ── Summary ──────────────────────────────────────────────────────
console.log('━'.repeat(50));
console.log('🚗 CarIQ Seed Complete — Schema v2 Global Expansion');
console.log('━'.repeat(50));
console.log(`   Vehicles     : ${allVehicles.length} (India + Global + Hypercar)`);
console.log(`   Customers    : ${allCustomers.length} (150 India + 20 International)`);
console.log(`   Leads        : ${allLeads.length}`);
console.log(`   Transactions : ${allTransactions.length}`);
console.log('━'.repeat(50));