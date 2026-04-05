'use strict';

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const { cors: corsConfig, storage } = require('./config/env');
const logger = require('./utils/logger');

// ── Route imports (added incrementally in later steps) ────────────────────────
const authRoutes = require('./routes/authRoutes');
const videoRoutes = require('./routes/videoRoutes');
const adminRoutes = require('./routes/adminRoutes');

// ── Global error handler ──────────────────────────────────────────────────────
const errorHandler = require('./middleware/errorHandler');

const createApp = () => {
  const app = express();

  // ── Core middleware ──────────────────────────────────────────────────────────
  app.use(
    cors({
      origin: function (origin, callback) {
        // Accept any origin dynamically to support Vercel deployments seamlessly
        callback(null, true);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // HTTP request logging (only in dev — keeps logs clean in prod)
  if (process.env.NODE_ENV !== 'test') {
    app.use(
      morgan('dev', {
        stream: { write: (msg) => logger.http(msg.trim()) },
      })
    );
  }

  // ── Static uploads (served only as fallback; streaming uses the /stream route)
  app.use('/uploads', express.static(path.resolve(storage.uploadDir)));

  // ── API routes ───────────────────────────────────────────────────────────────
  app.use('/api/auth', authRoutes);
  app.use('/api/videos', videoRoutes);
  app.use('/api/admin', adminRoutes);

  // ── Health check ─────────────────────────────────────────────────────────────
  app.get('/api/health', (_req, res) =>
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  );

  // ── 404 catch-all ────────────────────────────────────────────────────────────
  app.use((_req, res) => res.status(404).json({ message: 'Route not found' }));

  // ── Centralised error handler (must be last) ─────────────────────────────────
  app.use(errorHandler);

  return app;
};

module.exports = createApp;
