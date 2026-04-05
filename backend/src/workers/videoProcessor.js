'use strict';

const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const ffprobePath = require('ffprobe-static').path;
const { Video } = require('../models');
const { VIDEO_STATUS, SAFETY_STATUS, SOCKET_EVENTS } = require('../config/constants');
const storageLayer = require('../storage');
const logger = require('../utils/logger');
const { emitToTenant } = require('../sockets/socketManager');

// Explicitly wire OS-specific downloaded binaries into fluent-ffmpeg
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

/**
 * Runs FFmpeg to probe video metadata (duration, resolution, codec).
 * @param {string} absolutePath 
 * @returns {Promise<Object>}
 */
const probeVideo = (absolutePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(absolutePath, (err, metadata) => {
      if (err) return reject(err);

      const videoStream = metadata.streams.find((s) => s.codec_type === 'video');
      if (!videoStream) {
        return reject(new Error('No video stream found in file'));
      }

      resolve({
        duration: metadata.format.duration,
        width: videoStream.width,
        height: videoStream.height,
        codec: videoStream.codec_name,
        bitRate: metadata.format.bit_rate,
      });
    });
  });
};

/**
 * Deterministic sensitivity analysis.
 * Rule: Videos with duration > 30 seconds are considered "safe" (long-form content).
 * Videos <= 30 seconds are flagged (short clips more likely to be content fragments).
 * This is stable — same file = same duration = same result. Always deterministic.
 * A real system would use frame extraction + AI (Rekognition, Clarifai, etc.)
 */
const runSensitivityAnalysis = async (duration) => {
  // Simulate analysis time: up to 4 seconds regardless of file
  await new Promise((res) => setTimeout(res, 4000));
  // Deterministic: flag short clips (likely content fragments), approve long-form
  const isFlagged = duration !== undefined && duration <= 30;
  return isFlagged ? SAFETY_STATUS.FLAGGED : SAFETY_STATUS.SAFE;
};

/**
 * Helper to artificially delay between pipeline stages so the user
 * can see each progress step in real-time on the dashboard.
 */
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

/**
 * Emit a progress update to the tenant room with a human-readable message.
 */
const emitProgress = (tenantId, videoId, progress, message, status = VIDEO_STATUS.PROCESSING) => {
  emitToTenant(tenantId, SOCKET_EVENTS.PROCESSING_PROGRESS, {
    videoId,
    progress,
    status,
    message,
  });
};

/**
 * Process a single video job.
 * Pipeline stages with explicit progress milestones:
 *   0%  → "uploaded"
 *  25%  → "processing started"
 *  50%  → "analyzing frames"
 *  75%  → "sensitivity analysis"
 * 100%  → "completed" + safe/flagged
 */
const processVideo = async (videoId) => {
  logger.info(`Starting processing job for video: ${videoId}`);
  
  const video = await Video.findById(videoId);
  if (!video) {
    logger.error(`Video ${videoId} not found for processing`);
    return;
  }

  const { tenantId } = video;

  try {
    // ── Stage 1: Mark as Processing (0%) ────────────────────────────────────
    video.status = VIDEO_STATUS.PROCESSING;
    video.processingProgress = 0;
    video.safetyStatus = SAFETY_STATUS.PENDING;
    await video.save();

    emitProgress(tenantId, videoId, 0, 'uploaded');
    await delay(2000);

    // ── Stage 2: Processing Started (25%) ───────────────────────────────────
    video.processingProgress = 25;
    await video.save();
    emitProgress(tenantId, videoId, 25, 'processing started');
    await delay(2000);

    // ── Stage 3: FFprobe Analysis (50%) ─────────────────────────────────────
    const absolutePath = storageLayer.getAbsolutePath(video.filePath);
    const metadata = await probeVideo(absolutePath);

    video.duration = metadata.duration;
    video.resolution.width = metadata.width;
    video.resolution.height = metadata.height;
    video.codec = metadata.codec;
    video.processingProgress = 50;
    await video.save();

    emitProgress(tenantId, videoId, 50, 'analyzing frames');
    await delay(2500);

    // ── Stage 4: Sensitivity Analysis (75%) ─────────────────────────────────
    video.processingProgress = 75;
    await video.save();
    emitProgress(tenantId, videoId, 75, 'sensitivity analysis');

    const safetyResult = await runSensitivityAnalysis(metadata.duration);

    // ── Stage 5: Completed (100%) ────────────────────────────────────────────
    video.safetyStatus = safetyResult;
    video.status = VIDEO_STATUS.COMPLETED;
    video.processingProgress = 100;
    await video.save();

    logger.info(`Video ${videoId} processed: Safety=${safetyResult}, Duration=${metadata.duration}s`);

    emitToTenant(tenantId, SOCKET_EVENTS.PROCESSING_COMPLETE, {
      videoId,
      safetyStatus: safetyResult,
      duration: metadata.duration,
      status: VIDEO_STATUS.COMPLETED,
      progress: 100,
      message: 'completed',
    });

  } catch (err) {
    logger.error(`Video processing failed for ${videoId}: ${err.message}`);
    
    video.status = VIDEO_STATUS.FAILED;
    video.errorMessage = err.message || 'Unknown processing error';
    await video.save();

    emitToTenant(tenantId, SOCKET_EVENTS.PROCESSING_FAILED, {
      videoId,
      error: video.errorMessage,
      status: VIDEO_STATUS.FAILED,
      message: 'processing failed',
    });
  }
};

module.exports = { processVideo };
