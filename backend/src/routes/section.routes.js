const express = require('express');
const router = express.Router();
const SectionController = require('../controllers/section.controller');
const { authenticate, requireRole } = require('../middleware/auth');
const { validateTenant } = require('../middleware/tenant');
const {
    createSection,
    updateSection,
    sectionId,
    queryParams
} = require('../validators/section.validator');

// ==================== SECTION ROUTES ====================

/**
 * GET /api/sections/filter-options
 * Get filter options (academic years and classes) for sections
 * Accessible to all authenticated users
 */
router.get('/filter-options', authenticate, SectionController.getFilterOptions);

/**
 * GET /api/sections/statistics
 * Get section statistics for current campus
 * Accessible to all authenticated users
 */
router.get('/statistics', authenticate, SectionController.getSectionStatistics);

/**
 * GET /api/sections
 * Get all sections for current campus with pagination and filtering
 * Accessible to all authenticated users
 */
router.get('/', authenticate, queryParams, SectionController.getAllSections);

/**
 * POST /api/sections
 * Create new section (Admin only)
 */
router.post('/', authenticate, requireRole(['Admin']), createSection, SectionController.createSection);

/**
 * GET /api/sections/:sectionId
 * Get section by ID
 * Accessible to all authenticated users
 */
router.get('/:sectionId', authenticate, sectionId, SectionController.getSectionById);

/**
 * GET /api/sections/:sectionId/subjects
 * Get subjects for a section
 * Accessible to all authenticated users
 */
router.get('/:sectionId/subjects', authenticate, sectionId, SectionController.getSectionSubjects);

/**
 * PUT /api/sections/:sectionId
 * Update section (Admin only)
 */
router.put('/:sectionId', authenticate, requireRole(['Admin']), updateSection, SectionController.updateSection);

/**
 * DELETE /api/sections/:sectionId
 * Delete section (Admin only)
 */
router.delete('/:sectionId', authenticate, requireRole(['Admin']), sectionId, SectionController.deleteSection);

module.exports = router;