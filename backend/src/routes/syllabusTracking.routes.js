const express = require('express');
const router = express.Router();
const syllabusTrackingController = require('../controllers/syllabusTracking.controller');
const { authenticate, requirePermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');
const validate = require('../middleware/validation');
const syllabusTrackingSchema = require('../schemas/syllabusTracking.schema');

router.get(
  '/plans',
  authenticate,
  requirePermission(PERMISSIONS.SYLLABUS_PLAN_LIST_READ),
  validate(syllabusTrackingSchema.getPlans),
  syllabusTrackingController.getPlans
);

router.post(
  '/plans',
  authenticate,
  requirePermission(PERMISSIONS.SYLLABUS_PLAN_CREATE),
  validate(syllabusTrackingSchema.createPlan),
  syllabusTrackingController.createPlan
);

router.put(
  '/plans/replace',
  authenticate,
  requirePermission(PERMISSIONS.SYLLABUS_PLAN_EDIT),
  validate(syllabusTrackingSchema.replacePlans),
  syllabusTrackingController.replacePlans
);

router.get(
  '/plans/:planId',
  authenticate,
  requirePermission(PERMISSIONS.SYLLABUS_PLAN_ITEM_READ),
  validate(syllabusTrackingSchema.getPlanById),
  syllabusTrackingController.getPlanById
);

router.put(
  '/plans/:planId',
  authenticate,
  requirePermission(PERMISSIONS.SYLLABUS_PLAN_EDIT),
  validate(syllabusTrackingSchema.updatePlan),
  syllabusTrackingController.updatePlan
);

router.put(
  '/plans',
  authenticate,
  requirePermission(PERMISSIONS.SYLLABUS_PLAN_EDIT),
  validate(syllabusTrackingSchema.bulkUpdatePlans),
  syllabusTrackingController.bulkUpdatePlans
);

router.delete(
  '/plans/:planId',
  authenticate,
  requirePermission(PERMISSIONS.SYLLABUS_PLAN_DELETE),
  validate(syllabusTrackingSchema.deletePlan),
  syllabusTrackingController.deletePlan
);

router.get(
  '/progress',
  authenticate,
  requirePermission(PERMISSIONS.SYLLABUS_PROGRESS_LIST_READ),
  validate(syllabusTrackingSchema.getProgress),
  syllabusTrackingController.getProgress
);

router.post(
  '/progress',
  authenticate,
  requirePermission(PERMISSIONS.SYLLABUS_PROGRESS_CREATE),
  validate(syllabusTrackingSchema.createProgress),
  syllabusTrackingController.createProgress
);

router.put(
  '/progress',
  authenticate,
  requirePermission(PERMISSIONS.SYLLABUS_PROGRESS_EDIT),
  validate(syllabusTrackingSchema.bulkUpdateProgress),
  syllabusTrackingController.bulkUpdateProgress
);

router.get(
  '/progress/:progressId',
  authenticate,
  requirePermission(PERMISSIONS.SYLLABUS_PROGRESS_ITEM_READ),
  validate(syllabusTrackingSchema.getProgressById),
  syllabusTrackingController.getProgressById
);

router.put(
  '/progress/:progressId',
  authenticate,
  requirePermission(PERMISSIONS.SYLLABUS_PROGRESS_EDIT),
  validate(syllabusTrackingSchema.updateProgress),
  syllabusTrackingController.updateProgress
);

router.delete(
  '/progress/:progressId',
  authenticate,
  requirePermission(PERMISSIONS.SYLLABUS_PROGRESS_DELETE),
  validate(syllabusTrackingSchema.deleteProgress),
  syllabusTrackingController.deleteProgress
);

module.exports = router;
