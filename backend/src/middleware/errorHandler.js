'use strict';

const logger = require('../utils/logger');

/**
 * Centralised Express error handler.
 * Every thrown/next(err) error lands here.
 * Returns a consistent JSON shape so the frontend always knows what to expect.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, _req, res, _next) => {
  const status = err.status || err.statusCode || 500;

  // Log 5xx as errors; 4xx as warnings (expected client mistakes)
  if (status >= 500) {
    logger.error(`[${status}] ${err.message}`, { stack: err.stack });
  } else {
    logger.warn(`[${status}] ${err.message}`);
  }

  res.status(status).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
