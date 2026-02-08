const express = require('express');
const { getConsolidatedAttendanceController } = require('../controllers/consolidatedAttendance.controller');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// Daily consolidated attendance records over date range
router.post('/daily', authenticate, requireRole(['Admin']), getConsolidatedAttendanceController);

module.exports = router;
