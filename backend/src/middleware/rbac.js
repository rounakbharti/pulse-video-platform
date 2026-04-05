'use strict';

const { forbidden } = require('../utils/apiResponse');

/**
 * Role-Based Access Control (RBAC) Middleware.
 * Must be used AFTER the authenticate middleware (so req.user exists).
 *
 * @param {...string} allowedRoles - The roles that are permitted to access the route.
 * @returns {Function} Express middleware function
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    // 1. Safety check
    if (!req.user || !req.user.role) {
      // Should never happen if 'authenticate' runs before this
      return forbidden(res, 'Access denied. Role not found on user.');
    }

    // 2. Authorise
    if (!allowedRoles.includes(req.user.role)) {
      return forbidden(res, 'You do not have permission to perform this action.');
    }

    next();
  };
};

module.exports = requireRole;
