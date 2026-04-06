const express = require('express');
const router = express.Router();
const holidayController = require('../controllers/holiday.controller');
const { authenticate, requirePermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');
const validate = require('../middleware/validation');
const holidaySchema = require('../schemas/holiday.schema');

// Apply auth middleware to all routes
router.use(authenticate);

// Get all holidays
router.get(
  '/:campusId',
  requirePermission(PERMISSIONS.HOLIDAY_LIST_READ),
  validate(holidaySchema.getAllHolidays),
  holidayController.getAllHolidays
);
// Check if a specific date is a holiday
router.get(
  '/:campusId/check-date',
  requirePermission(PERMISSIONS.HOLIDAY_CHECK_DATE_READ),
  validate(holidaySchema.checkDate),
  holidayController.checkDate
);
// Get calculated holidays summary
router.get(
  '/:campusId/calculated',
  requirePermission(PERMISSIONS.HOLIDAY_CALCULATED_READ),
  validate(holidaySchema.getCalculatedHolidays),
  holidayController.getCalculatedHolidays
);

router.post(
  '/:campusId',
  requirePermission(PERMISSIONS.HOLIDAY_CREATE),
  validate(holidaySchema.createHoliday),
  holidayController.createHoliday
);

router.put(
  '/:campusId/:id',
  requirePermission(PERMISSIONS.HOLIDAY_EDIT),
  validate(holidaySchema.updateHoliday),
  holidayController.updateHoliday
);

router.delete(
  '/:campusId/:id',
  requirePermission(PERMISSIONS.HOLIDAY_DELETE),
  validate(holidaySchema.deleteHoliday),
  holidayController.deleteHoliday
);

module.exports = router;
