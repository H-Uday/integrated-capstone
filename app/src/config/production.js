/**
 * production.js
 * Production configuration checklist and validator.
 * Run: node src/config/production.js
 *
 * Checks all required environment variables and
 * connection health before production deployment.
 */

require('dotenv').config();

const REQUIRED_VARS = [
  'PORT',
  'NODE_ENV',
  'JWT_SECRET',
  'DB_MODE',
];

const SQLITE_VARS   = ['DB_PATH'];
const POSTGRES_VARS = ['PG_HOST','PG_PORT','PG_DATABASE','PG_USER','PG_PASSWORD'];
const EMAIL_VARS    = ['ALERT_EMAIL_FROM','ALERT_EMAIL_TO'];

function checkEnvVars() {
  console.log('\n🔍 Environment Variable Check:');
  let allOk = true;

  // Core vars
  REQUIRED_VARS.forEach(v => {
    const val = process.env[v];
    const ok  = !!val;
    if (!ok) allOk = false;
    console.log(`   ${ok ? '✅' : '❌'} ${v}: ${val || 'MISSING'}`);
  });

  // DB-specific vars
  const mode = process.env.DB_MODE || 'sqlite';
  const dbVars = mode === 'postgres' ? POSTGRES_VARS : SQLITE_VARS;
  console.log(`\n   Database mode: ${mode.toUpperCase()}`);
  dbVars.forEach(v => {
    const val = process.env[v];
    const ok  = !!val;
    if (!ok) allOk = false;
    console.log(`   ${ok ? '✅' : '❌'} ${v}: ${val || 'MISSING'}`);
  });

  // Security checks
  console.log('\n🔒 Security Check:');
  const jwtSecret = process.env.JWT_SECRET || '';
  const jwtOk     = jwtSecret.length >= 20;
  if (!jwtOk) allOk = false;
  console.log(`   ${jwtOk ? '✅' : '❌'} JWT_SECRET length: ${jwtSecret.length} chars (min 20)`);

  const nodeEnv   = process.env.NODE_ENV;
  const envOk     = nodeEnv === 'production';
  console.log(`   ${envOk ? '✅' : '⚠️ '} NODE_ENV: ${nodeEnv} ${!envOk ? '(should be production)' : ''}`);

  const alertMode = process.env.ALERT_ENABLED;
  console.log(`   ℹ️  ALERT_ENABLED: ${alertMode || 'false'} (email alerts)`);

  return allOk;
}

async function checkDatabaseConnection() {
  console.log('\n🗄️  Database Connection Check:');
  const mode = process.env.DB_MODE || 'sqlite';

  if (mode === 'postgres') {
    try {
      const { testConnection } = require('./database.pg');
      const ok = await testConnection();
      console.log(`   ${ok ? '✅' : '❌'} PostgreSQL connection: ${ok ? 'OK' : 'FAILED'}`);
      return ok;
    } catch (err) {
      console.log(`   ❌ PostgreSQL error: ${err.message}`);
      return false;
    }
  } else {
    const fs   = require('fs');
    const path = require('path');
    const dbPath = path.resolve(process.env.DB_PATH || './cariq.sqlite');
    const exists = fs.existsSync(dbPath);
    console.log(`   ${exists ? '✅' : '❌'} SQLite file: ${dbPath}`);
    if (exists) {
      const stats = fs.statSync(dbPath);
      console.log(`   ℹ️  File size: ${(stats.size / 1024).toFixed(1)} KB`);
    }
    return exists;
  }
}

function printProductionChecklist() {
  console.log('\n📋 Production Deployment Checklist:');
  const items = [
    ['Set NODE_ENV=production in .env',                   true],
    ['Change DB_MODE=postgres in .env',                   false],
    ['Run migration: node src/config/migrate_to_pg.js',   false],
    ['Set JWT_SECRET to 32+ character random string',     true],
    ['Configure GMAIL_USER + GMAIL_PASS for alerts',      false],
    ['Set ALERT_ENABLED=true for real email alerts',      false],
    ['Deploy to Railway (backend) + Vercel (frontend)',   false],
    ['Set CORS to production domain only',                false],
    ['Add HTTPS enforcement via reverse proxy',           false],
    ['Set up daily pipeline cron on server',              false],
  ];
  items.forEach(([item, done]) => {
    console.log(`   ${done ? '✅' : '⬜'} ${item}`);
  });
}

async function runProductionCheck() {
  console.log('🚗 CarIQ — Production Readiness Check');
  console.log('='.repeat(50));

  const envOk = checkEnvVars();
  const dbOk  = await checkDatabaseConnection();
  printProductionChecklist();

  console.log('\n' + '='.repeat(50));
  if (envOk && dbOk) {
    console.log('✅ System is READY for production deployment');
  } else {
    console.log('⚠️  Fix issues above before deploying to production');
  }
  console.log('='.repeat(50));

  process.exit(0);
}

runProductionCheck();