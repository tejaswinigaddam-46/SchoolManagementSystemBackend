const express = require('express');
const { createUserController, updateUserStatus, updateUserController, searchUsersController, searchTeachersController, searchStudentsController, searchStudentsByClassController, getDistinctRolesController, getUsersForAttendanceController, getActiveUsersOfRolesController, getDailyAttendanceController, saveUserAttendanceController } = require('../controllers/user.controller');
const { authenticate, requirePermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');
const validate = require('../middleware/validation');
const userSchema = require('../schemas/user.schema');

const router = express.Router();

// Get distinct roles
router.get(
  '/roles',
  authenticate,
  requirePermission(PERMISSIONS.USER_ROLES_READ),
  validate(userSchema.getDistinctRolesController),
  getDistinctRolesController
);

// Get users for attendance
router.post(
  '/attendance-search',
  authenticate,
  requirePermission(PERMISSIONS.USER_ATTENDANCE_SEARCH_CREATE),
  validate(userSchema.getUsersForAttendanceController),
  getUsersForAttendanceController
);

// Get active users filtered by roles
router.post(
  '/active-by-roles',
  authenticate,
  requirePermission(PERMISSIONS.USER_ACTIVE_BY_ROLES_CREATE),
  validate(userSchema.getActiveUsersOfRolesController),
  getActiveUsersOfRolesController
);

router.post(
  '/attendance/save',
  authenticate,
  requirePermission(PERMISSIONS.USER_ATTENDANCE_SAVE_CREATE),
  validate(userSchema.saveUserAttendanceController),
  saveUserAttendanceController
);

router.post(
  '/attendance/daily',
  authenticate,
  requirePermission(PERMISSIONS.USER_ATTENDANCE_DAILY_CREATE),
  validate(userSchema.getDailyAttendanceController),
  getDailyAttendanceController
);

router.post(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.USER_CREATE_ROUTE_CREATE),
  validate(userSchema.createUserController),
  createUserController
);

router.put(
  '/:id/status',
  authenticate,
  requirePermission(PERMISSIONS.USER_STATUS_EDIT),
  validate(userSchema.updateUserStatus),
  updateUserStatus
);

router.put(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.USER_EDIT),
  validate(userSchema.updateUserController),
  updateUserController
);

// Search routes
router.get(
  '/search',
  authenticate,
  requirePermission(PERMISSIONS.USER_SEARCH_READ),
  validate(userSchema.searchUsersController),
  searchUsersController
);
router.get(
  '/teachers/search',
  authenticate,
  requirePermission(PERMISSIONS.USER_TEACHERS_SEARCH_READ),
  validate(userSchema.searchTeachersController),
  searchTeachersController
);
router.get(
  '/students/search',
  authenticate,
  requirePermission(PERMISSIONS.USER_STUDENTS_SEARCH_READ),
  validate(userSchema.searchStudentsController),
  searchStudentsController
);
router.get(
  '/students/search-by-class',
  authenticate,
  requirePermission(PERMISSIONS.USER_STUDENTS_BY_CLASS_SEARCH_READ),
  validate(userSchema.searchStudentsByClassController),
  searchStudentsByClassController
);

module.exports = router;
