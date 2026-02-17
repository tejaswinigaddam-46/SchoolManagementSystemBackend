const express = require('express');
const router = express.Router();
const campusController = require('../controllers/campus.controller');
const { authenticate, requirePermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');

router.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.CAMPUS_LIST_READ),
  campusController.getAllCampuses
);

router.post(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.CAMPUS_CREATE),
  campusController.registerCampus
);

router.get(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.CAMPUS_ITEM_READ),
  campusController.getCampusById
);

router.put(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.CAMPUS_UPDATE),
  campusController.updateCampus
);

router.delete(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.CAMPUS_DELETE),
  campusController.deleteCampus
);

module.exports = router;
