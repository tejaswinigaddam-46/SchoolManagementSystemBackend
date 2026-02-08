const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subject.controller');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/auth');

// ==================== SUBJECT ROUTES ====================

/**
 * GET /api/subjects/:campusId
 * Get all subjects for a specific campus
 */
router.get('/:campusId', authenticate, subjectController.getAllSubjects);

/**
 * POST /api/subjects/:campusId
 * Create a new subject for a specific campus
 */
router.post('/:campusId', authenticate, requireRole(['Superadmin', 'Admin']), subjectController.createSubject);

/**
 * GET /api/subjects/:campusId/:subjectId
 * Get a subject by ID for a specific campus
 */
router.get('/:campusId/:subjectId', authenticate, subjectController.getSubjectById);

/**
 * PUT /api/subjects/:campusId/:subjectId
 * Update a subject by ID for a specific campus
 */
router.put('/:campusId/:subjectId', authenticate, requireRole(['Superadmin', 'Admin']), subjectController.updateSubject);

/**
 * DELETE /api/subjects/:campusId/:subjectId
 * Delete a subject by ID for a specific campus
 */
router.delete('/:campusId/:subjectId', authenticate, requireRole(['Superadmin', 'Admin']), subjectController.deleteSubject);

module.exports = router;