const { pool } = require('../config/database');
const logger = require('../utils/logger');
const employeeModel = require('../models/employee.model');
const { createResponse } = require('../utils/response');

// ==================== EMPLOYEE SERVICE METHODS ====================

/**
 * Create a new employee
 * @param {Object} employeeData - Employee data
 * @param {Object} context - User context (tenant_id, campus_id, role)
 * @returns {Promise<Object>} Service response
 */
const createEmployee = async (employeeData, context) => {
    logger.info('SERVICE: Starting createEmployee', {
        tenantId: context.tenant_id,
        campusId: context.campus_id,
        userRole: context.role,
        employeeId: employeeData?.employment?.employee_id
    });

    // Check if user has admin privileges
    if (context.role !== 'Admin') {
        logger.warn('SERVICE: Unauthorized employee creation attempt', { 
            userRole: context.role, 
            tenantId: context.tenant_id 
        });
        throw new Error('Only administrators can create employees');
    }

    // Validate required data structure
    if (!employeeData.user || !employeeData.contact || !employeeData.employment) {
        throw new Error('Missing required employee data sections (user, contact, employment)');
    }

    // Validate required fields
    const requiredUserFields = ['first_name', 'last_name', 'date_of_birth'];
    const requiredContactFields = ['email'];
    const requiredEmploymentFields = ['employee_id', 'designation', 'department', 'joining_date'];

    for (const field of requiredUserFields) {
        if (!employeeData.user[field]) {
            throw new Error(`Missing required user field: ${field}`);
        }
    }

    for (const field of requiredContactFields) {
        if (!employeeData.contact[field]) {
            throw new Error(`Missing required contact field: ${field}`);
        }
    }

    for (const field of requiredEmploymentFields) {
        if (!employeeData.employment[field]) {
            throw new Error(`Missing required employment field: ${field}`);
        }
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        logger.info('SERVICE: Started employee creation transaction');

        // Check if employee ID is unique within campus
        const campusId = context.campus_id;
        const isEmployeeIdUnique = await employeeModel.isEmployeeIdUnique(
            employeeData.employment.employee_id,
            campusId
        );

        if (!isEmployeeIdUnique) {
            throw new Error(`Employee ID '${employeeData.employment.employee_id}' already exists in this campus`);
        }

        // Check if email is unique (optional - depending on business rules)
        // You might want to allow same email for different roles
        
        // Create the employee using model
        const result = await employeeModel.createEmployeeWithClient(
            client,
            employeeData,
            context.tenant_id,
            campusId
        );

        await client.query('COMMIT');
        logger.info('SERVICE: Employee creation transaction committed', {
            username: result.username,
            employeeId: result.employee_id
        });

        return createResponse(true, 'Employee created successfully', {
            employee: {
                username: result.username,
                user_id: result.user_id,
                employee_id: result.employee_id,
                first_name: result.first_name,
                last_name: result.last_name
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        logger.error('SERVICE: Employee creation failed, rolled back', {
            error: error.message,
            tenantId: context.tenant_id,
            campusId: context.campus_id
        });
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Get employee by username
 * @param {string} username - Employee username
 * @param {Object} context - User context
 * @returns {Promise<Object>} Service response
 */
const getEmployeeByUsername = async (username, context) => {
    logger.info('SERVICE: Getting employee by username', { username, tenantId: context.tenant_id });

    try {
        const employee = await employeeModel.findEmployeeByUsername(username, context.tenant_id);

        if (!employee) {
            return createResponse(false, 'Employee not found', null, 404);
        }

        // Check if user has permission to view this employee
        // Admin can view all, others can only view employees in their campus
        if (context.role !== 'Admin' && employee.campus_id !== context.campus_id) {
            logger.warn('SERVICE: Unauthorized employee access attempt', {
                requestedEmployee: username,
                userRole: context.role,
                userCampusId: context.campus_id,
                employeeCampusId: employee.campus_id
            });
            return createResponse(false, 'You do not have permission to view this employee', null, 403);
        }

        return createResponse(true, 'Employee retrieved successfully', { employee });

    } catch (error) {
        logger.error('SERVICE: Error getting employee by username', {
            error: error.message,
            username,
            tenantId: context.tenant_id
        });
        throw error;
    }
};

/**
 * Get employee by employee ID
 * @param {string} employeeId - Employee ID
 * @param {Object} context - User context
 * @returns {Promise<Object>} Service response
 */
const getEmployeeByEmployeeId = async (employeeId, context) => {
    logger.info('SERVICE: Getting employee by employee ID', { employeeId, tenantId: context.tenant_id });

    try {
        const employee = await employeeModel.findEmployeeByEmployeeId(employeeId, context.campus_id);

        if (!employee) {
            return createResponse(false, 'Employee not found', null, 404);
        }

        return createResponse(true, 'Employee retrieved successfully', { employee });

    } catch (error) {
        logger.error('SERVICE: Error getting employee by employee ID', {
            error: error.message,
            employeeId,
            campusId: context.campus_id
        });
        throw error;
    }
};

/**
 * Get complete employee data for editing
 * @param {string} username - Employee username
 * @param {Object} context - User context
 * @returns {Promise<Object>} Service response
 */
const getCompleteEmployeeForEdit = async (username, context) => {
    logger.info('SERVICE: Getting complete employee for edit', { username, tenantId: context.tenant_id });

    // Check if user has admin privileges
    if (context.role !== 'Admin') {
        throw new Error('Only administrators can access complete employee data for editing');
    }

    try {
        const employee = await employeeModel.getCompleteEmployeeData(username, context.tenant_id);

        if (!employee) {
            return createResponse(false, 'Employee not found', null, 404);
        }

        // Structure the data for frontend consumption
        const structuredData = {
            user: {
                username: employee.username,
                first_name: employee.first_name,
                middle_name: employee.middle_name,
                last_name: employee.last_name,
                phone_number: employee.phone_number,
                date_of_birth: employee.date_of_birth ? new Date(employee.date_of_birth).toISOString().split('T')[0] : null,
                role: employee.role
            },
            contact: {
                email: employee.email,
                phone: employee.contact_phone,
                alt_phone: employee.alt_phone,
                current_address: employee.current_address,
                city: employee.city,
                state: employee.state,
                pincode: employee.pincode,
                country: employee.country,
                permanent_address: employee.permanent_address,
                emergency_contact_name: employee.emergency_contact_name,
                emergency_contact_phone: employee.emergency_contact_phone,
                emergency_contact_relation: employee.emergency_contact_relation
            },
            employment: {
                employment_id: employee.employment_id,
                employee_id: employee.employee_id,
                designation: employee.designation,
                department: employee.department,
                joining_date: employee.joining_date ? new Date(employee.joining_date).toISOString().split('T')[0] : null,
                salary: employee.salary,
                employment_type: employee.employment_type,
                status: employee.employment_status,
                transport_details: employee.transport_details,
                hostel_details: employee.hostel_details
            },
            personal: {
                gender: employee.gender,
                marital_status: employee.marital_status,
                nationality: employee.nationality,
                religion: employee.religion,
                caste: employee.caste,
                category: employee.category,
                blood_group: employee.blood_group,
                height_cm: employee.height_cm,
                weight_kg: employee.weight_kg,
                medical_conditions: employee.medical_conditions,
                allergies: employee.allergies,
                occupation: employee.occupation,
                income: employee.income
            }
        };

        return createResponse(true, 'Complete employee data retrieved successfully', structuredData);

    } catch (error) {
        logger.error('SERVICE: Error getting complete employee for edit', {
            error: error.message,
            username,
            tenantId: context.tenant_id
        });
        throw error;
    }
};

/**
 * Get all employees with filters and pagination
 * @param {Object} context - User context
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Service response
 */
const getAllEmployees = async (context, options = {}) => {
    logger.info('SERVICE: Getting all employees', {
        tenantId: context.tenant_id,
        campusId: context.campus_id,
        userRole: context.role,
        options
    });

    try {
        // For non-admin users, filter by their campus
        const queryOptions = { ...options };
        if (context.role !== 'Admin') {
            queryOptions.campus_id = context.campus_id;
        }

        const result = await employeeModel.getAllEmployees(context.tenant_id, queryOptions);

        return createResponse(true, 'Employees retrieved successfully', {
            employees: result.employees,
            pagination: result.pagination
        });

    } catch (error) {
        logger.error('SERVICE: Error getting all employees', {
            error: error.message,
            tenantId: context.tenant_id,
            options
        });
        throw error;
    }
};

/**
 * Update employee
 * @param {string} username - Employee username
 * @param {Object} updateData - Data to update
 * @param {Object} context - User context
 * @returns {Promise<Object>} Service response
 */
const updateEmployeeByUsername = async (username, updateData, context) => {
    logger.info('SERVICE: Updating employee', {
        username,
        tenantId: context.tenant_id,
        userRole: context.role,
        updateSections: Object.keys(updateData)
    });

    // Check if user has admin privileges
    if (context.role !== 'Admin') {
        throw new Error('Only administrators can update employees');
    }

    try {
        // Check if employee exists and belongs to the tenant
        const existingEmployee = await employeeModel.findEmployeeByUsername(username, context.tenant_id);
        if (!existingEmployee) {
            return createResponse(false, 'Employee not found', null, 404);
        }

        // If employee_id is being updated, check for uniqueness
        if (updateData.employment?.employee_id) {
            const isEmployeeIdUnique = await employeeModel.isEmployeeIdUnique(
                updateData.employment.employee_id,
                existingEmployee.campus_id,
                username // Exclude current employee from check
            );

            if (!isEmployeeIdUnique) {
                throw new Error(`Employee ID '${updateData.employment.employee_id}' already exists in this campus`);
            }
        }

        const updatedEmployee = await employeeModel.updateEmployee(username, updateData, context.tenant_id);

        if (!updatedEmployee) {
            return createResponse(false, 'Employee update failed', null, 500);
        }

        return createResponse(true, 'Employee updated successfully', { employee: updatedEmployee });

    } catch (error) {
        logger.error('SERVICE: Error updating employee', {
            error: error.message,
            username,
            tenantId: context.tenant_id
        });
        throw error;
    }
};

/**
 * Delete employee
 * @param {string} username - Employee username
 * @param {Object} context - User context
 * @returns {Promise<Object>} Service response
 */
const deleteEmployeeByUsername = async (username, context) => {
    logger.info('SERVICE: Deleting employee', {
        username,
        tenantId: context.tenant_id,
        userRole: context.role
    });

    // Check if user has admin privileges
    if (context.role !== 'Admin') {
        throw new Error('Only administrators can delete employees');
    }

    try {
        // Check if employee exists and belongs to the tenant
        const existingEmployee = await employeeModel.findEmployeeByUsername(username, context.tenant_id);
        if (!existingEmployee) {
            return createResponse(false, 'Employee not found', null, 404);
        }

        const result = await employeeModel.deleteEmployee(username, context.tenant_id);

        if (result) {
            return createResponse(true, 'Employee deleted successfully', null);
        } else {
            return createResponse(false, 'Employee deletion failed', null, 500);
        }

    } catch (error) {
        logger.error('SERVICE: Error deleting employee', {
            error: error.message,
            username,
            tenantId: context.tenant_id
        });
        throw error;
    }
};

/**
 * Check username availability
 * @param {string} username - Username to check
 * @param {Object} context - User context
 * @returns {Promise<Object>} Service response
 */
const checkUsernameAvailability = async (username, context) => {
    logger.info('SERVICE: Checking username availability', { username });

    try {
        const isUnique = await employeeModel.isUsernameUnique(username);
        
        return createResponse(true, 'Username availability checked', {
            username,
            available: isUnique
        });

    } catch (error) {
        logger.error('SERVICE: Error checking username availability', {
            error: error.message,
            username
        });
        throw error;
    }
};

/**
 * Check employee ID availability
 * @param {string} employeeId - Employee ID to check
 * @param {string} campusId - Campus ID
 * @param {Object} context - User context
 * @returns {Promise<Object>} Service response
 */
const checkEmployeeIdAvailability = async (employeeId, campusId, context) => {
    logger.info('SERVICE: Checking employee ID availability', { employeeId, campusId });

    try {
        const isUnique = await employeeModel.isEmployeeIdUnique(employeeId, campusId);
        
        return createResponse(true, 'Employee ID availability checked', {
            employee_id: employeeId,
            campus_id: campusId,
            available: isUnique
        });

    } catch (error) {
        logger.error('SERVICE: Error checking employee ID availability', {
            error: error.message,
            employeeId,
            campusId
        });
        throw error;
    }
};

/**
 * Get employee statistics
 * @param {Object} context - User context
 * @param {string} campusId - Optional campus ID filter
 * @returns {Promise<Object>} Service response
 */
const getEmployeeStatistics = async (context, campusId = null) => {
    logger.info('=== SERVICE: getEmployeeStatistics START ===');
    logger.info('SERVICE: Input parameters received', {
        context: {
            tenant_id: context?.tenant_id,
            campus_id: context?.campus_id,
            role: context?.role,
            username: context?.username
        },
        campusId_override: campusId,
        campusId_type: typeof campusId
    });

    try {
        // Validate context
        if (!context) {
            logger.error('SERVICE: No context provided');
            throw new Error('User context is required');
        }

        if (!context.tenant_id) {
            logger.error('SERVICE: No tenant_id in context', { context });
            throw new Error('Tenant ID is required');
        }

        // For non-admin users, use their campus
        const targetCampusId = context.role === 'Admin' ? campusId : context.campus_id;
        
        logger.info('SERVICE: Determined target campus ID', {
            user_role: context.role,
            is_admin: context.role === 'Admin',
            requested_campus_id: campusId,
            user_campus_id: context.campus_id,
            final_target_campus_id: targetCampusId
        });

        logger.info('SERVICE: Calling employeeModel.getEmployeeStatistics with parameters', {
            tenant_id: context.tenant_id,
            target_campus_id: targetCampusId
        });
        
        const stats = await employeeModel.getEmployeeStatistics(context.tenant_id, targetCampusId);

        logger.info('SERVICE: Model call completed', {
            stats_received: !!stats,
            stats_type: typeof stats,
            stats_keys: stats ? Object.keys(stats) : null,
            stats_content: stats
        });

        const response = createResponse(true, 'Employee statistics retrieved successfully', stats);
        
        logger.info('SERVICE: Response created', {
            response_success: response.success,
            response_message: response.message,
            response_data: response.data
        });

        logger.info('=== SERVICE: getEmployeeStatistics END (SUCCESS) ===');
        return response;

    } catch (error) {
        logger.error('=== SERVICE: getEmployeeStatistics ERROR ===');
        logger.error('SERVICE: Error details', {
            error_name: error.name,
            error_message: error.message,
            error_code: error.code,
            error_stack: error.stack,
            input_context: context,
            input_campusId: campusId
        });
        
        logger.error('=== SERVICE: getEmployeeStatistics END (ERROR) ===');
        throw error;
    }
};

/**
 * Get enum values for employee dropdowns
 * @param {Object} context - User context
 * @returns {Promise<Object>} Service response
 */
const getEnumValues = async (context) => {
    logger.info('SERVICE: Getting enum values for employee dropdowns');

    try {
        const enumValues = await employeeModel.getEnumValues();
        const data = enumValues?.data || enumValues;
        return createResponse(true, 'Enum values retrieved successfully', data);
    } catch (error) {
        logger.error('SERVICE: Error getting enum values', {
            error: error.message
        });
        throw error;
    }
};

/**
 * Get filter options for employee list
 * @param {Object} context - User context
 * @returns {Promise<Object>} Service response
 */
const getFilterOptions = async (context) => {
    logger.info('SERVICE: Getting filter options for employees', {
        tenantId: context.tenant_id,
        userRole: context.role
    });

    try {
        // Get enum values for dropdowns
        const enumValues = await employeeModel.getEnumValues();
        const data = enumValues?.data || enumValues;
        return createResponse(true, 'Filter options retrieved successfully', data);

    } catch (error) {
        logger.error('SERVICE: Error getting filter options', {
            error: error.message,
            tenantId: context.tenant_id
        });
        throw error;
    }
};

/**
 * Get employees by campus
 * @param {string} campusId - Campus ID
 * @param {Object} context - User context
 * @returns {Promise<Object>} Service response
 */
const getEmployeesByCampus = async (campusId, context) => {
    logger.info('SERVICE: Getting employees by campus', {
        campusId,
        tenantId: context.tenant_id,
        userRole: context.role
    });

    // Check if user has permission to access this campus
    if (context.role !== 'Admin' && context.campus_id !== campusId) {
        throw new Error('You do not have permission to view employees from this campus');
    }

    try {
        const options = { campus_id: campusId };
        const result = await employeeModel.getAllEmployees(context.tenant_id, options);

        return createResponse(true, 'Campus employees retrieved successfully', {
            campus_id: campusId,
            employees: result.employees,
            pagination: result.pagination
        });

    } catch (error) {
        logger.error('SERVICE: Error getting employees by campus', {
            error: error.message,
            campusId,
            tenantId: context.tenant_id
        });
        throw error;
    }
};

/**
 * Get employees by department
 * @param {string} department - Department name
 * @param {Object} context - User context
 * @param {string} campusId - Optional campus ID filter
 * @returns {Promise<Object>} Service response
 */
const getEmployeesByDepartment = async (department, context, campusId = null) => {
    logger.info('SERVICE: Getting employees by department', {
        department,
        campusId,
        tenantId: context.tenant_id,
        userRole: context.role
    });

    try {
        const options = { 
            department: department,
            campus_id: context.role === 'Admin' ? campusId : context.campus_id
        };
        
        const result = await employeeModel.getAllEmployees(context.tenant_id, options);

        return createResponse(true, 'Department employees retrieved successfully', {
            department: department,
            campus_id: options.campus_id,
            employees: result.employees,
            pagination: result.pagination
        });

    } catch (error) {
        logger.error('SERVICE: Error getting employees by department', {
            error: error.message,
            department,
            campusId,
            tenantId: context.tenant_id
        });
        throw error;
    }
};

module.exports = {
    createEmployee,
    getEmployeeByUsername,
    getEmployeeByEmployeeId,
    getCompleteEmployeeForEdit,
    getAllEmployees,
    updateEmployeeByUsername,
    deleteEmployeeByUsername,
    checkUsernameAvailability,
    checkEmployeeIdAvailability,
    getEmployeeStatistics,
    getEnumValues,
    getFilterOptions,
    getEmployeesByCampus,
    getEmployeesByDepartment
};
