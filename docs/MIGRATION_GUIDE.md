# CarIQ — SQLite to PostgreSQL Migration Guide

## Overview

CarIQ uses SQLite in development (zero-config, single file) and
PostgreSQL in production (multi-user, connection pooling, indexes).

The migration script transfers all data with zero data loss.

---

## Prerequisites

- PostgreSQL 16+ installed and running
- `cariq.sqlite` database file present in `/app`
- Node.js dependencies installed (`npm install`)

---

## Step 1 — Create PostgreSQL Database

```bash
psql -U postgres
CREATE DATABASE cariq_db;
CREATE USER cariq_user WITH PASSWORD 'cariq2026';
GRANT ALL PRIVILEGES ON DATABASE cariq_db TO cariq_user;
\q
```

---

## Step 2 — Update `.env`
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=cariq_db
PG_USER=cariq_user
PG_PASSWORD=cariq2026
DB_MODE=sqlite # Keep as sqlite until migration completes
---

## Step 3 — Run Migration Script

```bash
cd app
node src/config/migrate_to_pg.js
```

Expected output:
✅ customers migrated : 170
✅ vehicles migrated : 26
✅ leads migrated : 300
✅ transactions migrated: 94
✅ Migration SUCCESSFUL — all row counts match
---

## Step 4 — Switch to PostgreSQL

In `.env`, change:
DB_MODE=postgres
Restart server:
```bash
npm run dev
```

---

## Step 5 — Verify

```bash
npm run prod:check
```

All checks should show ✅

---

## Performance Indexes Created

| Index | Table | Column | Purpose |
|---|---|---|---|
| idx_leads_customer | leads | customer_id | Fast customer lead lookup |
| idx_leads_status | leads | status | Filter by New/Converted |
| idx_leads_enquiry | leads | enquiry_date | Date range queries |
| idx_transactions_lead | transactions | lead_id | Lead→Transaction join |
| idx_transactions_cust | transactions | customer_id | Customer history |
| idx_customers_country | customers | country | International filtering |
| idx_customers_income | customers | annual_income_usd | Affordability analysis |
| idx_vehicles_segment | vehicles | segment | Segment filtering |

---

## Rollback — Switch Back to SQLite

In `.env`, change:
DB_MODE=sqlite
Restart server. SQLite file is never deleted — rollback is instant.

---

## Production Environment Variables
NODE_ENV=production
PORT=3000
DB_MODE=postgres
PG_HOST=your-pg-host
PG_PORT=5432
PG_DATABASE=cariq_db
PG_USER=cariq_user
PG_PASSWORD=your-secure-password
JWT_SECRET=your-32-char-minimum-secret
ALERT_ENABLED=true
GMAIL_USER=your-gmail@gmail.com
GMAIL_PASS=your-app-password
