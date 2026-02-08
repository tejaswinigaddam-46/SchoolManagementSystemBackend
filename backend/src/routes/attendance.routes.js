const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');
const { authenticate, requireRole } = require('../middleware/auth');

// ==================== ATTENDANCE ROUTES ====================

/**
 * GET /api/attendance
 * Get attendance records for a class section on a specific date
 */
router.get('/', authenticate, requireRole(['Admin', 'Teacher', 'Principal']), attendanceController.getAttendance);

/**
 * POST /api/attendance
 * Save attendance records (bulk)
 */
router.post('/', authenticate, requireRole(['Admin', 'Teacher', 'Principal']), attendanceController.saveAttendance);

module.exports = router;
