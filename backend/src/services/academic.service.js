const academicModel = require('../models/academic.model');
const classModel = require('../models/class.model');

// ==================== CURRICULA SERVICE METHODS ====================

/**
 * Get all curricula for a specific campus
 */
const getAllCurricula = async (campusId) => {
    return await academicModel.getAllCurricula(campusId);
};

/**
 * Create a new curriculum
 */
const createCurriculum = async (curriculumData) => {
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
        return await academicModel.getCurriculumById(curriculumId, campusId);
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
    return await academicModel.getAllAcademicYears(campusId);
};

/**
 * Create a new academic year
 */
const createAcademicYear = async (academicYearData) => {
    // Resolve class IDs from class names
    try {
        if (academicYearData.fromclass) {
            const fromClass = await classModel.getClassByName(academicYearData.fromclass, academicYearData.campus_id);
            if (!fromClass) {
                throw new Error(`From Class '${academicYearData.fromclass}' not found`);
            }
            academicYearData.from_class_id = fromClass.class_id;
        }

        if (academicYearData.toclass) {
            const toClass = await classModel.getClassByName(academicYearData.toclass, academicYearData.campus_id);
            if (!toClass) {
                throw new Error(`To Class '${academicYearData.toclass}' not found`);
            }
            academicYearData.to_class_id = toClass.class_id;
        }

        // Validate curriculum existence and campus ownership
        if (academicYearData.curriculum_id) {
            const curriculum = await academicModel.getCurriculumById(academicYearData.curriculum_id, academicYearData.campus_id);
            if (!curriculum) {
                throw new Error('Invalid curriculum ID for this campus');
            }
        }

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
    // Resolve class IDs from class names if provided
    try {
        if (academicYearData.fromclass) {
            const fromClass = await classModel.getClassByName(academicYearData.fromclass, campusId);
            if (!fromClass) {
                throw new Error(`From Class '${academicYearData.fromclass}' not found`);
            }
            academicYearData.from_class_id = fromClass.class_id;
        }

        if (academicYearData.toclass) {
            const toClass = await classModel.getClassByName(academicYearData.toclass, campusId);
            if (!toClass) {
                throw new Error(`To Class '${academicYearData.toclass}' not found`);
            }
            academicYearData.to_class_id = toClass.class_id;
        }

        // Validate curriculum existence and campus ownership
        if (academicYearData.curriculum_id) {
            const curriculum = await academicModel.getCurriculumById(academicYearData.curriculum_id, campusId);
            if (!curriculum) {
                throw new Error('Invalid curriculum ID for this campus');
            }
        }

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
        return await academicModel.getAcademicYearById(academicYearId, campusId);
    } catch (error) {
        console.error('Error getting academic year by ID in service:', error);
        throw error;
    }
};

/**
 * Get academic year options for dropdown
 */
const getAcademicYearOptions = async (campusId) => {
    return await academicModel.getAcademicYearOptions(campusId);
};

/**
 * Get distinct year names for dropdown
 */
const getDistinctYearNames = async (campusId) => {
    return await academicModel.getDistinctYearNames(campusId);
};

/**
 * Get distinct media for dropdown
 */
const getDistinctMedia = async (campusId) => {
    return await academicModel.getDistinctMedia(campusId);
};

/**
 * Get academic year ID by combination
 */
const getAcademicYearIdByCombo = async (campusId, yearName, yearType, curriculumId, medium) => {
    return await academicModel.getAcademicYearIdByCombo(campusId, yearName, yearType, curriculumId, medium);
};

/**
 * Get comprehensive filter options for dropdowns (academic years + classes)
 * This centralized method eliminates duplicate code between student and section controllers
 */
const getFilterOptions = async (campusId, tenantId) => {
    try {
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
