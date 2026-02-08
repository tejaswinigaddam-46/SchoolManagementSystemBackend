const studentModel = require('../models/student.model');
const userModel = require('../models/user.model');
const { pool } = require('../config/database');
const logger = require('../utils/logger');
const feeService = require('./fee.service');

// ==================== STUDENT SERVICE METHODS ====================

/**
 * Register a new student with transactional integrity
 * @param {Object} studentData - Complete student data from frontend
 * @param {string} tenantId - School/Tenant ID
 * @param {string} campusId - Campus ID
 * @returns {Promise<Object>} Created student with enrollment info
 * @throws {Error} If validation fails or database operation fails
 */
const registerStudent = async (studentData, tenantId, campusId) => {
    logger.info('=== SERVICE: Starting student registration ===', {
        tenantId,
        campusId,
        admissionNumber: studentData?.admissionNumber,
        firstName: studentData?.firstName,
        lastName: studentData?.lastName,
        email: studentData?.email,
        hasStudentData: !!studentData,
        studentDataKeys: Object.keys(studentData || {})
    });

    // Validate required fields
    logger.info('SERVICE: Validating required fields');
    
    if (!studentData.firstName?.trim()) {
        logger.error('SERVICE: First name validation failed');
        throw new Error('First name is required');
    }
    
    if (!studentData.lastName?.trim()) {
        logger.error('SERVICE: Last name validation failed');
        throw new Error('Last name is required');
    }
    
    if (!studentData.admissionNumber?.trim()) {
        logger.error('SERVICE: Admission number validation failed');
        throw new Error('Admission number is required');
    }
    
    if (!studentData.dateOfBirth) {
        logger.error('SERVICE: Date of birth validation failed');
        throw new Error('Date of birth is required');
    }
    
    // Email is now mandatory for student registration
    if (!studentData.email?.trim()) {
        logger.error('SERVICE: Email validation failed');
        throw new Error('Email is required for student registration');
    }
    
    // Handle both academic_year_id and academicYearId field names
    const academicYearInput = studentData.academic_year_id || studentData.academicYearId;
    if (!academicYearInput) {
        logger.error('SERVICE: Academic year ID validation failed', {
            academic_year_id: studentData.academic_year_id,
            academicYearId: studentData.academicYearId
        });
        throw new Error('Academic year is required');
    }
    
    // Normalize the academic year field in studentData for the model
    studentData.academic_year_id = academicYearInput;
    
    logger.info('SERVICE: All required fields validated successfully', {
        academic_year_id: studentData.academic_year_id
    });

    // Validate date of birth
    logger.info('SERVICE: Validating date of birth');
    const dob = new Date(studentData.dateOfBirth);
    if (isNaN(dob.getTime())) {
        logger.error('SERVICE: Invalid date of birth format', {
            dateOfBirth: studentData.dateOfBirth
        });
        throw new Error('Invalid date of birth');
    }
    
    // Check if student is at least 3 years old and not more than 85 years old
    const age = Math.floor((new Date() - dob) / (365.25 * 24 * 60 * 60 * 1000));
    if (age < 3 || age > 85) {
        logger.error('SERVICE: Age validation failed', {
            age,
            dateOfBirth: studentData.dateOfBirth
        });
        throw new Error('Student age must be between 3 and 85 years');
    }
    
    logger.info('SERVICE: Date of birth and age validated successfully', { age });
    
    // Validate phone number if provided
    if (studentData.phoneNumber && studentData.phoneNumber.trim()) {
        logger.info('SERVICE: Validating phone number');
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        if (!phoneRegex.test(studentData.phoneNumber.replace(/[\s\-\(\)]/g, ''))) {
            logger.error('SERVICE: Phone number validation failed', {
                phoneNumber: studentData.phoneNumber
            });
            throw new Error('Invalid phone number format');
        }
        logger.info('SERVICE: Phone number validated successfully');
    }
    
    // Validate email format
    logger.info('SERVICE: Validating email format');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(studentData.email.trim())) {
        logger.error('SERVICE: Email format validation failed', {
            email: studentData.email
        });
        throw new Error('Invalid email format');
    }
    logger.info('SERVICE: Email format validated successfully');
    
    // Check if admission number is unique using the new schema
    logger.info('SERVICE: Checking admission number uniqueness');
    try {
        const existingStudent = await studentModel.findStudentByAdmissionNumber(
            studentData.admissionNumber.trim(), 
            tenantId
        );
        if (existingStudent) {
            logger.error('SERVICE: Admission number already exists', {
                admissionNumber: studentData.admissionNumber,
                existingStudent: existingStudent.username
            });
            throw new Error('Admission number already exists');
        }
        logger.info('SERVICE: Admission number is unique');
    } catch (error) {
        if (error.message === 'Admission number already exists') {
            throw error;
        }
        logger.error('SERVICE: Error checking admission number uniqueness', {
            error: error.message,
            admissionNumber: studentData.admissionNumber
        });
        throw new Error(`Failed to validate admission number: ${error.message}`);
    }

    // Start transaction for all database operations
    logger.info('SERVICE: Starting database transaction');
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        logger.info('SERVICE: Transaction started successfully');
        
        // Create student using the new schema
        logger.info('SERVICE: Calling studentModel.createStudentWithClient', {
            tenantId,
            campusId,
            admissionNumber: studentData.admissionNumber
        });
        
        const studentResult = await studentModel.createStudentWithClient(client, studentData, tenantId, campusId);
        
        // After enrollment creation, auto-assign fees in the same transaction
        try {
            const enrollment = studentResult?.enrollment;
            if (enrollment?.academic_year_id && enrollment?.class_name) {
                await feeService.assignFeesForEnrollmentWithClient(client, {
                    tenant_id: tenantId,
                    campus_id: campusId,
                    academic_year_id: enrollment.academic_year_id,
                    class_name: enrollment.class_name,
                    username: studentResult.username
                });
            }
        } catch (feeErr) {
            logger.warn('SERVICE: Fee assignment skipped/failed (non-blocking)', { error: feeErr.message });
        }
        
        logger.info('SERVICE: Student created successfully by model', {
            username: studentResult?.username,
            admissionNumber: studentResult?.admission_number,
            userId: studentResult?.user_id
        });
        
        await client.query('COMMIT');
        logger.info('SERVICE: Transaction committed successfully');
        
        const transformedResult = transformStudentToFrontendNewSchema(studentResult);
        logger.info('SERVICE: Student data transformed for frontend', {
            transformedKeys: Object.keys(transformedResult || {})
        });
        
        return transformedResult;
    } catch (error) {
        logger.error('SERVICE: Error in transaction, rolling back', {
            error: error.message,
            stack: error.stack,
            errorCode: error.code,
            errorConstraint: error.constraint,
            admissionNumber: studentData?.admissionNumber
        });
        
        await client.query('ROLLBACK');
        logger.info('SERVICE: Transaction rolled back');
        
        // Custom error handling for unique constraints
        if (error.code === '23505') {
            if (error.constraint?.includes('email')) {
                logger.error('SERVICE: Email constraint violation');
                throw new Error('Email already exists in the system');
            }
            if (error.constraint?.includes('admission_number')) {
                logger.error('SERVICE: Admission number constraint violation');
                throw new Error('Admission number already exists');
            }
        }
        throw new Error(error.message || 'Student registration failed');
    } finally {
        client.release();
        logger.info('SERVICE: Database client released');
    }
};

const getAllStudents = async (tenantId, options = {}) => {
    if (!tenantId) {
        throw new Error('Tenant ID is required');
    }
    
    const { page = 1, limit = 20, search = '', academic_year = '', curriculum = '', medium = '', status = 'active' } = options;
    
    console.log('🔄 SERVICE getAllStudents called with:', {
        tenantId,
        options: { page, limit, search, academic_year, curriculum, medium, status }
    });
    
    // Validate pagination
    if (page < 1 || limit < 1 || limit > 100) {
        throw new Error('Invalid pagination parameters');
    }
    
    try {
        console.log('📞 SERVICE: Calling studentModel.getAllStudents');
        const result = await studentModel.getAllStudents(tenantId, {
            page: parseInt(page),
            limit: parseInt(limit),
            search: search.trim(),
            academic_year: academic_year.trim(),
            curriculum: curriculum.trim(),
            medium: medium.trim(),
            status: status.trim()
        });
        
        console.log('📋 SERVICE: Raw result from model:', {
            studentsCount: result.students.length,
            paginationInfo: result.pagination
        });
        
        // Transform students to frontend format
        console.log('🔄 SERVICE: Starting transformation to frontend format');
        const transformedStudents = result.students.map((student, index) => {
            const transformed = transformStudentToFrontendFromNewSchema(student);
            if (index < 3) { // Log first 3 transformations
                console.log(`🔄 SERVICE: Transformed student ${index + 1}:`, {
                    original_user_id: student.user_id,
                    original_username: student.username,
                    original_admission_number: student.admission_number,
                    transformed_userId: transformed.userId,
                    transformed_username: transformed.username,
                    transformed_admissionNumber: transformed.admissionNumber
                });
            }
            return transformed;
        });
        
        console.log('✅ SERVICE: Transformation complete. Final counts:', {
            originalCount: result.students.length,
            transformedCount: transformedStudents.length
        });
        
        // Check for duplicates in transformed data
        const transformedUserIds = transformedStudents.map(s => s.userId);
        const uniqueTransformedUserIds = [...new Set(transformedUserIds)];
        if (transformedUserIds.length !== uniqueTransformedUserIds.length) {
            console.log('⚠️  SERVICE: DUPLICATES DETECTED IN TRANSFORMED DATA!');
            console.log('  - Original count:', transformedUserIds.length);
            console.log('  - Unique count:', uniqueTransformedUserIds.length);
        }
        
        const finalResult = {
            students: transformedStudents,
            pagination: result.pagination
        };
        
        console.log('📤 SERVICE: Returning final result with', finalResult.students.length, 'students');
        return finalResult;
        
    } catch (error) {
        console.error('❌ SERVICE: Error in getAllStudents:', error);
        throw error;
    }
};

/**
 * Get student by admission number
 * @param {string} admissionNumber - Student's admission number
 * @param {string} tenantId - School/Tenant ID
 * @returns {Promise<Object|null>} Student object or null
 */
const getStudentByAdmissionNumber = async (admissionNumber, tenantId) => {
    if (!admissionNumber?.trim()) {
        throw new Error('Admission number is required');
    }
    
    if (!tenantId) {
        throw new Error('Tenant ID is required');
    }
    
    try {
        const student = await studentModel.findStudentByAdmissionNumber(admissionNumber.trim(), tenantId);
        
        if (!student) {
            return null;
        }
        
        return transformStudentToFrontendFromNewSchema(student);
        
    } catch (error) {
        throw error;
    }
};

/**
 * Update student information with transactional integrity
 * @param {string} username - Student's username
 * @param {Object} updateData - Data to update
 * @param {string} tenantId - School/Tenant ID
 * @returns {Promise<Object|null>} Updated student object
 */
const updateStudent = async (username, updateData, tenantId) => {
    if (!username) {
        throw new Error('Username is required');
    }
    
    if (!tenantId) {
        throw new Error('Tenant ID is required');
    }
    
    // Validate basic fields if provided
    if (updateData.firstName !== undefined && !updateData.firstName?.trim()) {
        throw new Error('First name cannot be empty');
    }
    
    if (updateData.lastName !== undefined && !updateData.lastName?.trim()) {
        throw new Error('Last name cannot be empty');
    }
    
    // Validate date of birth if provided
    if (updateData.dateOfBirth) {
        const dob = new Date(updateData.dateOfBirth);
        if (isNaN(dob.getTime())) {
            throw new Error('Invalid date of birth');
        }
        
        const age = Math.floor((new Date() - dob) / (365.25 * 24 * 60 * 60 * 1000));
        if (age < 3 || age > 85) {
            throw new Error('Student age must be between 3 and 85 years');
        }
    }
    
    // Check if student exists
    const existingStudent = await studentModel.findStudentByUsername(username, tenantId);
    if (!existingStudent) {
        throw new Error('Student not found');
    }
    
    try {
        // Update student using new schema methods
        const updatedStudent = await studentModel.updateStudent(username, updateData, tenantId);
        return transformStudentToFrontendFromNewSchema(updatedStudent);
        
    } catch (error) {
        throw error;
    }
};

/**
 * Delete student with transactional integrity (hard delete)
 * @param {string} username - Student's username
 * @param {string} tenantId - School/Tenant ID
 * @returns {Promise<Object>} Deletion confirmation
 */
const deleteStudent = async (username, tenantId) => {
    if (!username) {
        throw new Error('Username is required');
    }
    
    if (!tenantId) {
        throw new Error('Tenant ID is required');
    }
    
    // Check if student exists
    const existingStudent = await studentModel.findStudentByUsername(username, tenantId);
    if (!existingStudent) {
        throw new Error('Student not found');
    }
    
    try {
        logger.info('SERVICE: Starting student deletion', { username, tenantId });
        const deleted = await studentModel.deleteStudent(username);
        
        if (deleted) {
            logger.info('SERVICE: Student deleted successfully', { username });
            return {
                message: 'Student and related data deleted successfully',
                username: username,
                deletedPermanently: true
            };
        } else {
            logger.error('SERVICE: Failed to delete student - deleteStudent returned false', { username });
            throw new Error('Failed to delete student');
        }
        
    } catch (error) {
        logger.error('SERVICE: Error during student deletion', { 
            error: error.message, 
            username, 
            tenantId 
        });
        throw error;
    }
};

/**
 * Get complete student data for editing (includes all related data)
 * @param {string} username - Student's username
 * @param {string} tenantId - School/Tenant ID
 * @returns {Promise<Object|null>} Complete student object with all details or null
 */
const getCompleteStudentForEdit = async (username, tenantId) => {
    if (!username) {
        throw new Error('Username is required');
    }
    
    if (!tenantId) {
        throw new Error('Tenant ID is required');
    }
    
    try {
        const completeStudent = await studentModel.getCompleteStudentData(username, tenantId);
        
        if (!completeStudent) {
            return null;
        }
        
        return transformCompleteStudentToFrontend(completeStudent);
        
    } catch (error) {
        throw error;
    }
};

/**
 * Transform complete database student record to frontend format (for editing)
 * @param {Object} dbStudent - Complete database student record
 * @returns {Object} Frontend formatted student object with all data
 */
const transformCompleteStudentToFrontend = (dbStudent) => {
    return {
        userId: dbStudent.user_id,
        username: dbStudent.username,
        studentId: dbStudent.user_id, // For compatibility with frontend
        
        // Basic Info
        admissionNumber: dbStudent.admission_number,
        firstName: dbStudent.first_name,
        middleName: dbStudent.middle_name,
        lastName: dbStudent.last_name,
        fullName: `${dbStudent.first_name} ${dbStudent.middle_name ? dbStudent.middle_name + ' ' : ''}${dbStudent.last_name}`,
        dateOfBirth: dbStudent.date_of_birth,
        gender: dbStudent.gender,
        
        // Contact Info
        phoneNumber: dbStudent.phone_number,
        email: dbStudent.email,
        alternatePhoneNumber: dbStudent.alt_phone,
        
        // Personal Details
        nationality: dbStudent.nationality,
        religion: dbStudent.religion,
        caste: dbStudent.caste,
        category: dbStudent.category,
        bloodGroup: dbStudent.blood_group,
        height: dbStudent.height_cm,
        weight: dbStudent.weight_kg,
        medicalConditions: dbStudent.medical_conditions,
        allergies: dbStudent.allergies,
        
        // Address Details
        currentAddress: dbStudent.current_address,
        permanentAddress: dbStudent.permanent_address,
        city: dbStudent.city,
        state: dbStudent.state,
        pincode: dbStudent.pincode,
        country: dbStudent.country,
        
        // Emergency Contact
        emergencyContactName: dbStudent.emergency_contact_name,
        emergencyContactPhone: dbStudent.emergency_contact_phone,
        emergencyContactRelation: dbStudent.emergency_contact_relation,
        
        // Academic Info
        admissionDate: dbStudent.admission_date,
        registrationNumber: dbStudent.registration_number,
        admissionType: dbStudent.admission_type,
        transferCertificateNumber: dbStudent.tc_number,
        scholarshipApplied: dbStudent.scholarship_applied ? 'Yes' : 'No', // Convert boolean to string for frontend dropdown
        previousSchool: dbStudent.previous_school || '', // Add previous school mapping
        
        // Transport and Hostel Details - Fix mapping
        transportMode: dbStudent.transport_details || '',
        hostelRequired: dbStudent.hostel_details === 'Required' ? 'Yes' : 'No', // Map hostel details correctly
        
        // Enrollment Info (for form compatibility)
        enrollment: {
            admissionNumber: dbStudent.admission_number,
            admissionDate: dbStudent.admission_date,
            academic_year_id: dbStudent.academic_year_id,
            academicYear: dbStudent.academic_year_id,
            year_name: dbStudent.year_name,
            year_type: dbStudent.year_type, // Add missing year_type
            curriculum_id: dbStudent.curriculum_id,
            curriculum_name: dbStudent.curriculum_name,
            medium: dbStudent.medium,
            class: dbStudent.class_name,
            sectionId: dbStudent.section_id,
            sectionName: dbStudent.section_name,
            registrationNumber: dbStudent.registration_number,
            admissionType: dbStudent.admission_type,
            transferCertificateNumber: dbStudent.tc_number,
            status: dbStudent.status
        },
        
        // Academic Year Data (for form compatibility)
        class: dbStudent.class_name,
        section: dbStudent.section_name,
        
        // Parents - transform to frontend format with proper field mapping and emergency contact
        parents: Array.isArray(dbStudent.parents) ? dbStudent.parents.map(parent => ({
            firstName: parent.first_name,
            lastName: parent.last_name,
            middleName: parent.middle_name,
            dateOfBirth: parent.date_of_birth, // This should now map correctly
            email: parent.email,
            phone: parent.phone_number || parent.contact_phone,
            occupation: parent.occupation || '', // Map occupation from parent data
            income: parent.income || '', // Map income from parent data
            relation: parent.relationship_type,
            relationshipType: parent.relationship_type,
            isEmergency: Boolean(parent.is_emergency_contact) // Map emergency contact flag correctly
        })) : [],
        
        // Status info
        campusId: dbStudent.campus_id,
        status: dbStudent.status,
        createdAt: dbStudent.created_at
    };
};

/**
 * Transform database student record to frontend format (for new schema)
 * @param {Object} dbStudent - Database student record from new schema
 * @returns {Object} Frontend formatted student object
 */
const transformStudentToFrontendNewSchema = (dbStudent) => {
    return {
        username: dbStudent.username,
        userId: dbStudent.user_id,
        admissionNumber: dbStudent.admission_number,
        firstName: dbStudent.first_name,
        lastName: dbStudent.last_name,
        fullName: `${dbStudent.first_name} ${dbStudent.last_name}`,
        enrollment: dbStudent.enrollment
    };
};

/**
 * Transform database student record from new schema to frontend format
 * @param {Object} dbStudent - Database student record from new schema queries
 * @returns {Object} Frontend formatted student object
 */
const transformStudentToFrontendFromNewSchema = (dbStudent) => {
    return {
        userId: dbStudent.user_id,
        username: dbStudent.username,
        admissionNumber: dbStudent.admission_number,
        firstName: dbStudent.first_name,
        middleName: dbStudent.middle_name,
        lastName: dbStudent.last_name,
        fullName: `${dbStudent.first_name} ${dbStudent.middle_name ? dbStudent.middle_name + ' ' : ''}${dbStudent.last_name}`,
        phoneNumber: dbStudent.phone_number,
        dateOfBirth: dbStudent.date_of_birth,
        email: dbStudent.email,
        contactPhone: dbStudent.contact_phone,
        alternatePhone: dbStudent.alt_phone,
        
        // Personal details
        gender: dbStudent.gender,
        nationality: dbStudent.nationality,
        religion: dbStudent.religion,
        caste: dbStudent.caste,
        category: dbStudent.category,
        bloodGroup: dbStudent.blood_group,
        height: dbStudent.height_cm,
        weight: dbStudent.weight_kg,
        medicalConditions: dbStudent.medical_conditions,
        allergies: dbStudent.allergies,
        scholarshipApplied: dbStudent.scholarship_applied,
        
        // Contact details
        currentAddress: dbStudent.current_address,
        city: dbStudent.city,
        state: dbStudent.state,
        pincode: dbStudent.pincode,
        country: dbStudent.country,
        permanentAddress: dbStudent.permanent_address,
        
        // Enrollment info (if available)
        ...(dbStudent.admission_number && {
            enrollment: {
                admissionNumber: dbStudent.admission_number,
                admissionDate: dbStudent.admission_date,
                academicYear: dbStudent.academic_year_id,
                registrationNumber: dbStudent.registration_number,
                admissionType: dbStudent.admission_type,
                transferCertificateNumber: dbStudent.tc_number,
                className: dbStudent.class_name,
                sectionId: dbStudent.section_id
            }
        }),
        
        // Status info
        campusId: dbStudent.campus_id,
        status: dbStudent.status,
        createdAt: dbStudent.created_at
    };
};

/**
 * Get student statistics for dashboard
 * @param {string} tenantId - School/Tenant ID
 * @param {string} academicYear - Academic year (optional)
 * @returns {Promise<Object>} Student statistics
 */
const getStudentStatistics = async (tenantId, academicYear = null) => {
    if (!tenantId) {
        throw new Error('Tenant ID is required');
    }
    
    try {
        // Get basic counts using new schema
        const allStudentsResult = await studentModel.getAllStudents(tenantId, { 
            limit: 1, 
            academic_year: academicYear || '' 
        });
        
        const activeStudentsResult = await studentModel.getAllStudents(tenantId, { 
            limit: 1, 
            status: 'active',
            academic_year: academicYear || '' 
        });
        
        return {
            total_students: allStudentsResult.pagination.total_count,
            active_students: activeStudentsResult.pagination.total_count,
            academic_year: academicYear
        };
        
    } catch (error) {
        throw error;
    }
};

/**
 * Get student by username
 * @param {string} username - Student's username
 * @param {string} tenantId - School/Tenant ID
 * @returns {Promise<Object|null>} Student object or null
 */
const findStudentByUsername = async (username, tenantId) => {
    if (!username) {
        throw new Error('Username is required');
    }
    
    if (!tenantId) {
        throw new Error('Tenant ID is required');
    }
    
    try {
        const student = await studentModel.findStudentByUsername(username, tenantId);
        
        if (!student) {
            return null;
        }
        
        return transformStudentToFrontendFromNewSchema(student);
        
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
    if (!studentUsername) {
        throw new Error('Student username is required');
    }
    
    if (!tenantId) {
        throw new Error('Tenant ID is required');
    }
    
    try {
        const parents = await studentModel.getStudentParents(studentUsername, tenantId);
        
        // Transform parents to frontend format
        return parents.map(parent => ({
            userId: parent.user_id,
            username: parent.username,
            firstName: parent.first_name,
            middleName: parent.middle_name,
            lastName: parent.last_name,
            fullName: `${parent.first_name} ${parent.middle_name ? parent.middle_name + ' ' : ''}${parent.last_name}`,
            phoneNumber: parent.phone_number,
            dateOfBirth: parent.date_of_birth,
            role: parent.role,
            
            // Contact details
            email: parent.email,
            contactPhone: parent.contact_phone,
            alternatePhone: parent.alt_phone,
            currentAddress: parent.current_address,
            city: parent.city,
            state: parent.state,
            pincode: parent.pincode,
            country: parent.country,
            permanentAddress: parent.permanent_address,
            
            // Personal details
            gender: parent.gender,
            nationality: parent.nationality,
            religion: parent.religion,
            
            // Relationship info
            relationshipType: parent.relationship_type
        }));
        
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
    if (!parentUsername) {
        throw new Error('Parent username is required');
    }
    
    if (!tenantId) {
        throw new Error('Tenant ID is required');
    }
    
    try {
        const students = await studentModel.getParentStudents(parentUsername, tenantId);
        
        // Transform students to frontend format
        return students.map(student => ({
            userId: student.user_id,
            username: student.username,
            firstName: student.first_name,
            middleName: student.middle_name,
            lastName: student.last_name,
            fullName: `${student.first_name} ${student.middle_name ? student.middle_name + ' ' : ''}${student.last_name}`,
            phoneNumber: student.phone_number,
            dateOfBirth: student.date_of_birth,
            role: student.role,
            
            // Enrollment info
            admissionNumber: student.admission_number,
            admissionDate: student.admission_date,
            academicYear: student.academic_year_id,
            
            // Contact details
            email: student.email,
            contactPhone: student.contact_phone,
            
            // Relationship info
            relationshipType: student.relationship_type
        }));
        
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
    if (!studentUsername) {
        throw new Error('Student username is required');
    }
    
    if (!parentUsername) {
        throw new Error('Parent username is required');
    }
    
    if (!relationshipType) {
        throw new Error('Relationship type is required');
    }
    
    if (!tenantId) {
        throw new Error('Tenant ID is required');
    }
    
    if (!campusId) {
        throw new Error('Campus ID is required');
    }
    
    // Validate relationship type
    const validRelationships = ['father', 'mother', 'guardian', 'parent', 'other'];
    if (!validRelationships.includes(relationshipType.toLowerCase())) {
        throw new Error('Invalid relationship type. Must be one of: father, mother, guardian, parent, other');
    }
    
    try {
        // Check if student exists
        const student = await studentModel.findStudentByUsername(studentUsername, tenantId);
        if (!student) {
            throw new Error('Student not found');
        }
        
        // Check if parent exists and has Parent role
        const parent = await userModel.findByUsername(parentUsername);
        if (!parent) {
            throw new Error('Parent user not found');
        }
        
        if (parent.role !== 'Parent') {
            throw new Error('User is not a parent');
        }
        
        if (parent.tenant_id !== tenantId) {
            throw new Error('Parent does not belong to the same tenant');
        }
        
        const result = await studentModel.addParentToStudent(
            studentUsername, 
            parentUsername, 
            relationshipType.toLowerCase(), 
            tenantId, 
            campusId
        );
        
        return {
            tenantId: result.tenant_id,
            campusId: result.campus_id,
            studentUsername: result.student_username,
            parentUsername: result.parent_username,
            relationshipType: result.relationship_type
        };
        
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
    if (!studentUsername) {
        throw new Error('Student username is required');
    }
    
    if (!parentUsername) {
        throw new Error('Parent username is required');
    }
    
    if (!tenantId) {
        throw new Error('Tenant ID is required');
    }
    
    try {
        // Check if relationship exists
        const parents = await studentModel.getStudentParents(studentUsername, tenantId);
        const relationshipExists = parents.some(parent => parent.username === parentUsername);
        
        if (!relationshipExists) {
            throw new Error('Parent relationship not found');
        }
        
        const result = await studentModel.removeParentFromStudent(studentUsername, parentUsername, tenantId);
        
        return result;
        
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
 * @returns {Promise<Object>} Updated relationship
 */
const updateParentRelationship = async (studentUsername, parentUsername, relationshipType, tenantId) => {
    if (!studentUsername) {
        throw new Error('Student username is required');
    }
    
    if (!parentUsername) {
        throw new Error('Parent username is required');
    }
    
    if (!relationshipType) {
        throw new Error('Relationship type is required');
    }
    
    if (!tenantId) {
        throw new Error('Tenant ID is required');
    }
    
    // Validate relationship type
    const validRelationships = ['father', 'mother', 'guardian', 'parent', 'other'];
    if (!validRelationships.includes(relationshipType.toLowerCase())) {
        throw new Error('Invalid relationship type. Must be one of: father, mother, guardian, parent, other');
    }
    
    try {
        // Check if relationship exists
        const parents = await studentModel.getStudentParents(studentUsername, tenantId);
        const relationshipExists = parents.some(parent => parent.username === parentUsername);
        
        if (!relationshipExists) {
            throw new Error('Parent relationship not found');
        }
        
        const result = await studentModel.updateParentRelationship(
            studentUsername, 
            parentUsername, 
            relationshipType.toLowerCase(), 
            tenantId
        );
        
        return {
            tenantId: result.tenant_id,
            campusId: result.campus_id,
            studentUsername: result.student_username,
            parentUsername: result.parent_username,
            relationshipType: result.relationship_type
        };
        
    } catch (error) {
        throw error;
    }
};

/**
 * Get students by filters for section assignment
 * @param {Object} filters - Filter parameters
 * @param {string} filters.tenantId - School/Tenant ID
 * @param {string} filters.campusId - Campus ID
 * @param {number} filters.academic_year_id - Academic year ID
 * @param {number} filters.class_id - Class ID
 * @param {string} filters.assignment_status - 'assigned' or 'unassigned'
 * @returns {Promise<Array>} List of students matching the filters
 */
const getStudentsByFilters = async (filters) => {
    try {
        const { tenantId, campusId, academic_year_id, class_id, assignment_status, include_parents } = filters;
        
        logger.info('SERVICE: Getting students by filters for section assignment', {
            tenantId,
            campusId,
            academic_year_id,
            class_id,
            assignment_status,
            include_parents
        });

        // Validate input parameters
        if (!tenantId || !campusId || !academic_year_id || !class_id || !assignment_status) {
            logger.error('SERVICE: Missing required parameters', {
                tenantId: !!tenantId,
                campusId: !!campusId,
                academic_year_id: !!academic_year_id,
                class_id: !!class_id,
                assignment_status: !!assignment_status
            });
            throw new Error('Missing required parameters for student filtering');
        }
        
        // Build the query based on assignment status
        let query;
        let params;
        
        if (assignment_status === 'unassigned') {
            // Get students without section assignment
            query = `
                SELECT DISTINCT 
                    u.user_id,
                    u.username,
                    u.first_name,
                    u.middle_name,
                    u.last_name,
                    se.admission_number,
                    se.academic_year_id,
                    se.class_name,
                    se.section_id,
                    se.roll_number,
                    se.admission_date
                FROM users u
                INNER JOIN student_enrollment se ON u.username = se.username
                INNER JOIN user_statuses us ON u.username = us.username AND us.campus_id = se.campus_id
                INNER JOIN classes c ON se.class_name = c.class_name
                WHERE u.tenant_id = $1 
                    AND se.campus_id = $2
                    AND se.academic_year_id = $3
                    AND c.class_id = $4
                    AND u.role = 'Student'
                    AND us.status = 'active'
                    AND (se.section_id IS NULL OR se.section_id = 0)
                ORDER BY u.first_name, u.last_name
            `;
            params = [tenantId, campusId, academic_year_id, class_id];
        } else {
            // Get students with section assignment
            if (include_parents) {
                query = `
                    SELECT 
                        u.user_id,
                        u.username,
                        u.first_name,
                        u.middle_name,
                        u.last_name,
                        se.admission_number,
                        se.academic_year_id,
                        se.class_name,
                        se.section_id,
                        cs.section_name,
                        se.roll_number,
                        se.admission_date,
                        COALESCE(
                            json_agg(
                                json_build_object(
                                    'user_id', p.user_id,
                                    'username', p.username,
                                    'first_name', p.first_name,
                                    'last_name', p.last_name,
                                    'relationship', spr.relationship_type,
                                    'phone', p.phone_number
                                ) ORDER BY p.first_name
                            ) FILTER (WHERE spr.parent_username IS NOT NULL),
                            '[]'
                        ) as parents
                    FROM users u
                    INNER JOIN student_enrollment se ON u.username = se.username
                    INNER JOIN user_statuses us ON u.username = us.username AND us.campus_id = se.campus_id
                    INNER JOIN classes c ON se.class_name = c.class_name
                    LEFT JOIN class_sections cs ON se.section_id = cs.section_id
                    LEFT JOIN student_parent_relations spr ON u.username = spr.student_username
                    LEFT JOIN users p ON spr.parent_username = p.username
                    WHERE u.tenant_id = $1 
                        AND se.campus_id = $2
                        AND se.academic_year_id = $3
                        AND c.class_id = $4
                        AND u.role = 'Student'
                        AND us.status = 'active'
                        AND se.section_id IS NOT NULL 
                        AND se.section_id > 0
                    GROUP BY u.user_id, u.username, u.first_name, u.middle_name, u.last_name, se.admission_number, se.academic_year_id, se.class_name, se.section_id, cs.section_name, se.roll_number, se.admission_date
                    ORDER BY u.first_name, u.last_name
                `;
            } else {
                query = `
                    SELECT DISTINCT 
                        u.user_id,
                        u.username,
                        u.first_name,
                        u.middle_name,
                        u.last_name,
                        se.admission_number,
                        se.academic_year_id,
                        se.class_name,
                        se.section_id,
                        cs.section_name,
                        se.roll_number,
                        se.admission_date
                    FROM users u
                    INNER JOIN student_enrollment se ON u.username = se.username
                    INNER JOIN user_statuses us ON u.username = us.username AND us.campus_id = se.campus_id
                    INNER JOIN classes c ON se.class_name = c.class_name
                    LEFT JOIN class_sections cs ON se.section_id = cs.section_id
                    WHERE u.tenant_id = $1 
                        AND se.campus_id = $2
                        AND se.academic_year_id = $3
                        AND c.class_id = $4
                        AND u.role = 'Student'
                        AND us.status = 'active'
                        AND se.section_id IS NOT NULL 
                        AND se.section_id > 0
                    ORDER BY u.first_name, u.last_name
                `;
            }
            params = [tenantId, campusId, academic_year_id, class_id];
        }
        
        logger.info('SERVICE: Executing query with params', {
            query: query.replace(/\s+/g, ' ').trim(),
            params,
            paramTypes: params.map(p => typeof p)
        });
        
        const result = await pool.query(query, params);
        
        logger.info('SERVICE: Students retrieved by filters', {
            tenantId,
            campusId,
            academic_year_id,
            class_id,
            assignment_status,
            count: result.rows.length
        });
        
        return result.rows;
        
    } catch (error) {
        logger.error('SERVICE: Error getting students by filters:', error);
        throw error;
    }
};

/**
 * Assign students to section (bulk assignment)
 * @param {Object} assignmentData - Assignment data
 * @param {string} assignmentData.tenantId - School/Tenant ID
 * @param {string} assignmentData.campusId - Campus ID
 * @param {Array} assignmentData.student_ids - Array of student IDs
 * @param {number} assignmentData.section_id - Section ID to assign to
 * @param {number} assignmentData.academic_year_id - Academic year ID
 * @param {number} assignmentData.class_id - Class ID
 * @returns {Promise<Object>} Assignment result with count and updated students
 */
const assignStudentsToSection = async (assignmentData) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const { tenantId, campusId, student_ids, section_id, academic_year_id, class_id } = assignmentData;
        
        logger.info('SERVICE: Starting bulk student section assignment', {
            tenantId,
            campusId,
            student_ids,
            section_id,
            academic_year_id,
            class_id,
            studentCount: student_ids.length
        });
        
        // Verify section exists and belongs to the correct class/academic year
        const sectionQuery = `
            SELECT cs.section_id, cs.section_name, cs.class_id, cs.academic_year_id
            FROM class_sections cs
            WHERE cs.section_id = $1 
                AND cs.class_id = $2 
                AND cs.academic_year_id = $3
                AND cs.campus_id = $4
        `;
        const sectionResult = await client.query(sectionQuery, [section_id, class_id, academic_year_id, campusId]);
        
        if (sectionResult.rows.length === 0) {
            throw new Error('Section not found or does not match the specified class and academic year');
        }
        
        const section = sectionResult.rows[0];
        
        // Verify students exist and are eligible for assignment
        const studentCheckQuery = `
            SELECT DISTINCT 
                u.user_id,
                u.username,
                se.admission_number,
                se.section_id as current_section_id
            FROM users u
            INNER JOIN student_enrollment se ON u.username = se.username
            INNER JOIN classes c ON se.class_name = c.class_name
            INNER JOIN user_statuses us ON u.username = us.username AND us.campus_id = se.campus_id
            WHERE u.tenant_id = $1 
                AND se.campus_id = $2
                AND se.academic_year_id = $3
                AND c.class_id = $4
                AND u.role = 'Student'
                AND us.status = 'active'
                AND u.user_id = ANY($5)
        `;
        
        const studentCheckResult = await client.query(studentCheckQuery, [
            tenantId, 
            campusId, 
            academic_year_id, 
            class_id, 
            student_ids
        ]);
        
        if (studentCheckResult.rows.length !== student_ids.length) {
            throw new Error('Some students not found or not eligible for assignment');
        }
        
        // Check if any students are already assigned to a section
        const alreadyAssigned = studentCheckResult.rows.filter(student => 
            student.current_section_id && student.current_section_id !== null && student.current_section_id > 0
        );
        
        if (alreadyAssigned.length > 0) {
            const assignedAdmissions = alreadyAssigned.map(s => s.admission_number).join(', ');
            throw new Error(`Some students are already assigned to sections: ${assignedAdmissions}`);
        }
        
        // Prepare usernames for update
        const usernames = studentCheckResult.rows.map(student => student.username);
        
        // Update student_enrollment table with section_id
        const updateQuery = `
            UPDATE student_enrollment 
            SET section_id = $1
            WHERE username = ANY($2)
                AND campus_id = $3
                AND academic_year_id = $4
            RETURNING admission_number, username, section_id
        `;
        
        const updateResult = await client.query(updateQuery, [
            section_id,
            usernames,
            campusId,
            academic_year_id
        ]);
        
        logger.info('SERVICE: Students assigned to section successfully', {
            tenantId,
            campusId,
            section_id,
            section_name: section.section_name,
            assignedCount: updateResult.rows.length,
            updatedStudents: updateResult.rows.map(r => r.admission_number)
        });
        
        await client.query('COMMIT');
        
        return {
            assignedCount: updateResult.rows.length,
            updatedStudents: updateResult.rows,
            section: {
                section_id: section.section_id,
                section_name: section.section_name
            }
        };
        
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error('SERVICE: Error assigning students to section:', error);
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Update a single student's section assignment
 * @param {number} studentId - Student's user ID
 * @param {number} sectionId - Section ID to assign to
 * @param {string} tenantId - School/Tenant ID
 * @param {string} campusId - Campus ID
 * @returns {Promise<Object>} Updated student section assignment
 */
const updateStudentSection = async (studentId, sectionId, tenantId, campusId) => {
    try {
        if (!studentId || !sectionId || !tenantId || !campusId) {
            throw new Error('Student ID, Section ID, Tenant ID, and Campus ID are required');
        }

        logger.info('SERVICE: Updating student section assignment', {
            studentId,
            sectionId,
            tenantId,
            campusId
        });

        // Verify student exists and get current enrollment
        const studentQuery = `
            SELECT DISTINCT 
                u.user_id,
                u.username,
                se.admission_number,
                se.academic_year_id,
                se.class_name,
                se.section_id as current_section_id,
                c.class_id
            FROM users u
            INNER JOIN student_enrollment se ON u.username = se.username
            INNER JOIN classes c ON se.class_name = c.class_name
            INNER JOIN user_statuses us ON u.username = us.username AND us.campus_id = se.campus_id
            WHERE u.user_id = $1 
                AND u.tenant_id = $2
                AND se.campus_id = $3
                AND u.role = 'Student'
                AND us.status = 'active'
        `;

        const studentResult = await pool.query(studentQuery, [studentId, tenantId, campusId]);

        if (studentResult.rows.length === 0) {
            throw new Error('Student not found or not eligible for section assignment');
        }

        const student = studentResult.rows[0];

        // Verify section exists and belongs to the correct class/academic year
        const sectionQuery = `
            SELECT cs.section_id, cs.section_name, cs.class_id, cs.academic_year_id
            FROM class_sections cs
            WHERE cs.section_id = $1 
                AND cs.class_id = $2 
                AND cs.academic_year_id = $3
                AND cs.campus_id = $4
        `;
        const sectionResult = await pool.query(sectionQuery, [
            sectionId, 
            student.class_id, 
            student.academic_year_id, 
            campusId
        ]);

        if (sectionResult.rows.length === 0) {
            throw new Error('Section not found or does not match student\'s class and academic year');
        }

        const section = sectionResult.rows[0];

        // Update student section assignment
        const updateQuery = `
            UPDATE student_enrollment 
            SET section_id = $1
            WHERE username = $2
                AND campus_id = $3
                AND academic_year_id = $4
            RETURNING admission_number, username, section_id
        `;

        const updateResult = await pool.query(updateQuery, [
            sectionId,
            student.username,
            campusId,
            student.academic_year_id
        ]);

        if (updateResult.rows.length === 0) {
            throw new Error('Failed to update student section assignment');
        }

        logger.info('SERVICE: Student section updated successfully', {
            studentId,
            username: student.username,
            admissionNumber: student.admission_number,
            oldSectionId: student.current_section_id,
            newSectionId: sectionId,
            sectionName: section.section_name
        });

        return {
            studentId,
            username: student.username,
            admissionNumber: student.admission_number,
            section: {
                section_id: section.section_id,
                section_name: section.section_name
            },
            previousSectionId: student.current_section_id
        };

    } catch (error) {
        logger.error('SERVICE: Error updating student section:', error);
        throw error;
    }
};

/**
 * Remove a student from their section assignment (set section to null)
 * @param {number} studentId - Student's user ID
 * @param {string} tenantId - School/Tenant ID
 * @param {string} campusId - Campus ID
 * @returns {Promise<Object>} Student section deassignment result
 */
const deassignStudentSection = async (studentId, tenantId, campusId) => {
    try {
        if (!studentId || !tenantId || !campusId) {
            throw new Error('Student ID, Tenant ID, and Campus ID are required');
        }

        logger.info('SERVICE: Deassigning student from section', {
            studentId,
            tenantId,
            campusId
        });

        // Verify student exists and get current enrollment
        const studentQuery = `
            SELECT DISTINCT 
                u.user_id,
                u.username,
                se.admission_number,
                se.academic_year_id,
                se.class_name,
                se.section_id as current_section_id,
                cs.section_name as current_section_name
            FROM users u
            INNER JOIN student_enrollment se ON u.username = se.username
            INNER JOIN user_statuses us ON u.username = us.username AND us.campus_id = se.campus_id
            LEFT JOIN class_sections cs ON se.section_id = cs.section_id
            WHERE u.user_id = $1 
                AND u.tenant_id = $2
                AND se.campus_id = $3
                AND u.role = 'Student'
                AND us.status = 'active'
        `;

        const studentResult = await pool.query(studentQuery, [studentId, tenantId, campusId]);

        if (studentResult.rows.length === 0) {
            throw new Error('Student not found');
        }

        const student = studentResult.rows[0];

        if (!student.current_section_id) {
            throw new Error('Student is not currently assigned to any section');
        }

        // Remove section assignment by setting section_id to null
        const updateQuery = `
            UPDATE student_enrollment 
            SET section_id = NULL
            WHERE username = $1
                AND campus_id = $2
                AND academic_year_id = $3
            RETURNING admission_number, username, section_id
        `;

        const updateResult = await pool.query(updateQuery, [
            student.username,
            campusId,
            student.academic_year_id
        ]);

        if (updateResult.rows.length === 0) {
            throw new Error('Failed to deassign student from section');
        }

        logger.info('SERVICE: Student deassigned from section successfully', {
            studentId,
            username: student.username,
            admissionNumber: student.admission_number,
            previousSectionId: student.current_section_id,
            previousSectionName: student.current_section_name
        });

        return {
            studentId,
            username: student.username,
            admissionNumber: student.admission_number,
            previousSection: {
                section_id: student.current_section_id,
                section_name: student.current_section_name
            },
            message: 'Student successfully deassigned from section'
        };

    } catch (error) {
        logger.error('SERVICE: Error deassigning student from section:', error);
        throw error;
    }
};

const getStudentsBySection = async (tenantId, campusId, academicYearId, classId, sectionId) => {
    try {
        logger.info('SERVICE: Getting students by section', {
            tenantId, campusId, academicYearId, classId, sectionId
        });
        return await studentModel.getStudentsBySection(tenantId, campusId, academicYearId, classId, sectionId);
    } catch (error) {
        logger.error('SERVICE: Error getting students by section', error);
        throw error;
    }
};

// ==================== EXPORTS ====================

module.exports = {
    registerStudent,
    getAllStudents,
    getStudentByAdmissionNumber,
    updateStudent,
    deleteStudent,
    getCompleteStudentForEdit,
    getStudentStatistics,
    findStudentByUsername,
    transformStudentToFrontendNewSchema,
    transformStudentToFrontendFromNewSchema,
    getStudentParents,
    getParentStudents,
    addParentToStudent,
    removeParentFromStudent,
    updateParentRelationship,
    getStudentsByFilters,
    assignStudentsToSection,
    updateStudentSection,
    deassignStudentSection,
    getStudentsBySection
};
