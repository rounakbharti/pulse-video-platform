'use strict';

const { Video } = require('../models');
const storageLayer = require('../storage');
const logger = require('../utils/logger');

/**
 * Retrieves a paginated list of videos for a specific tenant.
 * Includes optional filtering by status and safetyStatus.
 */
const getVideos = async (tenantId, { page = 1, limit = 20, status, safetyStatus, uploadedBy, dateFilter, sizeFilter, durationFilter } = {}) => {
  const query = { tenantId };

  if (status) query.status = status;
  if (safetyStatus) query.safetyStatus = safetyStatus;
  if (uploadedBy) query.uploadedBy = uploadedBy;

  if (dateFilter) {
    const now = new Date();
    if (dateFilter === '24h') query.createdAt = { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) };
    else if (dateFilter === '7d') query.createdAt = { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
    else if (dateFilter === '30d') query.createdAt = { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
  }

  if (sizeFilter) {
    if (sizeFilter === 'small') query.size = { $lt: 10 * 1024 * 1024 }; // < 10 MB
    else if (sizeFilter === 'medium') query.size = { $gte: 10 * 1024 * 1024, $lte: 50 * 1024 * 1024 }; // 10-50 MB
    else if (sizeFilter === 'large') query.size = { $gt: 50 * 1024 * 1024 }; // > 50 MB
  }

  if (durationFilter) {
    if (durationFilter === 'short') query.duration = { $lte: 30 };
    else if (durationFilter === 'medium') query.duration = { $gt: 30, $lte: 300 };
    else if (durationFilter === 'long') query.duration = { $gt: 300 };
  }

  const skip = (page - 1) * limit;

  const [videos, total] = await Promise.all([
    Video.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('uploadedBy', 'name email'),
    Video.countDocuments(query),
  ]);

  return {
    videos,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Gets a video by ID, ensuring it belongs to the specified tenant.
 */
const getVideoById = async (videoId, tenantId) => {
  const video = await Video.findOne({ _id: videoId, tenantId }).populate(
    'uploadedBy',
    'name email'
  );

  if (!video) {
    const err = new Error('Video not found');
    err.status = 404;
    throw err;
  }

  return video;
};

/**
 * Deletes a video from the database and removes the underlying file.
 * Requires admin privileges (enforced at the route level).
 */
const deleteVideo = async (videoId, tenantId) => {
  const video = await getVideoById(videoId, tenantId);

  // 1. Remove from storage
  try {
    await storageLayer.deleteFile(video.filePath);
  } catch (err) {
    logger.warn(`Could not delete file for video ${videoId} from storage: ${err.message}`);
    // We continue with DB deletion even if storage deletion fails (e.g., file already gone)
  }

  // 2. Remove from DB
  await Video.deleteOne({ _id: videoId });
  logger.info(`Video ${videoId} deleted by tenant ${tenantId}`);
};

module.exports = {
  getVideos,
  getVideoById,
  deleteVideo,
};
