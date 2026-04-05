'use strict';

const { Video } = require('../models');
const { created, badRequest, ok } = require('../utils/apiResponse');
const storageLayer = require('../storage');
const processingQueue = require('../workers/processingQueue');
const videoService = require('../services/videoService');
const streamService = require('../services/streamService');
const { extractId } = require('../utils/extractId');

/**
 * Handle a video upload.
 * Multer has already saved the file to disk at this point.
 */
const uploadVideoHandler = async (req, res, next) => {
  try {
    const file = req.file;

    // 1. Validation check
    if (!file) {
      return badRequest(res, 'No video file provided');
    }

    // 2. Generate the provider-relative path to save in MongoDB
    // Multer saves the exact filename; we generate the logical relative path for the DB
    const tenantIdStr = extractId(req.user.tenantId);
    const relativePath = storageLayer.generatePath(tenantIdStr, file.filename);

    const { title, tags } = req.body;
    let parsedTags = [];
    if (tags) {
      try {
        parsedTags = JSON.parse(tags);
      } catch (e) {
        // Fallback if not valid JSON
        parsedTags = typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : [];
      }
    }

    // 3. Create the Database Document (status: QUEUED by default)
    const video = await Video.create({
      originalFileName: file.originalname,
      storedFileName: file.filename,
      filePath: relativePath,
      mimeType: file.mimetype,
      size: file.size,
      uploadedBy: req.user._id,
      tenantId: tenantIdStr, // Tenant Isolation — always a plain ObjectId string
      title: title || file.originalname,
      tags: parsedTags,
    });

    // 4. Enqueue the processing job (FFmpeg sensitivity analysis, duration, etc.)
    // We do NOT await this processing. The client gets a 201 Created immediately.
    processingQueue.addJob({ videoId: video._id });

    // 5. Respond
    return created(res, { video }, 'Video uploaded successfully and queued for processing');
  } catch (err) {
    next(err);
  }
};

/**
 * List videos for the current tenant.
 */
const listVideosHandler = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    let { status, safetyStatus, uploadedBy, dateFilter, sizeFilter, durationFilter } = req.query;

    // RBAC: Viewers can only see safe+completed videos.
    // Editors and Admins can see all videos regardless of safety status.
    if (req.user.role === 'viewer') {
      status = 'completed';
      safetyStatus = 'safe';
    }

    const result = await videoService.getVideos(extractId(req.user.tenantId), {
      page,
      limit,
      status,
      safetyStatus,
      uploadedBy,
      dateFilter,
      sizeFilter,
      durationFilter,
    });

    return ok(res, result, 'Videos retrieved');
  } catch (err) {
    next(err);
  }
};

/**
 * Get single video details.
 */
const getVideoHandler = async (req, res, next) => {
  try {
    const video = await videoService.getVideoById(req.params.id, extractId(req.user.tenantId));
    return ok(res, { video });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete a video (admin only).
 */
const deleteVideoHandler = async (req, res, next) => {
  try {
    await videoService.deleteVideo(req.params.id, extractId(req.user.tenantId));
    return ok(res, null, 'Video deleted successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * HTTP Range Stream handler.
 */
const streamVideoHandler = async (req, res, next) => {
  try {
    const video = await videoService.getVideoById(req.params.id, extractId(req.user.tenantId));
    
    // Policy C: Seamless playback for safe videos.
    // Flagged videos can still be streamed, but with restricted access (Viewer blocked, Editor/Admin allowed).
    if (video.status !== 'completed') {
      const err = new Error('Video is not ready for streaming');
      err.status = 400;
      throw err;
    }

    if (video.safetyStatus === 'flagged' && req.user.role === 'viewer') {
      const err = new Error('Policy C Restriction: You do not have permission to view flagged content.');
      err.status = 403;
      throw err;
    }

    await streamService.handleStream(video, req.headers.range, res);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  uploadVideoHandler,
  listVideosHandler,
  getVideoHandler,
  deleteVideoHandler,
  streamVideoHandler,
};
