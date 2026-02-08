const studentService = require('../services/student.service');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

// ==================== STUDENT CONTROLLER METHODS ====================

/**
 * Get all students with pagination and filtering
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllStudents = async (req, res) => {
    try {
        // Enhanced global context - now includes tenant and campus objects
        const { tenantId, tenant, campus, campusId: userCampusId } = req.user;
        const { page, limit, search, academic_year, curriculum, medium, status, class_id, academic_year_id, section_id, campus_id } = req.query;
        
        logger.info('Getting all students', { 
            tenantId, 
            tenantName: tenant?.name,
            campusId: userCampusId,
            campusName: campus?.name,
            page, 
            limit, 
            search, 
            academic_year,
            curriculum,
            medium,
            status,
            class_id,
            academic_year_id,
            section_id,
            campus_id
        });
        
        const result = await studentService.getAllStudents(tenantId, {
            page,
            limit,
            search,
            academic_year: academic_year || academic_year_id, // Support both
            curriculum,
            medium,
            status,
            class_id,
            section_id,
            campus_id: campus_id || userCampusId
        });
        
        logger.info('Successfully retrieved students', { 
            tenantId, 
            tenantName: tenant?.name,
            campusName: campus?.name,
            count: result.students.length,
            total: result.pagination.total_count 
        });
        
        return successResponse(res, 'Students retrieved successfully', result);
        
    } catch (error) {
        logger.error('Error getting all students:', error);
        return errorResponse(res, error.message, 500);
    }
};

/**
 * Register a new student
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const registerStudent = async (req, res) => {
    const { tenantId, campusId, tenant, campus } = req.user;
    const studentData = req.body;
    
    try {
        logger.info('=== CONTROLLER: Starting student registration ===', { 
            tenantId, 
            campusId,
            tenantName: tenant?.name,
            campusName: campus?.name,
            admissionNumber: studentData.admissionNumber,
            firstName: studentData.firstName,
            lastName: studentData.lastName,
            email: studentData.email,
            academicYearId: studentData.academicYearId || studentData.academic_year_id,
            requestBody: JSON.stringify(studentData)
        });
        
        // Validate required context
        if (!tenantId) {
            logger.error('CONTROLLER: Missing tenantId in request context');
            return errorResponse(res, 'Invalid tenant context', 400);
        }
        
        if (!campusId) {
            logger.error('CONTROLLER: Missing campusId in request context');
            return errorResponse(res, 'Invalid campus context', 400);
        }
        
        logger.info('CONTROLLER: Calling studentService.registerStudent', {
            tenantId,
            campusId,
            hasStudentData: !!studentData,
            studentDataKeys: Object.keys(studentData || {})
        });
        
        const result = await studentService.registerStudent(studentData, tenantId, campusId);
        
        logger.info('CONTROLLER: Student registered successfully', { 
            tenantId, 
            username: result.username,
            admissionNumber: result.admissionNumber,
            resultKeys: Object.keys(result || {})
        });
        
        return successResponse(res, 'Student registered successfully', result, 201);
        
    } catch (error) {
        logger.error('CONTROLLER: Error registering student', {
            error: error.message,
            stack: error.stack,
            tenantId,
            campusId,
            admissionNumber: studentData?.admissionNumber,
            errorCode: error.code,
            errorConstraint: error.constraint
        });
        
        console.error('CONTROLLER: Full error details:', error);
        
        if (error.message.includes('already exists') || 
            error.message.includes('unique') ||
            error.message.includes('required') ||
            error.message.includes('Invalid') ||
            error.message.includes('age must be')) {
            return errorResponse(res, error.message, 400);
        }
        
        return errorResponse(res, `Failed to register student: ${error.message}`, 500);
    }
};

/**
 * Update student information
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateStudent = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const username = req.params.username; // Changed from studentId to username
        const updateData = req.body;
        
        if (!username?.trim()) {
            return errorResponse(res, 'Invalid username', 400);
        }
        
        logger.info('Updating student', { 
            tenantId, 
            username, 
            updateFields: Object.keys(updateData) 
        });
        
        const result = await studentService.updateStudent(username, updateData, tenantId);
        
        if (!result) {
            return errorResponse(res, 'Student not found', 404);
        }
        
        logger.info('Student updated successfully', { 
            tenantId, 
            username,
            admissionNumber: result.admissionNumber 
        });
        
        return successResponse(res, 'Student updated successfully', result);
        
    } catch (error) {
        logger.error('Error updating student:', error);
        
        if (error.message.includes('not found') || error.message.includes('Student not found')) {
            return errorResponse(res, error.message, 404);
        }
        
        if (error.message.includes('required') ||
            error.message.includes('Invalid') ||
            error.message.includes('cannot be empty') ||
            error.message.includes('age must be')) {
            return errorResponse(res, error.message, 400);
        }
        
        return errorResponse(res, 'Failed to update student', 500);
    }
};

/**
 * Update student enrollment (class, section, roll number)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateStudentEnrollment = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const studentId = parseInt(req.params.studentId);
        const enrollmentData = req.body;
        
        if (!studentId || isNaN(studentId)) {
            return errorResponse(res, 'Invalid student ID', 400);
        }
        
        logger.info('Updating student enrollment', { 
            tenantId, 
            studentId, 
            enrollmentData 
        });
        
        const result = await studentService.updateStudentEnrollment(studentId, enrollmentData, tenantId);
        
        if (!result) {
            return errorResponse(res, 'Student not found', 404);
        }
        
        logger.info('Student enrollment updated successfully', { 
            tenantId, 
            studentId 
        });
        
        return successResponse(res, 'Student enrollment updated successfully', result);
        
    } catch (error) {
        logger.error('Error updating student enrollment:', error);
        
        if (error.message.includes('not found')) {
            return errorResponse(res, error.message, 404);
        }
        
        if (error.message.includes('already exists') ||
            error.message.includes('required')) {
            return errorResponse(res, error.message, 400);
        }
        
        return errorResponse(res, 'Failed to update student enrollment', 500);
    }
};

/**
 * Delete student (soft delete)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteStudent = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const username = req.params.username; // Changed from studentId to username
        
        if (!username?.trim()) {
            return errorResponse(res, 'Invalid username', 400);
        }
        
        logger.info('Deleting student', { tenantId, username });
        
        const result = await studentService.deleteStudent(username, tenantId);
        
        logger.info('Student deleted successfully', { tenantId, username });
        
        return successResponse(res, result.message, { username: username });
        
    } catch (error) {
        logger.error('Error deleting student:', error);
        
        if (error.message.includes('not found')) {
            return errorResponse(res, error.message, 404);
        }
        
        return errorResponse(res, 'Failed to delete student', 500);
    }
};

/**
 * Get student by admission number
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getStudentByAdmissionNumber = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const { admissionNumber } = req.params;
        
        if (!admissionNumber?.trim()) {
            return errorResponse(res, 'Admission number is required', 400);
        }
        
        logger.info('Getting student by admission number', { 
            tenantId, 
            admissionNumber 
        });
        
        const result = await studentService.getStudentByAdmissionNumber(admissionNumber, tenantId);
        
        if (!result) {
            return errorResponse(res, 'Student not found', 404);
        }
        
        logger.info('Student found by admission number', { 
            tenantId, 
            admissionNumber,
            username: result.username 
        });
        
        return successResponse(res, 'Student retrieved successfully', result);
        
    } catch (error) {
        logger.error('Error getting student by admission number:', error);
        
        if (error.message.includes('required')) {
            return errorResponse(res, error.message, 400);
        }
        
        return errorResponse(res, 'Failed to get student', 500);
    }
};

/**
 * Get student by username
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getStudentByUsername = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const { username } = req.params;
        
        if (!username?.trim()) {
            return errorResponse(res, 'Username is required', 400);
        }
        
        logger.info('Getting student by username', { 
            tenantId, 
            username 
        });
        
        const result = await studentService.findStudentByUsername(username, tenantId);
        
        if (!result) {
            return errorResponse(res, 'Student not found', 404);
        }
        
        logger.info('Student found by username', { 
            tenantId, 
            username,
            admissionNumber: result.admissionNumber 
        });
        
        return successResponse(res, 'Student retrieved successfully', result);
        
    } catch (error) {
        logger.error('Error getting student by username:', error);
        
        if (error.message.includes('required')) {
            return errorResponse(res, error.message, 400);
        }
        
        return errorResponse(res, 'Failed to get student', 500);
    }
};

/**
 * Get students by class and section
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getStudentsByClassSection = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const { class: studentClass, section } = req.params;
        const { academicYear } = req.query;
        
        if (!studentClass?.trim()) {
            return errorResponse(res, 'Class is required', 400);
        }
        
        if (!section?.trim()) {
            return errorResponse(res, 'Section is required', 400);
        }
        
        if (!academicYear?.trim()) {
            return errorResponse(res, 'response Academic year is required', 400);
        }
        
        logger.info('Getting students by class and section', { 
            tenantId, 
            class: studentClass,
            section,
            academicYear 
        });
        
        const result = await studentService.getStudentsByClassSection(
            studentClass, 
            section, 
            academicYear, 
            tenantId
        );
        
        logger.info('Students retrieved by class and section', { 
            tenantId, 
            class: studentClass,
            section,
            academicYear,
            count: result.length 
        });
        
        return successResponse(res, 'Students retrieved successfully', { students: result });
        
    } catch (error) {
        logger.error('Error getting students by class and section:', error);
        
        if (error.message.includes('required')) {
            return errorResponse(res, error.message, 400);
        }
        
        return errorResponse(res, 'Failed to get students', 500);
    }
};

/**
 * Get student statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getStudentStatistics = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const { academicYear } = req.query;
        
        logger.info('Getting student statistics', { tenantId, academicYear });
        
        const result = await studentService.getStudentStatistics(tenantId, academicYear);
        
        logger.info('Student statistics retrieved', { tenantId, statistics: result });
        
        return successResponse(res, 'Student statistics retrieved successfully', result);
        
    } catch (error) {
        logger.error('Error getting student statistics:', error);
        return errorResponse(res, 'Failed to get student statistics', 500);
    }
};

/**
 * Get student by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getStudentById = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const studentId = parseInt(req.params.studentId);
        
        if (!studentId || isNaN(studentId)) {
            return errorResponse(res, 'Invalid student ID', 400);
        }
        
        logger.info('Getting student by ID', { tenantId, studentId });
        
        const student = await studentService.findStudentById(studentId, tenantId);
        
        if (!student) {
            return errorResponse(res, 'Student not found', 404);
        }
        
        logger.info('Student found by ID', { 
            tenantId, 
            studentId,
            admissionNumber: student.admissionNumber 
        });
        
        return successResponse(res, 'Student retrieved successfully', student);
        
    } catch (error) {
        logger.error('Error getting student by ID:', error);
        return errorResponse(res, 'Failed to get student', 500);
    }
};

/**
 * Get parents for a student
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getStudentParents = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const { username } = req.params;
        
        if (!username?.trim()) {
            return errorResponse(res, 'Username is required', 400);
        }
        
        logger.info('Getting parents for student', { tenantId, username });
        
        const parents = await studentService.getStudentParents(username, tenantId);
        
        logger.info('Parents retrieved for student', { 
            tenantId, 
            username,
            parentCount: parents.length 
        });
        
        return successResponse(res, 'Student parents retrieved successfully', { parents });
        
    } catch (error) {
        logger.error('Error getting student parents:', error);
        
        if (error.message.includes('not found')) {
            return errorResponse(res, error.message, 404);
        }
        
        return errorResponse(res, 'Failed to get student parents', 500);
    }
};

/**
 * Get students for a parent
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getParentStudents = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const { parentUsername } = req.params;
        
        if (!parentUsername?.trim()) {
            return errorResponse(res, 'Parent username is required', 400);
        }
        
        logger.info('Getting students for parent', { tenantId, parentUsername });
        
        const students = await studentService.getParentStudents(parentUsername, tenantId);
        
        logger.info('Students retrieved for parent', { 
            tenantId, 
            parentUsername,
            studentCount: students.length 
        });
        
        return successResponse(res, 'Parent students retrieved successfully', { students });
        
    } catch (error) {
        logger.error('Error getting parent students:', error);
        
        if (error.message.includes('not found')) {
            return errorResponse(res, error.message, 404);
        }
        
        return errorResponse(res, 'Failed to get parent students', 500);
    }
};

/**
 * Add parent to student
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const addParentToStudent = async (req, res) => {
    try {
        const { tenantId, campusId } = req.user;
        const { username } = req.params;
        const { parentUsername, relationshipType } = req.body;
        
        if (!username?.trim()) {
            return errorResponse(res, 'Student username is required', 400);
        }
        
        if (!parentUsername?.trim()) {
            return errorResponse(res, 'Parent username is required', 400);
        }
        
        if (!relationshipType?.trim()) {
            return errorResponse(res, 'Relationship type is required', 400);
        }
        
        logger.info('Adding parent to student', { 
            tenantId, 
            campusId,
            studentUsername: username,
            parentUsername,
            relationshipType 
        });
        
        const result = await studentService.addParentToStudent(
            username, 
            parentUsername, 
            relationshipType, 
            tenantId, 
            campusId
        );
        
        logger.info('Parent added to student successfully', { 
            tenantId, 
            studentUsername: username,
            parentUsername,
            relationshipType 
        });
        
        return successResponse(res, 'Parent added to student successfully', result, 201);
        
    } catch (error) {
        logger.error('Error adding parent to student:', error);
        
        if (error.message.includes('not found')) {
            return errorResponse(res, error.message, 404);
        }
        
        if (error.message.includes('already exists') || error.message.includes('unique')) {
            return errorResponse(res, 'Parent relationship already exists', 409);
        }
        
        return errorResponse(res, 'Failed to add parent to student', 500);
    }
};

/**
 * Remove parent from student
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const removeParentFromStudent = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const { username, parentUsername } = req.params;
        
        if (!username?.trim()) {
            return errorResponse(res, 'Student username is required', 400);
        }
        
        if (!parentUsername?.trim()) {
            return errorResponse(res, 'Parent username is required', 400);
        }
        
        logger.info('Removing parent from student', { 
            tenantId, 
            studentUsername: username,
            parentUsername 
        });
        
        const result = await studentService.removeParentFromStudent(username, parentUsername, tenantId);
        
        if (!result) {
            return errorResponse(res, 'Parent relationship not found', 404);
        }
        
        logger.info('Parent removed from student successfully', { 
            tenantId, 
            studentUsername: username,
            parentUsername 
        });
        
        return successResponse(res, 'Parent removed from student successfully', { 
            studentUsername: username,
            parentUsername 
        });
        
    } catch (error) {
        logger.error('Error removing parent from student:', error);
        
        if (error.message.includes('not found')) {
            return errorResponse(res, error.message, 404);
        }
        
        return errorResponse(res, 'Failed to remove parent from student', 500);
    }
};

/**
 * Update parent relationship type
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateParentRelationship = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const { username, parentUsername } = req.params;
        const { relationshipType } = req.body;
        
        if (!username?.trim()) {
            return errorResponse(res, 'Student username is required', 400);
        }
        
        if (!parentUsername?.trim()) {
            return errorResponse(res, 'Parent username is required', 400);
        }
        
        if (!relationshipType?.trim()) {
            return errorResponse(res, 'Relationship type is required', 400);
        }
        
        logger.info('Updating parent relationship', { 
            tenantId, 
            studentUsername: username,
            parentUsername,
            relationshipType 
        });
        
        const result = await studentService.updateParentRelationship(
            username, 
            parentUsername, 
            relationshipType, 
            tenantId
        );
        
        if (!result) {
            return errorResponse(res, 'Parent relationship not found', 404);
        }
        
        logger.info('Parent relationship updated successfully', { 
            tenantId, 
            studentUsername: username,
            parentUsername,
            relationshipType 
        });
        
        return successResponse(res, 'Parent relationship updated successfully', result);
        
    } catch (error) {
        logger.error('Error updating parent relationship:', error);
        
        if (error.message.includes('not found')) {
            return errorResponse(res, error.message, 404);
        }
        
        return errorResponse(res, 'Failed to update parent relationship', 500);
    }
};

/**
 * Get filter options for student management
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getStudentFilterOptions = async (req, res) => {
    try {
        const { tenantId, campusId } = req.user;
        
        logger.info('Getting student filter options', { tenantId, campusId });
        
        // Validate required parameters
        if (!campusId) {
            return errorResponse(res, 'Campus ID is required', 400);
        }
        
        if (!tenantId) {
            return errorResponse(res, 'Tenant ID is required', 400);
        }
        
        // Use centralized filter options method from academic service
        const academicService = require('../services/academic.service');
        const result = await academicService.getFilterOptions(campusId, tenantId);
        
        logger.info('Successfully retrieved student filter options', { 
            tenantId, 
            campusId,
            academicYearsCount: result.academic_years.length,
            classesCount: result.classes.length
        });
        
        return successResponse(res, 'Student filter options retrieved successfully', result);
        
    } catch (error) {
        logger.error('Error getting student filter options:', error);
        return errorResponse(res, error.message, 500);
    }
};

/**
 * Get complete student data for editing (includes all related data)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getCompleteStudentForEdit = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const { username } = req.params;
        
        if (!username?.trim()) {
            return errorResponse(res, 'Username is required', 400);
        }
        
        logger.info('Getting complete student data for editing', { 
            tenantId, 
            username 
        });
        
        const result = await studentService.getCompleteStudentForEdit(username, tenantId);
        
        if (!result) {
            return errorResponse(res, 'Student not found', 404);
        }
        
        logger.info('Complete student data retrieved for editing', { 
            tenantId, 
            username,
            admissionNumber: result.admissionNumber,
            parentCount: result.parents?.length || 0
        });
        
        return successResponse(res, 'Complete student data retrieved successfully', result);
        
    } catch (error) {
        logger.error('Error getting complete student data for editing:', error);
        
        if (error.message.includes('required')) {
            return errorResponse(res, error.message, 400);
        }
        
        return errorResponse(res, 'Failed to get complete student data', 500);
    }
};

/**
 * Get students by filters (for section assignment)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getStudentsByFilters = async (req, res) => {
    try {
        const { tenantId, campusId } = req.user;
        const { academic_year_id, class_id, assignment_status, include_parents } = req.query;
        
        // Validate required parameters
        if (!academic_year_id) {
            return errorResponse(res, 'Academic year ID is required', 400);
        }
        
        if (!class_id) {
            return errorResponse(res, 'Class ID is required', 400);
        }
        
        if (!assignment_status || !['assigned', 'unassigned'].includes(assignment_status)) {
            return errorResponse(res, 'Assignment status must be either "assigned" or "unassigned"', 400);
        }
        
        logger.info('Getting students by filters for section assignment', { 
            tenantId, 
            campusId,
            academic_year_id,
            class_id,
            assignment_status,
            include_parents
        });
        
        const result = await studentService.getStudentsByFilters({
            tenantId,
            campusId,
            academic_year_id: parseInt(academic_year_id),
            class_id: parseInt(class_id),
            assignment_status,
            include_parents: include_parents === 'true'
        });
        
        logger.info('Students retrieved by filters', { 
            tenantId, 
            campusId,
            academic_year_id,
            class_id,
            assignment_status,
            count: result.length
        });
        
        return successResponse(res, 'Students retrieved successfully', { students: result });
        
    } catch (error) {
        logger.error('Error getting students by filters:', error);
        
        if (error.message.includes('required')) {
            return errorResponse(res, error.message, 400);
        }
        
        return errorResponse(res, 'Failed to get students by filters', 500);
    }
};

/**
 * Assign students to section (bulk assignment)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const assignStudentsToSection = async (req, res) => {
    try {
        const { tenantId, campusId } = req.user;
        const { student_ids, section_id, academic_year_id, class_id } = req.body;
        
        // Validate required parameters
        if (!student_ids || !Array.isArray(student_ids) || student_ids.length === 0) {
            return errorResponse(res, 'Student IDs array is required and cannot be empty', 400);
        }
        
        if (!section_id) {
            return errorResponse(res, 'Section ID is required', 400);
        }
        
        if (!academic_year_id) {
            return errorResponse(res, 'Academic year ID is required', 400);
        }
        
        if (!class_id) {
            return errorResponse(res, 'Class ID is required', 400);
        }
        
        logger.info('Assigning students to section', { 
            tenantId, 
            campusId,
            student_ids,
            section_id,
            academic_year_id,
            class_id,
            studentCount: student_ids.length
        });
        
        const result = await studentService.assignStudentsToSection({
            tenantId,
            campusId,
            student_ids,
            section_id: parseInt(section_id),
            academic_year_id: parseInt(academic_year_id),
            class_id: parseInt(class_id)
        });
        
        logger.info('Students assigned to section successfully', { 
            tenantId, 
            campusId,
            section_id,
            assignedCount: result.assignedCount,
            updatedStudents: result.updatedStudents
        });
        
        return successResponse(res, `Successfully assigned ${result.assignedCount} students to section`, result, 201);
        
    } catch (error) {
        logger.error('Error assigning students to section:', error);
        
        if (error.message.includes('required') || 
            error.message.includes('not found') || 
            error.message.includes('already assigned')) {
            return errorResponse(res, error.message, 400);
        }
        
        return errorResponse(res, 'Failed to assign students to section', 500);
    }
};

/**
 * Update a single student's section assignment
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateStudentSection = async (req, res) => {
    try {
        const { tenantId, campusId } = req.user;
        const studentId = parseInt(req.params.studentId);
        const { section_id } = req.body;
        
        // Validate required parameters
        if (!studentId || isNaN(studentId)) {
            return errorResponse(res, 'Invalid student ID', 400);
        }
        
        if (!section_id) {
            return errorResponse(res, 'Section ID is required', 400);
        }
        
        logger.info('Updating student section assignment', { 
            tenantId, 
            campusId,
            studentId,
            section_id
        });
        
        const result = await studentService.updateStudentSection(
            studentId,
            parseInt(section_id),
            tenantId,
            campusId
        );
        
        logger.info('Student section updated successfully', { 
            tenantId, 
            campusId,
            studentId,
            username: result.username,
            newSectionId: result.section.section_id,
            sectionName: result.section.section_name
        });
        
        return successResponse(res, 'Student section updated successfully', result);
        
    } catch (error) {
        logger.error('Error updating student section:', error);
        
        if (error.message.includes('required') || 
            error.message.includes('not found') || 
            error.message.includes('does not match')) {
            return errorResponse(res, error.message, 400);
        }
        
        return errorResponse(res, 'Failed to update student section', 500);
    }
};

/**
 * Deassign a student from their section (set section to null)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deassignStudentSection = async (req, res) => {
    try {
        const { tenantId, campusId } = req.user;
        const studentId = parseInt(req.params.studentId);
        
        // Validate required parameters
        if (!studentId || isNaN(studentId)) {
            return errorResponse(res, 'Invalid student ID', 400);
        }
        
        logger.info('Deassigning student from section', { 
            tenantId, 
            campusId,
            studentId
        });
        
        const result = await studentService.deassignStudentSection(
            studentId,
            tenantId,
            campusId
        );
        
        logger.info('Student deassigned from section successfully', { 
            tenantId, 
            campusId,
            studentId,
            username: result.username,
            previousSectionId: result.previousSection.section_id,
            previousSectionName: result.previousSection.section_name
        });
        
        return successResponse(res, result.message, result);
        
    } catch (error) {
        logger.error('Error deassigning student from section:', error);
        
        if (error.message.includes('not found') || 
            error.message.includes('not currently assigned')) {
            return errorResponse(res, error.message, 404);
        }
        
        return errorResponse(res, 'Failed to deassign student from section', 500);
    }
};

const getStudentsBySectionController = async (req, res) => {
    try {
        const { tenantId, campusId } = req.user;
        const { classId, sectionId } = req.params;
        const { academicYearId } = req.query;

        if (!classId) {
            return errorResponse(res, 'Class ID is required', 400);
        }

        if (!sectionId) {
            return errorResponse(res, 'Section ID is required', 400);
        }

        logger.info('CONTROLLER: Getting students by section ID', {
            tenantId,
            campusId,
            classId,
            sectionId,
            academicYearId
        });

        const students = await studentService.getStudentsBySection(
            tenantId,
            campusId,
            academicYearId,
            classId,
            sectionId
        );

        return successResponse(res, 'Students retrieved successfully', { students });

    } catch (error) {
        logger.error('CONTROLLER: Error getting students by section:', error);
        return errorResponse(res, 'Failed to get students by section', 500);
    }
};

module.exports = {
    getAllStudents,
    registerStudent,
    updateStudent,
    updateStudentEnrollment,
    deleteStudent,
    getStudentByAdmissionNumber,
    getStudentByUsername,
    getStudentsByClassSection,
    getStudentStatistics,
    getStudentById,
    getStudentParents,
    getParentStudents,
    addParentToStudent,
    removeParentFromStudent,
    updateParentRelationship,
    getStudentFilterOptions,
    getCompleteStudentForEdit,
    getStudentsByFilters,
    assignStudentsToSection,
    updateStudentSection,
    deassignStudentSection,
    getStudentsBySectionController
};