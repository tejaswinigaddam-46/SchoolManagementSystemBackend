const sectionService = require('../services/section.service');
const academicService = require('../services/academic.service');
const classService = require('../services/class.service');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

// ==================== SECTION CONTROLLER METHODS ====================

/**
 * Get all sections with pagination and filtering
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllSections = async (req, res) => {
    try {
        const { tenantId, campusId, tenant, campus } = req.user;
        const { page, limit, search, academic_year_id, class_id } = req.query;
        
        logger.info('Getting all sections', { 
            tenantId, 
            campusId,
            tenantName: tenant?.name,
            campusName: campus?.name,
            page, 
            limit, 
            search,
            academic_year_id,
            class_id
        });
        
        const result = await sectionService.getAllSections(tenantId, campusId, {
            page,
            limit,
            search,
            academic_year_id,
            class_id
        });
        
        logger.info('Successfully retrieved sections', { 
            tenantId, 
            campusId,
            tenantName: tenant?.name,
            campusName: campus?.name,
            count: result.sections.length,
            total: result.pagination.total_count 
        });
        
        return successResponse(res, 'Sections retrieved successfully', result);
        
    } catch (error) {
        logger.error('Error getting all sections:', error);
        return errorResponse(res, error.message, 500);
    }
};

/**
 * Create a new section (Admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createSection = async (req, res) => {
    try {
        const { tenantId, campusId, tenant, campus, role } = req.user;
        const sectionData = req.body;
        
        // Check if user is admin
        if (role !== 'Admin' && role !== 'Superadmin' && role !== 'Zonaladmin') {
            return errorResponse(res, 'Only admins can create sections', 403);
        }
        
        logger.info('Creating new section', { 
            tenantId, 
            campusId,
            tenantName: tenant?.name,
            campusName: campus?.name,
            sectionName: sectionData.section_name,
            className: sectionData.class_id,
            academicYearId: sectionData.academic_year_id
        });
        
        const result = await sectionService.createSection(sectionData, tenantId, campusId);
        
        logger.info('Section created successfully', { 
            tenantId, 
            sectionId: result.section_id,
            sectionName: result.section_name 
        });
        
        return successResponse(res, 'Section created successfully', result, 201);
        
    } catch (error) {
        logger.error('Error creating section:', error);
        
        if (error.message.includes('already exists') || 
            error.message.includes('required') ||
            error.message.includes('Invalid') ||
            error.message.includes('must be') ||
            error.message.includes('cannot be')) {
            return errorResponse(res, error.message, 400);
        }
        
        return errorResponse(res, 'Failed to create section', 500);
    }
};

/**
 * Get section by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getSectionById = async (req, res) => {
    try {
        const { tenantId, campusId } = req.user;
        const sectionId = parseInt(req.params.sectionId);
        
        if (!sectionId || isNaN(sectionId)) {
            return errorResponse(res, 'Invalid section ID', 400);
        }
        
        logger.info('Getting section by ID', { tenantId, campusId, sectionId });
        
        const section = await sectionService.getSectionById(sectionId, tenantId, campusId);
        
        logger.info('Section found by ID', { 
            tenantId, 
            campusId,
            sectionId,
            sectionName: section.section_name 
        });
        
        return successResponse(res, 'Section retrieved successfully', section);
        
    } catch (error) {
        logger.error('Error getting section by ID:', error);
        
        if (error.message.includes('not found')) {
            return errorResponse(res, error.message, 404);
        }
        
        if (error.message.includes('required')) {
            return errorResponse(res, error.message, 400);
        }
        
        return errorResponse(res, 'Failed to get section', 500);
    }
};

/**
 * Get subjects assigned to a section
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getSectionSubjects = async (req, res) => {
    try {
        const { tenantId, campusId } = req.user;
        const sectionId = parseInt(req.params.sectionId);
        
        if (!sectionId || isNaN(sectionId)) {
            return errorResponse(res, 'Invalid section ID', 400);
        }
        
        logger.info('Getting subjects for section', { tenantId, campusId, sectionId });
        
        const subjects = await sectionService.getSectionSubjects(sectionId, tenantId, campusId);
        
        return successResponse(res, 'Section subjects retrieved successfully', subjects);
        
    } catch (error) {
        logger.error('Error getting section subjects:', error);
        
        if (error.message.includes('not found')) {
            return errorResponse(res, error.message, 404);
        }
        
        return errorResponse(res, 'Failed to get section subjects', 500);
    }
};

/**
 * Update section information (Admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateSection = async (req, res) => {
    try {
        const { tenantId, campusId, role } = req.user;
        const sectionId = parseInt(req.params.sectionId);
        const updateData = req.body;
        
        // Check if user is admin
        if (role !== 'Admin' && role !== 'Superadmin' && role !== 'Zonaladmin') {
            return errorResponse(res, 'Only admins can update sections', 403);
        }
        
        if (!sectionId || isNaN(sectionId)) {
            return errorResponse(res, 'Invalid section ID', 400);
        }
        
        logger.info('Updating section', { 
            tenantId, 
            campusId,
            sectionId, 
            updateFields: Object.keys(updateData) 
        });
        
        const result = await sectionService.updateSection(sectionId, updateData, tenantId, campusId);
        
        logger.info('Section updated successfully', { 
            tenantId, 
            campusId,
            sectionId,
            sectionName: result.section_name 
        });
        
        return successResponse(res, 'Section updated successfully', result);
        
    } catch (error) {
        logger.error('Error updating section:', error);
        
        if (error.message.includes('not found')) {
            return errorResponse(res, error.message, 404);
        }
        
        if (error.message.includes('already exists') ||
            error.message.includes('required') ||
            error.message.includes('Invalid') ||
            error.message.includes('cannot be') ||
            error.message.includes('must be')) {
            return errorResponse(res, error.message, 400);
        }
        
        return errorResponse(res, 'Failed to update section', 500);
    }
};

/**
 * Delete section (Admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteSection = async (req, res) => {
    try {
        const { tenantId, campusId, role } = req.user;
        const sectionId = parseInt(req.params.sectionId);
        
        // Check if user is admin
        if (role !== 'Admin' && role !== 'Superadmin' && role !== 'Zonaladmin') {
            return errorResponse(res, 'Only admins can delete sections', 403);
        }
        
        if (!sectionId || isNaN(sectionId)) {
            return errorResponse(res, 'Invalid section ID', 400);
        }
        
        logger.info('Deleting section', { tenantId, campusId, sectionId });
        
        const result = await sectionService.deleteSection(sectionId, tenantId, campusId);
        
        logger.info('Section deleted successfully', { tenantId, campusId, sectionId });
        
        return successResponse(res, 'Section deleted successfully', result);
        
    } catch (error) {
        logger.error('Error deleting section:', error);
        
        if (error.message.includes('not found')) {
            return errorResponse(res, error.message, 404);
        }
        
        if (error.message.includes('Cannot delete') ||
            error.message.includes('enrolled students')) {
            return errorResponse(res, error.message, 400);
        }
        
        return errorResponse(res, 'Failed to delete section', 500);
    }
};

/**
 * Get section statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getSectionStatistics = async (req, res) => {
    try {
        const { tenantId, campusId } = req.user;
        
        logger.info('Getting section statistics', { tenantId, campusId });
        
        const result = await sectionService.getSectionStatistics(tenantId, campusId);
        
        logger.info('Section statistics retrieved', { tenantId, campusId, statistics: result });
        
        return successResponse(res, 'Section statistics retrieved successfully', result);
        
    } catch (error) {
        logger.error('Error getting section statistics:', error);
        return errorResponse(res, 'Failed to get section statistics', 500);
    }
};

/**
 * Get filter options for sections (academic years and classes)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getFilterOptions = async (req, res) => {
    try {
        const { tenantId, campusId } = req.user;
        
        logger.info('Getting section filter options', { tenantId, campusId });
        
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
        
        logger.info('Successfully retrieved section filter options', { 
            tenantId, 
            campusId,
            academicYearsCount: result.academic_years.length,
            classesCount: result.classes.length
        });
        
        return successResponse(res, 'Filter options retrieved successfully', result);
        
    } catch (error) {
        logger.error('Error getting section filter options:', error);
        return errorResponse(res, error.message, 500);
    }
};

module.exports = {
    getAllSections,
    createSection,
    getSectionById,
    getSectionSubjects,
    updateSection,
    deleteSection,
    getSectionStatistics,
    getFilterOptions
};