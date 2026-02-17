const express = require('express');
const router = express.Router();
const holidayController = require('../controllers/holiday.controller');
const { authenticate, requirePermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');

// Apply auth middleware to all routes
router.use(authenticate);

// Get all holidays
router.get(
  '/:campusId',
  requirePermission(PERMISSIONS.HOLIDAY_LIST_READ),
  holidayController.getAllHolidays
);
// Check if a specific date is a holiday
router.get(
  '/:campusId/check-date',
  requirePermission(PERMISSIONS.HOLIDAY_CHECK_DATE_READ),
  holidayController.checkDate
);
// Get calculated holidays summary
router.get(
  '/:campusId/calculated',
  requirePermission(PERMISSIONS.HOLIDAY_CALCULATED_READ),
  holidayController.getCalculatedHolidays
);

router.post(
  '/:campusId',
  requirePermission(PERMISSIONS.HOLIDAY_CREATE),
  holidayController.createHoliday
);

router.put(
  '/:campusId/:id',
  requirePermission(PERMISSIONS.HOLIDAY_EDIT),
  holidayController.updateHoliday
);

router.delete(
  '/:campusId/:id',
  requirePermission(PERMISSIONS.HOLIDAY_DELETE),
  holidayController.deleteHoliday
);

module.exports = router;
