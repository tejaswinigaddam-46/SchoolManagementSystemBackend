const express = require('express');
const { getConsolidatedAttendanceController } = require('../controllers/consolidatedAttendance.controller');
const { authenticate, requirePermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');

const router = express.Router();

router.post(
  '/daily',
  authenticate,
  requirePermission([
    PERMISSIONS.CONSOLIDATED_ATTENDANCE_DAILY_CREATE,
    PERMISSIONS.MY_ATTENDANCE_READ
  ]),
  getConsolidatedAttendanceController
);

module.exports = router;
