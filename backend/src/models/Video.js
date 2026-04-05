'use strict';

const { Schema, model } = require('mongoose');
const { VIDEO_STATUS, SAFETY_STATUS } = require('../config/constants');

/**
 * Video — core entity of the platform.
 *
 * Lifecycle:
 *   upload → [status: queued]
 *   worker picks up → [status: processing, safetyStatus: pending]
 *   FFmpeg completes → [status: completed, safetyStatus: safe | flagged]
 *   on error → [status: failed]
 *
 * Tenant isolation: every query in the service layer MUST filter by tenantId.
 * The tenantId is always taken from the verified JWT — never from the request body.
 *
 * Storage abstraction: filePath stores the provider-relative path.
 * The storage layer resolves this to an absolute path or a cloud URL at read time,
 * so swapping local storage for S3 only requires changing the storage provider.
 */
const videoSchema = new Schema(
  {
    // ── File identity ───────────────────────────────────────────────────────────
    originalFileName: {
      type: String,
      required: [true, 'Original file name is required'],
      trim: true,
    },

    storedFileName: {
      type: String,
      required: [true, 'Stored file name is required'],
      trim: true,
    },

    // Provider-relative path (e.g. "uploads/tenantId/uuid.mp4")
    filePath: {
      type: String,
      required: [true, 'File path is required'],
    },

    mimeType: {
      type: String,
      required: [true, 'MIME type is required'],
    },

    // File size in bytes
    size: {
      type: Number,
      required: [true, 'File size is required'],
      min: [1, 'File size must be positive'],
    },

    // ── FFmpeg-extracted metadata (populated after processing) ──────────────────
    duration: {
      type: Number, // seconds (float)
      default: null,
    },

    resolution: {
      width: { type: Number, default: null },
      height: { type: Number, default: null },
    },

    codec: {
      type: String,
      default: null,
    },

    // ── Processing state machine ────────────────────────────────────────────────
    status: {
      type: String,
      enum: {
        values: Object.values(VIDEO_STATUS),
        message: `Status must be one of: ${Object.values(VIDEO_STATUS).join(', ')}`,
      },
      default: VIDEO_STATUS.QUEUED,
      index: true,
    },

    safetyStatus: {
      type: String,
      enum: {
        values: Object.values(SAFETY_STATUS),
        message: `Safety status must be one of: ${Object.values(SAFETY_STATUS).join(', ')}`,
      },
      default: SAFETY_STATUS.PENDING,
      index: true,
    },

    // 0–100 percentage tracked during worker processing
    processingProgress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    // Human-readable error message stored on failure
    errorMessage: {
      type: String,
      default: null,
    },

    // ── Ownership & isolation ───────────────────────────────────────────────────
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'uploadedBy (userId) is required'],
      index: true,
    },

    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: [true, 'tenantId is required'],
      index: true,
    },

    // Optional user-supplied label / category
    title: {
      type: String,
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
      default: null,
    },

    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
    versionKey: false,
  }
);

// ── Compound indexes for common query patterns ────────────────────────────────

// List all videos for a tenant (most frequent query)
videoSchema.index({ tenantId: 1, createdAt: -1 });

// Filter by tenant + status (dashboard / processing queue view)
videoSchema.index({ tenantId: 1, status: 1 });

// Filter by tenant + safety status (content review / library view)
videoSchema.index({ tenantId: 1, safetyStatus: 1 });

// Filter by tenant + uploader (user's own videos)
videoSchema.index({ tenantId: 1, uploadedBy: 1 });

module.exports = model('Video', videoSchema);
