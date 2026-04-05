'use strict';

const { Router } = require('express');
const upload = require('../middleware/upload');
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/rbac');
const { ROLES } = require('../config/constants');
const { 
  uploadVideoHandler, 
  listVideosHandler, 
  getVideoHandler, 
  deleteVideoHandler, 
  streamVideoHandler 
} = require('../controllers/videoController');
const { badRequest } = require('../utils/apiResponse');
const multer = require('multer');

const router = Router();

// ── Shared Middleware ─────────────────────────────────────────────────────────
// Every route in /api/videos requires authentication
router.use(authenticate);

// ── Wrapper to catch Multer errors (file too large, wrong type) elegantly ─────
const handleUpload = (req, res, next) => {
  const multerUpload = upload.single('video');
  multerUpload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return badRequest(res, 'File too large. Maximum size is 500MB.');
      }
      return badRequest(res, err.message);
    } else if (err) {
      return next(err);
    }
    next();
  });
};

// ── Routes ────────────────────────────────────────────────────────────────────

// GET /api/videos — List all videos for tenant
router.get('/', listVideosHandler);

// POST /api/videos/upload — Upload video (requires editor/admin)
router.post(
  '/upload',
  requireRole(ROLES.EDITOR, ROLES.ADMIN),
  handleUpload,
  uploadVideoHandler
);

// GET /api/videos/:id — Get video metadata
router.get('/:id', getVideoHandler);

// DELETE /api/videos/:id — Delete video (requires editor/admin)
router.delete('/:id', requireRole(ROLES.EDITOR, ROLES.ADMIN), deleteVideoHandler);

// GET /api/videos/:id/stream — Stream video content via HTTP Range
router.get('/:id/stream', streamVideoHandler);

module.exports = router;
