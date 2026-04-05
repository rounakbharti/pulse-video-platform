'use strict';

const { validationResult } = require('express-validator');
const authService = require('../services/authService');
const { ok, created, badRequest } = require('../utils/apiResponse');

/**
 * Auth Controller — thin handlers that delegate to authService.
 */

// ── POST /api/auth/register ───────────────────────────────────────────────────
const registerHandler = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return badRequest(res, 'Validation failed', errors.array());
    }

    const { name, email, password, tenantName } = req.body;
    const result = await authService.register({ name, email, password, tenantName });

    return created(res, result, 'Account created successfully');
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/join ── Join existing org via invite code ─────────────────
const joinHandler = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return badRequest(res, 'Validation failed', errors.array());
    }

    const { name, email, password, inviteCode } = req.body;
    const result = await authService.joinTenant({ name, email, password, inviteCode });

    return created(res, result, 'Joined organisation successfully');
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/login ──────────────────────────────────────────────────────
const loginHandler = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return badRequest(res, 'Validation failed', errors.array());
    }

    const { email, password } = req.body;
    const result = await authService.login({ email, password });

    return ok(res, result, 'Login successful');
  } catch (err) {
    next(err);
  }
};

// ── GET /api/auth/me ─────────────────────────────────────────────────────────
const getMeHandler = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user._id);
    return ok(res, { user }, 'User profile retrieved');
  } catch (err) {
    next(err);
  }
};

// ── GET /api/auth/invite/:code ─ Validate invite code & get org name ─────────
const getInviteInfoHandler = async (req, res, next) => {
  try {
    const { code } = req.params;
    const info = await authService.getInviteInfo(code);
    return ok(res, info, 'Invite info retrieved');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  registerHandler,
  joinHandler,
  loginHandler,
  getMeHandler,
  getInviteInfoHandler,
};
