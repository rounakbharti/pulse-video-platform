'use strict';

const fs = require('fs');
const fsPromises = require('fs/promises');
const path = require('path');
const StorageProvider = require('./StorageProvider');
const { storage } = require('../config/env');
const logger = require('../utils/logger');

/**
 * Local disk implementation of the StorageProvider.
 * Designed to meet MVP requirements while remaining fully abstracted.
 */
class LocalStorageProvider extends StorageProvider {
  constructor() {
    super();
    this.uploadDir = path.resolve(storage.uploadDir);
    this._ensureDir(this.uploadDir);
  }

  // Ensure root upload directory exists synchronously on startup
  _ensureDir(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logger.info(`Created local storage directory at: ${dir}`);
    }
  }

  // Local storage just uses the filename directly within the UPLOAD_DIR.
  // We prefix the tenant dir here for clean tenant isolation on disk.
  generatePath(tenantId, filename) {
      // e.g., tnt_abc123/uuid-name.mp4
      return path.join(`tnt_${tenantId}`, filename).replace(/\\/g, '/');
  }

  getAbsolutePath(filePath) {
    return path.join(this.uploadDir, filePath);
  }

  async getReadStream(filePath, options = {}) {
    const fullPath = this.getAbsolutePath(filePath);
    
    // Check if it exists before trying to stream
    try {
      await fsPromises.access(fullPath, fs.constants.R_OK);
    } catch (err) {
      const error = new Error('File not found or not readable');
      error.status = 404;
      throw error;
    }

    return fs.createReadStream(fullPath, options);
  }

  async deleteFile(filePath) {
    const fullPath = this.getAbsolutePath(filePath);
    try {
      await fsPromises.unlink(fullPath);
      logger.debug(`Deleted local file: ${fullPath}`);
    } catch (err) {
      // Ignore if it's already gone; throw on permission/disk errors
      if (err.code !== 'ENOENT') {
        logger.error(`Failed to delete file: ${fullPath}`, err);
        throw err;
      }
    }
  }
}

module.exports = LocalStorageProvider;
