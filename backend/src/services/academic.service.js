const academicModel = require('../models/academic.model');

// ==================== CURRICULA SERVICE METHODS ====================

/**
 * Get all curricula for a specific campus
 */
const getAllCurricula = async (campusId) => {
    try {
        if (!campusId || campusId.toString().trim() === '' || campusId === 'undefined' || campusId === null) {
            throw new Error('Valid campus ID is required');
        }

        const curricula = await academicModel.getAllCurricula(campusId);
        return curricula;
    } catch (error) {
        throw error;
    }
};

/**
 * Create a new curriculum
 */
const createCurriculum = async (curriculumData) => {
    console.log('Creating curriculum with data:', curriculumData);
    
    if (!curriculumData.campus_id || curriculumData.campus_id.toString().trim() === '' || curriculumData.campus_id === 'undefined' || curriculumData.campus_id === null) {
        throw new Error('Valid campus ID is required');
    }
    
    // Validate required fields
    if (!curriculumData.curriculum_code || !curriculumData.curriculum_name) {
        throw new Error('Missing required fields: curriculum_code and curriculum_name are required');
    }

    // Validate curriculum code format (alphanumeric, no spaces, max 20 chars)
    if (!/^[A-Za-z0-9_-]{1,20}$/.test(curriculumData.curriculum_code)) {
        throw new Error('Curriculum code must be alphanumeric (with underscores/hyphens allowed) and maximum 20 characters');
    }

    // Validate curriculum name length
    if (curriculumData.curriculum_name.length > 100) {
        throw new Error('Curriculum name must be maximum 100 characters');
    }

    try {
        const newCurriculum = await academicModel.createCurriculum(curriculumData);
        if (!newCurriculum) {
            throw new Error('Failed to create curriculum');
        }

        return {
            curriculumData: newCurriculum,
            message: 'Curriculum created successfully'
        };
    } catch (error) {
        console.error('Error creating curriculum in service:', error);
        
        // Handle unique constraint violation
        if (error.code === '23505') {
            throw new Error('A curriculum with this code already exists for this campus');
        }
        
        throw error;
    }
};

/**
 * Update a curriculum
 */
const updateCurriculum = async (curriculumId, curriculumData, campusId) => {
    console.log('Updating curriculum with data:', curriculumData);
    
    if (!campusId || campusId.toString().trim() === '' || campusId === 'undefined' || campusId === null) {
        throw new Error('Valid campus ID is required');
    }

    if (!curriculumId || curriculumId.toString().trim() === '' || curriculumId === 'undefined' || curriculumId === null) {
        throw new Error('Valid curriculum ID is required');
    }
    
    // Validate that at least one field is provided
    if (!curriculumData.curriculum_code && !curriculumData.curriculum_name) {
        throw new Error('At least one field must be provided: curriculum_code or curriculum_name');
    }

    // Validate curriculum code format if provided
    if (curriculumData.curriculum_code !== undefined && !/^[A-Za-z0-9_-]{1,20}$/.test(curriculumData.curriculum_code)) {
        throw new Error('Curriculum code must be alphanumeric (with underscores/hyphens allowed) and maximum 20 characters');
    }

    // Validate curriculum name length if provided
    if (curriculumData.curriculum_name !== undefined && curriculumData.curriculum_name.length > 100) {
        throw new Error('Curriculum name must be maximum 100 characters');
    }

    try {
        // Check if curriculum exists
        const existingCurriculum = await academicModel.getCurriculumById(curriculumId, campusId);
        if (!existingCurriculum) {
            throw new Error('Curriculum not found');
        }

        const updatedCurriculum = await academicModel.updateCurriculum(curriculumId, curriculumData, campusId);
        if (!updatedCurriculum) {
            throw new Error('Failed to update curriculum');
        }

        return {
            curriculumData: updatedCurriculum,
            message: 'Curriculum updated successfully'
        };
    } catch (error) {
        console.error('Error updating curriculum in service:', error);
        
        // Handle unique constraint violation
        if (error.code === '23505') {
            throw new Error('A curriculum with this code already exists for this campus');
        }
        
        throw error;
    }
};

/**
 * Delete a curriculum
 */
const deleteCurriculum = async (curriculumId, campusId) => {
    try {
        if (!campusId || campusId.toString().trim() === '' || campusId === 'undefined' || campusId === null) {
            throw new Error('Valid campus ID is required');
        }

        if (!curriculumId || curriculumId.toString().trim() === '' || curriculumId === 'undefined' || curriculumId === null) {
            throw new Error('Valid curriculum ID is required');
        }

        // Check if curriculum exists
        const existingCurriculum = await academicModel.getCurriculumById(curriculumId, campusId);
        if (!existingCurriculum) {
            throw new Error('Curriculum not found');
        }

        const deletedCurriculum = await academicModel.deleteCurriculum(curriculumId, campusId);
        if (!deletedCurriculum) {
            throw new Error('Failed to delete curriculum');
        }

        return {
            curriculumData: deletedCurriculum,
            message: 'Curriculum deleted successfully'
        };
    } catch (error) {
        console.error('Error deleting curriculum in service:', error);
        
        // Handle foreign key constraint violation
        if (error.code === '23503') {
            throw new Error('Cannot delete curriculum as it is being used by academic years');
        }
        
        throw error;
    }
};

/**
 * Get curriculum by ID
 */
const getCurriculumById = async (curriculumId, campusId) => {
    try {
        if (!campusId || campusId.toString().trim() === '' || campusId === 'undefined' || campusId === null) {
            throw new Error('Valid campus ID is required');
        }

        if (!curriculumId || curriculumId.toString().trim() === '' || curriculumId === 'undefined' || curriculumId === null) {
            throw new Error('Valid curriculum ID is required');
        }

        const curriculum = await academicModel.getCurriculumById(curriculumId, campusId);
        return curriculum;
    } catch (error) {
        console.error('Error getting curriculum by ID in service:', error);
        throw error;
    }
};

// ==================== ACADEMIC YEARS SERVICE METHODS ====================

/**
 * Get all academic years for a specific campus
 */
const getAllAcademicYears = async (campusId) => {
    try {
        if (!campusId || campusId.toString().trim() === '' || campusId === 'undefined' || campusId === null) {
            throw new Error('Valid campus ID is required');
        }

        const academicYears = await academicModel.getAllAcademicYears(campusId);
        return academicYears;
    } catch (error) {
        throw error;
    }
};

/**
 * Create a new academic year
 */
const createAcademicYear = async (academicYearData) => {
    console.log('Creating academic year with data:', academicYearData);
    
    if (!academicYearData.campus_id || academicYearData.campus_id.toString().trim() === '' || academicYearData.campus_id === 'undefined' || academicYearData.campus_id === null) {
        throw new Error('Valid campus ID is required');
    }
    
    // Validate required fields
    if (!academicYearData.year_name || !academicYearData.year_type || !academicYearData.medium || 
        !academicYearData.fromclass || !academicYearData.toclass || !academicYearData.curriculum_id) {
        throw new Error('Missing required fields: year_name, year_type, medium, fromclass, toclass, curriculum_id are required');
    }

    // Validate year_name format (e.g., '2025-2026')
    if (!/^\d{4}-\d{4}$/.test(academicYearData.year_name)) {
        throw new Error('Year name must be in format YYYY-YYYY (e.g., 2025-2026)');
    }

    // Validate year_type enum
    const validYearTypes = ['Current year', 'Previous year', 'Next year'];
    if (!validYearTypes.includes(academicYearData.year_type)) {
        throw new Error('Year type must be one of: Current year, Previous year, Next year');
    }

    // Validate date format if provided
    if (academicYearData.start_date && isNaN(Date.parse(academicYearData.start_date))) {
        throw new Error('Start date must be a valid date');
    }

    if (academicYearData.end_date && isNaN(Date.parse(academicYearData.end_date))) {
        throw new Error('End date must be a valid date');
    }

    // Validate that end_date is after start_date if both are provided
    if (academicYearData.start_date && academicYearData.end_date) {
        const startDate = new Date(academicYearData.start_date);
        const endDate = new Date(academicYearData.end_date);
        if (endDate <= startDate) {
            throw new Error('End date must be after start date');
        }
    }

    // Validate curriculum_id is a number
    if (!Number.isInteger(parseInt(academicYearData.curriculum_id))) {
        throw new Error('Curriculum ID must be a valid integer');
    }

    try {
        const newAcademicYear = await academicModel.createAcademicYear(academicYearData);
        if (!newAcademicYear) {
            throw new Error('Failed to create academic year');
        }

        return {
            academicYearData: newAcademicYear,
            message: 'Academic year created successfully'
        };
    } catch (error) {
        console.error('Error creating academic year in service:', error);
        
        // Handle unique constraint violation
        if (error.code === '23505') {
            throw new Error('An academic year with this combination already exists for this campus');
        }
        
        // Handle foreign key constraint violation
        if (error.code === '23503') {
            throw new Error('Invalid curriculum ID or campus ID');
        }
        
        throw error;
    }
};

/**
 * Update an academic year
 */
const updateAcademicYear = async (academicYearId, academicYearData, campusId) => {
    console.log('Updating academic year with data:', academicYearData);
    
    if (!campusId || campusId.toString().trim() === '' || campusId === 'undefined' || campusId === null) {
        throw new Error('Valid campus ID is required');
    }

    if (!academicYearId || academicYearId.toString().trim() === '' || academicYearId === 'undefined' || academicYearId === null) {
        throw new Error('Valid academic year ID is required');
    }
    
    // Validate that at least one field is provided
    const validFields = ['year_name', 'year_type', 'medium', 'start_date', 'end_date', 'fromclass', 'toclass', 
                         'start_time_of_day', 'end_time_of_day', 'shift_type', 'curriculum_id'];
    const providedFields = Object.keys(academicYearData).filter(field => 
        validFields.includes(field) && academicYearData[field] !== undefined
    );
    
    if (providedFields.length === 0) {
        throw new Error('At least one valid field must be provided for update');
    }

    // Validate year_name format if provided
    if (academicYearData.year_name !== undefined && !/^\d{4}-\d{4}$/.test(academicYearData.year_name)) {
        throw new Error('Year name must be in format YYYY-YYYY (e.g., 2025-2026)');
    }

    // Validate year_type enum if provided
    if (academicYearData.year_type !== undefined) {
        const validYearTypes = ['Current year', 'Previous year', 'Next year'];
        if (!validYearTypes.includes(academicYearData.year_type)) {
            throw new Error('Year type must be one of: Current year, Previous year, Next year');
        }
    }

    // Validate date format if provided
    if (academicYearData.start_date !== undefined && isNaN(Date.parse(academicYearData.start_date))) {
        throw new Error('Start date must be a valid date');
    }

    if (academicYearData.end_date !== undefined && isNaN(Date.parse(academicYearData.end_date))) {
        throw new Error('End date must be a valid date');
    }

    // Validate that end_date is after start_date if both are provided
    if (academicYearData.start_date !== undefined && academicYearData.end_date !== undefined) {
        const startDate = new Date(academicYearData.start_date);
        const endDate = new Date(academicYearData.end_date);
        if (endDate <= startDate) {
            throw new Error('End date must be after start date');
        }
    }

    // Validate curriculum_id is a number if provided
    if (academicYearData.curriculum_id !== undefined && !Number.isInteger(parseInt(academicYearData.curriculum_id))) {
        throw new Error('Curriculum ID must be a valid integer');
    }

    try {
        // Check if academic year exists
        const existingAcademicYear = await academicModel.getAcademicYearById(academicYearId, campusId);
        if (!existingAcademicYear) {
            throw new Error('Academic year not found');
        }

        const updatedAcademicYear = await academicModel.updateAcademicYear(academicYearId, academicYearData, campusId);
        if (!updatedAcademicYear) {
            throw new Error('Failed to update academic year');
        }

        return {
            academicYearData: updatedAcademicYear,
            message: 'Academic year updated successfully'
        };
    } catch (error) {
        console.error('Error updating academic year in service:', error);
        
        // Handle unique constraint violation
        if (error.code === '23505') {
            throw new Error('An academic year with this combination already exists for this campus');
        }
        
        // Handle foreign key constraint violation
        if (error.code === '23503') {
            throw new Error('Invalid curriculum ID');
        }
        
        throw error;
    }
};

/**
 * Delete an academic year
 */
const deleteAcademicYear = async (academicYearId, campusId) => {
    try {
        if (!campusId || campusId.toString().trim() === '' || campusId === 'undefined' || campusId === null) {
            throw new Error('Valid campus ID is required');
        }

        if (!academicYearId || academicYearId.toString().trim() === '' || academicYearId === 'undefined' || academicYearId === null) {
            throw new Error('Valid academic year ID is required');
        }

        // Check if academic year exists
        const existingAcademicYear = await academicModel.getAcademicYearById(academicYearId, campusId);
        if (!existingAcademicYear) {
            throw new Error('Academic year not found');
        }

        const deletedAcademicYear = await academicModel.deleteAcademicYear(academicYearId, campusId);
        if (!deletedAcademicYear) {
            throw new Error('Failed to delete academic year');
        }

        return {
            academicYearData: deletedAcademicYear,
            message: 'Academic year deleted successfully'
        };
    } catch (error) {
        console.error('Error deleting academic year in service:', error);
        
        // Handle foreign key constraint violation
        if (error.code === '23503') {
            throw new Error('Cannot delete academic year as it is being referenced by other records');
        }
        
        throw error;
    }
};

/**
 * Get academic year by ID
 */
const getAcademicYearById = async (academicYearId, campusId) => {
    try {
        if (!campusId || campusId.toString().trim() === '' || campusId === 'undefined' || campusId === null) {
            throw new Error('Valid campus ID is required');
        }

        if (!academicYearId || academicYearId.toString().trim() === '' || academicYearId === 'undefined' || academicYearId === null) {
            throw new Error('Valid academic year ID is required');
        }

        const academicYear = await academicModel.getAcademicYearById(academicYearId, campusId);
        return academicYear;
    } catch (error) {
        console.error('Error getting academic year by ID in service:', error);
        throw error;
    }
};

/**
 * Get academic year options for dropdown
 */
const getAcademicYearOptions = async (campusId) => {
    try {
        if (!campusId || campusId.toString().trim() === '' || campusId === 'undefined' || campusId === null) {
            throw new Error('Valid campus ID is required');
        }

        const academicYearOptions = await academicModel.getAcademicYearOptions(campusId);
        return academicYearOptions;
    } catch (error) {
        throw error;
    }
};

/**
 * Get distinct year names for dropdown
 */
const getDistinctYearNames = async (campusId) => {
    try {
        if (!campusId || campusId.toString().trim() === '' || campusId === 'undefined' || campusId === null) {
            throw new Error('Valid campus ID is required');
        }

        const yearNames = await academicModel.getDistinctYearNames(campusId);
        return yearNames;
    } catch (error) {
        throw error;
    }
};

/**
 * Get distinct media for dropdown
 */
const getDistinctMedia = async (campusId) => {
    try {
        if (!campusId || campusId.toString().trim() === '' || campusId === 'undefined' || campusId === null) {
            throw new Error('Valid campus ID is required');
        }

        const media = await academicModel.getDistinctMedia(campusId);
        return media;
    } catch (error) {
        throw error;
    }
};

/**
 * Get academic year ID by combination
 */
const getAcademicYearIdByCombo = async (campusId, yearName, yearType, curriculumId, medium) => {
    try {
        if (!campusId || campusId.toString().trim() === '' || campusId === 'undefined' || campusId === null) {
            throw new Error('Valid campus ID is required');
        }

        if (!yearName || !yearType || !curriculumId || !medium) {
            throw new Error('Year name, year type, curriculum ID, and medium are required');
        }

        const result = await academicModel.getAcademicYearIdByCombo(campusId, yearName, yearType, curriculumId, medium);
        return result;
    } catch (error) {
        throw error;
    }
};

/**
 * Get comprehensive filter options for dropdowns (academic years + classes)
 * This centralized method eliminates duplicate code between student and section controllers
 */
const getFilterOptions = async (campusId, tenantId) => {
    try {
        if (!campusId || campusId.toString().trim() === '' || campusId === 'undefined' || campusId === null) {
            throw new Error('Valid campus ID is required');
        }
        
        if (!tenantId || tenantId.toString().trim() === '' || tenantId === 'undefined' || tenantId === null) {
            throw new Error('Valid tenant ID is required');
        }

        // Import class service to get classes
        const classService = require('./class.service');
        
        // Get academic year options and classes in parallel
        const [academicYears, classes] = await Promise.all([
            getAcademicYearOptions(campusId),
            classService.getClassesByCampus(campusId, tenantId)
        ]);
        
        // Format the response data consistently
        const result = {
            academic_years: academicYears || [],
            classes: classes?.map(cls => ({
                class_id: cls.class_id,
                class_name: cls.class_name,
                class_level: cls.class_level
            })) || []
        };
        
        return result;
    } catch (error) {
        throw error;
    }
};

module.exports = {
    // Curricula services
    getAllCurricula,
    createCurriculum,
    updateCurriculum,
    deleteCurriculum,
    getCurriculumById,
    
    // Academic Years services
    getAllAcademicYears,
    createAcademicYear,
    updateAcademicYear,
    deleteAcademicYear,
    getAcademicYearById,
    getAcademicYearOptions,
    getDistinctYearNames,
    getDistinctMedia,
    getAcademicYearIdByCombo,
    
    // Centralized filter options method
    getFilterOptions
};