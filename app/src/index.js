require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { runMigrations } = require('./config/database');

const customersRouter = require('./routes/customers');
const vehiclesRouter = require('./routes/vehicles');
const leadsRouter = require('./routes/leads');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Run DB migrations on startup
runMigrations();

// Routes
app.use('/api/customers', customersRouter);
app.use('/api/vehicles', vehiclesRouter);
app.use('/api/leads', leadsRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    project: 'CarIQ',
    phase: 2,
    timestamp: new Date().toISOString()
  });
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