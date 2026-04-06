const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subject.controller');
const { authenticate, requirePermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');
const validate = require('../middleware/validation');
const subjectSchema = require('../schemas/subject.schema');

router.get(
  '/:campusId',
  authenticate,
  requirePermission(PERMISSIONS.SUBJECT_LIST_READ),
  validate(subjectSchema.getAllSubjects),
  subjectController.getAllSubjects
);

router.post(
  '/:campusId',
  authenticate,
  requirePermission(PERMISSIONS.SUBJECT_CREATE),
  validate(subjectSchema.createSubject),
  subjectController.createSubject
);

router.get(
  '/:campusId/:subjectId',
  authenticate,
  requirePermission(PERMISSIONS.SUBJECT_ITEM_READ),
  validate(subjectSchema.getSubjectById),
  subjectController.getSubjectById
);

router.put(
  '/:campusId/:subjectId',
  authenticate,
  requirePermission(PERMISSIONS.SUBJECT_EDIT),
  validate(subjectSchema.updateSubject),
  subjectController.updateSubject
);

router.delete(
  '/:campusId/:subjectId',
  authenticate,
  requirePermission(PERMISSIONS.SUBJECT_DELETE),
  validate(subjectSchema.deleteSubject),
  subjectController.deleteSubject
);

module.exports = router;
