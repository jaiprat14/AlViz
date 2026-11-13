require('dotenv').config();

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const datasetRoutes = require('./routes/datasets');
const historyRoutes = require('./routes/history');

// Connect to MongoDB
connectDB();

const app = express();

// Security headers with relaxed CSP for CDN scripts
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

// CORS — allow all origins in development
app.use(
  cors({
    origin: process.env.NODE_ENV === 'production' ? process.env.CLIENT_ORIGIN : '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// HTTP request logger
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Body parser
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

// Rate limiting for API requests
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// Serve static frontend assets
const clientPath = path.join(__dirname, '../client');
app.use(express.static(clientPath));

// API health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'AlViz API' });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/datasets', datasetRoutes);
app.use('/api/history', historyRoutes);

// Dedicated route for the Algorithm Visualizer workspace
app.get('/visualizer', (req, res) => {
  res.sendFile(path.join(clientPath, 'visualizer.html'));
});

// Landing page route
app.get('/', (req, res) => {
  res.sendFile(path.join(clientPath, 'index.html'));
});

// 404 handler for unknown API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, error: `API route ${req.originalUrl} not found` });
});

// Central error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`AlViz API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

module.exports = app;
