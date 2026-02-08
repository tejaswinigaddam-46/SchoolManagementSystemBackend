const classService = require('../services/class.service');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

// ==================== CLASS CONTROLLER METHODS ====================

/**
 * Get all classes with pagination and filtering
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllClasses = async (req, res) => {
    try {
        const { tenantId, campusId, tenant, campus } = req.user;
        const { page, limit, search } = req.query;
        
        logger.info('Getting all classes', { 
            tenantId, 
            campusId,
            tenantName: tenant?.name,
            campusName: campus?.name,
            page, 
            limit, 
            search 
        });
        
        const result = await classService.getAllClasses(tenantId, campusId, {
            page,
            limit,
            search
        });
        
        // Transform database field names to camelCase for frontend
        const transformedResult = {
            ...result,
            classes: result.classes.map(classItem => ({
                classId: classItem.class_id,
                campusId: classItem.campus_id,
                className: classItem.class_name,
                classLevel: classItem.class_level,
                campusName: classItem.campus_name
            }))
        };
        
        logger.info('Successfully retrieved classes', { 
            tenantId, 
            campusId,
            tenantName: tenant?.name,
            campusName: campus?.name,
            count: transformedResult.classes.length,
            total: transformedResult.pagination.total_count 
        });
        
        return successResponse(res, 'Classes retrieved successfully', transformedResult);
        
    } catch (error) {
        logger.error('Error getting all classes:', error);
        return errorResponse(res, error.message, 500);
    }
};

/**
 * Create a new class
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createClass = async (req, res) => {
    try {
        const { tenantId, campusId, tenant, campus } = req.user;
        const classData = req.body;
        
        logger.info('Creating new class', { 
            tenantId, 
            campusId,
            tenantName: tenant?.name,
            campusName: campus?.name,
            className: classData.className,
            classLevel: classData.classLevel 
        });
        
        const result = await classService.createClass(classData, tenantId, campusId);
        
        logger.info('Class created successfully', { 
            tenantId, 
            classId: result.class_id,
            className: result.class_name 
        });
        
        return successResponse(res, 'Class created successfully', result, 201);
        
    } catch (error) {
        logger.error('Error creating class:', error);
        
        if (error.message.includes('already exists') || 
            error.message.includes('unique') ||
            error.message.includes('required') ||
            error.message.includes('Invalid') ||
            error.message.includes('must be') ||
            error.message.includes('cannot be')) {
            return errorResponse(res, error.message, 400);
        }
        
        return errorResponse(res, 'Failed to create class', 500);
    }
};

/**
 * Get class by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getClassById = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const classId = parseInt(req.params.classId);
        
        if (!classId || isNaN(classId)) {
            return errorResponse(res, 'Invalid class ID', 400);
        }
        
        logger.info('Getting class by ID', { tenantId, classId });
        
        const classItem = await classService.getClassById(classId, tenantId);
        
        if (!classItem) {
            return errorResponse(res, 'Class not found', 404);
        }
        
        logger.info('Class found by ID', { 
            tenantId, 
            classId,
            className: classItem.class_name 
        });
        
        return successResponse(res, 'Class retrieved successfully', classItem);
        
    } catch (error) {
        logger.error('Error getting class by ID:', error);
        
        if (error.message.includes('required')) {
            return errorResponse(res, error.message, 400);
        }
        
        return errorResponse(res, 'Failed to get class', 500);
    }
};

/**
 * Get classes by campus
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getClassesByCampus = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const { campusId } = req.params;
        
        if (!campusId?.trim()) {
            return errorResponse(res, 'Campus ID is required', 400);
        }
        
        logger.info('Getting classes by campus', { 
            tenantId, 
            campusId 
        });
        
        const result = await classService.getClassesByCampus(campusId, tenantId);
        
        logger.info('Classes retrieved by campus', { 
            tenantId, 
            campusId,
            count: result.length 
        });
        
        return successResponse(res, 'Classes retrieved successfully', { classes: result });
        
    } catch (error) {
        logger.error('Error getting classes by campus:', error);
        
        if (error.message.includes('required')) {
            return errorResponse(res, error.message, 400);
        }
        
        return errorResponse(res, 'Failed to get classes', 500);
    }
};

/**
 * Update class information
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateClass = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const classId = parseInt(req.params.classId);
        const updateData = req.body;
        
        if (!classId || isNaN(classId)) {
            return errorResponse(res, 'Invalid class ID', 400);
        }
        
        logger.info('Updating class', { 
            tenantId, 
            classId, 
            updateFields: Object.keys(updateData) 
        });
        
        const result = await classService.updateClass(classId, updateData, tenantId);
        
        if (!result) {
            return errorResponse(res, 'Class not found', 404);
        }
        
        logger.info('Class updated successfully', { 
            tenantId, 
            classId,
            className: result.class_name 
        });
        
        return successResponse(res, 'Class updated successfully', result);
        
    } catch (error) {
        logger.error('Error updating class:', error);
        
        if (error.message.includes('not found') || error.message.includes('Class not found')) {
            return errorResponse(res, error.message, 404);
        }
        
        if (error.message.includes('already exists') ||
            error.message.includes('required') ||
            error.message.includes('Invalid') ||
            error.message.includes('cannot be') ||
            error.message.includes('must be')) {
            return errorResponse(res, error.message, 400);
        }
        
        return errorResponse(res, 'Failed to update class', 500);
    }
};

/**
 * Delete class
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */

/* update delete only if c;ass is not associated with any section or student*/
const deleteClass = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const classId = parseInt(req.params.classId);
        
        if (!classId || isNaN(classId)) {
            return errorResponse(res, 'Invalid class ID', 400);
        }
        
        logger.info('Deleting class', { tenantId, classId });
        
        const result = await classService.deleteClass(classId, tenantId);
        
        logger.info('Class deleted successfully', { tenantId, classId });
        
        return successResponse(res, 'Class deleted successfully', { class_id: classId });
        
    } catch (error) {
        logger.error('Error deleting class:', error);
        
        if (error.message.includes('not found')) {
            return errorResponse(res, error.message, 404);
        }
        
        if (error.message.includes('Cannot delete') ||
            error.message.includes('students enrolled')) {
            return errorResponse(res, error.message, 400);
        }
        
        return errorResponse(res, 'Failed to delete class', 500);
    }
};

/**
 * Get class statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getClassStatistics = async (req, res) => {
    try {
        const { tenantId, campusId } = req.user;
        
        logger.info('Getting class statistics', { tenantId, campusId });
        
        const result = await classService.getClassStatistics(campusId, tenantId);
        
        logger.info('Class statistics retrieved', { tenantId, campusId, statistics: result });
        
        return successResponse(res, 'Class statistics retrieved successfully', result);
        
    } catch (error) {
        logger.error('Error getting class statistics:', error);
        return errorResponse(res, 'Failed to get class statistics', 500);
    }
};

module.exports = {
    getAllClasses,
    createClass,
    getClassById,
    getClassesByCampus,
    updateClass,
    deleteClass,
    getClassStatistics
};