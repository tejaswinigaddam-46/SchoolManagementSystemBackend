const express = require('express');
const router = express.Router();
const buildingController = require('../controllers/building.controller');

const { authenticate, requirePermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');
const validate = require('../middleware/validation');
const buildingSchema = require('../schemas/building.schema');

router.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.BUILDING_LIST_READ),
  validate(buildingSchema.getAllBuildings),
  buildingController.getAllBuildings
);

router.get(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.BUILDING_ITEM_READ),
  validate(buildingSchema.getBuildingById),
  buildingController.getBuildingById
);

router.post(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.BUILDING_CREATE),
  validate(buildingSchema.createBuilding),
  buildingController.createBuilding
);

router.put(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.BUILDING_EDIT),
  validate(buildingSchema.updateBuilding),
  buildingController.updateBuilding
);

router.delete(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.BUILDING_DELETE),
  validate(buildingSchema.deleteBuilding),
  buildingController.deleteBuilding
);

module.exports = router;
