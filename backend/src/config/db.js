'use strict';

const mongoose = require('mongoose');
const logger = require('../utils/logger');
const { mongodb } = require('./env');

let isConnected = false;

/**
 * Connects to MongoDB Atlas.
 * Idempotent — safe to call multiple times.
 */
const connectDB = async () => {
  if (isConnected) return;

  try {
    await mongoose.connect(mongodb.uri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    logger.info(`MongoDB connected: ${mongoose.connection.host}`);
  } catch (err) {
    logger.error(`MongoDB connection failed: ${err.message}`);
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  logger.warn('MongoDB disconnected');
});

module.exports = connectDB;
