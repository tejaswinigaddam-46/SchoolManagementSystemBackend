const express = require('express');
const router = express.Router();
const academicController = require('../controllers/academic.controller');
const { authenticate, requirePermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');
const validate = require('../middleware/validation');
const academicSchema = require('../schemas/academic.schema');

router.get(
  '/:campusId/curricula',
  authenticate,
  requirePermission(PERMISSIONS.ACADEMIC_CURRICULA_LIST_READ),
  validate(academicSchema.getAllCurricula),
  academicController.getAllCurricula
);

router.post(
  '/:campusId/curricula',
  authenticate,
  requirePermission(PERMISSIONS.ACADEMIC_CURRICULA_CREATE),
  validate(academicSchema.createCurriculum),
  academicController.createCurriculum
);

router.get(
  '/:campusId/curricula/:curriculumId',
  authenticate,
  requirePermission(PERMISSIONS.ACADEMIC_CURRICULA_ITEM_READ),
  validate(academicSchema.getCurriculumById),
  academicController.getCurriculumById
);

router.put(
  '/:campusId/curricula/:curriculumId',
  authenticate,
  requirePermission(PERMISSIONS.ACADEMIC_CURRICULA_ITEM_EDIT),
  validate(academicSchema.updateCurriculum),
  academicController.updateCurriculum
);

router.delete(
  '/:campusId/curricula/:curriculumId',
  authenticate,
  requirePermission(PERMISSIONS.ACADEMIC_CURRICULA_ITEM_DELETE),
  validate(academicSchema.deleteCurriculum),
  academicController.deleteCurriculum
);

router.get(
  '/:campusId/academic-year-options',
  authenticate,
  requirePermission(PERMISSIONS.ACADEMIC_YEAR_OPTIONS_READ),
  validate(academicSchema.getAcademicYearOptions),
  academicController.getAcademicYearOptions
);

router.get(
  '/:campusId/year-names',
  authenticate,
  requirePermission(PERMISSIONS.ACADEMIC_YEAR_NAMES_READ),
  validate(academicSchema.getDistinctYearNames),
  academicController.getDistinctYearNames
);

router.get(
  '/:campusId/media',
  authenticate,
  requirePermission(PERMISSIONS.ACADEMIC_MEDIA_READ),
  validate(academicSchema.getDistinctMedia),
  academicController.getDistinctMedia
);

router.get(
  '/:campusId/academic-year-id',
  authenticate,
  requirePermission(PERMISSIONS.ACADEMIC_YEAR_ID_READ),
  validate(academicSchema.getAcademicYearIdByCombo),
  academicController.getAcademicYearIdByCombo
);

router.get(
  '/:campusId/academic-years',
  authenticate,
  requirePermission(PERMISSIONS.ACADEMIC_YEARS_LIST_READ),
  validate(academicSchema.getAllAcademicYears),
  academicController.getAllAcademicYears
);

router.post(
  '/:campusId/academic-years',
  authenticate,
  requirePermission(PERMISSIONS.ACADEMIC_YEAR_CREATE),
  validate(academicSchema.createAcademicYear),
  academicController.createAcademicYear
);

router.get(
  '/:campusId/academic-years/:academicYearId',
  authenticate,
  requirePermission(PERMISSIONS.ACADEMIC_YEAR_ITEM_READ),
  validate(academicSchema.getAcademicYearById),
  academicController.getAcademicYearById
);

router.put(
  '/:campusId/academic-years/:academicYearId',
  authenticate,
  requirePermission(PERMISSIONS.ACADEMIC_YEAR_ITEM_EDIT),
  validate(academicSchema.updateAcademicYear),
  academicController.updateAcademicYear
);

router.delete(
  '/:campusId/academic-years/:academicYearId',
  authenticate,
  requirePermission(PERMISSIONS.ACADEMIC_YEAR_ITEM_DELETE),
  validate(academicSchema.deleteAcademicYear),
  academicController.deleteAcademicYear
);

module.exports = router;
