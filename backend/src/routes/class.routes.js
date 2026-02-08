const express = require('express');
const router = express.Router();
const classController = require('../controllers/class.controller');
const { authenticate, requireRole } = require('../middleware/auth');
const { validateClassCreation, validateClassUpdate } = require('../validators/class.validator');

// ==================== CLASS ROUTES ====================

/**
 * GET /api/classes
 * Get all classes with pagination and filtering
 */
router.get('/', authenticate, classController.getAllClasses);

/**
 * POST /api/classes
 * Create a new class (Admin only)
 */
router.post('/', authenticate, requireRole(['Admin']), validateClassCreation, classController.createClass);

/**
 * GET /api/classes/statistics
 * Get class statistics for dashboard
 */
router.get('/statistics', authenticate, classController.getClassStatistics);

/**
 * GET /api/classes/campus/:campusId
 * Get classes by campus
 */
router.get('/campus/:campusId', authenticate, classController.getClassesByCampus);

/**
 * GET /api/classes/:classId
 * Get a class by ID
 */
router.get('/:classId', authenticate, classController.getClassById);

/**
 * PUT /api/classes/:classId
 * Update class information (Admin only)
 */
router.put('/:classId', authenticate, requireRole(['Admin']), validateClassUpdate, classController.updateClass);

/**
 * DELETE /api/classes/:classId
 * Delete class (Admin only)
 */
router.delete('/:classId', authenticate, requireRole(['Admin']), classController.deleteClass);

module.exports = router;