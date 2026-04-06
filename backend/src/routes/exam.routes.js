const express = require('express');
const router = express.Router();
const { authenticate, requirePermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');
const validate = require('../middleware/validation');
const examSchema = require('../schemas/exam.schema');
const {
  createExamController,
  updateExamController,
  deleteExamController,
  getExamsController,
  getExamByIdController
} = require('../controllers/exam.controller');

// Apply authentication middleware to all routes
router.use(authenticate);

// Routes
router.post(
  '/',
  requirePermission(PERMISSIONS.EXAM_CREATE),
  validate(examSchema.createExam),
  createExamController
);
router.get(
  '/',
  requirePermission(PERMISSIONS.EXAM_LIST_READ),
  validate(examSchema.getExams),
  getExamsController
);
router.get(
  '/:id',
  requirePermission(PERMISSIONS.EXAM_ITEM_READ),
  validate(examSchema.getExamById),
  getExamByIdController
);
router.put(
  '/:id',
  requirePermission(PERMISSIONS.EXAM_EDIT),
  validate(examSchema.updateExam),
  updateExamController
);
router.delete(
  '/:id',
  requirePermission(PERMISSIONS.EXAM_DELETE),
  validate(examSchema.deleteExam),
  deleteExamController
);

module.exports = router;
