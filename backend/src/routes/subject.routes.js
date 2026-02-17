const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subject.controller');
const { authenticate, requirePermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');

router.get(
  '/:campusId',
  authenticate,
  requirePermission(PERMISSIONS.SUBJECT_LIST_READ),
  subjectController.getAllSubjects
);

router.post(
  '/:campusId',
  authenticate,
  requirePermission(PERMISSIONS.SUBJECT_CREATE),
  subjectController.createSubject
);

router.get(
  '/:campusId/:subjectId',
  authenticate,
  requirePermission(PERMISSIONS.SUBJECT_ITEM_READ),
  subjectController.getSubjectById
);

router.put(
  '/:campusId/:subjectId',
  authenticate,
  requirePermission(PERMISSIONS.SUBJECT_EDIT),
  subjectController.updateSubject
);

router.delete(
  '/:campusId/:subjectId',
  authenticate,
  requirePermission(PERMISSIONS.SUBJECT_DELETE),
  subjectController.deleteSubject
);

module.exports = router;
