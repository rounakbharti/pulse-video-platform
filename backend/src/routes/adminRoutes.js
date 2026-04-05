'use strict';

const { Router } = require('express');
const {
  listUsersHandler,
  updateUserRoleHandler,
  rotateInviteCodeHandler,
  getInviteCodeHandler,
} = require('../controllers/adminController');
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/rbac');
const { ROLES } = require('../config/constants');

const router = Router();

// Every route in /api/admin requires authentication AND the Admin role
router.use(authenticate);
router.use(requireRole(ROLES.ADMIN));

// ── User Management ───────────────────────────────────────────────────────────
// GET  /api/admin/users               — list all users in the tenant
router.get('/users', listUsersHandler);

// PATCH/PUT /api/admin/users/:id/role — update a user's role
router.patch('/users/:id/role', updateUserRoleHandler);
router.put('/users/:id/role', updateUserRoleHandler);

// ── Invite Code Management ────────────────────────────────────────────────────
// GET  /api/admin/invite              — get current invite code + link
router.get('/invite', getInviteCodeHandler);

// POST /api/admin/invite/rotate       — rotate invite code (invalidates old link)
router.post('/invite/rotate', rotateInviteCodeHandler);

module.exports = router;
