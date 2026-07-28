/**
 * migrate_to_pg.js
 * Migrates all data from SQLite (cariq.sqlite) to PostgreSQL.
 *
 * Run once: node src/config/migrate_to_pg.js
 *
 * Process:
 * 1. Read all data from SQLite
 * 2. Create PostgreSQL tables and indexes
 * 3. Insert data in correct order (respecting FK constraints)
 * 4. Verify row counts match
 */

require('dotenv').config();
const Database = require('better-sqlite3');
const path     = require('path');
const { pool, runMigrationsPG } = require('./database.pg');

const SQLITE_PATH = path.resolve(process.env.DB_PATH || './cariq.sqlite');

async function migrateData() {
  console.log('🚀 CarIQ — SQLite → PostgreSQL Migration');
  console.log('='.repeat(50));

  // Connect to SQLite
  let sqlite;
  try {
    sqlite = new Database(SQLITE_PATH);
    console.log(`\n✅ SQLite connected: ${SQLITE_PATH}`);
  } catch (err) {
    console.error('❌ SQLite connection failed:', err.message);
    process.exit(1);
  }

  // Run PostgreSQL migrations first
  await runMigrationsPG();

  const client = await pool.connect();

  try {
    // ── 1. Migrate Customers ──────────────────────────────────
    console.log('\n📦 Migrating customers...');
    const customers = sqlite.prepare('SELECT * FROM customers').all();

    for (const c of customers) {
      await client.query(`
        INSERT INTO customers
          (customer_id, full_name, email, phone, city, state,
           country, currency_code, annual_income_local,
           annual_income_usd, credit_score, employment_type, created_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
        ON CONFLICT (customer_id) DO NOTHING
      `, [
        c.customer_id, c.full_name, c.email, c.phone || null,
        c.city, c.state,
        c.country        || 'India',
        c.currency_code  || 'INR',
        c.annual_income_local || c.annual_income || 0,
        c.annual_income_usd   || (c.annual_income || 0) * 0.0107,
        c.credit_score,
        c.employment_type,
        c.created_at || new Date().toISOString(),
      ]);
    }

    // Reset sequence
    await client.query(`
      SELECT setval('customers_customer_id_seq',
        (SELECT MAX(customer_id) FROM customers))
    `);
    console.log(`    ✅ ${customers.length} customers migrated`);

    // ── 2. Migrate Vehicles ───────────────────────────────────
    console.log('📦 Migrating vehicles...');
    const vehicles = sqlite.prepare('SELECT * FROM vehicles').all();

    for (const v of vehicles) {
      await client.query(`
        INSERT INTO vehicles
          (vehicle_id, make, model, variant, year,
           price_local, currency_code, price_usd_equivalent,
           segment, fuel_type, country_origin, created_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
        ON CONFLICT (vehicle_id) DO NOTHING
      `, [
        v.vehicle_id, v.make, v.model,
        v.variant || null, v.year,
        v.price_local      || v.price_inr || 0,
        v.currency_code    || 'INR',
        v.price_usd_equivalent || (v.price_inr || 0) * 0.0107,
        v.segment, v.fuel_type, v.country_origin,
        v.created_at || new Date().toISOString(),
      ]);
    }
    await client.query(`
      SELECT setval('vehicles_vehicle_id_seq',
        (SELECT MAX(vehicle_id) FROM vehicles))
    `);
    console.log(`    ✅ ${vehicles.length} vehicles migrated`);

    // ── 3. Migrate Leads ──────────────────────────────────────
    console.log('📦 Migrating leads...');
    const leads = sqlite.prepare('SELECT * FROM leads').all();

    for (const l of leads) {
      await client.query(`
        INSERT INTO leads
          (lead_id, customer_id, vehicle_id, enquiry_date,
           status, dealer_name, state, notes, created_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        ON CONFLICT (lead_id) DO NOTHING
      `, [
        l.lead_id, l.customer_id, l.vehicle_id,
        l.enquiry_date, l.status,
        l.dealer_name || null,
        l.state,
        l.notes || null,
        l.created_at || new Date().toISOString(),
      ]);
    }
    await client.query(`
      SELECT setval('leads_lead_id_seq',
        (SELECT MAX(lead_id) FROM leads))
    `);
    console.log(`    ✅ ${leads.length} leads migrated`);

    // ── 4. Migrate Transactions ───────────────────────────────
    console.log('📦 Migrating transactions...');
    const transactions = sqlite.prepare('SELECT * FROM transactions').all();

    for (const t of transactions) {
      await client.query(`
        INSERT INTO transactions
          (transaction_id, lead_id, customer_id, vehicle_id,
           transaction_date, final_price_inr, loan_amount,
           loan_tenure_months, interest_rate, emi_amount,
           payment_mode, created_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
        ON CONFLICT (transaction_id) DO NOTHING
      `, [
        t.transaction_id,
        t.lead_id || null,
        t.customer_id, t.vehicle_id,
        t.transaction_date,
        t.final_price_inr,
        t.loan_amount || null,
        t.loan_tenure_months || null,
        t.interest_rate || null,
        t.emi_amount || null,
        t.payment_mode,
        t.created_at || new Date().toISOString(),
      ]);
    }
    await client.query(`
      SELECT setval('transactions_transaction_id_seq',
        (SELECT MAX(transaction_id) FROM transactions))
    `);
    console.log(`    ✅ ${transactions.length} transactions migrated`);

    // ── 5. Verify Row Counts ──────────────────────────────────
    console.log('\n🔍 Verifying migration...');
    const tables = ['customers','vehicles','leads','transactions'];

    console.log(`\n${'Table'.padEnd(20)} ${'SQLite'.padStart(10)} ${'PostgreSQL'.padStart(12)} ${'Match'.padStart(8)}`);
    console.log('-'.repeat(52));

    let allMatch = true;
    for (const table of tables) {
      const sqliteCount = sqlite.prepare(`SELECT COUNT(*) as c FROM ${table}`).get().c;
      const pgResult    = await client.query(`SELECT COUNT(*) as c FROM ${table}`);
      const pgCount     = parseInt(pgResult.rows[0].c, 10);
      const match       = sqliteCount === pgCount ? '✅' : '❌';
      if (sqliteCount !== pgCount) allMatch = false;

      const tableNameFormatted   = table.padEnd(20);
      const sqliteCountFormatted = String(sqliteCount).padStart(10);
      const pgCountFormatted     = String(pgCount).padStart(12);
      const matchFormatted       = match.padStart(8);

      console.log(`${tableNameFormatted} ${sqliteCountFormatted} ${pgCountFormatted} ${matchFormatted}`);
    }

    console.log('\n' + '='.repeat(50));
    if (allMatch) {
      console.log('✅ Migration SUCCESSFUL — all row counts match');
      console.log('\nNext step: Change DB_MODE=postgres in .env');
      console.log('Then restart: npm run dev');
    } else {
      console.log('⚠️  Migration completed with mismatches — check logs above');
    }
    console.log('='.repeat(50));

  } catch (err) {
    console.error('❌ Migration error:', err.message);
    throw err;
  } finally {
    client.release();
    sqlite.close();
    await pool.end();
  }
}

migrateData().catch(err => {
  console.error('Fatal migration error:', err);
  process.exit(1);
});