const express = require('express');
const { identifyTenant } = require('../middleware/tenant');
const { authenticate, requirePermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');
const loginController = require('../controllers/login.controller');
const { getProfile } = require('../controllers/user.controller');
const validate = require('../middleware/validation');
const loginSchema = require('../schemas/login.schema');

const router = express.Router();

// ==================== PUBLIC ROUTES ====================
// These routes don't require authentication but need tenant identification

// /**
//  * POST /api/auth/login
//  * User login endpoint - uses identifyTenant middleware
//  */
router.post('/login', identifyTenant, validate(loginSchema.login), loginController.login);

// /**
//  * POST /api/auth/refresh
//  * Refresh access token using refresh token from HTTP-only cookie
//  */
router.post('/refresh', loginController.refreshToken);

/**
 * POST /api/auth/resolve-tenant
 * Resolve tenant by mobile number
 */
router.post('/resolve-tenant', validate(loginSchema.resolveTenant), loginController.resolveTenant);

/**
 * GET /api/auth/profile
 * Get current user profile
 */
router.get(
  '/profile',
  authenticate,
  requirePermission(PERMISSIONS.AUTH_PROFILE_READ),
  getProfile
);

// /**
//  * POST /api/auth/verify
//  * Verify token validity (for testing/debugging)
//  */
router.post('/verify', validate(loginSchema.verifyToken), loginController.verifyToken);

// ==================== PROTECTED ROUTES ====================
// These routes require authentication

// /**
//  * POST /api/auth/logout
//  * User logout endpoint - no auth required since we want to allow logout even with expired tokens
//  */
router.post('/logout', loginController.logout);

// /**
//  * PUT /api/auth/change-password
//  * Change user password
//  */
router.put(
  '/change-password',
  authenticate,
  requirePermission(PERMISSIONS.AUTH_CHANGE_PASSWORD_EDIT),
  validate(loginSchema.changePassword),
  loginController.changePassword
);

// ==================== USER MANAGEMENT ROUTES ====================
// These routes require authentication and admin role


module.exports = router;
