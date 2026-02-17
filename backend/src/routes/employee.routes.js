const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employee.controller');
const employeeBulkImportController = require('../controllers/employeeBulkImport.controller');
const upload = require('../middleware/upload.middleware');
const employeeExportController = require('../controllers/employeeExport.controller');
const employeeBulkUpdateController = require('../controllers/employeeBulkUpdate.controller');
const { authenticate, requirePermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');
const { 
    createEmployeeValidation, 
    updateEmployeeValidation,
    usernameParamValidation,
    employeeIdParamValidation,
    employmentIdParamValidation
} = require('../validators/employee.validator');

// ==================== EMPLOYEE ROUTES ====================

router.get(
  '/import/template',
  authenticate,
  requirePermission(PERMISSIONS.EMPLOYEE_IMPORT_TEMPLATE_READ),
  employeeBulkImportController.downloadTemplate
);

router.post(
  '/import',
  authenticate,
  requirePermission(PERMISSIONS.EMPLOYEE_IMPORT_CREATE),
  upload.single('file'),
  employeeBulkImportController.uploadEmployees
);

router.post(
  '/export',
  authenticate,
  requirePermission(PERMISSIONS.EMPLOYEE_EXPORT_CREATE),
  employeeExportController.exportEmployees
);

router.post(
  '/bulk-update',
  authenticate,
  requirePermission(PERMISSIONS.EMPLOYEE_BULK_UPDATE_CREATE),
  upload.single('file'),
  employeeBulkUpdateController.bulkUpdateEmployees
);

/**
 * GET /api/employees
 * Get all employees with pagination and filtering
 */
router.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.EMPLOYEE_LIST_READ),
  employeeController.getAllEmployeesController
);

router.post(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.EMPLOYEE_CREATE_ROUTE_CREATE),
  createEmployeeValidation,
  employeeController.createEmployeeController
);

/**
 * GET /api/employees/statistics
 * Get employee statistics for dashboard
 */
router.get(
  '/statistics',
  authenticate,
  requirePermission(PERMISSIONS.EMPLOYEE_STATISTICS_READ),
  employeeController.getEmployeeStatisticsController
);

/**
 * GET /api/employees/enum-values
 * Get enum values for employee forms
 */
router.get(
  '/enum-values',
  authenticate,
  requirePermission(PERMISSIONS.EMPLOYEE_ENUM_VALUES_READ),
  employeeController.getEnumValuesController
);

/**
 * GET /api/employees/filter-options
 * Get filter options for employee lists
 */
router.get(
  '/filter-options',
  authenticate,
  requirePermission(PERMISSIONS.EMPLOYEE_FILTER_OPTIONS_READ),
  employeeController.getFilterOptionsController
);

/**
 * GET /api/employees/check-username
 * Check if username is available
 */
router.get(
  '/check-username',
  authenticate,
  requirePermission(PERMISSIONS.EMPLOYEE_CHECK_USERNAME_READ),
  employeeController.checkUsernameAvailabilityController
);

/**
 * GET /api/employees/check-employee-id
 * Check if employee ID is available
 */
router.get(
  '/check-employee-id',
  authenticate,
  requirePermission(PERMISSIONS.EMPLOYEE_CHECK_EMPLOYEE_ID_READ),
  employeeController.checkEmployeeIdAvailabilityController
);

/**
 * GET /api/employees/campus/:campusId
 * Get employees by campus
 */
router.get(
  '/campus/:campusId',
  authenticate,
  requirePermission(PERMISSIONS.EMPLOYEE_BY_CAMPUS_READ),
  employeeController.getEmployeesByCampusController
);

/**
 * GET /api/employees/department/:department
 * Get employees by department
 */
router.get(
  '/department/:department',
  authenticate,
  requirePermission(PERMISSIONS.EMPLOYEE_BY_DEPARTMENT_READ),
  employeeController.getEmployeesByDepartmentController
);

/**
 * GET /api/employees/username/:username
 * Get employee by username
 */
router.get(
  '/username/:username',
  authenticate,
  requirePermission(PERMISSIONS.EMPLOYEE_BY_USERNAME_READ),
  usernameParamValidation,
  employeeController.getEmployeeByUsernameController
);

/**
 * GET /api/employees/employee-id/:employeeId
 * Get employee by employee ID
 */
router.get(
  '/employee-id/:employeeId',
  authenticate,
  requirePermission(PERMISSIONS.EMPLOYEE_BY_EMPLOYEE_ID_READ),
  employeeIdParamValidation,
  employeeController.getEmployeeByEmployeeIdController
);

/**
 * GET /api/employees/employment/:employmentId
 * Get employee by employment ID (alias for employee-id)
 */
router.get(
  '/employment/:employmentId',
  authenticate,
  requirePermission(PERMISSIONS.EMPLOYEE_BY_EMPLOYMENT_ID_READ),
  employmentIdParamValidation,
  employeeController.getEmployeeByEmployeeIdController
);

router.get(
  '/username/:username/edit',
  authenticate,
  requirePermission(PERMISSIONS.EMPLOYEE_FOR_EDIT_READ),
  usernameParamValidation,
  employeeController.getCompleteEmployeeForEditController
);

router.put(
  '/:username',
  authenticate,
  requirePermission(PERMISSIONS.EMPLOYEE_EDIT_PRIMARY_EDIT),
  usernameParamValidation,
  updateEmployeeValidation,
  employeeController.updateEmployeeController
);

router.put(
  '/username/:username',
  authenticate,
  requirePermission(PERMISSIONS.EMPLOYEE_EDIT_USERNAME_EDIT),
  usernameParamValidation,
  updateEmployeeValidation,
  employeeController.updateEmployeeController
);

router.delete(
  '/:username',
  authenticate,
  requirePermission(PERMISSIONS.EMPLOYEE_DELETE_ROUTE_DELETE),
  usernameParamValidation,
  employeeController.deleteEmployeeController
);

router.delete(
  '/username/:username',
  authenticate,
  requirePermission(PERMISSIONS.EMPLOYEE_DELETE_USERNAME_ROUTE_DELETE),
  usernameParamValidation,
  employeeController.deleteEmployeeController
);

module.exports = router;
