const express = require('express');
const { createUserController, updateUserStatus, updateUserController, searchUsersController, searchTeachersController, searchStudentsController, searchStudentsByClassController, getDistinctRolesController, getUsersForAttendanceController, getActiveUsersOfRolesController } = require('../controllers/user.controller');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get distinct roles
router.get('/roles', authenticate, getDistinctRolesController);

// Get users for attendance
router.post('/attendance-search', authenticate, getUsersForAttendanceController);

// Get active users filtered by roles
router.post('/active-by-roles', authenticate, getActiveUsersOfRolesController);

router.post('/attendance/save', authenticate, require('../controllers/user.controller').saveUserAttendanceController);

// Daily attendance records over date range
router.post('/attendance/daily', authenticate, requireRole(['Admin']), require('../controllers/user.controller').getDailyAttendanceController);

// Route to create a new user
router.post('/', authenticate, requireRole(['Admin']), createUserController);

// Route to update a user status
router.put('/:id/status', authenticate, requireRole(['Admin']), updateUserStatus);

// Route to update a user
router.put('/:id', authenticate, requireRole(['Admin']), updateUserController);

// Search routes
router.get('/search', authenticate, searchUsersController);
router.get('/teachers/search', authenticate, searchTeachersController);
router.get('/students/search', authenticate, searchStudentsController);
router.get('/students/search-by-class', authenticate, searchStudentsByClassController);

module.exports = router;
