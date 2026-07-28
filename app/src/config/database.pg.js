/**
 * database.pg.js
 * PostgreSQL connection with connection pooling.
 *
 * Uses pg-Pool for efficient connection management:
 * - Max 10 concurrent connections
 * - Idle connections released after 30 seconds
 * - Connection timeout after 2 seconds
 *
 * Why PostgreSQL over SQLite for production:
 * - Handles multiple concurrent writers (SQLite = single writer)
 * - Connection pooling for high traffic
 * - Full ACID compliance with row-level locking
 * - Better support for concurrent dealer sessions
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host:              process.env.PG_HOST     || 'localhost',
  port:              parseInt(process.env.PG_PORT || '5432'),
  database:          process.env.PG_DATABASE || 'cariq_db',
  user:              process.env.PG_USER     || 'cariq_user',
  password:          process.env.PG_PASSWORD || 'cariq2026',
  max:               parseInt(process.env.PG_MAX_CONNECTIONS || '10'),
  idleTimeoutMillis: parseInt(process.env.PG_IDLE_TIMEOUT    || '30000'),
  connectionTimeoutMillis: parseInt(process.env.PG_CONNECTION_TIMEOUT || '2000'),
});

// Test connection on startup
pool.on('connect', () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🐘 PostgreSQL client connected from pool');
  }
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL pool error:', err.message);
});

async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version()');
    console.log('✅ PostgreSQL connected:', result.rows[0].current_time);
    console.log('   Version:', result.rows[0].version.split(',')[0]);
    client.release();
    return true;
  } catch (err) {
    console.error('❌ PostgreSQL connection failed:', err.message);
    return false;
  }
}

async function runMigrationsPG() {
  const client = await pool.connect();
  try {
    console.log('\n🐘 Running PostgreSQL migrations...\n');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id        SERIAL PRIMARY KEY,
        username       TEXT UNIQUE NOT NULL,
        email          TEXT UNIQUE NOT NULL,
        password_hash  TEXT NOT NULL,
        role           TEXT NOT NULL DEFAULT 'dealer'
                       CHECK (role IN ('admin','dealer','analyst')),
        created_at     TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('   ✅ users table');

    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        customer_id         SERIAL PRIMARY KEY,
        full_name           TEXT NOT NULL,
        email               TEXT UNIQUE NOT NULL,
        phone               TEXT,
        city                TEXT NOT NULL,
        state               TEXT NOT NULL,
        country             TEXT NOT NULL DEFAULT 'India',
        currency_code       TEXT NOT NULL DEFAULT 'INR',
        annual_income_local REAL NOT NULL CHECK (annual_income_local > 0),
        annual_income_usd   REAL NOT NULL CHECK (annual_income_usd > 0),
        credit_score        INTEGER NOT NULL
                            CHECK (credit_score BETWEEN 300 AND 900),
        employment_type     TEXT NOT NULL
                            CHECK (employment_type IN (
                              'Salaried','Self-Employed','Business','Retired')),
        created_at          TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('   ✅ customers table');

    await client.query(`
      CREATE TABLE IF NOT EXISTS vehicles (
        vehicle_id           SERIAL PRIMARY KEY,
        make                 TEXT NOT NULL,
        model                TEXT NOT NULL,
        variant              TEXT,
        year                 INTEGER NOT NULL CHECK (year BETWEEN 2015 AND 2026),
        price_local          REAL NOT NULL CHECK (price_local > 0),
        currency_code        TEXT NOT NULL DEFAULT 'INR',
        price_usd_equivalent REAL NOT NULL CHECK (price_usd_equivalent > 0),
        segment              TEXT NOT NULL
                             CHECK (segment IN (
                               'Hatchback','Sedan','SUV','Luxury',
                               'EV','MUV','Hypercar')),
        fuel_type            TEXT NOT NULL
                             CHECK (fuel_type IN (
                               'Petrol','Diesel','Electric','Hybrid','CNG')),
        country_origin       TEXT NOT NULL,
        created_at           TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('   ✅ vehicles table');

    await client.query(`
      CREATE TABLE IF NOT EXISTS leads (
        lead_id       SERIAL PRIMARY KEY,
        customer_id   INTEGER NOT NULL REFERENCES customers(customer_id),
        vehicle_id    INTEGER NOT NULL REFERENCES vehicles(vehicle_id),
        enquiry_date  DATE NOT NULL,
        status        TEXT NOT NULL
                      CHECK (status IN (
                        'New','In-Progress','Converted','Rejected','On-Hold')),
        dealer_name   TEXT,
        state         TEXT NOT NULL,
        notes         TEXT,
        created_at    TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('   ✅ leads table');

    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        transaction_id      SERIAL PRIMARY KEY,
        lead_id             INTEGER REFERENCES leads(lead_id),
        customer_id         INTEGER NOT NULL REFERENCES customers(customer_id),
        vehicle_id          INTEGER NOT NULL REFERENCES vehicles(vehicle_id),
        transaction_date    DATE NOT NULL,
        final_price_inr     REAL NOT NULL CHECK (final_price_inr > 0),
        loan_amount         REAL CHECK (loan_amount >= 0),
        loan_tenure_months  INTEGER CHECK (loan_tenure_months IN
                            (12,24,36,48,60,72,84)),
        interest_rate       REAL CHECK (interest_rate BETWEEN 6.0 AND 20.0),
        emi_amount          REAL,
        payment_mode        TEXT CHECK (payment_mode IN
                            ('Full Cash','Loan','Lease')),
        created_at          TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('   ✅ transactions table');

    // ── Indexes for performance ──────────────────────────────
    const indexes = [
      `CREATE INDEX IF NOT EXISTS idx_leads_customer    ON leads(customer_id)`,
      `CREATE INDEX IF NOT EXISTS idx_leads_status      ON leads(status)`,
      `CREATE INDEX IF NOT EXISTS idx_leads_enquiry     ON leads(enquiry_date)`,
      `CREATE INDEX IF NOT EXISTS idx_transactions_lead ON transactions(lead_id)`,
      `CREATE INDEX IF NOT EXISTS idx_transactions_cust ON transactions(customer_id)`,
      `CREATE INDEX IF NOT EXISTS idx_customers_country ON customers(country)`,
      `CREATE INDEX IF NOT EXISTS idx_customers_income  ON customers(annual_income_usd)`,
      `CREATE INDEX IF NOT EXISTS idx_vehicles_segment  ON vehicles(segment)`,
    ];

    for (const idx of indexes) {
      await client.query(idx);
    }
    console.log('   ✅ 8 performance indexes created');

    console.log('\n✅ PostgreSQL migrations complete — all tables and indexes ready');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, testConnection, runMigrationsPG };