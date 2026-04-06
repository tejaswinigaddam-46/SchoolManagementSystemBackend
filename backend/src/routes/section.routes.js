const express = require('express');
const router = express.Router();
const SectionController = require('../controllers/section.controller');
const { authenticate, requirePermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');
const validate = require('../middleware/validation');
const sectionSchema = require('../schemas/section.schema');

router.get(
  '/filter-options',
  authenticate,
  requirePermission(PERMISSIONS.SECTION_FILTER_OPTIONS_READ),
  validate(sectionSchema.getFilterOptions),
  SectionController.getFilterOptions
);

router.get(
  '/statistics',
  authenticate,
  requirePermission(PERMISSIONS.SECTION_STATISTICS_READ),
  validate(sectionSchema.getSectionStatistics),
  SectionController.getSectionStatistics
);

router.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.SECTION_LIST_READ),
  validate(sectionSchema.getAllSections),
  SectionController.getAllSections
);

router.post(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.SECTION_CREATE),
  validate(sectionSchema.createSection),
  SectionController.createSection
);

router.get(
  '/:sectionId',
  authenticate,
  requirePermission(PERMISSIONS.SECTION_ITEM_READ),
  validate(sectionSchema.getSectionById),
  SectionController.getSectionById
);

router.get(
  '/:sectionId/subjects',
  authenticate,
  requirePermission(PERMISSIONS.SECTION_SUBJECTS_READ),
  validate(sectionSchema.getSectionSubjects),
  SectionController.getSectionSubjects
);

router.put(
  '/:sectionId',
  authenticate,
  requirePermission(PERMISSIONS.SECTION_EDIT),
  validate(sectionSchema.updateSection),
  SectionController.updateSection
);

router.delete(
  '/:sectionId',
  authenticate,
  requirePermission(PERMISSIONS.SECTION_DELETE),
  validate(sectionSchema.deleteSection),
  SectionController.deleteSection
);

module.exports = router;
