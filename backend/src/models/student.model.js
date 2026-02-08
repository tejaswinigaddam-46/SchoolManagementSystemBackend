const { pool } = require('../config/database');
const logger = require('../utils/logger');
const userModel = require('./user.model');
const academicModel = require('./academic.model');
const crypto = require('crypto');
const bcrypt = require('bcrypt'); // Add bcrypt for proper password hashing

// ==================== STUDENT MODEL METHODS ====================

/**
 * Helper function to get academic year ID from year name or validate existing ID
 * @param {string|number} academicYearInput - Either academic year ID or year name
 * @param {string} campusId - Campus ID
 * @returns {Promise<number|null>} Academic year ID or null
 */
const resolveAcademicYearId = async (academicYearInput, campusId) => {
    if (!academicYearInput) {
        return null;
    }
    
    // If it's already a number, assume it's an ID and validate it
    if (typeof academicYearInput === 'number' || /^\d+$/.test(academicYearInput.toString())) {
        const academicYearId = parseInt(academicYearInput);
        try {
            const academicYear = await academicModel.getAcademicYearById(academicYearId, campusId);
            return academicYear ? academicYearId : null;
        } catch (error) {
            logger.error('Error validating academic year ID', { academicYearId, campusId, error: error.message });
            return null;
        }
    }
    
    // If it's a string that looks like a year name (e.g., "2024-2025"), try to find the ID
    const yearName = academicYearInput.toString().trim();
    if (yearName) {
        try {
            const query = `
                SELECT academic_year_id 
                FROM academic_years 
                WHERE campus_id = $1 AND year_name = $2 
                LIMIT 1
            `;
            const result = await pool.query(query, [campusId, yearName]);
            return result.rows.length > 0 ? result.rows[0].academic_year_id : null;
        } catch (error) {
            logger.error('Error resolving academic year by name', { yearName, campusId, error: error.message });
            return null;
        }
    }
    
    return null;
};

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
 * Create a new student following the new schema
 * @param {Object} client - Database client from transaction
 * @param {Object} studentData - Student data from frontend
 * @param {string} tenantId - School/Tenant ID
 * @param {string} campusId - Campus ID
 * @returns {Promise<Object>} Created student with enrollment info
 * @throws {Error} If database operation fails
 */
const createStudentWithClient = async (client, studentData, tenantId, campusId) => {
    logger.info('=== MODEL: Starting createStudentWithClient ===', {
        tenantId,
        campusId,
        admissionNumber: studentData?.admissionNumber,
        firstName: studentData?.firstName,
        lastName: studentData?.lastName,
        email: studentData?.email,
        academicYearId: studentData?.academicYearId || studentData?.academic_year_id,
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
    
    logger.info("MODEL: Creating student user account");
    
    // Step 1: Create user in users table with role 'Student' using existing create method
    // Generate unique username using existing generateUniqueId pattern
    let username;
    let isUnique = false;

    logger.info('MODEL: Generating unique username');
    while (!isUnique) {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let uniqueId = '';
        for (let i = 0; i < 7; i++) {
            uniqueId += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        username = `st-${uniqueId}`;

        // Check if the username already exists
        const existing = await userModel.findByUsername(username, client);
        if (!existing) {
            isUnique = true;
        }
        logger.info('MODEL: Username generation attempt', { username, isUnique });
    }
    
    logger.info('MODEL: Generated unique username', { username });
    
    // Create password hash from date of birth using bcrypt (not SHA256)
    // Convert date to YYYYMMDD format for consistent password format
    const dobDate = new Date(studentData.dateOfBirth);
    const dobPassword = `${dobDate.getFullYear()}${String(dobDate.getMonth() + 1).padStart(2, '0')}${String(dobDate.getDate()).padStart(2, '0')}`;
    const passwordHash = await bcrypt.hash(dobPassword, 10); // Proper bcrypt hashing
    
    logger.info('MODEL: Generated password from DOB', { 
        originalDOB: studentData.dateOfBirth, 
        formattedPassword: dobPassword 
    });
    
    const userData = {
        username: username,
        first_name: studentData.firstName.trim(),
        middle_name: studentData.middleName?.trim() || null,
        last_name: studentData.lastName.trim(),
        phone_number: studentData.phoneNumber?.trim() || null,
        password_hash: passwordHash, // Use bcrypt hash instead of SHA256
        date_of_birth: studentData.dateOfBirth,
        role: 'Student'
    };
    
    logger.info('MODEL: Prepared user data', {
        username: userData.username,
        first_name: userData.first_name,
        last_name: userData.last_name,
        role: userData.role,
        phone_number: userData.phone_number,
        date_of_birth: userData.date_of_birth,
        password_hash: userData.password_hash
    });
    
    logger.info('MODEL: Calling userModel.create');
    const createdUser = await userModel.create(userData, tenantId, client);
    
    logger.info(`MODEL: Created user successfully`, {
        username: username,
        userId: createdUser?.user_id,
        createdUserKeys: Object.keys(createdUser || {})
    });
    
    // Step 2: Insert into student_enrollment table
    logger.info("MODEL: Inserting student enrollment");
    const enrollmentQuery = `
        INSERT INTO student_enrollment (
            admission_number, admission_date, campus_id, username, academic_year_id, 
            registration_number, admission_type, tc_number, scholarship_applied,
            previous_school, transport_details, hostel_details, class_name
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
    `;
    
    // Handle academic_year_id - resolve it properly
    let academicYearId = studentData.academicYearId || studentData.academic_year_id;
    
    // Resolve academic year ID from name if needed
    if (academicYearId) {
        const resolvedAcademicYearId = await resolveAcademicYearId(academicYearId, campusId);
        if (!resolvedAcademicYearId) {
            logger.error('MODEL: Could not resolve academic year ID', { 
                originalInput: academicYearId, 
                campusId 
            });
            throw new Error(`Invalid academic year: ${academicYearId}. Please select a valid academic year.`);
        }
        academicYearId = resolvedAcademicYearId;
    }
    
    // Fix transport and hostel field mapping
    const transportDetails = studentData.transportMode || studentData.transportDetails || null;
    const hostelDetails = (studentData.hostelRequired === 'Yes' || studentData.hostelRequired === true) ? 'Required' : 'Not Required';
    const scholarshipApplied = (studentData.scholarshipApplied === 'Yes' || studentData.scholarshipApplied === true);
    
    const enrollmentParams = [
        studentData.admissionNumber.trim(),
        studentData.admissionDate || new Date(),
        campusId,
        username,
        academicYearId,
        studentData.registrationNumber?.trim() || null,
        studentData.admissionType || 'regular',
        studentData.transferCertificateNumber?.trim() || null,
        scholarshipApplied,
        studentData.previousSchool?.trim() || null,
        transportDetails,
        hostelDetails,
        studentData.class?.trim() || null
    ];
    
    logger.info('MODEL: Enrollment query parameters', {
        admission_number: enrollmentParams[0],
        admission_date: enrollmentParams[1],
        campus_id: enrollmentParams[2],
        username: enrollmentParams[3],
        academic_year_id: enrollmentParams[4],
        academic_year_id_type: typeof enrollmentParams[4],
        registration_number: enrollmentParams[5],
        admission_type: enrollmentParams[6],
        tc_number: enrollmentParams[7],
        scholarship_applied: enrollmentParams[8],
        previous_school: enrollmentParams[9],
        transport_details: enrollmentParams[10],
        hostel_details: enrollmentParams[11],
        class_name: enrollmentParams[12]
    });
    
    let enrollmentResult;
    try {
        enrollmentResult = await client.query(enrollmentQuery, enrollmentParams);
        const enrollment = enrollmentResult.rows[0];
        logger.info('MODEL: Student enrollment created', {
            enrollmentId: enrollment?.id,
            admissionNumber: enrollment?.admission_number,
            academicYearId: enrollment?.academic_year_id
        });
    } catch (enrollmentError) {
        logger.error('MODEL: Error creating student enrollment', {
            error: enrollmentError.message,
            code: enrollmentError.code,
            constraint: enrollmentError.constraint
        });
        
        // Handle unique constraint violations with specific error messages
        if (enrollmentError.code === '23505') {
            if (enrollmentError.constraint === 'uq_campus_admission') {
                throw new Error(`This admission number (${studentData.admissionNumber}) already exists in this campus`);
            }
            if (enrollmentError.constraint === 'uq_campus_registration') {
                throw new Error(`This registration number (${studentData.registrationNumber}) already exists in this campus`);
            }
            if (enrollmentError.constraint === 'uq_campus_tc') {
                throw new Error(`This TC number (${studentData.transferCertificateNumber}) already exists in this campus`);
            }
            if (enrollmentError.constraint === 'student_enrollment_pkey') {
                throw new Error(`This admission number (${studentData.admissionNumber}) already exists`);
            }
        }
        throw enrollmentError;
    }
    
    const enrollment = enrollmentResult.rows[0];
    
    // Step 3: Insert into user_personal_details table
    logger.info("MODEL: Inserting user personal details");
    const personalDetailsQuery = `
        INSERT INTO user_personal_details (
            username, gender, nationality, religion, caste, category, 
            blood_group, height_cm, weight_kg, medical_conditions, 
            allergies
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `;
    
    const personalParams = [
        username,
        studentData.gender?.trim() || null,
        studentData.nationality?.trim() || null,
        studentData.religion?.trim() || null,
        studentData.caste?.trim() || null,
        studentData.category?.trim() || null,
        studentData.bloodGroup?.trim() || null,
        studentData.height ? parseInt(studentData.height) : null,
        studentData.weight ? parseFloat(studentData.weight) : null,
        studentData.medicalConditions?.trim() || null,
        studentData.allergies?.trim() || null
    ];
    
    logger.info('MODEL: Personal details parameters', {
        username: personalParams[0],
        gender: personalParams[1],
        nationality: personalParams[2],
        bloodGroup: personalParams[6]
    });
    
    await client.query(personalDetailsQuery, personalParams);
    logger.info('MODEL: User personal details inserted successfully');
    
    // Step 4: Insert into user_contact_details table
    logger.info("MODEL: Inserting user contact details");
    const contactDetailsQuery = `
        INSERT INTO user_contact_details (
            username, email, phone, alt_phone, current_address, 
            city, state, pincode, country, permanent_address
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `;
    
    const contactParams = [
        username,
        studentData.email.trim(),
        studentData.phoneNumber?.trim() || null,
        studentData.alternatePhoneNumber?.trim() || null,
        studentData.currentAddress?.trim() || null,
        studentData.city?.trim() || null,
        studentData.state?.trim() || null,
        studentData.pincode?.trim() || null,
        studentData.country?.trim() || null,
        studentData.permanentAddress?.trim() || null
    ];
    
    logger.info('MODEL: Contact details parameters', {
        username: contactParams[0],
        email: contactParams[1],
        phone: contactParams[2],
        city: contactParams[5],
        state: contactParams[6]
    });
    
    await client.query(contactDetailsQuery, contactParams);
    logger.info('MODEL: User contact details inserted successfully');
    
    // Step 5: Create user status
    logger.info('MODEL: Creating user status');
    await userModel.createUserStatus(username, campusId, tenantId, client);
    logger.info('MODEL: User status created successfully');
    
    // Step 6: Handle parents if provided
    if (Array.isArray(studentData.parents) && studentData.parents.length > 0) {
        logger.info('MODEL: Processing parents', { parentCount: studentData.parents.length });
        
        for (const [index, parent] of studentData.parents.entries()) {
            logger.info(`MODEL: Processing parent ${index + 1}`, {
                firstName: parent.firstName,
                lastName: parent.lastName,
                email: parent.email,
                phone: parent.phone,
                relationshipType: parent.relationshipType || parent.relation,
                isEmergency: parent.isEmergency
            });
            
            let parentUser;
            
            try {
                // Since emails are not unique and only usernames are unique,
                // we'll always create a new parent user for each parent
                logger.info(`MODEL: Creating new parent user for parent ${index + 1}`);
                
                // Generate unique username for parent
                let parentUsername;
                let parentIsUnique = false;

                while (!parentIsUnique) {
                    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                    let uniqueId = '';
                    for (let i = 0; i < 7; i++) {
                        uniqueId += chars.charAt(Math.floor(Math.random() * chars.length));
                    }
                    parentUsername = `pa-${uniqueId}`;

                    const existing = await userModel.findByUsername(parentUsername, client);
                    if (!existing) {
                        parentIsUnique = true;
                    }
                }
                
                logger.info(`MODEL: Generated parent username`, { parentUsername });
                
                // Create password hash from parent's date of birth using bcrypt (not SHA256)
                // Convert date to YYYYMMDD format for consistent password format
                let parentPassword;
                if (parent.dateOfBirth) {
                    const parentDobDate = new Date(parent.dateOfBirth);
                    parentPassword = `${parentDobDate.getFullYear()}${String(parentDobDate.getMonth() + 1).padStart(2, '0')}${String(parentDobDate.getDate()).padStart(2, '0')}`;
                } else {
                    parentPassword = parent.phone || 'default123';
                }
                const parentPasswordHash = await bcrypt.hash(parentPassword, 10); // Proper bcrypt hashing
                
                logger.info(`MODEL: Generated parent password from DOB`, { 
                    originalDOB: parent.dateOfBirth, 
                    formattedPassword: parentPassword 
                });
                
                // Create new parent user using existing create method
                const parentUserData = {
                    username: parentUsername,
                    first_name: parent.firstName,
                    middle_name: null, // Not available in frontend
                    last_name: parent.lastName,
                    phone_number: parent.phone,
                    password_hash: parentPasswordHash, // Use bcrypt hash instead of SHA256
                    date_of_birth: parent.dateOfBirth || null,
                    role: 'Parent'
                };
                
                parentUser = await userModel.create(parentUserData, tenantId, client);
                logger.info(`MODEL: Created parent user`, { parentUsername, parentUserId: parentUser?.user_id });
                
                // Insert parent contact details
                await client.query(contactDetailsQuery, [
                    parentUser.username,
                    parent.email.trim(),
                    parent.phone?.trim() || null,
                    null, // alt_phone - not available in frontend
                    null, // current_address - not available in frontend
                    null, // city - not available in frontend
                    null, // state - not available in frontend
                    null, // pincode - not available in frontend
                    null, // country - not available in frontend
                    null  // permanent_address - not available in frontend
                ]);
                logger.info(`MODEL: Created parent contact details`);
                
                // Insert parent personal details with occupation and income
                const parentPersonalQuery = `
                    INSERT INTO user_personal_details (
                        username, gender, nationality, religion, caste, category, 
                        blood_group, height_cm, weight_kg, medical_conditions, allergies,
                        occupation, income
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                `;
                
                await client.query(parentPersonalQuery, [
                    parentUser.username,
                    null, // gender - not available in frontend
                    null, // nationality - not available in frontend
                    null, // religion - not available in frontend
                    null, // caste - not available in frontend
                    null, // category - not available in frontend
                    null, // blood_group - not available in frontend
                    null, // height_cm - not needed for parent
                    null, // weight_kg - not needed for parent
                    null, // medical_conditions - not available in frontend
                    null, // allergies - not available in frontend
                    parent.occupation?.trim() || null, // occupation - from frontend
                    parent.income ? parseFloat(parent.income) : null // income - from frontend
                ]);
                logger.info(`MODEL: Created parent personal details with occupation and income`);
                
                // Create parent user status
                await userModel.createUserStatus(parentUser.username, campusId, tenantId, client);
                logger.info(`MODEL: Created parent user status`);
                
                // Create student-parent relationship with emergency contact flag
                const relationshipType = parent.relation || parent.relationshipType || 'Parent';
                const relationshipQuery = `
                    INSERT INTO student_parent_relations (
                        tenant_id, campus_id, student_username, parent_username, relationship_type, is_emergency_contact
                    ) VALUES ($1, $2, $3, $4, $5, $6)
                    ON CONFLICT (campus_id, student_username, parent_username) 
                    DO UPDATE SET 
                        relationship_type = EXCLUDED.relationship_type,
                        is_emergency_contact = EXCLUDED.is_emergency_contact
                `;
                
                await client.query(relationshipQuery, [
                    tenantId,
                    campusId,
                    username,
                    parentUser.username,
                    relationshipType,
                    Boolean(parent.isEmergency) // Handle emergency contact flag
                ]);
                
                logger.info(`MODEL: Created student-parent relationship`, {
                    studentUsername: username,
                    parentUsername: parentUser.username,
                    relationshipType: relationshipType,
                    isEmergency: Boolean(parent.isEmergency)
                });
                
            } catch (error) {
                logger.error(`MODEL: Error processing parent ${index + 1}`, {
                    error: error.message,
                    errorCode: error.code,
                    errorConstraint: error.constraint,
                    parentEmail: parent.email
                });
                
                throw new Error(`Failed to create parent user: ${error.message}`);
            }
        }
        logger.info('MODEL: All parents processed successfully');
    } else {
        logger.info('MODEL: No parents to process');
    }
    
    const result = {
        username: username,
        user_id: createdUser.user_id,
        admission_number: enrollment.admission_number,
        enrollment: enrollment,
        first_name: createdUser.first_name,
        last_name: createdUser.last_name
    };
    
    logger.info('MODEL: Student creation completed successfully', {
        username: result.username,
        userId: result.user_id,
        admissionNumber: result.admission_number,
        resultKeys: Object.keys(result)
    });
    
    return result;
};

/**
 * Find student by admission number (updated for new schema)
 * @param {string} admissionNumber - Student's admission number
 * @param {string} tenantId - School/Tenant ID
 * @returns {Promise<Object|null>} Student object with enrollment info or null
 */
const findStudentByAdmissionNumber = async (admissionNumber, tenantId) => {
    const query = `
        SELECT 
            u.user_id, u.username, u.first_name, u.middle_name, u.last_name, 
            u.phone_number, u.date_of_birth, u.role, u.tenant_id,
            se.admission_number, se.admission_date, se.academic_year_id, 
            se.registration_number, se.admission_type, se.tc_number, se.scholarship_applied,
            upd.gender, upd.nationality, upd.religion, upd.caste, upd.category,
            upd.blood_group, upd.height_cm, upd.weight_kg, upd.medical_conditions,
            upd.allergies,
            ucd.email, ucd.phone as contact_phone, ucd.alt_phone, ucd.current_address,
            ucd.city, ucd.state, ucd.pincode, ucd.country, ucd.permanent_address
        FROM users u
        JOIN student_enrollment se ON se.username = u.username
        LEFT JOIN user_personal_details upd ON u.username = upd.username
        LEFT JOIN user_contact_details ucd ON u.username = ucd.username
        WHERE se.admission_number = $1 AND u.tenant_id = $2 AND u.role = 'Student'
        LIMIT 1
    `;
    
    try {
        const result = await pool.query(query, [admissionNumber, tenantId]);
        return result.rows[0] || null;
    } catch (error) {
        throw error;
    }
};

/**
 * Find student by username
 * @param {string} username - Student's username
 * @param {string} tenantId - School/Tenant ID
 * @returns {Promise<Object|null>} Student object with all details or null
 */
const findStudentByUsername = async (username, tenantId) => {
    const query = `
        SELECT 
            u.user_id, u.username, u.first_name, u.middle_name, u.last_name, 
            u.phone_number, u.date_of_birth, u.role, u.tenant_id, u.created_at, u.updated_at,
            se.admission_number, se.admission_date, se.academic_year_id, 
            se.registration_number, se.admission_type, se.tc_number, se.scholarship_applied, se.section_id, se.class_name, se.roll_number,
            upd.gender, upd.nationality, upd.religion, upd.caste, upd.category,
            upd.blood_group, upd.height_cm, upd.weight_kg, upd.medical_conditions,
            upd.allergies,
            ucd.email, ucd.phone as contact_phone, ucd.alt_phone, ucd.current_address,
            ucd.city, ucd.state, ucd.pincode, ucd.country, ucd.permanent_address,
            us.campus_id, us.status
        FROM users u
        LEFT JOIN student_enrollment se ON se.username = u.username
        LEFT JOIN user_personal_details upd ON u.username = upd.username
        LEFT JOIN user_contact_details ucd ON u.username = ucd.username
        LEFT JOIN user_statuses us ON u.username = us.username
        WHERE u.username = $1 AND u.tenant_id = $2 AND u.role = 'Student'
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
 * Get complete student data for editing (includes all related data)
 * @param {string} username - Student's username
 * @param {string} tenantId - School/Tenant ID
 * @returns {Promise<Object|null>} Complete student object with all details or null
 */
const getCompleteStudentData = async (username, tenantId) => {
    const query = `
        SELECT 
            u.user_id, u.username, u.first_name, u.middle_name, u.last_name, 
            u.phone_number, u.date_of_birth, u.role, u.tenant_id, u.created_at, u.updated_at,
            se.admission_number, se.admission_date, se.academic_year_id, 
            se.registration_number, se.admission_type, se.tc_number, se.scholarship_applied,
            se.previous_school, se.transport_details, se.hostel_details, se.class_name, se.section_id, se.roll_number,
            upd.gender, upd.nationality, upd.religion, upd.caste, upd.category,
            upd.blood_group, upd.height_cm, upd.weight_kg, upd.medical_conditions,
            upd.allergies,
            ucd.email, ucd.phone as contact_phone, ucd.alt_phone, ucd.current_address,
            ucd.city, ucd.state, ucd.pincode, ucd.country, ucd.permanent_address,
            us.campus_id, us.status,
            ay.year_name, ay.year_type, ay.medium,
            c.curriculum_name, c.curriculum_id,
            cs.section_name
        FROM users u
        LEFT JOIN student_enrollment se ON se.username = u.username
        LEFT JOIN user_personal_details upd ON u.username = upd.username
        LEFT JOIN user_contact_details ucd ON u.username = ucd.username
        LEFT JOIN user_statuses us ON u.username = us.username
        LEFT JOIN academic_years ay ON se.academic_year_id = ay.academic_year_id
        LEFT JOIN curricula c ON ay.curriculum_id = c.curriculum_id
        LEFT JOIN class_sections cs ON se.section_id = cs.section_id
        WHERE u.username = $1 AND u.tenant_id = $2 AND u.role = 'Student'
        LIMIT 1
    `;
    
    try {
        const result = await pool.query(query, [username, tenantId]);
        if (!result.rows[0]) {
            return null;
        }
        
        const student = result.rows[0];
        
        // Get parents for this student
        const parents = await getStudentParents(username, tenantId);
        
        // Return complete student data
        return {
            ...student,
            parents: parents || []
        };
    } catch (error) {
        throw error;
    }
};

/**
 * Get all students for a school with pagination and filters
 * @param {string} tenantId - School/Tenant ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Students list with pagination info
 */
const getAllStudents = async (tenantId, options = {}) => {
    const { 
        page = 1, 
        limit = 20, 
        search = '', 
        academic_year = '',
        curriculum = '',
        medium = '',
        status = 'active',
        class_id = '',
        section_id = '',
        campus_id = ''
    } = options;
    
    console.log('📋 MODEL getAllStudents called with:', {
        tenantId,
        page,
        limit,
        search,
        academic_year,
        curriculum,
        medium,
        status,
        class_id,
        section_id,
        campus_id
    });
    
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE u.tenant_id = $1 AND u.role = $2';
    let queryParams = [tenantId, 'Student'];
    let paramCounter = 3;
    
    // Add status filter
    if (status) {
        whereClause += ` AND us.status = $${paramCounter}`;
        queryParams.push(status);
        paramCounter++;
    }
    
    // Add class filter
    if (class_id) {
        if (/^\d+$/.test(class_id.toString().trim())) {
             const clsRes = await pool.query('SELECT class_name FROM classes WHERE class_id = $1', [class_id]);
             if (clsRes.rows.length > 0) {
                 whereClause += ` AND se.class_name = $${paramCounter}`;
                 queryParams.push(clsRes.rows[0].class_name);
                 paramCounter++;
             }
        } else {
             whereClause += ` AND se.class_name = $${paramCounter}`;
             queryParams.push(class_id);
             paramCounter++;
        }
    }

    // Add section filter
    if (section_id) {
        whereClause += ` AND se.section_id = $${paramCounter}`;
        queryParams.push(section_id);
        paramCounter++;
    }
    
    // Add campus filter
    if (campus_id) {
        whereClause += ` AND us.campus_id = $${paramCounter}`;
        queryParams.push(campus_id);
        paramCounter++;
    }
    
    // Add search filter
    if (search.trim()) {
        whereClause += ` AND (u.first_name ILIKE $${paramCounter} OR u.last_name ILIKE $${paramCounter} OR se.admission_number ILIKE $${paramCounter})`;
        queryParams.push(`%${search.trim()}%`);
        paramCounter++;
    }
    
    // Add academic year filter
    if (academic_year.trim()) {
        // Check if it's an ID or year name
        if (/^\d+$/.test(academic_year.trim())) {
            whereClause += ` AND ay.academic_year_id = $${paramCounter}`;
        } else {
            whereClause += ` AND ay.year_name = $${paramCounter}`;
        }
        queryParams.push(academic_year.trim());
        paramCounter++;
    }
    
    // Add curriculum filter
    if (curriculum.trim()) {
        whereClause += ` AND c.curriculum_name = $${paramCounter}`;
        queryParams.push(curriculum.trim());
        paramCounter++;
    }
    
    // Add medium filter
    if (medium.trim()) {
        whereClause += ` AND ay.medium = $${paramCounter}`;
        queryParams.push(medium.trim());
        paramCounter++;
    }
    
    const query = `
        SELECT DISTINCT
            u.user_id, u.username, u.first_name, u.middle_name, u.last_name, 
            u.phone_number, u.date_of_birth, u.created_at,
            se.admission_number, se.admission_date, se.academic_year_id, 
            se.registration_number, se.admission_type,
            se.class_name,
            upd.gender, upd.blood_group, upd.nationality,
            ucd.email, ucd.phone as contact_phone, ucd.city, ucd.state,
            us.campus_id, us.status,
            ay.year_name, ay.medium,
            c.curriculum_name
        FROM users u
        LEFT JOIN user_statuses us ON u.username = us.username
        LEFT JOIN student_enrollment se ON se.username = u.username AND u.role = 'Student'
        LEFT JOIN user_personal_details upd ON u.username = upd.username
        LEFT JOIN user_contact_details ucd ON u.username = ucd.username
        LEFT JOIN academic_years ay ON se.academic_year_id = ay.academic_year_id
        LEFT JOIN curricula c ON ay.curriculum_id = c.curriculum_id
        ${whereClause}
        ORDER BY u.created_at DESC, u.first_name ASC
        LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `;
    
    const countQuery = `
        SELECT COUNT(DISTINCT u.user_id) as total
        FROM users u
        LEFT JOIN user_statuses us ON u.username = us.username
        LEFT JOIN student_enrollment se ON se.username = u.username AND u.role = 'Student'
        LEFT JOIN academic_years ay ON se.academic_year_id = ay.academic_year_id
        LEFT JOIN curricula c ON ay.curriculum_id = c.curriculum_id
        ${whereClause}
    `;
    
    console.log('🔍 MODEL Final query:', query);
    console.log('🔢 MODEL Query params:', queryParams);
    
    try {
        const [studentsResult, countResult] = await Promise.all([
            pool.query(query, [...queryParams, limit, offset]),
            pool.query(countQuery, queryParams)
        ]);
        
        console.log('📊 MODEL Raw database results:');
        console.log('  - Students count from DB:', studentsResult.rows.length);
        console.log('  - Total count from DB:', countResult.rows[0].total);
        console.log('  - First few students:', studentsResult.rows.slice(0, 3).map(s => ({
            user_id: s.user_id,
            username: s.username,
            admission_number: s.admission_number,
            first_name: s.first_name,
            last_name: s.last_name
        })));
        
        // Check for duplicate user_ids
        const userIds = studentsResult.rows.map(s => s.user_id);
        const uniqueUserIds = [...new Set(userIds)];
        if (userIds.length !== uniqueUserIds.length) {
            console.log('⚠️  MODEL DUPLICATE USER_IDS DETECTED!');
            console.log('  - Total rows:', userIds.length);
            console.log('  - Unique user_ids:', uniqueUserIds.length);
            console.log('  - Duplicates:', userIds.filter((id, index) => userIds.indexOf(id) !== index));
        }
        
        // Check for duplicate usernames
        const usernames = studentsResult.rows.map(s => s.username);
        const uniqueUsernames = [...new Set(usernames)];
        if (usernames.length !== uniqueUsernames.length) {
            console.log('⚠️  MODEL DUPLICATE USERNAMES DETECTED!');
            console.log('  - Total rows:', usernames.length);
            console.log('  - Unique usernames:', uniqueUsernames.length);
            console.log('  - Duplicates:', usernames.filter((username, index) => usernames.indexOf(username) !== index));
        }
        
        const total = parseInt(countResult.rows[0].total);
        const totalPages = Math.ceil(total / limit);
        
        const result = {
            students: studentsResult.rows,
            pagination: {
                current_page: page,
                total_pages: totalPages,
                total_count: total,
                limit: limit,
                has_next: page < totalPages,
                has_prev: page > 1
            }
        };
        
        console.log('✅ MODEL Returning result with', result.students.length, 'students');
        return result;
        
    } catch (error) {
        console.error('❌ MODEL Database error:', error);
        throw error;
    }
};

/**
 * Update student information across multiple tables (Enhanced version)
 * @param {string} username - Student's username
 * @param {Object} updateData - Data to update
 * @param {string} tenantId - School/Tenant ID
 * @returns {Promise<Object|null>} Updated student object or null
 */
const updateStudent = async (username, updateData, tenantId) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        logger.info('MODEL: Starting student update transaction', { username, updateDataKeys: Object.keys(updateData) });
        
        // Get campus ID from user status for academic year resolution
        const campusQuery = `SELECT campus_id FROM user_statuses WHERE username = $1`;
        const campusResult = await client.query(campusQuery, [username]);
        const campusId = campusResult.rows[0]?.campus_id;
        
        // Update users table
        const userUpdates = {};
        if (updateData.firstName !== undefined) userUpdates.first_name = updateData.firstName;
        if (updateData.middleName !== undefined) userUpdates.middle_name = updateData.middleName;
        if (updateData.lastName !== undefined) userUpdates.last_name = updateData.lastName;
        if (updateData.phoneNumber !== undefined) userUpdates.phone_number = updateData.phoneNumber;
        if (updateData.dateOfBirth !== undefined) userUpdates.date_of_birth = updateData.dateOfBirth;
        
        if (Object.keys(userUpdates).length > 0) {
            logger.info('MODEL: Updating user table', { userUpdates });
            await userModel.editUser(username, userUpdates, client);
        }
        
        // Update student_enrollment table - ENHANCED with missing fields
        const enrollmentUpdates = {};
        
        // Handle academic year ID - resolve it properly if provided
        if (updateData.academic_year_id !== undefined) {
            const resolvedAcademicYearId = await resolveAcademicYearId(updateData.academic_year_id, campusId);
            if (resolvedAcademicYearId) {
                enrollmentUpdates.academic_year_id = resolvedAcademicYearId;
            } else {
                logger.warn('MODEL: Could not resolve academic year ID', { academic_year_id: updateData.academic_year_id });
            }
        }
        
        // Handle legacy field name
        if (updateData.academicYear !== undefined) {
            const resolvedAcademicYearId = await resolveAcademicYearId(updateData.academicYear, campusId);
            if (resolvedAcademicYearId) {
                enrollmentUpdates.academic_year_id = resolvedAcademicYearId;
            } else {
                logger.warn('MODEL: Could not resolve academic year ID from academicYear', { academicYear: updateData.academicYear });
            }
        }
        
        // ✅ MISSING FIELD FIXED: Admission Date
        if (updateData.admissionDate !== undefined) {
            enrollmentUpdates.admission_date = updateData.admissionDate;
        }
        
        // Handle class updates
        if (updateData.class !== undefined) {
            enrollmentUpdates.class_name = updateData.class;
        }
        
        // Handle transport and hostel details
        if (updateData.transportMode !== undefined) {
            enrollmentUpdates.transport_details = updateData.transportMode;
        }
        if (updateData.hostelRequired !== undefined) {
            enrollmentUpdates.hostel_details = (updateData.hostelRequired === 'Yes' || updateData.hostelRequired === true) ? 'Required' : 'Not Required';
        }
        
        // Handle other enrollment fields
        if (updateData.registrationNumber !== undefined) enrollmentUpdates.registration_number = updateData.registrationNumber;
        if (updateData.admissionType !== undefined) enrollmentUpdates.admission_type = updateData.admissionType;
        if (updateData.transferCertificateNumber !== undefined) enrollmentUpdates.tc_number = updateData.transferCertificateNumber;
        if (updateData.scholarshipApplied !== undefined) {
            enrollmentUpdates.scholarship_applied = (updateData.scholarshipApplied === 'Yes' || updateData.scholarshipApplied === true);
        }
        if (updateData.previousSchool !== undefined) enrollmentUpdates.previous_school = updateData.previousSchool;
        
        if (Object.keys(enrollmentUpdates).length > 0) {
            const enrollmentFields = Object.keys(enrollmentUpdates)
                .map((key, index) => `${key} = $${index + 2}`)
                .join(', ');
            
            const enrollmentQuery = `
                UPDATE student_enrollment 
                SET ${enrollmentFields}
                WHERE username = $1
            `;
            
            logger.info('MODEL: Updating enrollment table', { enrollmentUpdates });
            
            try {
                await client.query(enrollmentQuery, [username, ...Object.values(enrollmentUpdates)]);
            } catch (enrollmentError) {
                // Handle unique constraint violations with specific error messages
                if (enrollmentError.code === '23505') {
                    if (enrollmentError.constraint === 'uq_campus_registration') {
                        throw new Error(`This registration number (${updateData.registrationNumber}) already exists in this campus`);
                    }
                    if (enrollmentError.constraint === 'uq_campus_tc') {
                        throw new Error(`This TC number (${updateData.transferCertificateNumber}) already exists in this campus`);
                    }
                }
                throw enrollmentError;
            }
        }
        
        // Update user_personal_details table
        const personalUpdates = {};
        if (updateData.gender !== undefined) personalUpdates.gender = updateData.gender;
        if (updateData.nationality !== undefined) personalUpdates.nationality = updateData.nationality;
        if (updateData.religion !== undefined) personalUpdates.religion = updateData.religion;
        if (updateData.caste !== undefined) personalUpdates.caste = updateData.caste;
        if (updateData.category !== undefined) personalUpdates.category = updateData.category;
        if (updateData.bloodGroup !== undefined) personalUpdates.blood_group = updateData.bloodGroup;
        if (updateData.height !== undefined) personalUpdates.height_cm = updateData.height;
        if (updateData.weight !== undefined) personalUpdates.weight_kg = updateData.weight;
        if (updateData.medicalConditions !== undefined) personalUpdates.medical_conditions = updateData.medicalConditions;
        if (updateData.allergies !== undefined) personalUpdates.allergies = updateData.allergies;
        
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
        
        // Update user_contact_details table
        const contactUpdates = {};
        if (updateData.email !== undefined) contactUpdates.email = updateData.email;
        if (updateData.phone !== undefined) contactUpdates.phone = updateData.phone;
        if (updateData.alternatePhoneNumber !== undefined) contactUpdates.alt_phone = updateData.alternatePhoneNumber;
        if (updateData.currentAddress !== undefined) contactUpdates.current_address = updateData.currentAddress;
        if (updateData.city !== undefined) contactUpdates.city = updateData.city;
        if (updateData.state !== undefined) contactUpdates.state = updateData.state;
        if (updateData.pincode !== undefined) contactUpdates.pincode = updateData.pincode;
        if (updateData.country !== undefined) contactUpdates.country = updateData.country;
        if (updateData.permanentAddress !== undefined) contactUpdates.permanent_address = updateData.permanentAddress;
        
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
        
        // Handle parent updates - IMPROVED VERSION WITH PROPER UPDATE LOGIC
        if (updateData.parents !== undefined && Array.isArray(updateData.parents)) {
            logger.info('MODEL: Updating parent relationships with proper update logic', { parentCount: updateData.parents.length });
            
            // Get existing parents for this student
            const existingParentsQuery = `
                SELECT DISTINCT spr.parent_username, u.user_id, u.first_name, u.last_name, ucd.email, upd.occupation, upd.income
                FROM student_parent_relations spr
                JOIN users u ON spr.parent_username = u.username
                LEFT JOIN user_contact_details ucd ON u.username = ucd.username
                LEFT JOIN user_personal_details upd ON u.username = upd.username
                WHERE spr.student_username = $1 AND spr.tenant_id = $2
            `;
            const existingParentsResult = await client.query(existingParentsQuery, [username, tenantId]);
            const existingParents = existingParentsResult.rows;
            
            logger.info('MODEL: Found existing parents', { 
                existingParentCount: existingParents.length,
                existingParents: existingParents.map(p => ({ username: p.parent_username, email: p.email }))
            });
            
            // Track which parents to keep, update, or create
            const parentsToKeep = [];
            const parentsToUpdate = [];
            const parentsToCreate = [];
            
            // Process each parent from the update data
            for (const [index, parent] of updateData.parents.entries()) {
                logger.info(`MODEL: Processing parent ${index + 1} for update`, {
                    firstName: parent.firstName,
                    lastName: parent.lastName,
                    email: parent.email,
                    phone: parent.phone,
                    relation: parent.relation,
                    isEmergency: parent.isEmergency
                });
                
                // Try to find an existing parent by email and name match
                const existingParent = existingParents.find(ep => 
                    ep.email && parent.email && 
                    ep.email.toLowerCase() === parent.email.toLowerCase() &&
                    ep.first_name.toLowerCase() === parent.firstName.toLowerCase() &&
                    ep.last_name.toLowerCase() === parent.lastName.toLowerCase()
                );
                
                if (existingParent) {
                    // Parent exists - mark for update
                    logger.info(`MODEL: Found existing parent to update`, { 
                        parentUsername: existingParent.parent_username,
                        email: existingParent.email 
                    });
                    parentsToKeep.push(existingParent.parent_username);
                    parentsToUpdate.push({ existingParent, newData: parent });
                } else {
                    // Parent doesn't exist - mark for creation
                    logger.info(`MODEL: Parent not found, will create new`, { 
                        email: parent.email,
                        firstName: parent.firstName 
                    });
                    parentsToCreate.push(parent);
                }
            }
            
            // Remove parent relationships that are no longer needed
            const parentsToRemove = existingParents.filter(ep => !parentsToKeep.includes(ep.parent_username));
            
            logger.info('MODEL: Parent update plan', {
                parentsToKeep: parentsToKeep.length,
                parentsToUpdate: parentsToUpdate.length,
                parentsToCreate: parentsToCreate.length,
                parentsToRemove: parentsToRemove.length
            });
            
            // 1. Remove relationships for parents that are no longer needed
            if (parentsToRemove.length > 0) {
                logger.info('MODEL: Removing obsolete parent relationships');
                for (const parentToRemove of parentsToRemove) {
                    await client.query(
                        'DELETE FROM student_parent_relations WHERE student_username = $1 AND parent_username = $2 AND tenant_id = $3',
                        [username, parentToRemove.parent_username, tenantId]
                    );
                    logger.info('MODEL: Removed parent relationship', { parentUsername: parentToRemove.parent_username });
                }
            }
            
            // 2. Update existing parents
            for (const { existingParent, newData } of parentsToUpdate) {
                logger.info(`MODEL: Updating existing parent`, { 
                    parentUsername: existingParent.parent_username,
                    email: existingParent.email 
                });
                
                try {
                    // Update parent user basic info
                    const parentUserUpdates = {};
                    if (newData.firstName !== existingParent.first_name) parentUserUpdates.first_name = newData.firstName;
                    if (newData.lastName !== existingParent.last_name) parentUserUpdates.last_name = newData.lastName;
                    if (newData.phone) parentUserUpdates.phone_number = newData.phone;
                    if (newData.dateOfBirth) parentUserUpdates.date_of_birth = newData.dateOfBirth;
                    
                    if (Object.keys(parentUserUpdates).length > 0) {
                        await userModel.editUser(existingParent.parent_username, parentUserUpdates, client);
                        logger.info('MODEL: Updated parent user info', { parentUserUpdates });
                    }
                    
                    // Update parent contact details
                    const parentContactUpdates = {};
                    if (newData.email !== existingParent.email) parentContactUpdates.email = newData.email;
                    if (newData.phone) parentContactUpdates.phone = newData.phone;
                    
                    if (Object.keys(parentContactUpdates).length > 0) {
                        const contactFields = Object.keys(parentContactUpdates)
                            .map((key, idx) => `${key} = $${idx + 2}`)
                            .join(', ');
                        
                        await client.query(`
                            UPDATE user_contact_details 
                            SET ${contactFields}
                            WHERE username = $1
                        `, [existingParent.parent_username, ...Object.values(parentContactUpdates)]);
                        
                        logger.info('MODEL: Updated parent contact details', { parentContactUpdates });
                    }
                    
                    // Update parent personal details (occupation, income)
                    const parentPersonalUpdates = {};
                    if (newData.occupation !== existingParent.occupation) parentPersonalUpdates.occupation = newData.occupation || null;
                    if (newData.income && parseFloat(newData.income) !== existingParent.income) parentPersonalUpdates.income = parseFloat(newData.income);
                    
                    if (Object.keys(parentPersonalUpdates).length > 0) {
                        const personalFields = Object.keys(parentPersonalUpdates)
                            .map((key, idx) => `${key} = $${idx + 2}`)
                            .join(', ');
                        
                        await client.query(`
                            UPDATE user_personal_details 
                            SET ${personalFields}
                            WHERE username = $1
                        `, [existingParent.parent_username, ...Object.values(parentPersonalUpdates)]);
                        
                        logger.info('MODEL: Updated parent personal details', { parentPersonalUpdates });
                    }
                    
                    // Update relationship type and emergency contact flag
                    const relationshipType = newData.relation || newData.relationshipType || 'Parent';
                    await client.query(`
                        UPDATE student_parent_relations 
                        SET relationship_type = $1, is_emergency_contact = $2
                        WHERE student_username = $3 AND parent_username = $4 AND tenant_id = $5
                    `, [relationshipType, Boolean(newData.isEmergency), username, existingParent.parent_username, tenantId]);
                    
                    logger.info(`MODEL: Updated parent relationship`, {
                        parentUsername: existingParent.parent_username,
                        relationshipType: relationshipType,
                        isEmergency: Boolean(newData.isEmergency)
                    });
                    
                } catch (error) {
                    logger.error(`MODEL: Error updating existing parent`, {
                        error: error.message,
                        parentUsername: existingParent.parent_username,
                        parentEmail: existingParent.email
                    });
                    throw new Error(`Failed to update parent ${existingParent.email}: ${error.message}`);
                }
            }
            
            // 3. Create new parents
            for (const [index, parent] of parentsToCreate.entries()) {
                logger.info(`MODEL: Creating new parent ${index + 1}`, {
                    firstName: parent.firstName,
                    lastName: parent.lastName,
                    email: parent.email,
                    phone: parent.phone,
                    relation: parent.relation,
                    isEmergency: parent.isEmergency
                });
                
                try {
                    // Generate unique username for new parent
                    let parentUsername;
                    let parentIsUnique = false;

                    while (!parentIsUnique) {
                        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                        let uniqueId = '';
                        for (let i = 0; i < 7; i++) {
                            uniqueId += chars.charAt(Math.floor(Math.random() * chars.length));
                        }
                        parentUsername = `pa-${uniqueId}`;

                        const existing = await userModel.findByUsername(parentUsername, client);
                        if (!existing) {
                            parentIsUnique = true;
                        }
                    }
                    
                    // Create password hash from parent's date of birth using bcrypt (not SHA256)
                    // Convert date to YYYYMMDD format for consistent password format
                    let parentPassword;
                    if (parent.dateOfBirth) {
                        const parentDobDate = new Date(parent.dateOfBirth);
                        parentPassword = `${parentDobDate.getFullYear()}${String(parentDobDate.getMonth() + 1).padStart(2, '0')}${String(parentDobDate.getDate()).padStart(2, '0')}`;
                    } else {
                        parentPassword = parent.phone || 'default123';
                    }
                    const parentPasswordHash = await bcrypt.hash(parentPassword, 10); // Proper bcrypt hashing
                    
                    logger.info(`MODEL: Generated parent password from DOB`, { 
                        originalDOB: parent.dateOfBirth, 
                        formattedPassword: parentPassword 
                    });
                    
                    // Create new parent user
                    const parentUserData = {
                        username: parentUsername,
                        first_name: parent.firstName,
                        middle_name: null,
                        last_name: parent.lastName,
                        phone_number: parent.phone,
                        password_hash: parentPasswordHash,
                        date_of_birth: parent.dateOfBirth || null,
                        role: 'Parent'
                    };
                    
                    const parentUser = await userModel.create(parentUserData, tenantId, client);
                    
                    // Insert parent contact details
                    await client.query(`
                        INSERT INTO user_contact_details (
                            username, email, phone, alt_phone, current_address, 
                            city, state, pincode, country, permanent_address
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                    `, [
                        parentUser.username,
                        parent.email.trim(),
                        parent.phone?.trim() || null,
                        null, null, null, null, null, null, null
                    ]);
                    
                    // Insert parent personal details with occupation and income
                    await client.query(`
                        INSERT INTO user_personal_details (
                            username, gender, nationality, religion, caste, category, 
                            blood_group, height_cm, weight_kg, medical_conditions, allergies,
                            occupation, income
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                    `, [
                        parentUser.username, null, null, null, null, null, null, null, null, null, null,
                        parent.occupation?.trim() || null,
                        parent.income ? parseFloat(parent.income) : null
                    ]);
                    
                    // Create parent user status
                    await userModel.createUserStatus(parentUser.username, campusId, tenantId, client);
                    
                    // Create student-parent relationship with emergency contact flag
                    const relationshipType = parent.relation || parent.relationshipType || 'Parent';
                    await client.query(`
                        INSERT INTO student_parent_relations (
                            tenant_id, campus_id, student_username, parent_username, relationship_type, is_emergency_contact
                        ) VALUES ($1, $2, $3, $4, $5, $6)
                    `, [
                        tenantId, campusId, username, parentUser.username, relationshipType, Boolean(parent.isEmergency)
                    ]);
                    
                    logger.info(`MODEL: Created new parent successfully`, {
                        parentUsername: parentUser.username,
                        relationshipType: relationshipType,
                        isEmergency: Boolean(parent.isEmergency)
                    });
                    
                } catch (error) {
                    logger.error(`MODEL: Error creating new parent`, {
                        error: error.message,
                        parentEmail: parent.email
                    });
                    throw new Error(`Failed to create parent ${parent.email}: ${error.message}`);
                }
            }
            
            logger.info('MODEL: Parent update completed successfully', {
                updated: parentsToUpdate.length,
                created: parentsToCreate.length,
                removed: parentsToRemove.length
            });
        }
        
        await client.query('COMMIT');
        logger.info('MODEL: Student update transaction committed successfully');
        
        // Return updated student
        return await findStudentByUsername(username, tenantId);
        
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error('MODEL: Student update transaction failed, rolled back', { error: error.message });
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Delete student (hard delete with proper cleanup)
 * @param {string} username - Student's username
 * @returns {Promise<boolean>} True if student was deleted
 */
const deleteStudent = async (username) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        logger.info('MODEL: Starting hard delete transaction for student', { username });
        
        // Step 1: Get student details
        const studentQuery = `
            SELECT u.username, u.user_id 
            FROM users u
            WHERE u.username = $1 AND u.role = 'Student'
        `;
        const studentResult = await client.query(studentQuery, [username]);
        
        if (studentResult.rows.length === 0) {
            throw new Error('Student not found');
        }
        
        const student = studentResult.rows[0];
        logger.info('MODEL: Found student for deletion', { username: student.username, userId: student.user_id });
        
        // Step 2: Get all parents of this student
        const parentsQuery = `
            SELECT DISTINCT spr.parent_username
            FROM student_parent_relations spr
            WHERE spr.student_username = $1
        `;
        const parentsResult = await client.query(parentsQuery, [username]);
        const parentUsernames = parentsResult.rows.map(row => row.parent_username);
        
        logger.info('MODEL: Found parents for student', { 
            parentCount: parentUsernames.length, 
            parents: parentUsernames 
        });
        
        // Step 3: Filter parents who are ONLY parents of this student (not other students)
        let parentsToDelete = [];
        if (parentUsernames.length > 0) {
            const parentFilterQuery = `
                SELECT DISTINCT parent_username
                FROM student_parent_relations spr
                WHERE parent_username = ANY($1::text[])
                AND student_username != $2
            `;
            const parentsWithOtherStudentsResult = await client.query(parentFilterQuery, [
                parentUsernames, 
                username
            ]);
            const parentsWithOtherStudents = parentsWithOtherStudentsResult.rows.map(row => row.parent_username);
            
            // Filter out parents who have other students
            parentsToDelete = parentUsernames.filter(parentUsername => 
                !parentsWithOtherStudents.includes(parentUsername)
            );
            
            logger.info('MODEL: Filtered parents for deletion', {
                allParents: parentUsernames,
                parentsWithOtherStudents: parentsWithOtherStudents,
                parentsToDelete: parentsToDelete
            });
        }
        
        // Step 4: Delete student from student_enrollment table
        logger.info('MODEL: Deleting from student_enrollment');
        await client.query(
            'DELETE FROM student_enrollment WHERE username = $1',
            [username]
        );
        
        // Step 5: Delete student-parent relationships
        logger.info('MODEL: Deleting student-parent relationships');
        await client.query(
            'DELETE FROM student_parent_relations WHERE student_username = $1',
            [username]
        );
        
        // Step 6: Delete parent users who are only parents of this student
        if (parentsToDelete.length > 0) {
            logger.info('MODEL: Deleting parent-only users', { parentsToDelete });
            
            for (const parentUsername of parentsToDelete) {
                // Delete from user_contact_details
                await client.query(
                    'DELETE FROM user_contact_details WHERE username = $1',
                    [parentUsername]
                );
                
                // Delete from user_personal_details
                await client.query(
                    'DELETE FROM user_personal_details WHERE username = $1',
                    [parentUsername]
                );
                
                // Delete from user_statuses
                await client.query(
                    'DELETE FROM user_statuses WHERE username = $1',
                    [parentUsername]
                );
                
                // Delete from users table
                await client.query(
                    'DELETE FROM users WHERE username = $1 AND role = $2',
                    [parentUsername, 'Parent']
                );
                
                logger.info('MODEL: Deleted parent user', { parentUsername });
            }
        }
        
        // Step 7: Delete student user details
        logger.info('MODEL: Deleting student user details');
        
        // Delete from user_contact_details
        await client.query(
            'DELETE FROM user_contact_details WHERE username = $1',
            [username]
        );
        
        // Delete from user_personal_details
        await client.query(
            'DELETE FROM user_personal_details WHERE username = $1',
            [username]
        );
        
        // Delete from user_statuses
        await client.query(
            'DELETE FROM user_statuses WHERE username = $1',
            [username]
        );
        
        // Step 8: Finally delete the student from users table
        logger.info('MODEL: Deleting student from users table');
        await client.query(
            'DELETE FROM users WHERE username = $1 AND role = $2',
            [username, 'Student']
        );
        
        await client.query('COMMIT');
        logger.info('MODEL: Student hard delete transaction completed successfully', {
            deletedStudent: username,
            deletedParents: parentsToDelete,
            keptParents: parentUsernames.filter(p => !parentsToDelete.includes(p))
        });
        
        return true;
        
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error('MODEL: Student hard delete transaction failed, rolled back', { 
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
 * Check if admission number is unique within school
 * @param {string} admissionNumber - Admission number to check
 * @param {string} tenantId - School/Tenant ID
 * @param {string} excludeUsername - Username to exclude from check (for updates)
 * @returns {Promise<boolean>} True if admission number is available
 */
const isAdmissionNumberUnique = async (admissionNumber, tenantId, excludeUsername = null) => {
    let query = `
        SELECT 1 FROM student_enrollment se
        WHERE se.admission_number = $1
    `;
    const params = [admissionNumber];
    
    if (excludeUsername) {
        query += ` AND se.admission_number NOT IN (
            SELECT se2.admission_number FROM student_enrollment se2
            JOIN users u ON u.role = 'Student'
            WHERE u.username = $2 AND u.tenant_id = $3
        )`;
        params.push(excludeUsername, tenantId);
    }
    
    try {
        const result = await pool.query(query, params);
        return result.rows.length === 0;
    } catch (error) {
        throw error;
    }
};

/**
 * Get parents for a student
 * @param {string} studentUsername - Student's username
 * @param {string} tenantId - School/Tenant ID
 * @returns {Promise<Array>} Array of parent objects
 */
const getStudentParents = async (studentUsername, tenantId) => {
    const query = `
        SELECT 
            u.user_id, u.username, u.first_name, u.middle_name, u.last_name, 
            u.phone_number, u.date_of_birth, u.role,
            ucd.email, ucd.phone as contact_phone, ucd.alt_phone, ucd.current_address,
            ucd.city, ucd.state, ucd.pincode, ucd.country, ucd.permanent_address,
            upd.gender, upd.nationality, upd.religion, upd.occupation, upd.income,
            spr.relationship_type, spr.is_emergency_contact
        FROM student_parent_relations spr
        JOIN users u ON spr.parent_username = u.username
        LEFT JOIN user_contact_details ucd ON u.username = ucd.username
        LEFT JOIN user_personal_details upd ON u.username = upd.username
        WHERE spr.student_username = $1 AND spr.tenant_id = $2
        ORDER BY spr.relationship_type, u.first_name
    `;
    
    try {
        const result = await pool.query(query, [studentUsername, tenantId]);
        return result.rows;
    } catch (error) {
        throw error;
    }
};

/**
 * Get students for a parent
 * @param {string} parentUsername - Parent's username
 * @param {string} tenantId - School/Tenant ID
 * @returns {Promise<Array>} Array of student objects
 */
const getParentStudents = async (parentUsername, tenantId) => {
    const query = `
        SELECT 
            u.user_id, u.username, u.first_name, u.middle_name, u.last_name, 
            u.phone_number, u.date_of_birth, u.role,
            se.admission_number, se.admission_date, se.academic_year_id,
            ucd.email, ucd.phone as contact_phone,
            spr.relationship_type
        FROM student_parent_relations spr
        JOIN users u ON spr.student_username = u.username
        LEFT JOIN student_enrollment se ON se.username = u.username
        LEFT JOIN user_contact_details ucd ON u.username = ucd.username
        WHERE spr.parent_username = $1 AND spr.tenant_id = $2
        ORDER BY u.first_name
    `;
    
    try {
        const result = await pool.query(query, [parentUsername, tenantId]);
        return result.rows;
    } catch (error) {
        throw error;
    }
};

/**
 * Add parent to student
 * @param {string} studentUsername - Student's username
 * @param {string} parentUsername - Parent's username
 * @param {string} relationshipType - Type of relationship
 * @param {string} tenantId - School/Tenant ID
 * @param {string} campusId - Campus ID
 * @returns {Promise<Object>} Created relationship
 */
const addParentToStudent = async (studentUsername, parentUsername, relationshipType, tenantId, campusId) => {
    const query = `
        INSERT INTO student_parent_relations (
            tenant_id, campus_id, student_username, parent_username, relationship_type
        ) VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (campus_id, student_username, parent_username) 
        DO UPDATE SET relationship_type = EXCLUDED.relationship_type
        RETURNING *
    `;
    
    try {
        const result = await pool.query(query, [tenantId, campusId, studentUsername, parentUsername, relationshipType]);
        return result.rows[0];
    } catch (error) {
        throw error;
    }
};

/**
 * Remove parent from student
 * @param {string} studentUsername - Student's username
 * @param {string} parentUsername - Parent's username
 * @param {string} tenantId - School/Tenant ID
 * @returns {Promise<boolean>} True if relationship was removed
 */
const removeParentFromStudent = async (studentUsername, parentUsername, tenantId) => {
    const query = `
        DELETE FROM student_parent_relations 
        WHERE student_username = $1 AND parent_username = $2 AND tenant_id = $3
    `;
    
    try {
        const result = await pool.query(query, [studentUsername, parentUsername, tenantId]);
        return result.rowCount > 0;
    } catch (error) {
        throw error;
    }
};

/**
 * Update parent relationship type
 * @param {string} studentUsername - Student's username
 * @param {string} parentUsername - Parent's username
 * @param {string} relationshipType - New relationship type
 * @param {string} tenantId - School/Tenant ID
 * @returns {Promise<Object|null>} Updated relationship or null
 */
const updateParentRelationship = async (studentUsername, parentUsername, relationshipType, tenantId) => {
    const query = `
        UPDATE student_parent_relations 
        SET relationship_type = $1
        WHERE student_username = $2 AND parent_username = $3 AND tenant_id = $4
        RETURNING *
    `;
    
    try {
        const result = await pool.query(query, [relationshipType, studentUsername, parentUsername, tenantId]);
        return result.rows[0] || null;
    } catch (error) {
        throw error;
    }
};

/**
 * Get active students by section for a specific academic year and campus
 * @param {string} tenantId - Tenant ID
 * @param {string} campusId - Campus ID
 * @param {string|number} academicYearId - Academic Year ID
 * @param {string|number} classId - Class ID (optional but recommended)
 * @param {string|number} sectionId - Section ID
 * @returns {Promise<Array>} List of active students with details
 */
const getStudentsBySection = async (tenantId, campusId, academicYearId, classId, sectionId) => {
    logger.info('MODEL: Getting students by section', { 
        tenantId, campusId, academicYearId, classId, sectionId 
    });

    try {
        let whereClause = `
            WHERE u.tenant_id = $1 
            AND us.campus_id = $2
            AND u.role = 'Student'
            AND us.status = 'active'
        `;
        
        const queryParams = [tenantId, campusId];
        let paramCounter = 3;

        // Add academic year filter
        if (academicYearId) {
            whereClause += ` AND se.academic_year_id = $${paramCounter}`;
            queryParams.push(academicYearId);
            paramCounter++;
        }

        // Add section filter
        if (sectionId) {
            whereClause += ` AND se.section_id = $${paramCounter}`;
            queryParams.push(sectionId);
            paramCounter++;
        }

        // Add class filter (optional but good for validation)
        if (classId) {
             // If classId is provided, we can filter by class_id directly if available in student_enrollment
             // Or join with classes table. The current schema shows student_enrollment has class_name but not class_id directly linked easily without join
             // However, based on schema reading: student_enrollment has class_name referencing classes(class_name)
             // AND section_id referencing class_sections(section_id)
             
             // Let's assume classId passed is the ID, we might need to resolve it to name if we filter by name, 
             // but filtering by section_id should implicitly filter by class as sections belong to classes.
             // But to be safe and explicit as requested:
             
             // If classId is numeric, we might need to join or just rely on section_id being unique enough
             // For now, if section_id is present, it is the strongest filter.
        }

        const query = `
            SELECT 
                u.user_id,
                u.username,
                u.first_name,
                u.middle_name,
                u.last_name,
                se.admission_number,
                se.roll_number,
                se.class_name,
                se.section_id,
                us.status
            FROM users u
            JOIN user_statuses us ON u.username = us.username
            JOIN student_enrollment se ON u.username = se.username
            ${whereClause}
            ORDER BY 
                se.roll_number ASC,
                u.first_name ASC
        `;

        logger.info('MODEL: getStudentsBySection Query', { query, queryParams });

        const result = await pool.query(query, queryParams);
        
        logger.info(`MODEL: Found ${result.rows.length} students in section`);
        
        return result.rows;

    } catch (error) {
        logger.error('MODEL: Error getting students by section', error);
        throw error;
    }
};

module.exports = {
    createStudentWithClient,
    findStudentByAdmissionNumber,
    findStudentByUsername,
    getCompleteStudentData,
    getAllStudents,
    updateStudent,
    deleteStudent,
    isAdmissionNumberUnique,
    getMainCampusId,
    getAnyCampusId,
    getStudentParents,
    getParentStudents,
    addParentToStudent,
    removeParentFromStudent,
    updateParentRelationship,
    resolveAcademicYearId,
    getStudentsBySection // Export the new method
};
