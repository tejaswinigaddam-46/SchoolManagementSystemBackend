const express = require('express');
const router = express.Router();
const studentController = require('../controllers/student.controller');
const studentBulkOperationController = require('../controllers/studentBulkOperation.controller');
const upload = require('../middleware/upload.middleware');
const { authenticate, requirePermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');
const validate = require('../middleware/validation');
const studentBulkOperationSchema = require('../schemas/studentBulkOperation.schema');
const studentSchema = require('../schemas/student.schema');

router.get(
  '/import/template',
  authenticate,
  requirePermission(PERMISSIONS.STUDENT_IMPORT_TEMPLATE_READ),
  studentBulkOperationController.downloadTemplate
);

router.post(
  '/import',
  authenticate,
  requirePermission(PERMISSIONS.STUDENT_IMPORT_CREATE),
  upload.single('file'),
  validate(studentBulkOperationSchema.uploadStudents),
  studentBulkOperationController.uploadStudents
);

router.post(
  '/export',
  authenticate,
  requirePermission(PERMISSIONS.STUDENT_EXPORT_CREATE),
  validate(studentBulkOperationSchema.exportStudents),
  studentBulkOperationController.exportStudents
);

router.post(
  '/bulk-update',
  authenticate,
  requirePermission(PERMISSIONS.STUDENT_BULK_UPDATE_CREATE),
  upload.single('file'),
  validate(studentBulkOperationSchema.updateStudents),
  studentBulkOperationController.bulkUpdateStudents
);

/**
 * GET /api/students
 * Get all students with pagination and filtering
 */
router.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.STUDENT_LIST_READ),
  validate(studentSchema.getAllStudents),
  studentController.getAllStudents
);

/**
 * GET /api/students/filter-options
 * Get filter options for student dropdowns (academic years, curriculums, mediums)
 */
router.get(
  '/filter-options',
  authenticate,
  requirePermission(PERMISSIONS.STUDENT_FILTER_OPTIONS_READ),
  validate(studentSchema.getStudentFilterOptions),
  studentController.getStudentFilterOptions
);

/**
 * GET /api/students/by-filters
 * Get students by filters for section assignment
 */
router.get(
  '/by-filters',
  authenticate,
  requirePermission(PERMISSIONS.STUDENT_BY_FILTERS_READ),
  validate(studentSchema.getStudentsByFilters),
  studentController.getStudentsByFilters
);

/**
 * POST /api/students/assign-to-section
 * Assign students to section (bulk assignment)
 */
router.post(
  '/assign-to-section',
  authenticate,
  requirePermission(PERMISSIONS.STUDENT_ASSIGN_SECTION_CREATE),
  validate(studentSchema.assignStudentsToSection),
  studentController.assignStudentsToSection
);

/**
 * PUT /api/students/:studentId/section
 * Update a single student's section assignment
 */
router.put(
  '/:studentId/section',
  authenticate,
  requirePermission(PERMISSIONS.STUDENT_SECTION_EDIT),
  validate(studentSchema.updateStudentSection),
  studentController.updateStudentSection
);

/**
 * DELETE /api/students/:studentId/section
 * Deassign a student from their section (set section to null)
 */
router.delete(
  '/:studentId/section',
  authenticate,
  requirePermission(PERMISSIONS.STUDENT_SECTION_DELETE),
  validate(studentSchema.deassignStudentSection),
  studentController.deassignStudentSection
);

/**
 * GET /api/students/section/:classId/:sectionId
 * Get students by class and section IDs
 */
router.get(
  '/section/:classId/:sectionId',
  authenticate,
  requirePermission(PERMISSIONS.STUDENT_BY_SECTION_READ),
  validate(studentSchema.getStudentsBySection),
  studentController.getStudentsBySectionController
);

/**
 * POST /api/students
 * Register a new student
 */
router.post(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.STUDENT_CREATE_ROUTE_CREATE),
  validate(studentSchema.registerStudent),
  studentController.registerStudent
);

/**
 * GET /api/students/statistics
 * Get student statistics for dashboard
 */
router.get(
  '/statistics',
  authenticate,
  requirePermission(PERMISSIONS.STUDENT_STATISTICS_READ),
  validate(studentSchema.getStudentStatistics),
  studentController.getStudentStatistics
);

/**
 * GET /api/students/admission/:admissionNumber
 * Get student by admission number
 */
router.get(
  '/admission/:admissionNumber',
  authenticate,
  requirePermission(PERMISSIONS.STUDENT_BY_ADMISSION_READ),
  validate(studentSchema.getStudentByAdmissionNumber),
  studentController.getStudentByAdmissionNumber
);

/**
 * GET /api/students/username/:username
 * Get student by username
 */
router.get(
  '/username/:username',
  authenticate,
  requirePermission(PERMISSIONS.STUDENT_BY_USERNAME_READ),
  validate(studentSchema.getStudentByUsername),
  studentController.getStudentByUsername
);

/**
 * GET /api/students/username/:username/edit
 * Get complete student data for editing (includes all related data)
 */
router.get(
  '/username/:username/edit',
  authenticate,
  requirePermission(PERMISSIONS.STUDENT_FOR_EDIT_READ),
  validate(studentSchema.getCompleteStudentForEdit),
  studentController.getCompleteStudentForEdit
);

/**
 * PUT /api/students/username/:username
 * Update student basic information
 */
router.put(
  '/username/:username',
  authenticate,
  requirePermission(PERMISSIONS.STUDENT_EDIT),
  validate(studentSchema.updateStudent),
  studentController.updateStudent
);

/**
 * DELETE /api/students/username/:username
 * Delete student (soft delete)
 */
router.delete(
  '/username/:username',
  authenticate,
  requirePermission(PERMISSIONS.STUDENT_DELETE_ROUTE_DELETE),
  validate(studentSchema.deleteStudent),
  studentController.deleteStudent
);

/**
 * GET /api/students/username/:username/parents
 * Get parents for a student
 */
router.get(
  '/username/:username/parents',
  authenticate,
  requirePermission(PERMISSIONS.STUDENT_PARENTS_READ),
  validate(studentSchema.getStudentParents),
  studentController.getStudentParents
);

/**
 * GET /api/students/parents/:parentUsername/students
 * Get students for a parent
 */
router.get(
  '/parents/:parentUsername/students',
  authenticate,
  requirePermission(PERMISSIONS.STUDENT_BY_PARENT_READ),
  validate(studentSchema.getParentStudents),
  studentController.getParentStudents
);

/**
 * POST /api/students/username/:username/parents
 * Add parent to student
 */
router.post(
  '/username/:username/parents',
  authenticate,
  requirePermission(PERMISSIONS.STUDENT_PARENT_ADD_CREATE),
  validate(studentSchema.addParentToStudent),
  studentController.addParentToStudent
);

/**
 * DELETE /api/students/username/:username/parents/:parentUsername
 * Remove parent from student
 */
router.delete(
  '/username/:username/parents/:parentUsername',
  authenticate,
  requirePermission(PERMISSIONS.STUDENT_PARENT_REMOVE_DELETE),
  validate(studentSchema.removeParentFromStudent),
  studentController.removeParentFromStudent
);

/**
 * PUT /api/students/username/:username/parents/:parentUsername
 * Update parent relationship type
 */
router.put(
  '/username/:username/parents/:parentUsername',
  authenticate,
  requirePermission(PERMISSIONS.STUDENT_PARENT_RELATIONSHIP_EDIT),
  validate(studentSchema.updateParentRelationship),
  studentController.updateParentRelationship
);

module.exports = router;
