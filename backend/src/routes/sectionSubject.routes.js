const express = require('express');
const router = express.Router();
const { authenticate, requirePermission } = require('../middleware/auth');
const controller = require('../controllers/sectionSubject.controller');
const { PERMISSIONS } = require('../config/permissions');

router.post(
  '/assign',
  authenticate,
  requirePermission(PERMISSIONS.SECTION_SUBJECT_ASSIGN_CREATE),
  controller.bulkAssign
);
router.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.SECTION_SUBJECT_LIST_READ),
  controller.listBySections
);
router.post(
  '/unassign',
  authenticate,
  requirePermission(PERMISSIONS.SECTION_SUBJECT_UNASSIGN_CREATE),
  controller.unassign
);

module.exports = router;
