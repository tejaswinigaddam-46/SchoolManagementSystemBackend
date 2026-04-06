const express = require('express');
const router = express.Router();
const specialWorkingDayController = require('../controllers/specialWorkingDay.controller');
const { authenticate, requirePermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');
const validate = require('../middleware/validation');
const specialWorkingDaySchema = require('../schemas/specialWorkingDay.schema');

router.use(authenticate);

router.post(
  '/',
  requirePermission(PERMISSIONS.SPECIAL_WORKING_DAY_CREATE),
  validate(specialWorkingDaySchema.create),
  specialWorkingDayController.create
);
router.get(
  '/',
  requirePermission(PERMISSIONS.SPECIAL_WORKING_DAY_LIST_READ),
  validate(specialWorkingDaySchema.getAll),
  specialWorkingDayController.getAll
);
router.put(
  '/:id',
  requirePermission(PERMISSIONS.SPECIAL_WORKING_DAY_EDIT),
  validate(specialWorkingDaySchema.update),
  specialWorkingDayController.update
);
router.delete(
  '/:id',
  requirePermission(PERMISSIONS.SPECIAL_WORKING_DAY_DELETE),
  validate(specialWorkingDaySchema.delete),
  specialWorkingDayController.delete
);

module.exports = router;
