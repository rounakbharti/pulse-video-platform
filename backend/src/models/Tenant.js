'use strict';

const { Schema, model } = require('mongoose');
const crypto = require('crypto');

/**
 * Tenant — represents an organisation / user group.
 * slug is URL-safe, unique, and used for display & filtering.
 *
 * inviteCode — a secure random token that allows new users to join this
 * organisation. Generated once on creation, re-generatable by Admin.
 *
 * Every User, Video, and processing job is scoped to a Tenant.
 * This is the root of the multi-tenant isolation model.
 */
const tenantSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Tenant name is required'],
      trim: true,
      minlength: [2, 'Tenant name must be at least 2 characters'],
      maxlength: [100, 'Tenant name cannot exceed 100 characters'],
    },

    slug: {
      type: String,
      required: [true, 'Tenant slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, 'Slug may only contain lowercase letters, numbers, and hyphens'],
      minlength: [2, 'Slug must be at least 2 characters'],
      maxlength: [60, 'Slug cannot exceed 60 characters'],
    },

    /**
     * Invite code — secure 20-char hex token.
     * Share this with teammates to let them join this org as Viewer.
     * Admin can rotate it at any time from the Admin panel.
     */
    inviteCode: {
      type: String,
      required: true,
      unique: true,
      default: () => crypto.randomBytes(20).toString('hex'),
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/**
 * Regenerate the invite code (called from Admin panel "Rotate" action).
 */
tenantSchema.methods.rotateInviteCode = async function () {
  this.inviteCode = crypto.randomBytes(20).toString('hex');
  return this.save();
};

module.exports = model('Tenant', tenantSchema);
