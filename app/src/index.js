const path = require('path');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { runMigrations } = require('./config/database');

const authRouter = require('./routes/auth');
const alertsRouter = require('./routes/alerts');
const customersRouter = require('./routes/customers');
const vehiclesRouter = require('./routes/vehicles');
const leadsRouter = require('./routes/leads');
const transactionsRouter = require('./routes/transactions');

const app = express();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://localhost:3000',
    /\.onrender\.app$/,  
    /\.onrender\.com$/,
    /\.railway\.app$/,
    /\.vercel\.app$/,
    /\.streamlit\.app$/,
  ],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Serve frontend static files
// app.use(express.static(path.join(__dirname, '../public')));
app.use(express.static(path.join(__dirname, '../public'), {
  etag: false,
  lastModified: false,
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    }
  }
}));

// Run DB migrations on startup
runMigrations();

// Auto-seed database if empty (for cloud deployment)
async function autoSeed() {
  try {
    const { db } = require('./config/database');
    const count = db.prepare('SELECT COUNT(*) as c FROM customers').get();
    if (count.c === 0) {
      console.log('🌱 Empty database detected — running auto-seed...');
      require('./seed');
    } else {
      console.log(`✅ Database has ${count.c} customers — skipping seed`);
    }
  } catch (err) {
    console.log('⚠️  Auto-seed check failed:', err.message);
  }
}
autoSeed();

// Start dealer alert scheduler
const { startScheduler } = require('./alerts/alertScheduler');
startScheduler();

// Routes
app.use('/api/auth', authRouter);
const adminRouter = require('./routes/admin');
// ...
app.use('/api/admin', adminRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/customers', customersRouter);
app.use('/api/vehicles', vehiclesRouter);
app.use('/api/leads', leadsRouter);
app.use('/api/transactions', transactionsRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    project: 'CarIQ',
    phase: 2,
    timestamp: new Date().toISOString()
  });
});

// Default route — serve home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/home.html'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚗 CarIQ server running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV}`);
});