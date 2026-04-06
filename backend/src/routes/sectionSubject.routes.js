const express = require('express');
const router = express.Router();
const { authenticate, requirePermission } = require('../middleware/auth');
const controller = require('../controllers/sectionSubject.controller');
const { PERMISSIONS } = require('../config/permissions');
const validate = require('../middleware/validation');
const schema = require('../schemas/sectionSubject.schema');

router.post(
  '/assign',
  authenticate,
  requirePermission(PERMISSIONS.SECTION_SUBJECT_ASSIGN_CREATE),
  validate(schema.bulkAssign),
  controller.bulkAssign
);
router.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.SECTION_SUBJECT_LIST_READ),
  validate(schema.listBySections),
  controller.listBySections
);
router.post(
  '/unassign',
  authenticate,
  requirePermission(PERMISSIONS.SECTION_SUBJECT_UNASSIGN_CREATE),
  validate(schema.unassign),
  controller.unassign
);

module.exports = router;
