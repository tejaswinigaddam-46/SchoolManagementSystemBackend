const { validationResult } = require('express-validator');
const logger = require('../utils/logger');
const employeeService = require('../services/employee.service');

// ==================== EMPLOYEE CONTROLLER METHODS ====================

/**
 * Controller to handle employee creation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createEmployeeController = async (req, res) => {
    logger.info('CONTROLLER: createEmployeeController called', {
        tenantId: req.user?.tenantId,
        campusId: req.user?.campusId,
        userRole: req.user?.role,
        bodyKeys: Object.keys(req.body || {})
    });

    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        logger.warn('CONTROLLER: Validation errors in employee creation', {
            errors: errors.array(),
            tenantId: req.user?.tenantId
        });
        return res.status(400).json({ 
            success: false, 
            message: 'Validation failed',
            errors: errors.array() 
        });
    }

    try {
        const employeeData = req.body;
        const context = {
            tenant_id: req.user.tenantId,
            campus_id: req.user.campusId,
            role: req.user.role,
            username: req.user.username
        };

        if (!context.tenant_id || !context.campus_id) {
            logger.error('CONTROLLER: Invalid user context for employee creation', { context });
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid user context. Tenant ID and Campus ID are required.' 
            });
        }

        const result = await employeeService.createEmployee(employeeData, context);
        
        logger.info('CONTROLLER: Employee created successfully', {
            tenantId: context.tenant_id,
            username: result.data?.employee?.username,
            employeeId: result.data?.employee?.employee_id
        });

        res.status(201).json(result);
    } catch (error) {
        logger.error('CONTROLLER: Error in createEmployeeController', {
            error: error.message,
            tenantId: req.user?.tenantId,
            stack: error.stack
        });

        // Handle specific error types
        if (error.message.includes('Only administrators')) {
            return res.status(403).json({ 
                success: false, 
                message: error.message 
            });
        }

        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
            return res.status(409).json({ 
                success: false, 
                message: error.message 
            });
        }

        if (error.message.includes('Missing required')) {
            return res.status(400).json({ 
                success: false, 
                message: error.message 
            });
        }

        res.status(500).json({ 
            success: false, 
            message: 'Failed to create employee. Please try again later.' 
        });
    }
};

/**
 * Controller to get all employees with pagination and filters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllEmployeesController = async (req, res) => {
    logger.info('CONTROLLER: getAllEmployeesController called', {
        tenantId: req.user?.tenant_id,
        campusId: req.user?.campus_id,
        userRole: req.user?.role,
        queryParams: req.query
    });

    try {
        const context = {
            tenant_id: req.user.tenantId,
            campus_id: req.user.campusId,
            role: req.user.role,
            username: req.user.username
        };

        const options = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 20,
            search: req.query.search || '',
            department: req.query.department || '',
            designation: req.query.designation || '',
            status: req.query.status || '',
            employment_type: req.query.employment_type || '',
            campus_id: req.query.campus_id || null,
            role: req.query.role || ''
        };

        const result = await employeeService.getAllEmployees(context, options);
        
        logger.info('CONTROLLER: Employees retrieved successfully', {
            tenantId: context.tenant_id,
            count: result.data?.employees?.length || 0,
            page: options.page
        });

        res.status(200).json(result);
    } catch (error) {
        logger.error('CONTROLLER: Error in getAllEmployeesController', {
            error: error.message,
            tenantId: req.user?.tenant_id,
            queryParams: req.query
        });

        res.status(500).json({ 
            success: false, 
            message: `Failed to retrieve employees. Please try again later. Error: ${error.message}`
        });
    }
};

/**
 * Controller to get employee by username
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getEmployeeByUsernameController = async (req, res) => {
    const { username } = req.params;
    
    logger.info('CONTROLLER: getEmployeeByUsernameController called', {
        username,
        tenantId: req.user?.tenant_id,
        userRole: req.user?.role
    });

    try {
        const context = {
            tenant_id: req.user.tenantId,
            campus_id: req.user.campusId,
            role: req.user.role,
            username: req.user.username
        };

        const result = await employeeService.getEmployeeByUsername(username, context);
        
        if (result.success) {
            logger.info('CONTROLLER: Employee retrieved successfully', {
                username,
                tenantId: context.tenant_id
            });
        }

        res.status(result.success ? 200 : (result.statusCode || 404)).json(result);
    } catch (error) {
        logger.error('CONTROLLER: Error in getEmployeeByUsernameController', {
            error: error.message,
            username,
            tenantId: req.user?.tenant_id
        });

        if (error.message.includes('permission')) {
            return res.status(403).json({ 
                success: false, 
                message: error.message 
            });
        }

        res.status(500).json({ 
            success: false, 
            message: 'Failed to retrieve employee. Please try again later.' 
        });
    }
};

/**
 * Controller to get employee by employee ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getEmployeeByEmployeeIdController = async (req, res) => {
    const { employeeId, employmentId } = req.params;
    const actualEmployeeId = employeeId || employmentId;
    
    logger.info('CONTROLLER: getEmployeeByEmployeeIdController called', {
        employeeId: actualEmployeeId,
        tenantId: req.user?.tenant_id,
        campusId: req.user?.campus_id
    });

    try {
        const context = {
            tenant_id: req.user.tenantId,
            campus_id: req.user.campusId,
            role: req.user.role,
            username: req.user.username
        };

        const result = await employeeService.getEmployeeByEmployeeId(actualEmployeeId, context);
        
        if (result.success) {
            logger.info('CONTROLLER: Employee retrieved by employee ID successfully', {
                employeeId,
                tenantId: context.tenant_id
            });
        }

        res.status(result.success ? 200 : (result.statusCode || 404)).json(result);
    } catch (error) {
        logger.error('CONTROLLER: Error in getEmployeeByEmployeeIdController', {
            error: error.message,
            employeeId: actualEmployeeId,
            tenantId: req.user?.tenant_id
        });

        res.status(500).json({ 
            success: false, 
            message: 'Failed to retrieve employee. Please try again later.' 
        });
    }
};

/**
 * Controller to get complete employee data for editing
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getCompleteEmployeeForEditController = async (req, res) => {
    const { username } = req.params;
    
    logger.info('CONTROLLER: getCompleteEmployeeForEditController called', {
        username,
        tenantId: req.user?.tenant_id,
        userRole: req.user?.role
    });

    try {
        const context = {
            tenant_id: req.user.tenantId,
            campus_id: req.user.campusId,
            role: req.user.role,
            username: req.user.username
        };

        const result = await employeeService.getCompleteEmployeeForEdit(username, context);
        
        if (result.success) {
            logger.info('CONTROLLER: Complete employee data retrieved successfully', {
                username,
                tenantId: context.tenant_id
            });
        }

        res.status(result.success ? 200 : (result.statusCode || 404)).json(result);
    } catch (error) {
        logger.error('CONTROLLER: Error in getCompleteEmployeeForEditController', {
            error: error.message,
            username,
            tenantId: req.user?.tenant_id
        });

        if (error.message.includes('Only administrators')) {
            return res.status(403).json({ 
                success: false, 
                message: error.message 
            });
        }

        res.status(500).json({ 
            success: false, 
            message: 'Failed to retrieve employee details. Please try again later.' 
        });
    }
};

/**
 * Controller to update employee
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateEmployeeController = async (req, res) => {
    const { username } = req.params;
    
    logger.info('CONTROLLER: updateEmployeeController called', {
        username,
        tenantId: req.user?.tenant_id,
        userRole: req.user?.role,
        updateSections: Object.keys(req.body || {})
    });

    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        logger.warn('CONTROLLER: Validation errors in employee update', {
            errors: errors.array(),
            username,
            tenantId: req.user?.tenant_id
        });
        return res.status(400).json({ 
            success: false, 
            message: 'Validation failed',
            errors: errors.array() 
        });
    }

    try {
        const updateData = req.body;
        const context = {
            tenant_id: req.user.tenantId,
            campus_id: req.user.campusId,
            role: req.user.role,
            username: req.user.username
        };

        const result = await employeeService.updateEmployeeByUsername(username, updateData, context);
        
        if (result.success) {
            logger.info('CONTROLLER: Employee updated successfully', {
                username,
                tenantId: context.tenant_id
            });
        }

        res.status(result.success ? 200 : (result.statusCode || 404)).json(result);
    } catch (error) {
        logger.error('CONTROLLER: Error in updateEmployeeController', {
            error: error.message,
            username,
            tenantId: req.user?.tenant_id
        });

        if (error.message.includes('Only administrators')) {
            return res.status(403).json({ 
                success: false, 
                message: error.message 
            });
        }

        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
            return res.status(409).json({ 
                success: false, 
                message: error.message 
            });
        }

        res.status(500).json({ 
            success: false, 
            message: 'Failed to update employee. Please try again later.' 
        });
    }
};

/**
 * Controller to delete employee
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteEmployeeController = async (req, res) => {
    const { username } = req.params;
    
    logger.info('CONTROLLER: deleteEmployeeController called', {
        username,
        tenantId: req.user?.tenant_id,
        userRole: req.user?.role
    });

    try {
        const context = {
            tenant_id: req.user.tenantId,
            campus_id: req.user.campusId,
            role: req.user.role,
            username: req.user.username
        };

        const result = await employeeService.deleteEmployeeByUsername(username, context);
        
        if (result.success) {
            logger.info('CONTROLLER: Employee deleted successfully', {
                username,
                tenantId: context.tenant_id
            });
        }

        res.status(result.success ? 200 : (result.statusCode || 404)).json(result);
    } catch (error) {
        logger.error('CONTROLLER: Error in deleteEmployeeController', {
            error: error.message,
            username,
            tenantId: req.user?.tenant_id
        });

        if (error.message.includes('Only administrators')) {
            return res.status(403).json({ 
                success: false, 
                message: error.message 
            });
        }

        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete employee. Please try again later.' 
        });
    }
};

/**
 * Controller to check username availability
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const checkUsernameAvailabilityController = async (req, res) => {
    const { username } = req.query;
    
    logger.info('CONTROLLER: checkUsernameAvailabilityController called', {
        username,
        tenantId: req.user?.tenant_id
    });

    if (!username) {
        return res.status(400).json({ 
            success: false, 
            message: 'Username parameter is required' 
        });
    }

    try {
        const context = {
            tenant_id: req.user.tenantId,
            campus_id: req.user.campusId,
            role: req.user.role,
            username: req.user.username
        };

        const result = await employeeService.checkUsernameAvailability(username, context);
        
        res.status(200).json(result);
    } catch (error) {
        logger.error('CONTROLLER: Error in checkUsernameAvailabilityController', {
            error: error.message,
            username,
            tenantId: req.user?.tenant_id
        });

        res.status(500).json({ 
            success: false, 
            message: 'Failed to check username availability. Please try again later.' 
        });
    }
};

/**
 * Controller to check employee ID availability
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const checkEmployeeIdAvailabilityController = async (req, res) => {
    const { employee_id, campus_id } = req.query;
    
    logger.info('CONTROLLER: checkEmployeeIdAvailabilityController called', {
        employee_id,
        campus_id,
        tenantId: req.user?.tenant_id
    });

    if (!employee_id || !campus_id) {
        return res.status(400).json({ 
            success: false, 
            message: 'employee_id and campus_id parameters are required' 
        });
    }

    try {
        const context = {
            tenant_id: req.user.tenantId,
            campus_id: req.user.campusId,
            role: req.user.role,
            username: req.user.username
        };

        const result = await employeeService.checkEmployeeIdAvailability(employee_id, campus_id, context);
        
        res.status(200).json(result);
    } catch (error) {
        logger.error('CONTROLLER: Error in checkEmployeeIdAvailabilityController', {
            error: error.message,
            employee_id,
            campus_id,
            tenantId: req.user?.tenant_id
        });

        res.status(500).json({ 
            success: false, 
            message: 'Failed to check employee ID availability. Please try again later.' 
        });
    }
};

/**
 * Controller to get employee statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getEmployeeStatisticsController = async (req, res) => {
    const { campus_id } = req.query;
    
    logger.info('=== CONTROLLER: getEmployeeStatisticsController START ===');
    logger.info('CONTROLLER: Request received', {
        method: req.method,
        url: req.url,
        campus_id_param: campus_id,
        query_params: req.query,
        headers: {
            'content-type': req.headers['content-type'],
            'authorization': req.headers.authorization ? 'Bearer [PRESENT]' : 'MISSING'
        }
    });

    logger.info('CONTROLLER: User context from middleware', {
        user_exists: !!req.user,
        user_data: req.user ? {
            tenantId: req.user.tenantId,
            campusId: req.user.campusId,
            role: req.user.role,
            username: req.user.username,
            tenant_id: req.user.tenant_id,
            campus_id: req.user.campus_id
        } : null
    });

    try {
        if (!req.user) {
            logger.error('CONTROLLER: No user context available - authentication failed');
            return res.status(401).json({ 
                success: false, 
                message: 'Authentication required' 
            });
        }

        const context = {
            tenant_id: req.user.tenantId,
            campus_id: req.user.campusId,
            role: req.user.role,
            username: req.user.username
        };

        logger.info('CONTROLLER: Context prepared for service', {
            context,
            campus_id_override: campus_id
        });

        logger.info('CONTROLLER: Calling employeeService.getEmployeeStatistics...');
        const result = await employeeService.getEmployeeStatistics(context, campus_id);
        
        logger.info('CONTROLLER: Service call completed successfully', {
            result_success: result?.success,
            result_message: result?.message,
            result_data_keys: result?.data ? Object.keys(result.data) : null
        });
        
        logger.info('CONTROLLER: Sending response', {
            status: 200,
            response_structure: {
                success: result?.success,
                message: result?.message,
                has_data: !!result?.data
            }
        });

        res.status(200).json(result);
        
        logger.info('=== CONTROLLER: getEmployeeStatisticsController END (SUCCESS) ===');
    } catch (error) {
        logger.error('=== CONTROLLER: getEmployeeStatisticsController ERROR ===');
        logger.error('CONTROLLER: Error details', {
            error_name: error.name,
            error_message: error.message,
            error_stack: error.stack,
            campus_id,
            tenantId: req.user?.tenantId,
            user_context: req.user ? {
                tenantId: req.user.tenantId,
                campusId: req.user.campusId,
                role: req.user.role
            } : null
        });

        logger.error('CONTROLLER: Sending error response', {
            status: 500,
            message: 'Failed to retrieve employee statistics. Please try again later.'
        });

        res.status(500).json({ 
            success: false, 
            message: `Failed to retrieve employee statistics. Please try again later. Error: ${error.message}` 
        });
        
        logger.error('=== CONTROLLER: getEmployeeStatisticsController END (ERROR) ===');
    }
};

/**
 * Controller to get enum values
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getEnumValuesController = async (req, res) => {
    logger.info('CONTROLLER: getEnumValuesController called', {
        tenantId: req.user?.tenant_id
    });

    try {
        const context = {
            tenant_id: req.user.tenantId,
            campus_id: req.user.campusId,
            role: req.user.role,
            username: req.user.username
        };

        const result = await employeeService.getEnumValues(context);
        
        res.status(200).json(result);
    } catch (error) {
        logger.error('CONTROLLER: Error in getEnumValuesController', {
            error: error.message,
            tenantId: req.user?.tenant_id
        });

        res.status(500).json({ 
            success: false, 
            message: 'Failed to retrieve enum values. Please try again later.' 
        });
    }
};

/**
 * Controller to get filter options
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getFilterOptionsController = async (req, res) => {
    logger.info('CONTROLLER: getFilterOptionsController called', {
        tenantId: req.user?.tenant_id
    });

    try {
        const context = {
            tenant_id: req.user.tenantId,
            campus_id: req.user.campusId,
            role: req.user.role,
            username: req.user.username
        };

        const result = await employeeService.getFilterOptions(context);
        
        res.status(200).json(result);
    } catch (error) {
        logger.error('CONTROLLER: Error in getFilterOptionsController', {
            error: error.message,
            tenantId: req.user?.tenant_id
        });

        res.status(500).json({ 
            success: false, 
            message: 'Failed to retrieve filter options. Please try again later.' 
        });
    }
};

/**
 * Controller to get employees by campus
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getEmployeesByCampusController = async (req, res) => {
    const { campusId } = req.params;
    
    logger.info('CONTROLLER: getEmployeesByCampusController called', {
        campusId,
        tenantId: req.user?.tenant_id,
        userRole: req.user?.role
    });

    try {
        const context = {
            tenant_id: req.user.tenantId,
            campus_id: req.user.campusId,
            role: req.user.role,
            username: req.user.username
        };

        const result = await employeeService.getEmployeesByCampus(campusId, context);
        
        res.status(200).json(result);
    } catch (error) {
        logger.error('CONTROLLER: Error in getEmployeesByCampusController', {
            error: error.message,
            campusId,
            tenantId: req.user?.tenant_id
        });

        if (error.message.includes('permission')) {
            return res.status(403).json({ 
                success: false, 
                message: error.message 
            });
        }

        res.status(500).json({ 
            success: false, 
            message: 'Failed to retrieve campus employees. Please try again later.' 
        });
    }
};

/**
 * Controller to get employees by department
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getEmployeesByDepartmentController = async (req, res) => {
    const { department } = req.params;
    const { campus_id } = req.query;
    
    logger.info('CONTROLLER: getEmployeesByDepartmentController called', {
        department,
        campus_id,
        tenantId: req.user?.tenant_id,
        userRole: req.user?.role
    });

    try {
        const context = {
            tenant_id: req.user.tenantId,
            campus_id: req.user.campusId,
            role: req.user.role,
            username: req.user.username
        };

        const result = await employeeService.getEmployeesByDepartment(department, context, campus_id);
        
        res.status(200).json(result);
    } catch (error) {
        logger.error('CONTROLLER: Error in getEmployeesByDepartmentController', {
            error: error.message,
            department,
            campus_id,
            tenantId: req.user?.tenant_id
        });

        res.status(500).json({ 
            success: false, 
            message: 'Failed to retrieve department employees. Please try again later.' 
        });
    }
};

module.exports = {
    createEmployeeController,
    getAllEmployeesController,
    getEmployeeByUsernameController,
    getEmployeeByEmployeeIdController,
    getCompleteEmployeeForEditController,
    updateEmployeeController,
    deleteEmployeeController,
    checkUsernameAvailabilityController,
    checkEmployeeIdAvailabilityController,
    getEmployeeStatisticsController,
    getEnumValuesController,
    getFilterOptionsController,
    getEmployeesByCampusController,
    getEmployeesByDepartmentController
};
