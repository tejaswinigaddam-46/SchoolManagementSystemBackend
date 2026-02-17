const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');
const { authenticate, requirePermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');

router.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.ATTENDANCE_LIST_READ),
  attendanceController.getAttendance
);

router.post(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.ATTENDANCE_SAVE_CREATE),
  attendanceController.saveAttendance
);

module.exports = router;
