const express = require('express');
const router = express.Router();
const academicController = require('../controllers/academic.controller');
const { authenticate, requirePermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');

router.get(
  '/:campusId/curricula',
  authenticate,
  requirePermission(PERMISSIONS.ACADEMIC_CURRICULA_LIST_READ),
  academicController.getAllCurricula
);

router.post(
  '/:campusId/curricula',
  authenticate,
  requirePermission(PERMISSIONS.ACADEMIC_CURRICULA_CREATE),
  academicController.createCurriculum
);

router.get(
  '/:campusId/curricula/:curriculumId',
  authenticate,
  requirePermission(PERMISSIONS.ACADEMIC_CURRICULA_ITEM_READ),
  academicController.getCurriculumById
);

router.put(
  '/:campusId/curricula/:curriculumId',
  authenticate,
  requirePermission(PERMISSIONS.ACADEMIC_CURRICULA_ITEM_EDIT),
  academicController.updateCurriculum
);

router.delete(
  '/:campusId/curricula/:curriculumId',
  authenticate,
  requirePermission(PERMISSIONS.ACADEMIC_CURRICULA_ITEM_DELETE),
  academicController.deleteCurriculum
);

router.get(
  '/:campusId/academic-year-options',
  authenticate,
  requirePermission(PERMISSIONS.ACADEMIC_YEAR_OPTIONS_READ),
  academicController.getAcademicYearOptions
);

router.get(
  '/:campusId/year-names',
  authenticate,
  requirePermission(PERMISSIONS.ACADEMIC_YEAR_NAMES_READ),
  academicController.getDistinctYearNames
);

router.get(
  '/:campusId/media',
  authenticate,
  requirePermission(PERMISSIONS.ACADEMIC_MEDIA_READ),
  academicController.getDistinctMedia
);

router.get(
  '/:campusId/academic-year-id',
  authenticate,
  requirePermission(PERMISSIONS.ACADEMIC_YEAR_ID_READ),
  academicController.getAcademicYearIdByCombo
);

router.get(
  '/:campusId/academic-years',
  authenticate,
  requirePermission(PERMISSIONS.ACADEMIC_YEARS_LIST_READ),
  academicController.getAllAcademicYears
);

router.post(
  '/:campusId/academic-years',
  authenticate,
  requirePermission(PERMISSIONS.ACADEMIC_YEAR_CREATE),
  academicController.createAcademicYear
);

router.get(
  '/:campusId/academic-years/:academicYearId',
  authenticate,
  requirePermission(PERMISSIONS.ACADEMIC_YEAR_ITEM_READ),
  academicController.getAcademicYearById
);

router.put(
  '/:campusId/academic-years/:academicYearId',
  authenticate,
  requirePermission(PERMISSIONS.ACADEMIC_YEAR_ITEM_EDIT),
  academicController.updateAcademicYear
);

router.delete(
  '/:campusId/academic-years/:academicYearId',
  authenticate,
  requirePermission(PERMISSIONS.ACADEMIC_YEAR_ITEM_DELETE),
  academicController.deleteAcademicYear
);

module.exports = router;
