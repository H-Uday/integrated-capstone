/**
 * db.js
 * Unified database adapter — switches between SQLite and PostgreSQL
 * based on DB_MODE environment variable.
 *
 * DB_MODE=sqlite  → uses better-sqlite3 (synchronous, current default)
 * DB_MODE=postgres → uses pg Pool (async, production mode)
 *
 * This abstraction allows the app to run on either database
 * without changing any controller code.
 */

require('dotenv').config();

const DB_MODE = process.env.DB_MODE || 'sqlite';

let adapter;

if (DB_MODE === 'postgres') {
  const { pool } = require('./database.pg');

  adapter = {
    mode: 'postgres',

    // Wraps pg pool query to match better-sqlite3 API style
    async query(sql, params = []) {
      // Convert SQLite ? placeholders to PostgreSQL $1, $2...
      let pgSql = sql;
      let paramIndex = 1;
      pgSql = pgSql.replace(/\?/g, () => `$${paramIndex++}`);

      const result = await pool.query(pgSql, params);
      return result.rows;
    },

    async get(sql, params = []) {
      const rows = await this.query(sql, params);
      return rows[0] || null;
    },

    async all(sql, params = []) {
      return await this.query(sql, params);
    },

    async run(sql, params = []) {
      let pgSql = sql;
      let paramIndex = 1;
      pgSql = pgSql.replace(/\?/g, () => `$${paramIndex++}`);

      // For INSERT, return lastInsertRowid equivalent
      if (pgSql.trim().toUpperCase().startsWith('INSERT')) {
        pgSql += ' RETURNING *';
      }
      const result = await pool.query(pgSql, params);
      return {
        lastInsertRowid: result.rows[0]?.customer_id ||
                         result.rows[0]?.vehicle_id  ||
                         result.rows[0]?.lead_id     ||
                         result.rows[0]?.transaction_id ||
                         result.rows[0]?.user_id     || null,
        changes: result.rowCount,
      };
    },

    pool,
  };

  console.log('🐘 Database mode: PostgreSQL');

} else {
  // SQLite mode — default
  const { db, runMigrations } = require('./database');

  adapter = {
    mode: 'sqlite',
    db,
    runMigrations,

    query(sql, params = []) {
      return db.prepare(sql).all(...params);
    },

    get(sql, params = []) {
      return db.prepare(sql).get(...params);
    },

    all(sql, params = []) {
      return db.prepare(sql).all(...params);
    },

    run(sql, params = []) {
      return db.prepare(sql).run(...params);
    },
  };

  console.log('🗄️  Database mode: SQLite');
}

module.exports = adapter;