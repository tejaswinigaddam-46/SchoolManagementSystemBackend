const express = require('express');
const router = express.Router();
const SectionController = require('../controllers/section.controller');
const { authenticate, requirePermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');
const {
    createSection,
    updateSection,
    sectionId,
    queryParams
} = require('../validators/section.validator');

router.get(
  '/filter-options',
  authenticate,
  requirePermission(PERMISSIONS.SECTION_FILTER_OPTIONS_READ),
  SectionController.getFilterOptions
);

router.get(
  '/statistics',
  authenticate,
  requirePermission(PERMISSIONS.SECTION_STATISTICS_READ),
  SectionController.getSectionStatistics
);

router.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.SECTION_LIST_READ),
  queryParams,
  SectionController.getAllSections
);

router.post(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.SECTION_CREATE),
  createSection,
  SectionController.createSection
);

router.get(
  '/:sectionId',
  authenticate,
  requirePermission(PERMISSIONS.SECTION_ITEM_READ),
  sectionId,
  SectionController.getSectionById
);

router.get(
  '/:sectionId/subjects',
  authenticate,
  requirePermission(PERMISSIONS.SECTION_SUBJECTS_READ),
  sectionId,
  SectionController.getSectionSubjects
);

router.put(
  '/:sectionId',
  authenticate,
  requirePermission(PERMISSIONS.SECTION_EDIT),
  updateSection,
  SectionController.updateSection
);

router.delete(
  '/:sectionId',
  authenticate,
  requirePermission(PERMISSIONS.SECTION_DELETE),
  sectionId,
  SectionController.deleteSection
);

module.exports = router;
