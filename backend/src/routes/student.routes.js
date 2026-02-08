const express = require('express');
const router = express.Router();
const studentController = require('../controllers/student.controller');
const studentBulkImportController = require('../controllers/studentBulkImport.controller');
const studentExportController = require('../controllers/studentExport.controller');
const studentBulkUpdateController = require('../controllers/studentBulkUpdate.controller');
const upload = require('../middleware/upload.middleware');
const { authenticate, requireRole } = require('../middleware/auth');
const { validateStudentRegistration, validateStudentUpdate } = require('../validators/student.validator');

// ==================== STUDENT ROUTES ====================

/**
 * GET /api/students/import/template
 * Download Excel template for bulk import
 */
router.get('/import/template', authenticate, studentBulkImportController.downloadTemplate);

/**
 * POST /api/students/import
 * Bulk import students from Excel/CSV
 */
router.post('/import', authenticate, requireRole(['Admin']), upload.single('file'), studentBulkImportController.uploadStudents);

/**
 * POST /api/students/export
 * Export selected students to Excel
 */
router.post('/export', authenticate, requireRole(['Admin']), studentExportController.exportStudents);

/**
 * POST /api/students/bulk-update
 * Bulk update students from Excel (exported from bulk edit)
 */
router.post('/bulk-update', authenticate, requireRole(['Admin']), upload.single('file'), studentBulkUpdateController.bulkUpdateStudents);

/**
 * GET /api/students
 * Get all students with pagination and filtering
 */
router.get('/', authenticate, studentController.getAllStudents);

/**
 * GET /api/students/filter-options
 * Get filter options for student dropdowns (academic years, curriculums, mediums)
 */
router.get('/filter-options', authenticate, studentController.getStudentFilterOptions);

/**
 * GET /api/students/by-filters
 * Get students by filters for section assignment
 */
router.get('/by-filters', authenticate, studentController.getStudentsByFilters);

/**
 * POST /api/students/assign-to-section
 * Assign students to section (bulk assignment)
 */
router.post('/assign-to-section', authenticate, requireRole(['Admin', 'Teacher']), studentController.assignStudentsToSection);

/**
 * PUT /api/students/:studentId/section
 * Update a single student's section assignment
 */
router.put('/:studentId/section', authenticate, requireRole(['Admin', 'Teacher']), studentController.updateStudentSection);

/**
 * DELETE /api/students/:studentId/section
 * Deassign a student from their section (set section to null)
 */
router.delete('/:studentId/section', authenticate, requireRole(['Admin', 'Teacher']), studentController.deassignStudentSection);

/**
 * GET /api/students/section/:classId/:sectionId
 * Get students by class and section IDs
 */
router.get('/section/:classId/:sectionId', authenticate, studentController.getStudentsBySectionController);

/**
 * POST /api/students
 * Register a new student
 */
router.post('/', authenticate, requireRole(['Admin', 'Registrar']), validateStudentRegistration, studentController.registerStudent);

/**
 * GET /api/students/statistics
 * Get student statistics for dashboard
 */
router.get('/statistics', authenticate, studentController.getStudentStatistics);

/**
 * GET /api/students/admission/:admissionNumber
 * Get student by admission number
 */
router.get('/admission/:admissionNumber', authenticate, studentController.getStudentByAdmissionNumber);

/**
 * GET /api/students/username/:username
 * Get student by username
 */
router.get('/username/:username', authenticate, studentController.getStudentByUsername);

/**
 * GET /api/students/username/:username/edit
 * Get complete student data for editing (includes all related data)
 */
router.get('/username/:username/edit', authenticate, studentController.getCompleteStudentForEdit);

/**
 * PUT /api/students/username/:username
 * Update student basic information
 */
router.put('/username/:username', authenticate, requireRole(['Admin', 'Registrar']), validateStudentUpdate, studentController.updateStudent);

/**
 * DELETE /api/students/username/:username
 * Delete student (soft delete)
 */
router.delete('/username/:username', authenticate, requireRole(['Admin']), studentController.deleteStudent);

/**
 * GET /api/students/username/:username/parents
 * Get parents for a student
 */
router.get('/username/:username/parents', authenticate, studentController.getStudentParents);

/**
 * GET /api/students/parents/:parentUsername/students
 * Get students for a parent
 */
router.get('/parents/:parentUsername/students', authenticate, studentController.getParentStudents);

/**
 * POST /api/students/username/:username/parents
 * Add parent to student
 */
router.post('/username/:username/parents', authenticate, requireRole(['Admin', 'Registrar']), studentController.addParentToStudent);

/**
 * DELETE /api/students/username/:username/parents/:parentUsername
 * Remove parent from student
 */
router.delete('/username/:username/parents/:parentUsername', authenticate, requireRole(['Admin', 'Registrar']), studentController.removeParentFromStudent);

/**
 * PUT /api/students/username/:username/parents/:parentUsername
 * Update parent relationship type
 */
router.put('/username/:username/parents/:parentUsername', authenticate, requireRole(['Admin', 'Registrar']), studentController.updateParentRelationship);

module.exports = router;