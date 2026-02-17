const express = require('express');
const router = express.Router();
const classController = require('../controllers/class.controller');
const { authenticate, requirePermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');
const { validateClassCreation, validateClassUpdate } = require('../validators/class.validator');

router.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.CLASS_LIST_READ),
  classController.getAllClasses
);

router.post(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.CLASS_CREATE),
  validateClassCreation,
  classController.createClass
);

router.get(
  '/statistics',
  authenticate,
  requirePermission(PERMISSIONS.CLASS_STATISTICS_READ),
  classController.getClassStatistics
);

router.get(
  '/campus/:campusId',
  authenticate,
  requirePermission(PERMISSIONS.CLASS_BY_CAMPUS_READ),
  classController.getClassesByCampus
);

router.get(
  '/:classId',
  authenticate,
  requirePermission(PERMISSIONS.CLASS_ITEM_READ),
  classController.getClassById
);

router.put(
  '/:classId',
  authenticate,
  requirePermission(PERMISSIONS.CLASS_EDIT),
  validateClassUpdate,
  classController.updateClass
);

router.delete(
  '/:classId',
  authenticate,
  requirePermission(PERMISSIONS.CLASS_DELETE),
  classController.deleteClass
);

module.exports = router;
