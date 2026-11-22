require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const fs = require('fs');
const db = require('./database');

const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const examRoutes = require('./routes/exams');
const sessionRoutes = require('./routes/sessions');
const telemetryRoutes = require('./routes/telemetry');
const reportRoutes = require('./routes/reports');

const app = express();
const PORT = process.env.PORT || 5000;

// Security and Performance Middlewares
app.use(compression()); // Gzip compression
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    system: 'Smart Exam Security Platform',
    timestamp: new Date().toISOString(),
    concurrency_target: 1000
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/reports', reportRoutes);

// In Production, serve Vite static frontend build
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));

// Fallback to React index.html for client-side routing (compatible with Express 5)
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  const indexPath = path.join(clientDist, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).send('Smart Exam Security API is active. Frontend is building or running on port 3000.');
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

async function start() {
  try {
    await db.init();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`====================================================`);
      console.log(`🚀 Smart Exam Security Server is running on port ${PORT}`);
      console.log(`⚡ In-memory SQLite engine active (zero DLLs, microsecond latency)`);
      console.log(`👥 Engineered for 1,000+ concurrent student sessions`);
      console.log(`🛡️  All security, telemetry, and PDF protections active`);
      console.log(`====================================================`);
    });
  } catch (err) {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  }
}

start();

module.exports = app;
