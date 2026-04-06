const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employee.controller');
const employeeBulkOperationController = require('../controllers/employeeBulkOperation.controller');
const upload = require('../middleware/upload.middleware');
const { authenticate, requirePermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');
const validate = require('../middleware/validation');
const employeeBulkOperationSchema = require('../schemas/employeeBulkOperation.schema');
const employeeSchema = require('../schemas/employee.schema');

// ==================== EMPLOYEE ROUTES ====================

router.get(
  '/import/template',
  authenticate,
  requirePermission(PERMISSIONS.EMPLOYEE_IMPORT_TEMPLATE_READ),
  employeeBulkOperationController.downloadTemplate
);

router.post(
  '/import',
  authenticate,
  requirePermission(PERMISSIONS.EMPLOYEE_IMPORT_CREATE),
  upload.single('file'),
  validate(employeeBulkOperationSchema.uploadEmployees),
  employeeBulkOperationController.uploadEmployees
);

router.post(
  '/export',
  authenticate,
  requirePermission(PERMISSIONS.EMPLOYEE_EXPORT_CREATE),
  validate(employeeBulkOperationSchema.exportEmployees),
  employeeBulkOperationController.exportEmployees
);

router.post(
  '/bulk-update',
  authenticate,
  requirePermission(PERMISSIONS.EMPLOYEE_BULK_UPDATE_CREATE),
  upload.single('file'),
  validate(employeeBulkOperationSchema.updateEmployees),
  employeeBulkOperationController.bulkUpdateEmployees
);

/**
 * GET /api/employees
 * Get all employees with pagination and filtering
 */
router.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.EMPLOYEE_LIST_READ),
  validate(employeeSchema.getAllEmployees),
  employeeController.getAllEmployeesController
);

router.post(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.EMPLOYEE_CREATE_ROUTE_CREATE),
  validate(employeeSchema.createEmployee),
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
  validate(employeeSchema.getEmployeeStatistics),
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
  validate(employeeSchema.getEnumValues),
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
  validate(employeeSchema.getFilterOptions),
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
  validate(employeeSchema.checkUsernameAvailability),
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
  validate(employeeSchema.checkEmployeeIdAvailability),
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
  validate(employeeSchema.getEmployeesByCampus),
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
  validate(employeeSchema.getEmployeesByDepartment),
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
  validate(employeeSchema.getEmployeeByUsername),
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
  validate(employeeSchema.getEmployeeByEmployeeId),
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
  validate(employeeSchema.getEmployeeByEmploymentId),
  employeeController.getEmployeeByEmployeeIdController
);

router.get(
  '/username/:username/edit',
  authenticate,
  requirePermission(PERMISSIONS.EMPLOYEE_FOR_EDIT_READ),
  validate(employeeSchema.getEmployeeForEdit),
  employeeController.getCompleteEmployeeForEditController
);

router.put(
  '/:username',
  authenticate,
  requirePermission(PERMISSIONS.EMPLOYEE_EDIT_PRIMARY_EDIT),
  validate(employeeSchema.updateEmployee),
  employeeController.updateEmployeeController
);

router.put(
  '/username/:username',
  authenticate,
  requirePermission(PERMISSIONS.EMPLOYEE_EDIT_USERNAME_EDIT),
  validate(employeeSchema.updateEmployee),
  employeeController.updateEmployeeController
);

router.delete(
  '/:username',
  authenticate,
  requirePermission(PERMISSIONS.EMPLOYEE_DELETE_ROUTE_DELETE),
  validate(employeeSchema.deleteEmployee),
  employeeController.deleteEmployeeController
);

router.delete(
  '/username/:username',
  authenticate,
  requirePermission(PERMISSIONS.EMPLOYEE_DELETE_USERNAME_ROUTE_DELETE),
  validate(employeeSchema.deleteEmployee),
  employeeController.deleteEmployeeController
);

module.exports = router;
