require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const http     = require('http');
const { Server } = require('socket.io');
const { runMigrations } = require('./config/database');

const customersRouter    = require('./routes/customers');
const vehiclesRouter     = require('./routes/vehicles');
const leadsRouter        = require('./routes/leads');
const transactionsRouter = require('./routes/transactions');
const authRouter         = require('./routes/auth');
const alertsRouter       = require('./routes/alerts');
const adminRouter        = require('./routes/admin');

const app    = express();
const server = http.createServer(app);

// ── Socket.io setup ───────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Make io accessible in controllers
app.set('io', io);

// ── Middleware ────────────────────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://localhost:3000',
    /\.railway\.app$/,
    /\.onrender\.com$/,
    /\.vercel\.app$/,
    /\.streamlit\.app$/,
  ],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public'), {
  etag: false,
  lastModified: false,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    }
  }
}));

// ── Database ──────────────────────────────────────────────────
runMigrations();

// Auto-seed if empty
async function autoSeed() {
  try {
    const { db } = require('./config/database');
    const count  = db.prepare('SELECT COUNT(*) as c FROM customers').get();
    if (count.c === 0) {
      console.log('🌱 Empty database — running auto-seed...');
      require('./seed');
    } else {
      console.log(`✅ Database has ${count.c} customers — skipping seed`);
    }
  } catch (err) {
    console.log('⚠️  Auto-seed check failed:', err.message);
  }
}
autoSeed();

// ── Alert Scheduler ───────────────────────────────────────────
const { startScheduler } = require('./alerts/alertScheduler');
startScheduler();

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth',         authRouter);
app.use('/api/admin',        adminRouter);
app.use('/api/customers',    customersRouter);
app.use('/api/vehicles',     vehiclesRouter);
app.use('/api/leads',        leadsRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/alerts',       alertsRouter);
const reportsRouter = require('./routes/reports');
app.use('/api/reports', reportsRouter);
const chatbotRouter = require('./routes/chatbot');
app.use('/api/chatbot', chatbotRouter);

app.get('/health', (req, res) => {
  const connectedClients = io.engine.clientsCount;
  res.json({
    status:           'ok',
    project:          'CarIQ',
    websocket:        'enabled',
    connected_clients: connectedClients,
    timestamp:        new Date().toISOString(),
  });
});

// ── 404 + Global error handlers ───────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// ── Socket.io Events ─────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  socket.on('join_room', (room) => {
    socket.join(room);
    console.log(`   ${socket.id} joined room: ${room}`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// ── Start ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n🚗 CarIQ server running on http://localhost:${PORT}`);
  console.log(`   Environment : ${process.env.NODE_ENV}`);
  console.log(`   WebSocket   : enabled (socket.io)`);
  console.log(`   DB Mode     : ${process.env.DB_MODE || 'sqlite'}\n`);
});

module.exports = { app, io };