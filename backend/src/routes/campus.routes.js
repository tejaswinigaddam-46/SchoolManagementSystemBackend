const express = require('express');
const router = express.Router();
const campusController = require('../controllers/campus.controller');
const { authenticate, requirePermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');
const validate = require('../middleware/validation');
const campusSchema = require('../schemas/campus.schema');

router.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.CAMPUS_LIST_READ),
  validate(campusSchema.getAllCampuses),
  campusController.getAllCampuses
);

router.post(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.CAMPUS_CREATE),
  validate(campusSchema.registerCampus),
  campusController.registerCampus
);

router.get(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.CAMPUS_ITEM_READ),
  validate(campusSchema.getCampusById),
  campusController.getCampusById
);

router.put(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.CAMPUS_UPDATE),
  validate(campusSchema.updateCampus),
  campusController.updateCampus
);

router.delete(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.CAMPUS_DELETE),
  validate(campusSchema.deleteCampus),
  campusController.deleteCampus
);

module.exports = router;
