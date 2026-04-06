const express = require('express');
const router = express.Router();
const { authenticate, requirePermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');
const validate = require('../middleware/validation');
const examResultSchema = require('../schemas/examresult.schema');
const {
  createExamResultController,
  bulkCreateExamResultsController,
  updateExamResultController,
  deleteExamResultController,
  getExamResultsByExamIdController,
  getExamResultsByStudentIdController,
  getExamResultByIdController
} = require('../controllers/examResult.controller');

// Apply authentication middleware to all routes
router.use(authenticate);

// Routes
router.post(
  '/',
  requirePermission(PERMISSIONS.EXAM_RESULT_CREATE),
  validate(examResultSchema.createExamResult),
  createExamResultController
);
router.post(
  '/bulk',
  requirePermission(PERMISSIONS.EXAM_RESULT_BULK_CREATE),
  validate(examResultSchema.bulkCreateExamResults),
  bulkCreateExamResultsController
);
router.get(
  '/:id',
  requirePermission(PERMISSIONS.EXAM_RESULT_ITEM_READ),
  validate(examResultSchema.getExamResultById),
  getExamResultByIdController
);
router.put(
  '/:id',
  requirePermission(PERMISSIONS.EXAM_RESULT_EDIT),
  validate(examResultSchema.updateExamResult),
  updateExamResultController
);
router.delete(
  '/:id',
  requirePermission(PERMISSIONS.EXAM_RESULT_DELETE),
  validate(examResultSchema.deleteExamResult),
  deleteExamResultController
);

// Specific lookups
router.get(
  '/exam/:examId',
  requirePermission(PERMISSIONS.EXAM_RESULT_BY_EXAM_READ),
  validate(examResultSchema.getExamResultsByExamId),
  getExamResultsByExamIdController
);
router.get(
  '/student/:studentId',
  requirePermission(PERMISSIONS.EXAM_RESULT_BY_STUDENT_READ),
  validate(examResultSchema.getExamResultsByStudentId),
  getExamResultsByStudentIdController
);

module.exports = router;
