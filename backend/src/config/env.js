'use strict';

const dotenv = require('dotenv');
dotenv.config();

/**
 * Centralised, validated environment configuration.
 * All other modules import from here — never from process.env directly.
 */

const required = ['MONGODB_URI', 'JWT_SECRET'];

required.forEach((key) => {
  if (!process.env[key] || process.env[key].includes('REPLACE_WITH')) {
    throw new Error(`[config/env] Missing required environment variable: ${key}`);
  }
});

module.exports = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') === 'development',

  mongodb: {
    uri: process.env.MONGODB_URI,
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  storage: {
    uploadDir: process.env.UPLOAD_DIR || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 524_288_000, // 500 MB
  },

  cors: {
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  },
};
