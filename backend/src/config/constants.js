'use strict';

/**
 * Application-wide constants.
 * Import here rather than scattering magic strings throughout the codebase.
 */

const ROLES = Object.freeze({
  VIEWER: 'viewer',
  EDITOR: 'editor',
  ADMIN: 'admin',
});

const VIDEO_STATUS = Object.freeze({
  QUEUED: 'queued',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
});

const SAFETY_STATUS = Object.freeze({
  PENDING: 'pending',
  SAFE: 'safe',
  FLAGGED: 'flagged',
});

const SOCKET_EVENTS = Object.freeze({
  JOIN_TENANT: 'join-tenant',
  PROCESSING_PROGRESS: 'processing:progress',
  PROCESSING_COMPLETE: 'processing:complete',
  PROCESSING_FAILED: 'processing:failed',
});

const ALLOWED_MIME_TYPES = Object.freeze([
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
]);

module.exports = {
  ROLES,
  VIDEO_STATUS,
  SAFETY_STATUS,
  SOCKET_EVENTS,
  ALLOWED_MIME_TYPES,
};
