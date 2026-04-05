'use strict';

const { Router } = require('express');
const { body } = require('express-validator');
const {
  registerHandler,
  joinHandler,
  loginHandler,
  getMeHandler,
  getInviteInfoHandler,
} = require('../controllers/authController');
const authenticate = require('../middleware/authenticate');

const router = Router();

// ── Validation rule sets ──────────────────────────────────────────────────────

const registerRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),

  body('tenantName')
    .trim()
    .notEmpty().withMessage('Organisation name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Organisation name must be 2–100 characters'),
];

const joinRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),

  body('inviteCode')
    .trim()
    .notEmpty().withMessage('Invite code is required'),
];

const loginRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required'),
];

// ── Routes ────────────────────────────────────────────────────────────────────

// POST /api/auth/register — public, creates new org + admin user
router.post('/register', registerRules, registerHandler);

// POST /api/auth/join — public, joins existing org via invite code as VIEWER
router.post('/join', joinRules, joinHandler);

// GET /api/auth/invite/:code — public, validates invite code & returns org name
router.get('/invite/:code', getInviteInfoHandler);

// POST /api/auth/login — public
router.post('/login', loginRules, loginHandler);

// GET /api/auth/me — protected
router.get('/me', authenticate, getMeHandler);

module.exports = router;
