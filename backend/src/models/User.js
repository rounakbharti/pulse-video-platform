'use strict';

const { Schema, model } = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES } = require('../config/constants');

/**
 * User — application user, always scoped to a Tenant.
 *
 * Roles (enforced by RBAC middleware):
 *   viewer  — read-only access to their tenant's videos
 *   editor  — viewer + upload & manage own videos
 *   admin   — full access including user management
 *
 * passwordHash is never returned in API responses (select: false).
 */
const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },

    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false, // never returned in queries unless explicitly requested
    },

    role: {
      type: String,
      enum: {
        values: Object.values(ROLES),
        message: `Role must be one of: ${Object.values(ROLES).join(', ')}`,
      },
      default: ROLES.VIEWER,
    },

    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: [true, 'User must belong to a tenant'],
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ── Compound index: enforce unique email per tenant (extra safety layer) ──────
userSchema.index({ email: 1, tenantId: 1 });

// ── Instance method: compare plaintext password against stored hash ────────────
userSchema.methods.comparePassword = async function (plaintext) {
  return bcrypt.compare(plaintext, this.passwordHash);
};

// ── Static method: hash a plaintext password before saving ────────────────────
userSchema.statics.hashPassword = async function (plaintext) {
  const SALT_ROUNDS = 10; // cost 10 is the Node.js bcrypt community standard (~100ms)
  return bcrypt.hash(plaintext, SALT_ROUNDS);
};

// ── Ensure passwordHash is never serialised to JSON responses ─────────────────
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

module.exports = model('User', userSchema);
