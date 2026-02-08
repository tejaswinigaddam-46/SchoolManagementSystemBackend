const classModel = require('../models/class.model');
const logger = require('../utils/logger');

// ==================== CLASS SERVICE METHODS ====================

/**
 * Create a new class
 * @param {Object} classData - Class data from request
 * @param {string} tenantId - School/Tenant ID
 * @param {string} campusId - Campus ID
 * @returns {Promise<Object>} Created class object
 * @throws {Error} If creation fails or validation errors
 */
const createClass = async (classData, tenantId, campusId) => {
    // Validate required fields
    if (!classData.className || !classData.className.trim()) {
        throw new Error('Class name is required');
    }

    if (!classData.classLevel) {
        throw new Error('Class level is required');
    }

    // Validate class level is a positive integer
    const classLevel = parseInt(classData.classLevel);
    if (isNaN(classLevel) || classLevel < 1 || classLevel > 12) {
        throw new Error('Class level must be a number between 1 and 12');
    }

    // Validate class name length
    if (classData.className.trim().length > 50) {
        throw new Error('Class name must not exceed 50 characters');
    }

    try {
        // Check if class name is unique within the campus
        const isUnique = await classModel.isClassNameUnique(classData.className, campusId);
        if (!isUnique) {
            throw new Error('A class with this name already exists in this campus');
        }

        // Create the class
        const newClass = await classModel.createClass(classData, tenantId, campusId);
        
        logger.info(`Class service: Created class ${newClass.class_name} with ID ${newClass.class_id}`);
        return newClass;
    } catch (error) {
        logger.error('Class service: Error creating class:', error.message);
        throw error;
    }
};

/**
 * Get all classes with pagination and filters
 * @param {string} tenantId - School/Tenant ID
 * @param {string} campusId - Campus ID (optional)
 * @param {Object} options - Query options (page, limit, search)
 * @returns {Promise<Object>} Classes list with pagination
 */
const getAllClasses = async (tenantId, campusId = null, options = {}) => {
    try {
        const result = await classModel.getAllClasses(tenantId, campusId, options);
        
        logger.info(`Class service: Retrieved ${result.classes.length} classes for tenant ${tenantId}`);
        return result;
    } catch (error) {
        logger.error('Class service: Error fetching classes:', error.message);
        throw error;
    }
};

/**
 * Get class by ID
 * @param {number} classId - Class ID
 * @param {string} tenantId - School/Tenant ID
 * @returns {Promise<Object|null>} Class object or null if not found
 */
const getClassById = async (classId, tenantId) => {
    if (!classId || isNaN(parseInt(classId))) {
        throw new Error('Valid class ID is required');
    }

    try {
        const classItem = await classModel.findClassById(parseInt(classId), tenantId);
        
        if (!classItem) {
            logger.warn(`Class service: Class with ID ${classId} not found for tenant ${tenantId}`);
            return null;
        }

        logger.info(`Class service: Retrieved class ${classItem.class_name} with ID ${classId}`);
        return classItem;
    } catch (error) {
        logger.error('Class service: Error fetching class by ID:', error.message);
        throw error;
    }
};

/**
 * Get classes by campus
 * @param {string} campusId - Campus ID
 * @param {string} tenantId - School/Tenant ID
 * @returns {Promise<Array>} Array of classes
 */
const getClassesByCampus = async (campusId, tenantId) => {
    if (!campusId) {
        throw new Error('Campus ID is required');
    }

    try {
        const classes = await classModel.findClassesByCampus(campusId, tenantId);
        
        logger.info(`Class service: Retrieved ${classes.length} classes for campus ${campusId}`);
        return classes;
    } catch (error) {
        logger.error('Class service: Error fetching classes by campus:', error.message);
        throw error;
    }
};

/**
 * Update class information
 * @param {number} classId - Class ID
 * @param {Object} updateData - Data to update
 * @param {string} tenantId - School/Tenant ID
 * @returns {Promise<Object|null>} Updated class object or null
 */
const updateClass = async (classId, updateData, tenantId) => {
    if (!classId || isNaN(parseInt(classId))) {
        throw new Error('Valid class ID is required');
    }

    // Validate update data
    if (updateData.className !== undefined) {
        if (!updateData.className || !updateData.className.trim()) {
            throw new Error('Class name cannot be empty');
        }
        if (updateData.className.trim().length > 50) {
            throw new Error('Class name must not exceed 50 characters');
        }
    }

    if (updateData.classLevel !== undefined) {
        const classLevel = parseInt(updateData.classLevel);
        if (isNaN(classLevel) || classLevel < 1 || classLevel > 12) {
            throw new Error('Class level must be a number between 1 and 12');
        }
    }

    try {
        // First check if class exists
        const existingClass = await classModel.findClassById(parseInt(classId), tenantId);
        if (!existingClass) {
            throw new Error('Class not found');
        }

        // Check class name uniqueness if class name is being updated
        if (updateData.className && updateData.className.trim() !== existingClass.class_name) {
            const isUnique = await classModel.isClassNameUnique(
                updateData.className, 
                existingClass.campus_id, 
                parseInt(classId)
            );
            if (!isUnique) {
                throw new Error('A class with this name already exists in this campus');
            }
        }

        const updatedClass = await classModel.updateClass(parseInt(classId), updateData, tenantId);
        
        if (!updatedClass) {
            throw new Error('Class not found or update failed');
        }

        logger.info(`Class service: Updated class ${updatedClass.class_name} with ID ${classId}`);
        return updatedClass;
    } catch (error) {
        logger.error('Class service: Error updating class:', error.message);
        throw error;
    }
};

/**
 * Delete class
 * @param {number} classId - Class ID
 * @param {string} tenantId - School/Tenant ID
 * @returns {Promise<boolean>} True if deleted successfully
 */
const deleteClass = async (classId, tenantId) => {
    if (!classId || isNaN(parseInt(classId))) {
        throw new Error('Valid class ID is required');
    }

    try {
        // First check if class exists
        const existingClass = await classModel.findClassById(parseInt(classId), tenantId);
        if (!existingClass) {
            throw new Error('Class not found');
        }

        const result = await classModel.deleteClass(parseInt(classId), tenantId);
        
        logger.info(`Class service: Deleted class ${existingClass.class_name} with ID ${classId}`);
        return result;
    } catch (error) {
        logger.error('Class service: Error deleting class:', error.message);
        throw error;
    }
};

/**
 * Get class statistics
 * @param {string} campusId - Campus ID (optional)
 * @param {string} tenantId - School/Tenant ID
 * @returns {Promise<Object>} Class statistics
 */
const getClassStatistics = async (campusId, tenantId) => {
    try {
        const stats = await classModel.getClassStatistics(campusId, tenantId);
        
        logger.info(`Class service: Retrieved class statistics for ${campusId ? 'campus ' + campusId : 'tenant ' + tenantId}`);
        return stats;
    } catch (error) {
        logger.error('Class service: Error fetching class statistics:', error.message);
        throw error;
    }
};

module.exports = {
    createClass,
    getAllClasses,
    getClassById,
    getClassesByCampus,
    updateClass,
    deleteClass,
    getClassStatistics
};