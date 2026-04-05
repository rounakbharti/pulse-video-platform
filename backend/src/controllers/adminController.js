'use strict';

const { User, Tenant } = require('../models');
const { ok, badRequest, notFound } = require('../utils/apiResponse');
const { ROLES } = require('../config/constants');
const { extractId } = require('../utils/extractId');

/**
 * Get all users belonging to the current tenant.
 */
const listUsersHandler = async (req, res, next) => {
  try {
    const tenantId = extractId(req.user.tenantId);
    const users = await User.find({ tenantId })
      .select('-passwordHash')
      .sort({ createdAt: 1 });

    return ok(res, { users }, 'Users retrieved');
  } catch (err) {
    next(err);
  }
};

/**
 * Update a user's role.
 * An admin cannot change their own role (prevents self-lock-out).
 */
const updateUserRoleHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!Object.values(ROLES).includes(role)) {
      return badRequest(res, `Invalid role. Must be one of: ${Object.values(ROLES).join(', ')}`);
    }

    if (id === req.user._id.toString()) {
      return badRequest(res, 'You cannot change your own role.');
    }

    const targetUser = await User.findOne({
      _id: id,
      tenantId: extractId(req.user.tenantId),
    });
    if (!targetUser) {
      return notFound(res, 'User not found in your organisation');
    }

    targetUser.role = role;
    await targetUser.save();

    return ok(res, { user: targetUser }, `User role updated to "${role}"`);
  } catch (err) {
    next(err);
  }
};

/**
 * Rotate the tenant's invite code.
 * Admin can regenerate it to invalidate old invite links.
 */
const rotateInviteCodeHandler = async (req, res, next) => {
  try {
    const tenantId = extractId(req.user.tenantId);
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) return notFound(res, 'Tenant not found');

    await tenant.rotateInviteCode();
    return ok(res, { inviteCode: tenant.inviteCode }, 'Invite code rotated successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * Get the current invite code & link for this tenant.
 */
const getInviteCodeHandler = async (req, res, next) => {
  try {
    const tenantId = extractId(req.user.tenantId);
    const tenant = await Tenant.findById(tenantId, 'name slug inviteCode');
    if (!tenant) return notFound(res, 'Tenant not found');

    return ok(res, {
      inviteCode: tenant.inviteCode,
      tenantName: tenant.name,
      tenantSlug: tenant.slug,
    }, 'Invite code retrieved');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listUsersHandler,
  updateUserRoleHandler,
  rotateInviteCodeHandler,
  getInviteCodeHandler,
};
