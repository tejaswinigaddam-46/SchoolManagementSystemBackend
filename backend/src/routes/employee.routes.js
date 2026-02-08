const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employee.controller');
const employeeBulkImportController = require('../controllers/employeeBulkImport.controller');
const upload = require('../middleware/upload.middleware');
const employeeExportController = require('../controllers/employeeExport.controller')
const employeeBulkUpdateController = require('../controllers/employeeBulkUpdate.controller');
const { authenticate, requireRole } = require('../middleware/auth');
const { 
    createEmployeeValidation, 
    updateEmployeeValidation,
    usernameParamValidation,
    employeeIdParamValidation,
    employmentIdParamValidation
} = require('../validators/employee.validator');

// ==================== EMPLOYEE ROUTES ====================

/**
 * GET /api/employees/import/template
 * Download Excel template for bulk import
 */
router.get('/import/template', authenticate, requireRole(['Admin']), employeeBulkImportController.downloadTemplate);

/**
 * POST /api/employees/import
 * Bulk import employees from Excel/CSV
 */
router.post('/import', authenticate, requireRole(['Admin']), upload.single('file'), employeeBulkImportController.uploadEmployees);

/**
 * POST /api/employees/export
 * Export employees
 */
router.post('/export', authenticate, requireRole(['Admin']), employeeExportController.exportEmployees);

/**
 * POST /api/employees/bulk-update
 * Bulk update employees from Excel
 */
router.post('/bulk-update', authenticate, requireRole(['Admin']), upload.single('file'), employeeBulkUpdateController.bulkUpdateEmployees);

/**
 * GET /api/employees
 * Get all employees with pagination and filtering
 */
router.get('/', authenticate, employeeController.getAllEmployeesController);

/**
 * POST /api/employees
 * Create a new employee (Admin only)
 */
router.post('/', authenticate, requireRole(['Admin']), createEmployeeValidation, employeeController.createEmployeeController);

/**
 * GET /api/employees/statistics
 * Get employee statistics for dashboard
 */
router.get('/statistics', authenticate, employeeController.getEmployeeStatisticsController);

/**
 * GET /api/employees/enum-values
 * Get enum values for employee forms
 */
router.get('/enum-values', authenticate, employeeController.getEnumValuesController);

/**
 * GET /api/employees/filter-options
 * Get filter options for employee lists
 */
router.get('/filter-options', authenticate, employeeController.getFilterOptionsController);

/**
 * GET /api/employees/check-username
 * Check if username is available
 */
router.get('/check-username', authenticate, employeeController.checkUsernameAvailabilityController);

/**
 * GET /api/employees/check-employee-id
 * Check if employee ID is available
 */
router.get('/check-employee-id', authenticate, employeeController.checkEmployeeIdAvailabilityController);

/**
 * GET /api/employees/campus/:campusId
 * Get employees by campus
 */
router.get('/campus/:campusId', authenticate, employeeController.getEmployeesByCampusController);

/**
 * GET /api/employees/department/:department
 * Get employees by department
 */
router.get('/department/:department', authenticate, employeeController.getEmployeesByDepartmentController);

/**
 * GET /api/employees/username/:username
 * Get employee by username
 */
router.get('/username/:username', authenticate, usernameParamValidation, employeeController.getEmployeeByUsernameController);

/**
 * GET /api/employees/employee-id/:employeeId
 * Get employee by employee ID
 */
router.get('/employee-id/:employeeId', authenticate, employeeIdParamValidation, employeeController.getEmployeeByEmployeeIdController);

/**
 * GET /api/employees/employment/:employmentId
 * Get employee by employment ID (alias for employee-id)
 */
router.get('/employment/:employmentId', authenticate, employmentIdParamValidation, employeeController.getEmployeeByEmployeeIdController);

/**
 * GET /api/employees/username/:username/edit
 * Get complete employee data for editing (Admin only)
 */
router.get('/username/:username/edit', authenticate, requireRole(['Admin']), usernameParamValidation, employeeController.getCompleteEmployeeForEditController);

/**
 * PUT /api/employees/:username
 * Update employee information (Admin only)
 */
router.put('/:username', authenticate, requireRole(['Admin']), usernameParamValidation, updateEmployeeValidation, employeeController.updateEmployeeController);

/**
 * PUT /api/employees/username/:username
 * Update employee by username (Admin only) - alternative route
 */
router.put('/username/:username', authenticate, requireRole(['Admin']), usernameParamValidation, updateEmployeeValidation, employeeController.updateEmployeeController);



/**
 * DELETE /api/employees/:username
 * Delete employee (Admin only)
 */
router.delete('/:username', authenticate, requireRole(['Admin']), usernameParamValidation, employeeController.deleteEmployeeController);

/**
 * DELETE /api/employees/username/:username
 * Delete employee by username (Admin only) - alternative route
 */
router.delete('/username/:username', authenticate, requireRole(['Admin']), usernameParamValidation, employeeController.deleteEmployeeController);

module.exports = router;
