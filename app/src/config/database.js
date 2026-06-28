const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

const DB_PATH = process.env.DB_PATH || './cariq.sqlite';

const db = new Database(path.resolve(DB_PATH), {
  verbose: process.env.NODE_ENV === 'development' ? console.log : null
});

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function runMigrations() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      customer_id     INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name       TEXT NOT NULL,
      email           TEXT UNIQUE NOT NULL,
      phone           TEXT,
      city            TEXT NOT NULL,
      state           TEXT NOT NULL,
      annual_income   REAL NOT NULL CHECK (annual_income > 0),
      credit_score    INTEGER NOT NULL CHECK (credit_score BETWEEN 300 AND 900),
      employment_type TEXT NOT NULL CHECK (employment_type IN (
                        'Salaried','Self-Employed','Business','Retired')),
      created_at      TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS vehicles (
      vehicle_id      INTEGER PRIMARY KEY AUTOINCREMENT,
      make            TEXT NOT NULL,
      model           TEXT NOT NULL,
      variant         TEXT,
      year            INTEGER NOT NULL CHECK (year BETWEEN 2015 AND 2026),
      price_inr       REAL NOT NULL CHECK (price_inr > 0),
      segment         TEXT NOT NULL CHECK (segment IN (
                        'Hatchback','Sedan','SUV','Luxury','EV','MUV')),
      fuel_type       TEXT NOT NULL CHECK (fuel_type IN (
                        'Petrol','Diesel','Electric','Hybrid','CNG')),
      country_origin  TEXT NOT NULL,
      created_at      TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS leads (
      lead_id         INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id     INTEGER NOT NULL REFERENCES customers(customer_id),
      vehicle_id      INTEGER NOT NULL REFERENCES vehicles(vehicle_id),
      enquiry_date    TEXT NOT NULL,
      status          TEXT NOT NULL CHECK (status IN (
                        'New','In-Progress','Converted','Rejected','On-Hold')),
      dealer_name     TEXT,
      state           TEXT NOT NULL,
      notes           TEXT,
      created_at      TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS transactions (
      transaction_id      INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id             INTEGER NOT NULL REFERENCES leads(lead_id),
      customer_id         INTEGER NOT NULL REFERENCES customers(customer_id),
      vehicle_id          INTEGER NOT NULL REFERENCES vehicles(vehicle_id),
      transaction_date    TEXT NOT NULL,
      final_price_inr     REAL NOT NULL CHECK (final_price_inr > 0),
      loan_amount         REAL CHECK (loan_amount >= 0),
      loan_tenure_months  INTEGER CHECK (loan_tenure_months IN
                            (12,24,36,48,60,72,84)),
      interest_rate       REAL CHECK (interest_rate BETWEEN 6.0 AND 20.0),
      emi_amount          REAL,
      payment_mode        TEXT CHECK (payment_mode IN
                            ('Full Cash','Loan','Lease')),
      created_at          TEXT DEFAULT (datetime('now'))
    );
  `);

  console.log('✅ Database migrations complete — all tables verified.');
}

module.exports = { db, runMigrations };