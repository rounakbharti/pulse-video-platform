'use strict';

const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { jwt: jwtConfig } = require('../config/env');
const { unauthorized } = require('../utils/apiResponse');

/**
 * authenticate — JWT verification middleware.
 *
 * Expects:  Authorization: Bearer <token>
 * On success: attaches req.user = { userId, tenantId, role } and calls next().
 * On failure: returns 401 immediately.
 *
 * Design notes:
 *  - We verify the token cryptographically first (cheap) before hitting the DB.
 *  - We then confirm the user still exists and is active (guards against
 *    deleted / deactivated accounts that still hold a valid token).
 *  - The full user document is attached to req.user so downstream middleware
 *    (RBAC, tenant isolation) can read role/tenantId without another DB round-trip.
 */
const authenticate = async (req, res, next) => {
  try {
    let token;
    
    // 1. Standard Bearer token via explicit headers (Axios)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } 
    // 2. Fallback for raw HTML5 <video src="..."> tags streaming chunked requests
    else if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return unauthorized(res, 'No token provided. Please log in.');
    }

    let decoded;
    try {
      decoded = jwt.verify(token, jwtConfig.secret);
    } catch (err) {
      const message =
        err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
      return unauthorized(res, message);
    }

    // Confirm user still exists and is active
    const user = await User.findById(decoded.userId).populate('tenantId', 'name slug');

    if (!user || !user.isActive) {
      return unauthorized(res, 'Account not found or deactivated');
    }

    // Attach to request — available to all downstream middleware and controllers
    req.user = user;

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = authenticate;
