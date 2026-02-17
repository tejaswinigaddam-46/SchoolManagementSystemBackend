const express = require('express');
const router = express.Router();
const buildingController = require('../controllers/building.controller');

const { authenticate, requirePermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');
const buildingValidator = require('../validators/building.validator');

router.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.BUILDING_LIST_READ),
  buildingController.getAllBuildings
);

router.get(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.BUILDING_ITEM_READ),
  buildingController.getBuildingById
);

router.post(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.BUILDING_CREATE),
  buildingValidator.validateCreateBuilding,
  buildingController.createBuilding
);

router.put(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.BUILDING_EDIT),
  buildingValidator.validateUpdateBuilding,
  buildingController.updateBuilding
);

router.delete(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.BUILDING_DELETE),
  buildingController.deleteBuilding
);

module.exports = router;
