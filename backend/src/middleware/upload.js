'use strict';

const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { ALLOWED_MIME_TYPES } = require('../config/constants');
const { storage } = require('../config/env');
const storageLayer = require('../storage');
const { extractId } = require('../utils/extractId');

/**
 * Multer disk storage configuration.
 * Uses the StorageLayer to determine where files should go (handling tenant isolation).
 */
const diskStorage = multer.diskStorage({
  destination: (req, _file, cb) => {
    try {
      // 1. Get the directory name for the tenant
      // Note: Multer expects an absolute directory path on the local filesystem
      const tenantIdStr = extractId(req.user.tenantId);
      const tenantDir = storageLayer.generatePath(tenantIdStr, '');
      const absoluteDir = storageLayer.getAbsolutePath(tenantDir);

      // 2. Ensure it exists (LocalStorageProvider handles absolute creation)
      storageLayer._ensureDir(absoluteDir);

      cb(null, absoluteDir);
    } catch (err) {
      cb(err);
    }
  },
  filename: (_req, file, cb) => {
    // 3. Generate a safe, collision-free filename
    // e.g., uuid-v4.mp4
    const ext = path.extname(file.originalname).toLowerCase();
    const safeFilename = `${uuidv4()}${ext}`;
    cb(null, safeFilename);
  },
});

/**
 * File filter to ensure only allowed video MIME types are uploaded.
 */
const fileFilter = (_req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    // Send a safe MulterError to be caught by the route handler
    const err = new multer.MulterError('LIMIT_UNEXPECTED_FILE');
    err.message = 'Invalid file type. Only video files are allowed.';
    cb(err, false);
  }
};

/**
 * The configured multer middleware instance.
 */
const upload = multer({
  storage: diskStorage,
  limits: {
    fileSize: storage.maxFileSize, // e.g. 500MB
  },
  fileFilter,
});

module.exports = upload;
