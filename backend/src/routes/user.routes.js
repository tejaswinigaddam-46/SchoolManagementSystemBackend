const express = require('express');
const { createUserController, updateUserStatus, updateUserController, searchUsersController, searchTeachersController, searchStudentsController, searchStudentsByClassController, getDistinctRolesController, getUsersForAttendanceController, getActiveUsersOfRolesController } = require('../controllers/user.controller');
const { authenticate, requirePermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');

const router = express.Router();

// Get distinct roles
router.get(
  '/roles',
  authenticate,
  requirePermission(PERMISSIONS.USER_ROLES_READ),
  getDistinctRolesController
);

// Get users for attendance
router.post(
  '/attendance-search',
  authenticate,
  requirePermission(PERMISSIONS.USER_ATTENDANCE_SEARCH_CREATE),
  getUsersForAttendanceController
);

// Get active users filtered by roles
router.post(
  '/active-by-roles',
  authenticate,
  requirePermission(PERMISSIONS.USER_ACTIVE_BY_ROLES_CREATE),
  getActiveUsersOfRolesController
);

router.post(
  '/attendance/save',
  authenticate,
  requirePermission(PERMISSIONS.USER_ATTENDANCE_SAVE_CREATE),
  require('../controllers/user.controller').saveUserAttendanceController
);

router.post(
  '/attendance/daily',
  authenticate,
  requirePermission(PERMISSIONS.USER_ATTENDANCE_DAILY_CREATE),
  require('../controllers/user.controller').getDailyAttendanceController
);

router.post(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.USER_CREATE_ROUTE_CREATE),
  createUserController
);

router.put(
  '/:id/status',
  authenticate,
  requirePermission(PERMISSIONS.USER_STATUS_EDIT),
  updateUserStatus
);

router.put(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.USER_EDIT),
  updateUserController
);

// Search routes
router.get(
  '/search',
  authenticate,
  requirePermission(PERMISSIONS.USER_SEARCH_READ),
  searchUsersController
);
router.get(
  '/teachers/search',
  authenticate,
  requirePermission(PERMISSIONS.USER_TEACHERS_SEARCH_READ),
  searchTeachersController
);
router.get(
  '/students/search',
  authenticate,
  requirePermission(PERMISSIONS.USER_STUDENTS_SEARCH_READ),
  searchStudentsController
);
router.get(
  '/students/search-by-class',
  authenticate,
  requirePermission(PERMISSIONS.USER_STUDENTS_BY_CLASS_SEARCH_READ),
  searchStudentsByClassController
);

module.exports = router;
