const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { db }  = require('../config/database');

const JWT_SECRET  = process.env.JWT_SECRET || 'cariq_dev_secret_2026';
const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

// In-memory attempt tracker — resets on server restart (dev only)
const loginAttempts = {};

function getAttemptKey(email) {
  return email.toLowerCase().trim();
}

function isLocked(key) {
  const record = loginAttempts[key];
  if (!record) return false;
  if (record.count < MAX_ATTEMPTS) return false;

  const lockUntil = new Date(record.lockedAt);
  lockUntil.setMinutes(lockUntil.getMinutes() + LOCK_MINUTES);
  if (new Date() < lockUntil) return true;

  // Lock expired — reset
  delete loginAttempts[key];
  return false;
}

function recordAttempt(key) {
  if (!loginAttempts[key]) {
    loginAttempts[key] = { count: 1, lockedAt: null };
  } else {
    loginAttempts[key].count += 1;
  }
  if (loginAttempts[key].count >= MAX_ATTEMPTS) {
    loginAttempts[key].lockedAt = new Date().toISOString();
  }
  return loginAttempts[key].count;
}

function resetAttempts(key) {
  delete loginAttempts[key];
}

function getRemainingAttempts(key) {
  const record = loginAttempts[key];
  if (!record) return MAX_ATTEMPTS;
  return Math.max(0, MAX_ATTEMPTS - record.count);
}

// ── Register ─────────────────────────────────────────────────
async function register(req, res) {
  const { username, email, password, role } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({
      success: false,
      error: 'username, email, and password are required'
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      error: 'Password must be at least 6 characters'
    });
  }

  try {
    const salt         = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const stmt = db.prepare(`
      INSERT INTO users (username, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(
      username.trim(),
      email.trim().toLowerCase(),
      password_hash,
      role || 'dealer'
    );

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user_id: result.lastInsertRowid
    });

  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({
        success: false,
        error: 'Username or email already exists'
      });
    }
    console.error('register error:', err.message);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

// ── Login ────────────────────────────────────────────────────
async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'email and password are required'
    });
  }

  const key = getAttemptKey(email);

  // Check lock
  if (isLocked(key)) {
    return res.status(429).json({
      success: false,
      error: `Account temporarily locked after ${MAX_ATTEMPTS} failed attempts. Try again in ${LOCK_MINUTES} minutes.`,
      locked: true
    });
  }

  try {
    const user = db.prepare(
      'SELECT * FROM users WHERE email = ?'
    ).get(email.trim().toLowerCase());

    if (!user) {
      const attempts = recordAttempt(key);
      const remaining = getRemainingAttempts(key);
      return res.status(401).json({
        success:   false,
        error:     `Invalid email or password. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`,
        remaining
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      const attempts  = recordAttempt(key);
      const remaining = getRemainingAttempts(key);

      if (remaining === 0) {
        return res.status(429).json({
          success: false,
          error:   `Too many failed attempts. Account locked for ${LOCK_MINUTES} minutes.`,
          locked:  true,
          remaining: 0
        });
      }

      return res.status(401).json({
        success:   false,
        error:     `Invalid email or password. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`,
        remaining
      });
    }

    // Success — reset attempts, issue token
    resetAttempts(key);

    const token = jwt.sign(
      { user_id: user.user_id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.status(200).json({
      success: true,
      message: `Welcome back, ${user.username}!`,
      token,
      user: {
        user_id:  user.user_id,
        username: user.username,
        email:    user.email,
        role:     user.role
      }
    });

  } catch (err) {
    console.error('login error:', err.message);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

module.exports = { register, login };