const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');
const { authenticate, requirePermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');
const validate = require('../middleware/validation');
const attendanceSchema = require('../schemas/attendance.schema');

router.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.ATTENDANCE_LIST_READ),
  validate(attendanceSchema.getAttendance),
  attendanceController.getAttendance
);

router.post(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.ATTENDANCE_SAVE_CREATE),
  validate(attendanceSchema.saveAttendance),
  attendanceController.saveAttendance
);

module.exports = router;
