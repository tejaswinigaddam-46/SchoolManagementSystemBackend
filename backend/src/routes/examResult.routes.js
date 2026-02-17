const express = require('express');
const router = express.Router();
const { authenticate, requirePermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');
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
  createExamResultController
);
router.post(
  '/bulk',
  requirePermission(PERMISSIONS.EXAM_RESULT_BULK_CREATE),
  bulkCreateExamResultsController
);
router.get(
  '/:id',
  requirePermission(PERMISSIONS.EXAM_RESULT_ITEM_READ),
  getExamResultByIdController
);
router.put(
  '/:id',
  requirePermission(PERMISSIONS.EXAM_RESULT_EDIT),
  updateExamResultController
);
router.delete(
  '/:id',
  requirePermission(PERMISSIONS.EXAM_RESULT_DELETE),
  deleteExamResultController
);

// Specific lookups
router.get(
  '/exam/:examId',
  requirePermission(PERMISSIONS.EXAM_RESULT_BY_EXAM_READ),
  getExamResultsByExamIdController
);
router.get(
  '/student/:studentId',
  requirePermission(PERMISSIONS.EXAM_RESULT_BY_STUDENT_READ),
  getExamResultsByStudentIdController
);

module.exports = router;
