const express = require('express');
const router = express.Router();
const academicController = require('../controllers/academic.controller');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/auth');

// ==================== CURRICULA ROUTES ====================

/**
 * GET /api/academics/:campusId/curricula
 * Get all curricula for a specific campus
 */
router.get('/:campusId/curricula', authenticate, academicController.getAllCurricula);

/**
 * POST /api/academics/:campusId/curricula
 * Create a new curriculum for a specific campus
 */
router.post('/:campusId/curricula', authenticate, requireRole(['Superadmin', 'Admin']), academicController.createCurriculum);

/**
 * GET /api/academics/:campusId/curricula/:curriculumId
 * Get a curriculum by ID for a specific campus
 */
router.get('/:campusId/curricula/:curriculumId', authenticate, requireRole(['Superadmin', 'Admin']), academicController.getCurriculumById);

/**
 * PUT /api/academics/:campusId/curricula/:curriculumId
 * Update a curriculum by ID for a specific campus
 */
router.put('/:campusId/curricula/:curriculumId', authenticate, requireRole(['Superadmin', 'Admin']), academicController.updateCurriculum);

/**
 * DELETE /api/academics/:campusId/curricula/:curriculumId
 * Delete a curriculum by ID for a specific campus
 */
router.delete('/:campusId/curricula/:curriculumId', authenticate, requireRole(['Superadmin']), academicController.deleteCurriculum);

// ==================== ACADEMIC YEARS ROUTES ====================

/**
 * GET /api/academics/:campusId/academic-year-options
 * Get academic year options for dropdown (joins academic_years and curricula)
 */
router.get('/:campusId/academic-year-options', authenticate, academicController.getAcademicYearOptions);

/**
 * GET /api/academics/:campusId/year-names
 * Get distinct year names for dropdown
 */
router.get('/:campusId/year-names', authenticate, academicController.getDistinctYearNames);

/**
 * GET /api/academics/:campusId/media
 * Get distinct media for dropdown
 */
router.get('/:campusId/media', authenticate, academicController.getDistinctMedia);

/**
 * GET /api/academics/:campusId/academic-year-id
 * Get academic year ID by combination (query params: yearName, curriculumId, medium)
 */
router.get('/:campusId/academic-year-id', authenticate, academicController.getAcademicYearIdByCombo);

/**
 * GET /api/academics/:campusId/academic-years
 * Get all academic years for a specific campus
 */
router.get('/:campusId/academic-years', authenticate, academicController.getAllAcademicYears);

/**
 * POST /api/academics/:campusId/academic-years
 * Create a new academic year for a specific campus
 */
router.post('/:campusId/academic-years', authenticate, requireRole(['Superadmin', 'Admin']), academicController.createAcademicYear);

/**
 * GET /api/academics/:campusId/academic-years/:academicYearId
 * Get an academic year by ID for a specific campus
 */
router.get('/:campusId/academic-years/:academicYearId', authenticate, academicController.getAcademicYearById);

/**
 * PUT /api/academics/:campusId/academic-years/:academicYearId
 * Update an academic year by ID for a specific campus
 */
router.put('/:campusId/academic-years/:academicYearId', authenticate, requireRole(['Superadmin', 'Admin']), academicController.updateAcademicYear);

/**
 * DELETE /api/academics/:campusId/academic-years/:academicYearId
 * Delete an academic year by ID for a specific campus
 */
router.delete('/:campusId/academic-years/:academicYearId', authenticate, requireRole(['Superadmin']), academicController.deleteAcademicYear);

module.exports = router;
