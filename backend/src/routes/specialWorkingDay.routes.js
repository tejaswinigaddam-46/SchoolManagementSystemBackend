const express = require('express');
const router = express.Router();
const specialWorkingDayController = require('../controllers/specialWorkingDay.controller');
const { authenticate, requirePermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');

router.use(authenticate);

router.post(
  '/',
  requirePermission(PERMISSIONS.SPECIAL_WORKING_DAY_CREATE),
  specialWorkingDayController.create
);
router.get(
  '/',
  requirePermission(PERMISSIONS.SPECIAL_WORKING_DAY_LIST_READ),
  specialWorkingDayController.getAll
);
router.put(
  '/:id',
  requirePermission(PERMISSIONS.SPECIAL_WORKING_DAY_EDIT),
  specialWorkingDayController.update
);
router.delete(
  '/:id',
  requirePermission(PERMISSIONS.SPECIAL_WORKING_DAY_DELETE),
  specialWorkingDayController.delete
);

module.exports = router;
