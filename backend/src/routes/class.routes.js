const express = require('express');
const router = express.Router();
const classController = require('../controllers/class.controller');
const { authenticate, requirePermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');
const validate = require('../middleware/validation');
const classSchema = require('../schemas/class.schema');

router.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.CLASS_LIST_READ),
  validate(classSchema.getAllClasses),
  classController.getAllClasses
);

router.post(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.CLASS_CREATE),
  validate(classSchema.createClass),
  classController.createClass
);

router.get(
  '/statistics',
  authenticate,
  requirePermission(PERMISSIONS.CLASS_STATISTICS_READ),
  validate(classSchema.getClassStatistics),
  classController.getClassStatistics
);

router.get(
  '/campus/:campusId',
  authenticate,
  requirePermission(PERMISSIONS.CLASS_BY_CAMPUS_READ),
  validate(classSchema.getClassesByCampus),
  classController.getClassesByCampus
);

router.get(
  '/:classId',
  authenticate,
  requirePermission(PERMISSIONS.CLASS_ITEM_READ),
  validate(classSchema.getClassById),
  classController.getClassById
);

router.put(
  '/:classId',
  authenticate,
  requirePermission(PERMISSIONS.CLASS_EDIT),
  validate(classSchema.updateClass),
  classController.updateClass
);

router.delete(
  '/:classId',
  authenticate,
  requirePermission(PERMISSIONS.CLASS_DELETE),
  validate(classSchema.deleteClass),
  classController.deleteClass
);

module.exports = router;
