const express = require('express');
const router = express.Router();
const { authenticate, requirePermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');
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
  createExamController
);
router.get(
  '/',
  requirePermission(PERMISSIONS.EXAM_LIST_READ),
  getExamsController
);
router.get(
  '/:id',
  requirePermission(PERMISSIONS.EXAM_ITEM_READ),
  getExamByIdController
);
router.put(
  '/:id',
  requirePermission(PERMISSIONS.EXAM_EDIT),
  updateExamController
);
router.delete(
  '/:id',
  requirePermission(PERMISSIONS.EXAM_DELETE),
  deleteExamController
);

module.exports = router;
