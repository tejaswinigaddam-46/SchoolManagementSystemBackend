const bcrypt = require('bcrypt');
const { pool } = require('../config/database');
const UserModel = require('../models/user.model');
const AttendanceModel = require('../models/attendance.model');
const StudentModel = require('../models/student.model');
const EmployeeModel = require('../models/employee.model');
const logger = require('../utils/logger');

/**
 * Generates a unique alphanumeric ID of 7 characters.
 */
function generateUniqueId() {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let uniqueId = '';
    for (let i = 0; i < 7; i++) {
        uniqueId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return uniqueId;
}

/**
 * Creates a new user in the database.
 * @param {Object} userDetails - The user details.
 * @param {Object} context - The global context containing tenant_id and campus_id.
 * @param {Object} [client=null] - The optional database client for transaction integrity.
 */
async function createUser(userDetails, context, client = null) {
    logger.info('createUser method called', { 
        method: 'createUser',
        parameters: { userDetails: { ...userDetails, password: '[REDACTED]' }, context },
        hasClient: !!client 
    });
    
    const localClient = client || await pool.connect();
    try {
        const { role, first_name, middle_name, last_name, phone_number, date_of_birth } = userDetails;
        
        // Generate a unique username
        let uniqueId;
        let username;
        let isUnique = false;

        while (!isUnique) {
            uniqueId = generateUniqueId();
            username = `${role.substring(0, 2).toLowerCase()}-${uniqueId}`;

            // Check if the username already exists
            const existingUser = await UserModel.findByUsername(username, localClient);
            if (!existingUser) {
                isUnique = true;
            }
        }
        const contextTenantId = context.tenant_id;
        const contextCampusId = context.campus_id;
        // Set default password as DOB in YYYYMMDD format and hash it
        const defaultPassword = date_of_birth.replace(/-/g, '');
        const passwordHash = await bcrypt.hash(defaultPassword, 10);

        // Create the user in the database
        const user = {
            username,
            first_name,
            middle_name,
            last_name,
            phone_number,
            password_hash: passwordHash,
            date_of_birth,
            role,
            contextTenantId
        };

        const newUser = await UserModel.create(user, contextTenantId, localClient);

        // Insert into user_statuses table
       await UserModel.createUserStatus(username, contextCampusId, contextTenantId, localClient);

        logger.info('createUser method completed successfully', {
            method: 'createUser',
            response: { username: newUser.username, userId: newUser.user_id },
            tenantId: contextTenantId,
            campusId: contextCampusId
        });
        
        return newUser;
    } catch (error) {
        logger.error('Error in createUser method', {
            method: 'createUser',
            error: error.message,
            parameters: { userDetails: { ...userDetails, password: '[REDACTED]' }, context }
        });
        console.error('Error creating user:', error);
        throw new Error('Failed to create user. Please try again later.');
    } finally {
        if (!client) {
            localClient.release();
        }
    }
}

/**
 * Service to create a user with validation and context.
 * @param {Object} userDetails - The user details.
 * @param {Object} context - The global context containing tenant_id and campus_id.
 * @param {Object} [client=null] - The optional database client for transaction integrity.
 * @returns {Promise<Object>} The created user.
 */
async function createUserWithContext(userDetails, context, client = null) {
    logger.info('createUserWithContext method called', {
        method: 'createUserWithContext',
        parameters: { userDetails: { ...userDetails, password: '[REDACTED]' }, context },
        hasClient: !!client
    });
    
    if (!context || !context.tenant_id || !context.campus_id) {
        logger.error('Invalid context in createUserWithContext', {
            method: 'createUserWithContext',
            error: 'Invalid user context. Tenant ID and Campus ID are required.',
            context
        });
        throw new Error('Invalid user context. Tenant ID and Campus ID are required.');
    }

    const result = await createUser(userDetails, context, client);
    
    logger.info('createUserWithContext method completed successfully', {
        method: 'createUserWithContext',
        response: { username: result.username, userId: result.user_id }
    });
    
    return result;
}

/**
 * Sets the status of a user.
 * @param {string} username - The username of the user.
 * @param {string} campusId - The ID of the campus.
 * @param {string} status - The new status to set.
 */
async function setUserStatus(username, campusId, status) {
    logger.info('setUserStatus method called', {
        method: 'setUserStatus',
        parameters: { username, campusId, status }
    });
    
    try {
        await UserModel.setUserStatus(username, campusId, status);
        
        logger.info('setUserStatus method completed successfully', {
            method: 'setUserStatus',
            response: { success: true, username, campusId, status }
        });
    } catch (error) {
        logger.error('Error in setUserStatus method', {
            method: 'setUserStatus',
            error: error.message,
            parameters: { username, campusId, status }
        });
        console.error('Error setting user status:', error);
        throw new Error('Failed to set user status. Please try again later.');
    }
}

/**
 * Edits a user in the database.
 * @param {number} userId - The ID of the user.
 * @param {Object} updates - The fields to update.
 */
async function editUser(username, updates) {
    logger.info('editUser method called', {
        method: 'editUser',
        parameters: { username, updates: { ...updates, password: updates.password ? '[REDACTED]' : undefined } }
    });
    
    try {
        if (updates.password) {
            updates.password_hash = await bcrypt.hash(updates.password, 10);
            delete updates.password;
        }

        const editableFields = ['first_name', 'middle_name', 'last_name', 'phone_number', 'role', 'password_hash'];
        const filteredUpdates = Object.keys(updates)
            .filter((key) => editableFields.includes(key))
            .reduce((obj, key) => {
                obj[key] = updates[key];
                return obj;
            }, {});

        const result = await UserModel.editUser(username, filteredUpdates);
        
        logger.info('editUser method completed successfully', {
            method: 'editUser',
            response: { success: true, username, updatedFields: Object.keys(filteredUpdates) }
        });
        
        return result;
    } catch (error) {
        logger.error('Error in editUser method', {
            method: 'editUser',
            error: error.message,
            parameters: { username, updates: { ...updates, password: updates.password ? '[REDACTED]' : undefined } }
        });
        console.error('Error editing user:', error);
        throw new Error('Failed to edit user. Please try again later.');
    }
}

/**
 * Get user profile
 * @param {string} username - Username
 * @param {string} tenantId - Tenant's ID
 * @returns {Promise<Object>} User profile with membership info
 * @throws {Error} If user not found or not member of tenant
 */
async function getUserProfile(username, tenantId) {
    logger.info('getUserProfile method called', {
        method: 'getUserProfile',
        parameters: { username, tenantId }
    });
    
    if (!username) {
        logger.error('Username is required in getUserProfile', {
            method: 'getUserProfile',
            error: 'Username is required'
        });
        throw new Error('Username is required');
    }
    
    if (!tenantId) {
        logger.error('Tenant ID is required in getUserProfile', {
            method: 'getUserProfile',
            error: 'Tenant ID is required'
        });
        throw new Error('Tenant ID is required');
    }
    
    try {
        // Get user basic info
        const user = await UserModel.findByUsername(username);
        if (!user) {
            logger.error('User not found in getUserProfile', {
                method: 'getUserProfile',
                error: 'User not found',
                username
            });
            throw new Error('User not found');
        }

        const role = await UserModel.getUserRoleForTenant(user.username, tenantId);
        if (!role) {
            logger.error('No role found for user in getUserProfile', {
                method: 'getUserProfile', 
                error: 'No Role found for user',
                username
            });
            throw new Error('No Role found for user', username);
        }
        
        const tenantService = require('./tenant.service');
        const tenantDetails = await tenantService.getTenantById(tenantId);
        
        if (!tenantDetails) {
            logger.error('Tenant not found in getUserProfile', {
                method: 'getUserProfile',
                error: 'Tenant not found',
                tenantId
            });
            throw new Error('Tenant not found:', tenantId);
        }

        const campusId = await UserModel.getUserCampusId(user.username, tenantId);
        const campusService = require('./campus.service');
        const campusDetails = await campusService.getCampusById(campusId, tenantId);

        if (!campusDetails) {
            logger.error('No campus found for user in getUserProfile', {
                method: 'getUserProfile',
                error: 'No Campus found for user',
                username,
                campusId
            });
            throw new Error('No Campus found for user', username);
        }
        
        const result = {
            user: {
                user_id: user.user_id,
                username: user.username,
                first_name: user.first_name,
                middle_name: user.middle_name,
                last_name: user.last_name,
                phone_number: user.phone_number,
                created_at: user.created_at
            },
            tenant: {
                tenant_id: tenantDetails.tenant_id,
                tenant_name: tenantDetails.tenant_name,
                subdomain: tenantDetails.subdomain
            },
            role: role,
            campus:  {
                campus_id: campusDetails.campus_id,
                campus_name: campusDetails.campus_name,
                is_main_campus: campusDetails.is_main_campus
            } 
        };

        // Fetch additional role-specific details
        if (role === 'Student') {
            try {
                const studentDetails = await StudentModel.getCompleteStudentData(username, tenantId);
                if (studentDetails) {
                    result.student = {
                        admission_number: studentDetails.admission_number,
                        class_name: studentDetails.class_name,
                        section_id: studentDetails.section_id,
                        section_name: studentDetails.section_name,
                        roll_number: studentDetails.roll_number, // Note: This might be in enrollment or direct
                        parents: studentDetails.parents,
                        date_of_birth: studentDetails.date_of_birth,
                        gender: studentDetails.gender,
                        blood_group: studentDetails.blood_group,
                        current_address: studentDetails.current_address,
                        permanent_address: studentDetails.permanent_address,
                        email: studentDetails.email,
                        height_cm: studentDetails.height_cm,
                        weight_kg: studentDetails.weight_kg,
                        medical_conditions: studentDetails.medical_conditions,
                        allergies: studentDetails.allergies
                    };
                }
            } catch (err) {
                logger.warn('Failed to fetch student details', { username, error: err.message });
            }
        } else if (['Teacher', 'Employee', 'Admin'].includes(role)) {
            try {
                const employeeDetails = await EmployeeModel.findEmployeeByUsername(username, tenantId);
                if (employeeDetails) {
                    result.employee = {
                        employee_id: employeeDetails.employee_id,
                        department: employeeDetails.department,
                        designation: employeeDetails.designation,
                        salary: employeeDetails.salary,
                        joining_date: employeeDetails.joining_date,
                        employment_type: employeeDetails.employment_type,
                        date_of_birth: employeeDetails.date_of_birth,
                        gender: employeeDetails.gender,
                        blood_group: employeeDetails.blood_group,
                        current_address: employeeDetails.current_address,
                        permanent_address: employeeDetails.permanent_address,
                        email: employeeDetails.email,
                        marital_status: employeeDetails.marital_status, // If available
                        qualification: employeeDetails.qualification, // If available
                        height_cm: employeeDetails.height_cm,
                        weight_kg: employeeDetails.weight_kg,
                        medical_conditions: employeeDetails.medical_conditions,
                        allergies: employeeDetails.allergies
                    };
                }
            } catch (err) {
                logger.warn('Failed to fetch employee details', { username, error: err.message });
            }
        }
        
        logger.info('getUserProfile method completed successfully', {
            method: 'getUserProfile',
            response: { username: result.user.username, tenantId: result.tenant.tenant_id, role: result.role }
        });
        
        return result;
    } catch (error) {
        logger.error('Error in getUserProfile method', {
            method: 'getUserProfile',
            error: error.message,
            parameters: { username, tenantId }
        });
        throw error;
    }
};

/**
 * Search users by name and role
 * @param {string} searchTerm - Search term for user names
 * @param {string} role - Optional role filter
 * @param {string} tenantId - Tenant ID
 * @param {string} campusId - Campus ID
 * @returns {Promise<Array>} List of matching users
 */
async function searchUsers(searchTerm, role, tenantId, campusId) {
    logger.info('searchUsers method called', {
        method: 'searchUsers',
        parameters: { searchTerm, role, tenantId, campusId }
    });
    
    try {
        const users = await UserModel.searchUsers(searchTerm, role, tenantId, campusId);
        
        logger.info('searchUsers method completed successfully', {
            method: 'searchUsers',
            response: { count: users.length }
        });
        
        return users;
    } catch (error) {
        logger.error('Error in searchUsers method', {
            method: 'searchUsers',
            error: error.message,
            parameters: { searchTerm, role, tenantId, campusId }
        });
        throw new Error('Failed to search users. Please try again later.');
    }
}

/**
 * Search teachers with academic filters
 * @param {string} searchTerm - Search term for teacher names
 * @param {Object} filters - Academic filters (academicYearId, campusId, classId, curriculumId)
 * @param {string} tenantId - Tenant ID
 * @returns {Promise<Array>} List of matching teachers
 */
async function searchTeachers(searchTerm, filters, tenantId) {
    logger.info('searchTeachers method called', {
        method: 'searchTeachers',
        parameters: { searchTerm, filters, tenantId }
    });
    
    try {
        const teachers = await UserModel.searchTeachers(searchTerm, filters, tenantId);
        
        logger.info('searchTeachers method completed successfully', {
            method: 'searchTeachers',
            response: { count: teachers.length }
        });
        
        return teachers;
    } catch (error) {
        logger.error('Error in searchTeachers method', {
            method: 'searchTeachers',
            error: error.message,
            parameters: { searchTerm, filters, tenantId }
        });
        throw new Error('Failed to search teachers. Please try again later.');
    }
}

/**
 * Search students with academic filters
 * @param {string} searchTerm - Search term for student names
 * @param {Object} filters - Academic filters (academicYearId, campusId, classId, curriculumId)
 * @param {string} tenantId - Tenant ID
 * @returns {Promise<Array>} List of matching students
 */
async function searchStudents(searchTerm, filters, tenantId) {
    logger.info('searchStudents method called', {
        method: 'searchStudents',
        parameters: { searchTerm, filters, tenantId }
    });
    
    try {
        const students = await UserModel.searchStudents(searchTerm, filters, tenantId);
        
        logger.info('searchStudents method completed successfully', {
            method: 'searchStudents',
            response: { count: students.length }
        });
        
        return students;
    } catch (error) {
        logger.error('Error in searchStudents method', {
            method: 'searchStudents',
            error: error.message,
            parameters: { searchTerm, filters, tenantId }
        });
        throw new Error('Failed to search students. Please try again later.');
    }
}

/**
 * Search students by class - alias for searchStudents (for frontend compatibility)
 * @param {string} searchTerm - Search term for student names
 * @param {Object} filters - Academic filters (academicYearId, campusId, classId, curriculumId)
 * @param {string} tenantId - Tenant ID
 * @returns {Promise<Array>} List of matching students
 */
async function searchStudentsByClass(searchTerm, filters, tenantId) {
    return await searchStudents(searchTerm, filters, tenantId);
}

/**
 * Get distinct user roles for a tenant, optionally filtered by campus
 * @param {string} tenantId - Tenant ID
 * @param {string} campusId - Campus ID (optional)
 * @returns {Promise<Array>} List of distinct roles
 */
async function getDistinctRoles(tenantId, campusId) {
    try {
        const roles = await UserModel.getDistinctRoles(tenantId, campusId);
        return roles;
    } catch (error) {
        throw error;
    }
}

/**
 * Get users for attendance based on criteria
 * @param {string} campusId - Campus ID
 * @param {Array} roles - List of roles
 * @param {string} academicYear - Academic Year Name
 * @param {string} tenantId - Tenant ID
 * @returns {Promise<Array>} List of users
 */
async function getUsersForAttendance(campusId, roles, academicYear, tenantId) {
    try {
        const users = await UserModel.getUsersForAttendance(campusId, roles, academicYear, tenantId);
        return users;
    } catch (error) {
        throw error;
    }
}

async function getActiveUsersOfRoles(campusId, roles, tenantId) {
    try {
        const users = await UserModel.getActiveUsersOfRoles(campusId, roles, tenantId);
        return users;
    } catch (error) {
        throw error;
    }
}

async function getActiveUsersOfRolesWithAttendance(campusId, roles, tenantId, attendanceDate, yearName = null, classId = null, sectionId = null) {
    try {
        const users = await UserModel.getActiveUsersOfRolesWithAttendance(campusId, roles, tenantId, attendanceDate, yearName, classId, sectionId);
        return users;
    } catch (error) {
        throw error;
    }
}

async function saveUserAttendance(campusId, tenantId, attendanceDate, yearName, attendanceData) {
    try {
        const result = await UserModel.saveUserAttendance(attendanceDate, yearName, campusId, attendanceData);
        return result;
    } catch (error) {
        throw error;
    }
}

async function getDailyAttendance(campusId, roles, yearName, startDate, endDate, tenantId, classId = null, sectionId = null) {
    const client = await pool.connect();
    try {
        logger.info('Service.getDailyAttendance called', {
            campusId,
            roles,
            yearName,
            startDate,
            endDate,
            tenantId,
            classId,
            sectionId
        });

        // 1. Sync Student Attendance if needed
        const isStudent = roles && roles.some(r => r.toLowerCase() === 'student');
        if (isStudent) {
            await AttendanceModel.syncStudentAttendanceInRange(client, campusId, startDate, endDate, yearName);
        }

        // 2. Query Logic: Users x DateSeries LEFT JOIN UserAttendance
        const values = [campusId, startDate, endDate, tenantId]; // $1, $2, $3, $4
        let idx = 5;

        // Base Joins
        let userJoin = `
            JOIN user_statuses us ON u.username = us.username
            LEFT JOIN student_enrollment se ON u.username = se.username
            LEFT JOIN academic_years ay ON se.academic_year_id = ay.academic_year_id
            LEFT JOIN classes c ON se.class_name = c.class_name
        `;

        // Base Where - Step 1: Select all users of respective campusid and status as active
        let userWhere = "u.tenant_id = $4 AND us.campus_id = $1 AND us.status = 'active'";
        
        // Step 2: Filter role of selected roles
        if (roles && roles.length > 0) {
            userWhere += ` AND u.role = ANY($${idx})`;
            values.push(roles);
            idx++;
        }

        // Step 3 & 4: Student specific logic
        // If role is other than student, skip filters. 
        // If role is student, apply filters (year name, class, section).
        
        let studentFilters = [];

        // "fetch students whose year name from frontend matches with of year name from academic year id in student_enrollment"
        if (yearName) {
            studentFilters.push(`ay.year_name = $${idx}`);
            values.push(yearName);
            idx++;
        }
        
        // "fetch from student_enrollment table whose class and section matches (Incase of all skip)"
        if (classId) {
            studentFilters.push(`c.class_id = $${idx}`);
            values.push(classId);
            idx++;
        }

        if (sectionId) {
            studentFilters.push(`se.section_id = $${idx}`);
            values.push(sectionId);
            idx++;
        }

        // Apply filters only to Students. Non-students are always included if they match base criteria.
        if (studentFilters.length > 0) {
            userWhere += ` AND (u.role != 'Student' OR (${studentFilters.join(' AND ')}))`;
        }
        
        // Attendance Join Condition - Step 5
        let attendanceJoinCondition = `
            ua.username = u.username 
            AND ua.attendance_date = d.date 
            AND ua.campus_id = $1
        `;
        
        if (yearName) {
            attendanceJoinCondition += ` AND ua.year_name = $${idx}`;
            values.push(yearName);
            idx++;
        }

        const query = `
            WITH date_series AS (
                SELECT generate_series($2::date, $3::date, '1 day'::interval)::date AS date
            ),
            filtered_users AS (
                SELECT DISTINCT u.user_id, u.username, u.first_name, u.last_name, u.role
                FROM users u
                ${userJoin}
                WHERE ${userWhere}
            )
            SELECT 
                d.date as attendance_date,
                u.user_id,
                u.username,
                u.first_name,
                u.last_name,
                u.role,
                COALESCE(ua.status, 'No Attendance') as status,
                COALESCE(TO_CHAR(ua.duration, 'HH24:MI'), '00:00') as duration,
                COALESCE(TO_CHAR(ua.total_duration, 'HH24:MI'), '00:00') as total_duration,
                ua.login_time,
                ua.logout_time,
                EXTRACT(EPOCH FROM ua.duration) as duration_hours,
                EXTRACT(EPOCH FROM ua.total_duration) as total_duration_hours
            FROM filtered_users u
            CROSS JOIN date_series d
            LEFT JOIN user_attendance ua ON ${attendanceJoinCondition}
            ORDER BY d.date DESC, u.username
        `;

        const result = await client.query(query, values);
        return result.rows;
    } catch (error) {
        logger.error('Service.getDailyAttendance error', { error: error.message, stack: error.stack });
        throw error;
    } finally {
        client.release();
    }
}

module.exports = {
    createUser,
    createUserWithContext,
    setUserStatus,
    editUser,
    getUserProfile,
    searchUsers,
    searchTeachers,
    searchStudents,
    searchStudentsByClass,
    getDistinctRoles,
    getUsersForAttendance,
    getActiveUsersOfRoles,
    getActiveUsersOfRolesWithAttendance,
    saveUserAttendance,
    getDailyAttendance
};
