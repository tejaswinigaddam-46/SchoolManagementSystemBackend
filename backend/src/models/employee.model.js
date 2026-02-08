const { pool } = require('../config/database');
const logger = require('../utils/logger');
const userModel = require('./user.model');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

// ==================== EMPLOYEE MODEL METHODS ====================

/**
 * Get main campus for a tenant
 * @param {string} tenantId - Tenant ID
 * @returns {Promise<string|null>} Campus ID or null
 */
const getMainCampusId = async (tenantId) => {
    const query = `
        SELECT campus_id FROM campuses 
        WHERE tenant_id = $1 AND is_main_campus = true 
        LIMIT 1
    `;
    
    try {
        const result = await pool.query(query, [tenantId]);
        return result.rows.length > 0 ? result.rows[0].campus_id : null;
    } catch (error) {
        throw error;
    }
};

/**
 * Get any campus for a tenant (fallback)
 * @param {string} tenantId - Tenant ID
 * @returns {Promise<string|null>} Campus ID or null
 */
const getAnyCampusId = async (tenantId) => {
    const query = `
        SELECT campus_id FROM campuses 
        WHERE tenant_id = $1 
        ORDER BY is_main_campus DESC, created_at ASC
        LIMIT 1
    `;
    
    try {
        const result = await pool.query(query, [tenantId]);
        return result.rows.length > 0 ? result.rows[0].campus_id : null;
    } catch (error) {
        throw error;
    }
};

/**
 * Check if username is unique
 * @param {string} username - Username to check
 * @param {Object} client - Database client
 * @returns {Promise<boolean>} True if username is unique
 */
const isUsernameUnique = async (username, client = null) => {
    const query = 'SELECT 1 FROM users WHERE username = $1 LIMIT 1';
    
    try {
        const dbClient = client || pool;
        const result = await dbClient.query(query, [username]);
        return result.rows.length === 0;
    } catch (error) {
        throw error;
    }
};

/**
 * Check if employee ID is unique within campus
 * @param {string} employeeId - Employee ID to check
 * @param {string} campusId - Campus ID
 * @param {string} excludeUsername - Username to exclude from check (for updates)
 * @returns {Promise<boolean>} True if employee ID is unique
 */
const isEmployeeIdUnique = async (employeeId, campusId, excludeUsername = null) => {
    let query = `
        SELECT 1 FROM employment_details 
        WHERE campus_id = $1 AND employee_id = $2
    `;
    const params = [campusId, employeeId];
    
    if (excludeUsername) {
        query += ` AND username != $3`;
        params.push(excludeUsername);
    }
    
    try {
        const result = await pool.query(query, params);
        return result.rows.length === 0;
    } catch (error) {
        throw error;
    }
};

/**
 * Generate unique username for employee
 * @param {Object} client - Database client
 * @returns {Promise<string>} Unique username
 */
const generateUniqueUsername = async (client = null) => {
    let username;
    let isUnique = false;

    while (!isUnique) {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let uniqueId = '';
        for (let i = 0; i < 7; i++) {
            uniqueId += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        username = `emp-${uniqueId}`;

        isUnique = await isUsernameUnique(username, client);
    }
    
    return username;
};

/**
 * Create a new employee with all details
 * @param {Object} client - Database client from transaction
 * @param {Object} employeeData - Employee data from frontend
 * @param {string} tenantId - School/Tenant ID
 * @param {string} campusId - Campus ID
 * @returns {Promise<Object>} Created employee with employment info
 * @throws {Error} If database operation fails
 */
const createEmployeeWithClient = async (client, employeeData, tenantId, campusId) => {
    logger.info('=== MODEL: Starting createEmployeeWithClient ===', {
        tenantId,
        campusId,
        employeeId: employeeData?.employment?.employee_id,
        firstName: employeeData?.user?.first_name,
        lastName: employeeData?.user?.last_name,
        email: employeeData?.contact?.email,
        hasClient: !!client
    });

    // Get campus_id if not provided
    if (!campusId) {
        logger.info('MODEL: No campusId provided, looking for main campus');
        campusId = await getMainCampusId(tenantId);
        if (!campusId) {
            logger.info('MODEL: No main campus found, looking for any campus');
            campusId = await getAnyCampusId(tenantId);
        }
        if (!campusId) {
            logger.error('MODEL: No campus found for tenant', { tenantId });
            throw new Error('No campus found for this tenant. Please create a campus first.');
        }
        logger.info('MODEL: Found campus', { campusId });
    }
    
    logger.info("MODEL: Creating employee user account");
    
    // Step 1: Generate unique username
    const username = await generateUniqueUsername(client);
    logger.info('MODEL: Generated unique username', { username });
    
    // Step 2: Create password hash from date of birth using bcrypt
    const dobDate = new Date(employeeData.user.date_of_birth);
    const dobPassword = `${dobDate.getFullYear()}${String(dobDate.getMonth() + 1).padStart(2, '0')}${String(dobDate.getDate()).padStart(2, '0')}`;
    const passwordHash = await bcrypt.hash(dobPassword, 10);
    
    logger.info('MODEL: Generated password from DOB', { 
        originalDOB: employeeData.user.date_of_birth, 
        formattedPassword: dobPassword 
    });
    
    // Step 3: Create user in users table
    const userData = {
        username: username,
        first_name: employeeData.user.first_name.trim(),
        middle_name: employeeData.user.middle_name?.trim() || null,
        last_name: employeeData.user.last_name.trim(),
        phone_number: employeeData.user.phone_number?.trim() || null,
        password_hash: passwordHash,
        date_of_birth: employeeData.user.date_of_birth,
        role: employeeData.user.role || 'Teacher'
    };
    
    logger.info('MODEL: Prepared user data', {
        username: userData.username,
        first_name: userData.first_name,
        last_name: userData.last_name,
        role: userData.role
    });
    
    const createdUser = await userModel.create(userData, tenantId, client);
    logger.info('MODEL: Created user successfully', {
        username: username,
        userId: createdUser?.user_id
    });
    
    // Step 4: Insert into employment_details table
    logger.info("MODEL: Inserting employment details");
    const employmentQuery = `
        INSERT INTO employment_details (
            username, campus_id, employee_id, designation, department, 
            joining_date, salary, employment_type, status, transport_details, 
            hostel_details
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
    `;
    
    const employmentParams = [
        username,
        campusId,
        employeeData.employment.employee_id.trim(),
        employeeData.employment.designation,
        employeeData.employment.department,
        employeeData.employment.joining_date,
        employeeData.employment.salary || 0,
        employeeData.employment.employment_type || 'Full-time',
        employeeData.employment.status || 'Active',
        employeeData.employment.transport_details?.trim() || null,
        employeeData.employment.hostel_details?.trim() || null
    ];
    
    logger.info('MODEL: Employment query parameters', {
        username: employmentParams[0],
        campus_id: employmentParams[1],
        employee_id: employmentParams[2],
        designation: employmentParams[3],
        department: employmentParams[4],
        joining_date: employmentParams[5],
        salary: employmentParams[6]
    });
    
    let employmentResult;
    try {
        employmentResult = await client.query(employmentQuery, employmentParams);
        const employment = employmentResult.rows[0];
        logger.info('MODEL: Employment details created', {
            employmentId: employment?.employment_id,
            employeeId: employment?.employee_id
        });
    } catch (employmentError) {
        logger.error('MODEL: Error creating employment details', {
            error: employmentError.message,
            code: employmentError.code,
            constraint: employmentError.constraint
        });
        
        // Handle unique constraint violations
        if (employmentError.code === '23505') {
            if (employmentError.constraint === 'employment_details_campus_id_employee_id_key') {
                throw new Error(`Employee ID (${employeeData.employment.employee_id}) already exists in this campus`);
            }
        }
        throw employmentError;
    }
    
    const employment = employmentResult.rows[0];
    
    // Step 5: Insert into user_personal_details table
    logger.info("MODEL: Inserting user personal details");
    const personalDetailsQuery = `
        INSERT INTO user_personal_details (
            username, gender, nationality, religion, caste, category, 
            blood_group, height_cm, weight_kg, medical_conditions, 
            allergies, occupation, income
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `;
    
    const personalParams = [
        username,
        employeeData.personal?.gender?.trim() || null,
        employeeData.personal?.nationality?.trim() || null,
        employeeData.personal?.religion?.trim() || null,
        employeeData.personal?.caste?.trim() || null,
        employeeData.personal?.category?.trim() || null,
        employeeData.personal?.blood_group?.trim() || null,
        employeeData.personal?.height_cm ? parseInt(employeeData.personal.height_cm) : null,
        employeeData.personal?.weight_kg ? parseFloat(employeeData.personal.weight_kg) : null,
        employeeData.personal?.medical_conditions?.trim() || null,
        employeeData.personal?.allergies?.trim() || null,
        employeeData.personal?.occupation?.trim() || null,
        employeeData.personal?.income ? parseFloat(employeeData.personal.income) : null
    ];
    
    await client.query(personalDetailsQuery, personalParams);
    logger.info('MODEL: User personal details inserted successfully');
    
    // Step 6: Insert into user_contact_details table
    logger.info("MODEL: Inserting user contact details");
    const contactDetailsQuery = `
        INSERT INTO user_contact_details (
            username, email, phone, alt_phone, current_address, 
            city, state, pincode, country, permanent_address,
            emergency_contact_name, emergency_contact_phone, emergency_contact_relation
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `;
    
    const contactParams = [
        username,
        employeeData.contact.email.trim(),
        employeeData.contact.phone?.trim() || employeeData.user.phone_number?.trim() || null,
        employeeData.contact.alt_phone?.trim() || null,
        employeeData.contact.current_address?.trim() || null,
        employeeData.contact.city?.trim() || null,
        employeeData.contact.state?.trim() || null,
        employeeData.contact.pincode?.trim() || null,
        employeeData.contact.country?.trim() || null,
        employeeData.contact.permanent_address?.trim() || null,
        employeeData.contact.emergency_contact_name?.trim() || null,
        employeeData.contact.emergency_contact_phone?.trim() || null,
        employeeData.contact.emergency_contact_relation?.trim() || null
    ];
    
    await client.query(contactDetailsQuery, contactParams);
    logger.info('MODEL: User contact details inserted successfully');
    
    // Step 7: Create user status
    logger.info('MODEL: Creating user status');
    await userModel.createUserStatus(username, campusId, tenantId, client);
    logger.info('MODEL: User status created successfully');
    
    const result = {
        username: username,
        user_id: createdUser.user_id,
        employee_id: employment.employee_id,
        employment: employment,
        first_name: createdUser.first_name,
        last_name: createdUser.last_name
    };
    
    logger.info('MODEL: Employee creation completed successfully', {
        username: result.username,
        userId: result.user_id,
        employeeId: result.employee_id
    });
    
    return result;
};

/**
 * Find employee by username
 * @param {string} username - Employee's username
 * @param {string} tenantId - School/Tenant ID
 * @returns {Promise<Object|null>} Employee object with all details or null
 */
const findEmployeeByUsername = async (username, tenantId) => {
    const query = `
        SELECT 
            u.user_id, u.username, u.first_name, u.middle_name, u.last_name, 
            u.phone_number, u.date_of_birth, u.role, u.tenant_id, u.created_at, u.updated_at,
            ed.employment_id, ed.employee_id, ed.designation, ed.department, 
            ed.joining_date, ed.salary, ed.employment_type, ed.status as employment_status,
            ed.transport_details, ed.hostel_details,
            upd.gender, upd.nationality, upd.religion, upd.caste, upd.category,
            upd.blood_group, upd.height_cm, upd.weight_kg, upd.medical_conditions,
            upd.allergies, upd.occupation, upd.income,
            ucd.email, ucd.phone as contact_phone, ucd.alt_phone, ucd.current_address,
            ucd.city, ucd.state, ucd.pincode, ucd.country, ucd.permanent_address,
            ucd.emergency_contact_name, ucd.emergency_contact_phone, ucd.emergency_contact_relation,
            us.campus_id, us.status
        FROM users u
        LEFT JOIN employment_details ed ON ed.username = u.username
        LEFT JOIN user_personal_details upd ON u.username = upd.username
        LEFT JOIN user_contact_details ucd ON u.username = ucd.username
        LEFT JOIN user_statuses us ON u.username = us.username
        WHERE u.username = $1 AND u.tenant_id = $2 AND u.role IN ('Teacher', 'Employee', 'Admin')
        LIMIT 1
    `;
    
    try {
        const result = await pool.query(query, [username, tenantId]);
        return result.rows[0] || null;
    } catch (error) {
        throw error;
    }
};

/**
 * Find employee by employee ID
 * @param {string} employeeId - Employee ID
 * @param {string} campusId - Campus ID
 * @returns {Promise<Object|null>} Employee object or null
 */
const findEmployeeByEmployeeId = async (employeeId, campusId) => {
    const query = `
        SELECT 
            u.user_id, u.username, u.first_name, u.middle_name, u.last_name, 
            u.phone_number, u.date_of_birth, u.role, u.tenant_id,
            ed.employment_id, ed.employee_id, ed.designation, ed.department, 
            ed.joining_date, ed.salary, ed.employment_type, ed.status as employment_status,
            ed.transport_details, ed.hostel_details,
            upd.gender, upd.nationality, upd.religion, upd.caste, upd.category,
            upd.blood_group, upd.height_cm, upd.weight_kg, upd.medical_conditions,
            upd.allergies, upd.occupation, upd.income,
            ucd.email, ucd.phone as contact_phone, ucd.alt_phone, ucd.current_address,
            ucd.city, ucd.state, ucd.pincode, ucd.country, ucd.permanent_address,
            ucd.emergency_contact_name, ucd.emergency_contact_phone, ucd.emergency_contact_relation,
            us.campus_id, us.status
        FROM users u
        JOIN employment_details ed ON ed.username = u.username
        LEFT JOIN user_personal_details upd ON u.username = upd.username
        LEFT JOIN user_contact_details ucd ON u.username = ucd.username
        LEFT JOIN user_statuses us ON u.username = us.username
        WHERE ed.employee_id = $1 AND ed.campus_id = $2 AND u.role IN ('Teacher', 'Employee', 'Admin')
        LIMIT 1
    `;
    
    try {
        const result = await pool.query(query, [employeeId, campusId]);
        return result.rows[0] || null;
    } catch (error) {
        throw error;
    }
};

/**
 * Get complete employee data for editing (includes all related data)
 * @param {string} username - Employee's username
 * @param {string} tenantId - School/Tenant ID
 * @returns {Promise<Object|null>} Complete employee object with all details or null
 */
const getCompleteEmployeeData = async (username, tenantId) => {
    const query = `
        SELECT 
            u.user_id, u.username, u.first_name, u.middle_name, u.last_name, 
            u.phone_number, u.date_of_birth, u.role, u.tenant_id, u.created_at, u.updated_at,
            ed.employment_id, ed.employee_id, ed.designation, ed.department, 
            ed.joining_date, ed.salary, ed.employment_type, ed.status as employment_status,
            ed.transport_details, ed.hostel_details,
            upd.gender, upd.nationality, upd.religion, upd.caste, upd.category,
            upd.blood_group, upd.height_cm, upd.weight_kg, upd.medical_conditions,
            upd.allergies, upd.occupation, upd.income,
            ucd.email, ucd.phone as contact_phone, ucd.alt_phone, ucd.current_address,
            ucd.city, ucd.state, ucd.pincode, ucd.country, ucd.permanent_address,
            ucd.emergency_contact_name, ucd.emergency_contact_phone, ucd.emergency_contact_relation,
            us.campus_id, us.status
        FROM users u
        LEFT JOIN employment_details ed ON ed.username = u.username
        LEFT JOIN user_personal_details upd ON u.username = upd.username
        LEFT JOIN user_contact_details ucd ON u.username = ucd.username
        LEFT JOIN user_statuses us ON u.username = us.username
        WHERE u.username = $1 AND u.tenant_id = $2 AND u.role IN ('Teacher', 'Employee', 'Admin')
        LIMIT 1
    `;
    
    try {
        const result = await pool.query(query, [username, tenantId]);
        return result.rows[0] || null;
    } catch (error) {
        throw error;
    }
};

/**
 * Get all employees for a school with pagination and filters
 * @param {string} tenantId - School/Tenant ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Employees list with pagination info
 */
const getAllEmployees = async (tenantId, options = {}) => {
    const { 
        page = 1, 
        limit = 20, 
        search = '', 
        department = '',
        designation = '',
        status = '',
        employment_type = '',
        campus_id = null,
        role = ''
    } = options;
    
    logger.info('MODEL getAllEmployees called with:', {
        tenantId,
        page,
        limit,
        search,
        department,
        designation,
        status,
        employment_type,
        campus_id
    });
    
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE u.tenant_id = $1';
    let queryParams = [tenantId];
    if (role && role.trim()) {
        whereClause += ` AND u.role = $${queryParams.length + 1}`;
        queryParams.push(role.trim());
    } else {
        whereClause += ` AND u.role IN ($${queryParams.length + 1}, $${queryParams.length + 2}, $${queryParams.length + 3})`;
        queryParams.push('Teacher', 'Employee', 'Admin');
    }
    let paramCounter = queryParams.length + 1;
    
    // Add campus filter if specified (use employment_details.campus_id for employees)
    if (campus_id) {
        whereClause += ` AND ed.campus_id = $${paramCounter}`;
        queryParams.push(campus_id);
        paramCounter++;
    }
    
    // Add search filter
    if (search.trim()) {
        whereClause += ` AND (u.first_name ILIKE $${paramCounter} OR u.last_name ILIKE $${paramCounter} OR ed.employee_id ILIKE $${paramCounter} OR ucd.email ILIKE $${paramCounter})`;
        queryParams.push(`%${search.trim()}%`);
        paramCounter++;
    }
    
    // Add department filter
    if (department.trim()) {
        whereClause += ` AND ed.department = $${paramCounter}`;
        queryParams.push(department.trim());
        paramCounter++;
    }
    
    // Add designation filter
    if (designation.trim()) {
        whereClause += ` AND ed.designation = $${paramCounter}`;
        queryParams.push(designation.trim());
        paramCounter++;
    }
    
    // Add status filter
    if (status.trim()) {
        whereClause += ` AND ed.status = $${paramCounter}`;
        queryParams.push(status.trim());
        paramCounter++;
    }
    
    // Add employment type filter
    if (employment_type.trim()) {
        whereClause += ` AND ed.employment_type = $${paramCounter}`;
        queryParams.push(employment_type.trim());
        paramCounter++;
    }
    
    const query = `
        SELECT DISTINCT
            u.user_id, u.username, u.first_name, u.middle_name, u.last_name, 
            u.phone_number, u.date_of_birth, u.role, u.created_at,
            ed.employment_id, ed.employee_id, ed.designation, ed.department, 
            ed.joining_date, ed.salary, ed.employment_type, ed.status as employment_status,
            ed.transport_details, ed.hostel_details,
            upd.gender, upd.nationality, upd.blood_group,
            ucd.email, ucd.phone as contact_phone, ucd.city, ucd.state,
            us.campus_id, us.status
        FROM users u
        LEFT JOIN user_statuses us ON u.username = us.username
        LEFT JOIN employment_details ed ON ed.username = u.username
        LEFT JOIN user_personal_details upd ON u.username = upd.username
        LEFT JOIN user_contact_details ucd ON u.username = ucd.username
        ${whereClause}
        ORDER BY u.created_at DESC, u.first_name ASC
        LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `;
    
    const countQuery = `
        SELECT COUNT(DISTINCT u.user_id) as total
        FROM users u
        LEFT JOIN user_statuses us ON u.username = us.username
        LEFT JOIN employment_details ed ON ed.username = u.username
        LEFT JOIN user_contact_details ucd ON u.username = ucd.username
        ${whereClause}
    `;
    
    logger.info('MODEL Final query:', query);
    logger.info('MODEL Query params:', queryParams);
    
    try {
        const [employeesResult, countResult] = await Promise.all([
            pool.query(query, [...queryParams, limit, offset]),
            pool.query(countQuery, queryParams)
        ]);
        
        logger.info('MODEL Raw database results:', {
            employeesCount: employeesResult.rows.length,
            totalCount: countResult.rows[0].total
        });
        
        const total = parseInt(countResult.rows[0].total);
        const totalPages = Math.ceil(total / limit);
        
        const result = {
            employees: employeesResult.rows,
            pagination: {
                current_page: page,
                total_pages: totalPages,
                total_count: total,
                limit: limit,
                has_next: page < totalPages,
                has_prev: page > 1
            }
        };
        
        logger.info('MODEL Returning result with', result.employees.length, 'employees');
        return result;
        
    } catch (error) {
        logger.error('MODEL Database error:', error);
        throw error;
    }
};

/**
 * Update employee information across multiple tables
 * @param {string} username - Employee's username
 * @param {Object} updateData - Data to update
 * @param {string} tenantId - School/Tenant ID
 * @returns {Promise<Object|null>} Updated employee object or null
 */
const updateEmployee = async (username, updateData, tenantId) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        logger.info('MODEL: Starting employee update transaction', { username, updateDataKeys: Object.keys(updateData) });
        
        // Update users table
        if (updateData.user && Object.keys(updateData.user).length > 0) {
            const userUpdates = {};
            if (updateData.user.first_name !== undefined) userUpdates.first_name = updateData.user.first_name;
            if (updateData.user.middle_name !== undefined) userUpdates.middle_name = updateData.user.middle_name;
            if (updateData.user.last_name !== undefined) userUpdates.last_name = updateData.user.last_name;
            if (updateData.user.phone_number !== undefined) userUpdates.phone_number = updateData.user.phone_number;
            if (updateData.user.date_of_birth !== undefined) userUpdates.date_of_birth = updateData.user.date_of_birth;
            
            if (Object.keys(userUpdates).length > 0) {
                logger.info('MODEL: Updating user table', { userUpdates });
                await userModel.editUser(username, userUpdates, client);
            }
        }
        
        // Update employment_details table
        if (updateData.employment && Object.keys(updateData.employment).length > 0) {
            const employmentUpdates = {};
            if (updateData.employment.employee_id !== undefined) employmentUpdates.employee_id = updateData.employment.employee_id;
            if (updateData.employment.designation !== undefined) employmentUpdates.designation = updateData.employment.designation;
            if (updateData.employment.department !== undefined) employmentUpdates.department = updateData.employment.department;
            if (updateData.employment.joining_date !== undefined) employmentUpdates.joining_date = updateData.employment.joining_date;
            if (updateData.employment.salary !== undefined) employmentUpdates.salary = updateData.employment.salary;
            if (updateData.employment.employment_type !== undefined) employmentUpdates.employment_type = updateData.employment.employment_type;
            if (updateData.employment.status !== undefined) employmentUpdates.status = updateData.employment.status;
            if (updateData.employment.transport_details !== undefined) employmentUpdates.transport_details = updateData.employment.transport_details;
            if (updateData.employment.hostel_details !== undefined) employmentUpdates.hostel_details = updateData.employment.hostel_details;
            
            if (Object.keys(employmentUpdates).length > 0) {
                const employmentFields = Object.keys(employmentUpdates)
                    .map((key, index) => `${key} = $${index + 2}`)
                    .join(', ');
                
                const employmentQuery = `
                    UPDATE employment_details 
                    SET ${employmentFields}
                    WHERE username = $1
                `;
                
                logger.info('MODEL: Updating employment table', { employmentUpdates });
                
                try {
                    await client.query(employmentQuery, [username, ...Object.values(employmentUpdates)]);
                } catch (employmentError) {
                    // Handle unique constraint violations
                    if (employmentError.code === '23505') {
                        if (employmentError.constraint === 'employment_details_campus_id_employee_id_key') {
                            throw new Error(`Employee ID (${updateData.employment.employee_id}) already exists in this campus`);
                        }
                    }
                    throw employmentError;
                }
            }
        }
        
        // Update user_personal_details table
        if (updateData.personal && Object.keys(updateData.personal).length > 0) {
            const personalUpdates = {};
            if (updateData.personal.gender !== undefined) personalUpdates.gender = updateData.personal.gender;
            if (updateData.personal.nationality !== undefined) personalUpdates.nationality = updateData.personal.nationality;
            if (updateData.personal.religion !== undefined) personalUpdates.religion = updateData.personal.religion;
            if (updateData.personal.caste !== undefined) personalUpdates.caste = updateData.personal.caste;
            if (updateData.personal.category !== undefined) personalUpdates.category = updateData.personal.category;
            if (updateData.personal.blood_group !== undefined) personalUpdates.blood_group = updateData.personal.blood_group;
            if (updateData.personal.height_cm !== undefined) personalUpdates.height_cm = updateData.personal.height_cm;
            if (updateData.personal.weight_kg !== undefined) personalUpdates.weight_kg = updateData.personal.weight_kg;
            if (updateData.personal.medical_conditions !== undefined) personalUpdates.medical_conditions = updateData.personal.medical_conditions;
            if (updateData.personal.allergies !== undefined) personalUpdates.allergies = updateData.personal.allergies;
            if (updateData.personal.occupation !== undefined) personalUpdates.occupation = updateData.personal.occupation;
            if (updateData.personal.income !== undefined) personalUpdates.income = updateData.personal.income;
            
            if (Object.keys(personalUpdates).length > 0) {
                const personalFields = Object.keys(personalUpdates)
                    .map((key, index) => `${key} = $${index + 2}`)
                    .join(', ');
                
                const personalQuery = `
                    UPDATE user_personal_details 
                    SET ${personalFields}
                    WHERE username = $1
                `;
                
                logger.info('MODEL: Updating personal details', { personalUpdates });
                await client.query(personalQuery, [username, ...Object.values(personalUpdates)]);
            }
        }
        
        // Update user_contact_details table
        if (updateData.contact && Object.keys(updateData.contact).length > 0) {
            const contactUpdates = {};
            if (updateData.contact.email !== undefined) contactUpdates.email = updateData.contact.email;
            if (updateData.contact.phone !== undefined) contactUpdates.phone = updateData.contact.phone;
            if (updateData.contact.alt_phone !== undefined) contactUpdates.alt_phone = updateData.contact.alt_phone;
            if (updateData.contact.current_address !== undefined) contactUpdates.current_address = updateData.contact.current_address;
            if (updateData.contact.city !== undefined) contactUpdates.city = updateData.contact.city;
            if (updateData.contact.state !== undefined) contactUpdates.state = updateData.contact.state;
            if (updateData.contact.pincode !== undefined) contactUpdates.pincode = updateData.contact.pincode;
            if (updateData.contact.country !== undefined) contactUpdates.country = updateData.contact.country;
            if (updateData.contact.permanent_address !== undefined) contactUpdates.permanent_address = updateData.contact.permanent_address;
            if (updateData.contact.emergency_contact_name !== undefined) contactUpdates.emergency_contact_name = updateData.contact.emergency_contact_name;
            if (updateData.contact.emergency_contact_phone !== undefined) contactUpdates.emergency_contact_phone = updateData.contact.emergency_contact_phone;
            if (updateData.contact.emergency_contact_relation !== undefined) contactUpdates.emergency_contact_relation = updateData.contact.emergency_contact_relation;
            
            if (Object.keys(contactUpdates).length > 0) {
                const contactFields = Object.keys(contactUpdates)
                    .map((key, index) => `${key} = $${index + 2}`)
                    .join(', ');
                
                const contactQuery = `
                    UPDATE user_contact_details 
                    SET ${contactFields}
                    WHERE username = $1
                `;
                
                logger.info('MODEL: Updating contact details', { contactUpdates });
                await client.query(contactQuery, [username, ...Object.values(contactUpdates)]);
            }
        }
        
        await client.query('COMMIT');
        logger.info('MODEL: Employee update transaction committed successfully');
        
        // Return updated employee
        return await findEmployeeByUsername(username, tenantId);
        
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error('MODEL: Employee update transaction failed, rolled back', { error: error.message });
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Delete employee (hard delete with proper cleanup)
 * @param {string} username - Employee's username
 * @param {string} tenantId - School/Tenant ID
 * @returns {Promise<boolean>} True if employee was deleted
 */
const deleteEmployee = async (username, tenantId) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        logger.info('MODEL: Starting hard delete transaction for employee', { username });
        
        // Step 1: Verify employee exists
        const employeeQuery = `
            SELECT u.username, u.user_id 
            FROM users u
            WHERE u.username = $1 AND u.tenant_id = $2 AND u.role IN ('Teacher', 'Employee', 'Admin')
        `;
        const employeeResult = await client.query(employeeQuery, [username, tenantId]);
        
        if (employeeResult.rows.length === 0) {
            throw new Error('Employee not found');
        }
        
        const employee = employeeResult.rows[0];
        logger.info('MODEL: Found employee for deletion', { username: employee.username, userId: employee.user_id });
        
        // Step 2: Delete from employment_details table
        logger.info('MODEL: Deleting from employment_details');
        await client.query(
            'DELETE FROM employment_details WHERE username = $1',
            [username]
        );
        
        // Step 3: Delete from user_contact_details
        await client.query(
            'DELETE FROM user_contact_details WHERE username = $1',
            [username]
        );
        
        // Step 4: Delete from user_personal_details
        await client.query(
            'DELETE FROM user_personal_details WHERE username = $1',
            [username]
        );
        
        // Step 5: Delete from user_statuses
        await client.query(
            'DELETE FROM user_statuses WHERE username = $1',
            [username]
        );
        
        // Step 6: Finally delete the employee from users table
        logger.info('MODEL: Deleting employee from users table');
        await client.query(
            'DELETE FROM users WHERE username = $1 AND tenant_id = $2 AND role IN ($3, $4, $5)',
            [username, tenantId, 'Teacher', 'Employee', 'Admin']
        );
        
        await client.query('COMMIT');
        logger.info('MODEL: Employee hard delete transaction completed successfully', {
            deletedEmployee: username
        });
        
        return true;
        
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error('MODEL: Employee hard delete transaction failed, rolled back', { 
            error: error.message,
            username,
            tenantId
        });
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Get employee statistics for a campus or tenant
 * @param {string} tenantId - School/Tenant ID
 * @param {string} campusId - Campus ID (optional)
 * @returns {Promise<Object>} Employee statistics
 */
const getEmployeeStatistics = async (tenantId, campusId = null) => {
    const logger = require('../utils/logger');
    
    logger.info('=== MODEL: getEmployeeStatistics START ===');
    logger.info('MODEL: Input parameters', {
        tenantId,
        campusId,
        tenantId_type: typeof tenantId,
        campusId_type: typeof campusId,
        campusId_is_null: campusId === null
    });

    let whereClause = 'WHERE u.tenant_id = $1 AND u.role IN ($2, $3, $4)';
    let queryParams = [tenantId, 'Teacher', 'Employee', 'Admin'];
    
    if (campusId) {
        whereClause += ' AND us.campus_id = $5';
        queryParams.push(campusId);
    }
    
    const query = `
        SELECT 
            COUNT(DISTINCT u.user_id) as total_employees,
            COUNT(DISTINCT CASE WHEN ed.status = 'Active' THEN u.user_id END) as active_employees,
            COUNT(DISTINCT CASE WHEN ed.status = 'On-Leave' THEN u.user_id END) as on_leave_employees,
            COUNT(DISTINCT CASE WHEN ed.status = 'Resigned' THEN u.user_id END) as resigned_employees,
            COUNT(DISTINCT CASE WHEN ed.status = 'Terminated' THEN u.user_id END) as terminated_employees,
            COUNT(DISTINCT ed.department) as total_departments,
            COUNT(DISTINCT CASE WHEN u.role = 'Teacher' THEN u.user_id END) as teachers,
            COUNT(DISTINCT CASE WHEN u.role = 'Employee' THEN u.user_id END) as staff,
            COUNT(DISTINCT CASE WHEN u.role = 'Admin' THEN u.user_id END) as admins
        FROM users u
        LEFT JOIN user_statuses us ON u.username = us.username
        LEFT JOIN employment_details ed ON ed.username = u.username
        ${whereClause}
    `;
    
    logger.info('MODEL: SQL Query prepared', {
        whereClause,
        queryParams,
        full_query: query.replace(/\s+/g, ' ').trim()
    });
    
    try {
        logger.info('MODEL: Executing database query...');
        
        const startTime = Date.now();
        const result = await pool.query(query, queryParams);
        const executionTime = Date.now() - startTime;
        
        logger.info('MODEL: Database query executed successfully', {
            execution_time_ms: executionTime,
            rows_returned: result.rows.length,
            result_structure: {
                rows_count: result.rows.length,
                row_count_property: result.rowCount,
                fields: result.fields ? result.fields.map(f => f.name) : null
            }
        });

        const statisticsData = result.rows[0] || {};
        
        logger.info('MODEL: Statistics data extracted', {
            raw_data: statisticsData,
            data_keys: Object.keys(statisticsData),
            data_values: Object.values(statisticsData)
        });

        // Convert string counts to numbers for better handling
        const processedStats = {};
        for (const [key, value] of Object.entries(statisticsData)) {
            processedStats[key] = value ? parseInt(value, 10) : 0;
        }

        logger.info('MODEL: Statistics data processed', {
            processed_data: processedStats
        });

        logger.info('=== MODEL: getEmployeeStatistics END (SUCCESS) ===');
        return processedStats;
        
    } catch (error) {
        logger.error('=== MODEL: getEmployeeStatistics ERROR ===');
        logger.error('MODEL: Database query failed', {
            error_name: error.name,
            error_message: error.message,
            error_code: error.code,
            error_detail: error.detail,
            error_hint: error.hint,
            error_position: error.position,
            error_stack: error.stack,
            query_attempted: query.replace(/\s+/g, ' ').trim(),
            query_params: queryParams,
            tenant_id: tenantId,
            campus_id: campusId
        });
        
        logger.error('=== MODEL: getEmployeeStatistics END (ERROR) ===');
        throw error;
    }
};

/**
 * Get enum values for employee dropdowns from database enum types
 * @returns {Promise<Object>} Enum values for various fields
 */
const getEnumValues = async () => {
    // Helper to read enum labels from PostgreSQL
    const getEnumOptions = async (typeName) => {
        const query = `
            SELECT e.enumlabel AS label
            FROM pg_type t
            JOIN pg_enum e ON t.oid = e.enumtypid
            WHERE t.typname = $1
            ORDER BY e.enumsortorder
        `;
        const res = await pool.query(query, [typeName]);
        return res.rows.map(r => ({ value: r.label, label: r.label }));
    };

    try {
        const [
            designations,
            departments,
            employment_types,
            employment_status,
            genders,
            categories,
            blood_groups
        ] = await Promise.all([
            getEnumOptions('designation_enum'),
            getEnumOptions('department_enum'),
            getEnumOptions('employment_type_enum'),
            getEnumOptions('employment_status_enum'),
            getEnumOptions('gender_enum'),
            getEnumOptions('category_enum'),
            getEnumOptions('blood_group_enum')
        ]);

        return {
            success: true,
            data: {
                designations,
                departments,
                employment_types,
                employment_status,
                genders,
                categories,
                blood_groups
            }
        };
    } catch (error) {
        throw error;
    }
};

module.exports = {
    createEmployeeWithClient,
    findEmployeeByUsername,
    findEmployeeByEmployeeId,
    getCompleteEmployeeData,
    getAllEmployees,
    updateEmployee,
    deleteEmployee,
    isEmployeeIdUnique,
    isUsernameUnique,
    generateUniqueUsername,
    getEmployeeStatistics,
    getEnumValues,
    getMainCampusId,
    getAnyCampusId
};
