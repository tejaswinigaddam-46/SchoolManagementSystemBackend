const { getUserProfile, setUserStatus, editUser,createUserWithContext, searchUsers, searchTeachers, searchStudents, searchStudentsByClass, getDistinctRoles } = require('../services/user.service');
const { validationResult } = require('express-validator');
const { createUserValidationRules } = require('../validators/user.validator');

/**
 * Controller to handle user creation.
 */
async function createUserController(req, res, client = null) {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const userDetails = req.body;
        const context = req.user; // Assuming req.user contains tenant_id and campus_id

        if (!context || !context.tenant_id || !context.campus_id) {
            console.error('Invalid user context:', context);
            console.error('Request body:', req.user);
            return res.status(400).json({ error: 'Invalid user context. Tenant ID and Campus ID are required.' });
        }

        const newUser = await createUserWithContext(userDetails, context, client);
        res.status(201).json(newUser);
    } catch (error) {
        console.error('Error in createUserController:', error);
        res.status(500).json({ error: 'Failed to create user. Please try again later.' });
    }
}


/**
 * Controller to handle updating a user.
 */
async function updateUserController(req, res) {
    try {
        const userId = req.params.id;
        const userDetails = req.body;
        const updatedUser = await editUser(userId, userDetails);
        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found.' });
        }
        res.status(200).json(updatedUser);
    } catch (error) {
        console.error('Error in updateUserController:', error);
        res.status(500).json({ error: 'Failed to update user. Please try again later.' });
    }
}

/**
 * Controller to handle updating a user's status.
 */
async function updateUserStatus(req, res) {
    try {
        const username = req.params.username;
        const campusId = req.user.campus_id;
        const status = req.body.status;
        const updated = await setUserStatus(username, campusId, status);

        if (!updated) {
            return res.status(404).json({ error: 'User status not found.' });
        }

        res.status(200).json({ message: 'User status updated successfully.' });
    } catch (error) {           
        console.error('Error in updateUserStatus:', error);
        res.status(500).json({ error: 'Failed to update user status. Please try again later.' });
    }
}
    
/**
 * Get current user profile
 * GET /api/auth/profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getProfile(req, res) {
    try {
        const username = req.user?.username;
        const tenantId = req.user?.tenantId;
        //const campusId = req.user?.campus_id;
        
        console.log(req.user);
        
        if (!username || !tenantId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const profile = await getUserProfile(username, tenantId);
        
        res.status(200).json({
            success: true,
            data: profile
        });
    } catch (error) {
        console.error('Error in getProfile controller:', error);
        
        if (error.message.includes('not found') || error.message.includes('not a member')) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching profile'
        });
    }
};

/**
 * Controller to search users by name and role
 */
async function searchUsersController(req, res) {
    try {
        const { search, role } = req.query;
        const tenantId = req.user?.tenant_id;
        const campusId = req.user?.campus_id;

        if (!search) {
            return res.status(400).json({ error: 'Search term is required' });
        }

        const users = await searchUsers(search, role, tenantId, campusId);
        res.status(200).json({
            success: true,
            data: users
        });
    } catch (error) {
        console.error('Error in searchUsersController:', error);
        res.status(500).json({ error: 'Failed to search users' });
    }
}

/**
 * Controller to search teachers with academic filters
 */
async function searchTeachersController(req, res) {
    try {
        const { search, academicYearId, campusId, classId, curriculumId } = req.query;
        const tenantId = req.user?.tenant_id;
        const userCampusId = req.user?.campus_id;

        if (!search) {
            return res.status(400).json({ error: 'Search term is required' });
        }

        const filters = {
            academicYearId,
            campusId: campusId || userCampusId,
            classId,
            curriculumId
        };

        const teachers = await searchTeachers(search, filters, tenantId);
        res.status(200).json({
            success: true,
            data: teachers
        });
    } catch (error) {
        console.error('Error in searchTeachersController:', error);
        res.status(500).json({ error: 'Failed to search teachers' });
    }
}

/**
 * Controller to search students with academic filters
 */
async function searchStudentsController(req, res) {
    try {
        const { search, academicYearId, campusId, classId, curriculumId } = req.query;
        const tenantId = req.user?.tenant_id;
        const userCampusId = req.user?.campus_id;

        console.log('🔍 Student search request:', {
            search,
            academicYearId,
            campusId,
            classId,
            curriculumId,
            tenantId,
            userCampusId
        });

        if (!search) {
            return res.status(400).json({ error: 'Search term is required' });
        }

        const filters = {
            academicYearId,
            campusId: campusId || userCampusId,
            classId,
            curriculumId
        };

        console.log('📋 Filters being passed to service:', filters);

        const students = await searchStudents(search, filters, tenantId);
        
        console.log('✅ Student search results:', {
            count: students.length,
            students: students.slice(0, 3) // Log first 3 results for debugging
        });

        res.status(200).json({
            success: true,
            data: students
        });
    } catch (error) {
        console.error('❌ Error in searchStudentsController:', error);
        res.status(500).json({ error: 'Failed to search students' });
    }
}

/**
 * Controller to search students by class - alias for searchStudentsController (for frontend compatibility)
 */
async function searchStudentsByClassController(req, res) {
    try {
        const { search, academicYearId, campusId, classId, curriculumId } = req.query;
        const tenantId = req.user?.tenant_id;
        const userCampusId = req.user?.campus_id;

        console.log('🔍 Student search by class request:', {
            search,
            academicYearId,
            campusId,
            classId,
            curriculumId,
            tenantId,
            userCampusId
        });

        if (!search) {
            return res.status(400).json({ error: 'Search term is required' });
        }

        const filters = {
            academicYearId,
            campusId: campusId || userCampusId,
            classId,
            curriculumId
        };

        console.log('📋 Filters being passed to searchStudentsByClass service:', filters);

        const students = await searchStudentsByClass(search, filters, tenantId);
        
        console.log('✅ Student search by class results:', {
            count: students.length,
            students: students.slice(0, 3) // Log first 3 results for debugging
        });

        res.status(200).json({
            success: true,
            data: students
        });
    } catch (error) {
        console.error('❌ Error in searchStudentsByClassController:', error);
        res.status(500).json({ error: 'Failed to search students by class' });
    }
}

/**
 * Controller to get distinct user roles
 */
async function getDistinctRolesController(req, res) {
    try {
        const tenantId = req.user?.tenant_id || req.user?.tenantId || req.tenantId;
        const campusId = req.user?.campus_id || req.user?.campusId || req.campusId; // Get campusId from user context
        
        const roles = await getDistinctRoles(tenantId, campusId);
        
        res.status(200).json({
            success: true,
            data: roles
        });
    } catch (error) {
        console.error('Error in getDistinctRolesController:', error);
        res.status(500).json({ error: 'Failed to fetch user roles' });
    }
}

/**
 * Controller to get users for attendance
 */
async function getUsersForAttendanceController(req, res) {
    try {
        const tenantId = req.user?.tenant_id;
        const campusId = req.user?.campus_id;
        const { roles, academicYear } = req.body; // Expect POST body

        if (!roles || !Array.isArray(roles) || roles.length === 0) {
            return res.status(400).json({ error: 'Roles are required and must be an array' });
        }

        const users = await require('../services/user.service').getUsersForAttendance(campusId, roles, academicYear, tenantId);
        
        res.status(200).json({
            success: true,
            data: users
        });
    } catch (error) {
        console.error('Error in getUsersForAttendanceController:', error);
        res.status(500).json({ error: 'Failed to fetch users for attendance' });
    }
}

/**
 * Controller to get active users filtered by roles for a campus
 */
async function getActiveUsersOfRolesController(req, res) {
    try {
        const tenantId = req.user?.tenant_id || req.user?.tenantId || req.tenantId;
        const campusId = req.user?.campus_id || req.user?.campusId || req.campusId;
        const { roles, attendanceDate, academicYear, classId, sectionId } = req.body;

        if (!roles || !Array.isArray(roles) || roles.length === 0) {
            return res.status(400).json({ error: 'Roles are required and must be an array' });
        }

        let users;
        if (attendanceDate) {
            // For view/edit mode on a specific date
            // If fetching students, we might want to sync from event_attendance first
            const isStudent = roles && roles.some(r => r.toLowerCase() === 'student');
            
            // If student and single date, we should probably sync for that date first?
            // Actually getActiveUsersOfRolesWithAttendance just joins user_attendance.
            // But for students, user_attendance is derived from event_attendance.
            // So we should ensure it's up to date.
            
            if (isStudent && attendanceDate) {
                 // Trigger a sync for this date
                 // We can use the service method for daily attendance which does the sync
                 // But wait, getActiveUsersOfRolesWithAttendance returns users even if they don't have attendance records (LEFT JOIN)
                 // And we want that behavior for "Taking Attendance".
                 
                 // However, for Students, "Taking Attendance" means viewing the aggregated event attendance.
                 // So we should sync first.
                 
                 const AttendanceModel = require('../models/attendance.model');
                 const { pool } = require('../config/database');
                 const client = await pool.connect();
                 try {
                     await AttendanceModel.syncStudentAttendanceInRange(client, campusId, attendanceDate, attendanceDate, academicYear);
                 } catch (e) {
                     console.error('Error syncing student attendance before fetch:', e);
                 } finally {
                     client.release();
                 }
            }

            users = await require('../services/user.service').getActiveUsersOfRolesWithAttendance(
                campusId,
                roles,
                tenantId,
                attendanceDate,
                academicYear,
                classId,
                sectionId
            );
        } else {
            users = await require('../services/user.service').getActiveUsersOfRoles(campusId, roles, tenantId);
        }
        res.status(200).json({
            success: true,
            data: users
        });
    } catch (error) {
        console.error('Error in getActiveUsersOfRolesController:', error);
        res.status(500).json({ error: 'Failed to fetch active users' });
    }
}

async function saveUserAttendanceController(req, res) {
    try {
        const tenantId = req.user?.tenant_id || req.user?.tenantId || req.tenantId;
        const campusId = req.user?.campus_id || req.user?.campusId || req.campusId;
        const { attendanceDate, academicYear, attendanceData } = req.body;
        if (!attendanceDate || !academicYear || !attendanceData || !Array.isArray(attendanceData)) {
            return res.status(400).json({ error: 'Missing or invalid parameters' });
        }
        const result = await require('../services/user.service').saveUserAttendance(campusId, tenantId, attendanceDate, academicYear, attendanceData);
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error in saveUserAttendanceController:', error);
        res.status(500).json({ error: 'Failed to save attendance' });
    }
}


async function getDailyAttendanceController(req, res) {
    try {
        const tenantId = req.user?.tenant_id || req.user?.tenantId || req.tenantId;
        const campusId = req.user?.campus_id || req.user?.campusId || req.campusId;
        const { roles, academicYear, fromDate, toDate, classId, sectionId } = req.body;
        
        console.log('DailyAttendanceController Request', {
            campusId,
            roles,
            academicYear,
            fromDate,
            toDate
        });

        if (!fromDate || !toDate) {
            return res.status(400).json({ error: 'fromDate and toDate are required' });
        }

        const result = await require('../services/user.service').getDailyAttendance(
            campusId,
            roles || [],
            academicYear || null,
            fromDate,
            toDate,
            tenantId,
            classId,
            sectionId
        );

        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error in getDailyAttendanceController:', error);
        return res.status(500).json({ error: 'Failed to get daily attendance', details: error.message });
    }
}

module.exports = {
    createUserController,
    updateUserStatus,
    updateUserController,
    getProfile,
    searchUsersController,
    searchTeachersController,
    searchStudentsController,
    searchStudentsByClassController,
    getDistinctRolesController,
    getUsersForAttendanceController,
    getActiveUsersOfRolesController,
    getDailyAttendanceController,
    saveUserAttendanceController
};
