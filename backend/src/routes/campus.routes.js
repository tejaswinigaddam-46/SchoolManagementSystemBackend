const express = require('express');
const router = express.Router();
const campusController = require('../controllers/campus.controller');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/auth');

// ==================== CAMPUS ROUTES ====================

/**
 * GET /api/campuses
 * Get all campuses for the authenticated user's tenant
 */
router.get('/', authenticate, requireRole(['Superadmin']), campusController.getAllCampuses);

/**
 * POST /api/campuses
 * Create a new campus
 */
router.post('/', authenticate, requireRole(['Superadmin']), campusController.registerCampus);

/**
 * GET /api/campuses/:id
 * Get a campus by ID for the authenticated user's tenant
 */
router.get('/:id', authenticate, campusController.getCampusById);

/**
 * PUT /api/campuses/:id
 * Update a campus by ID
 */
router.put('/:id', authenticate, requireRole(['Superadmin']), campusController.updateCampus);

/**
 * DELETE /api/campuses/:id
 * Delete a campus by ID
 */
router.delete('/:id', authenticate, requireRole(['Superadmin']), campusController.deleteCampus);

module.exports = router;