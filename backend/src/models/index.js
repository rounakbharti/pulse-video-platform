'use strict';

/**
 * Barrel export for all Mongoose models.
 * Import from here throughout the codebase:
 *   const { User, Tenant, Video } = require('../models');
 */
module.exports = {
  Tenant: require('./Tenant'),
  User: require('./User'),
  Video: require('./Video'),
};
