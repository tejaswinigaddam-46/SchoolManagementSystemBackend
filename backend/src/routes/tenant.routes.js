const express = require('express');
const tenantController = require('../controllers/tenant.controller');
const { authenticate, requirePermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');

const router = express.Router();

// ==================== PUBLIC ROUTES ====================
// These routes don't require authentication

/**
 * POST /api/register-tenant
 * Register a new tenant (school) with admin user
 * This is the main tenant registration endpoint
 */
router.post('/register-tenant', tenantController.registerTenant);

/**
 * GET /api/tenants/check-subdomain/:subdomain
 * Check if subdomain is available
 */
router.get('/check-subdomain/:subdomain', tenantController.checkSubdomainAvailability);

/**
 * GET /api/tenants/check-email/:email
 * Check if email is available
 */
router.get('/check-email/:email', tenantController.checkEmailAvailability);

/**
 * GET /api/tenants/subdomain/:subdomain
 * Get tenant information by subdomain
 */
router.get('/subdomain/:subdomain', tenantController.getTenantBySubdomain);

// ==================== PROTECTED ROUTES ====================
// These routes require authentication

/**
 * GET /api/tenants
 * Get all tenants (admin only)
 */
router.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.TENANT_LIST_READ),
  tenantController.getAllTenants
);

/**
 * GET /api/tenants/:tenantId
 * Get tenant by ID
 */
router.get(
  '/:tenantId',
  authenticate,
  requirePermission(PERMISSIONS.TENANT_ITEM_READ),
  tenantController.getTenantById
);

/**
 * PUT /api/tenants/:tenantId
 * Update tenant information
 */
router.put(
  '/:tenantId',
  authenticate,
  requirePermission(PERMISSIONS.TENANT_EDIT),
  tenantController.updateTenant
);

/**
 * GET /api/tenants/:tenantId/statistics
 * Get tenant statistics
 */
router.get(
  '/:tenantId/statistics',
  authenticate,
  requirePermission(PERMISSIONS.TENANT_STATISTICS_READ),
  tenantController.getTenantStatistics
);

module.exports = router;
