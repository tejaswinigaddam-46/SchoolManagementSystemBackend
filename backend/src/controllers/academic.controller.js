const academicService = require('../services/academic.service');

// ==================== CURRICULA CONTROLLERS ====================

/**
 * Get all curricula for a campus
 */
const getAllCurricula = async (req, res) => {
    try {
        const { campusId } = req.params;
        
        if (!campusId || campusId.trim() === '' || campusId === 'undefined' || campusId === null) {
            return res.status(400).json({
                success: false,
                message: 'Valid campus ID is required'
            });
        }

        const curricula = await academicService.getAllCurricula(campusId);
        
        res.status(200).json({
            success: true,
            message: 'Curricula retrieved successfully',
            data: curricula
        });
    } catch (error) {
        console.error('Error in getAllCurricula controller:', error);
        
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching curricula'
        });
    }
};

/**
 * Create a new curriculum
 */
const createCurriculum = async (req, res) => {
    try {
        const { campusId } = req.params;
        const { curriculum_code, curriculum_name } = req.body;
        
        if (!campusId || campusId.trim() === '' || campusId === 'undefined' || campusId === null) {
            return res.status(400).json({
                success: false,
                message: 'Valid campus ID is required'
            });
        }
        
        // Validate required fields
        if (!curriculum_code || !curriculum_name) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required: curriculum_code, curriculum_name'
            });
        }

        const result = await academicService.createCurriculum({
            campus_id: campusId,
            curriculum_code,
            curriculum_name
        });
        
        res.status(201).json({
            success: true,
            message: 'Curriculum created successfully',
            data: {
                curriculum: result.curriculumData,
                message: result.message
            }
        });
    } catch (error) {
        console.error('Error in createCurriculum controller:', error);
        
        // Handle specific validation errors
        if (error.message.includes('Missing required fields') || 
            error.message.includes('alphanumeric') || 
            error.message.includes('maximum') ||
            error.message.includes('already exists')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Internal server error while creating curriculum'
        });
    }
};

/**
 * Update a curriculum
 */
const updateCurriculum = async (req, res) => {
    try {
        const { campusId, curriculumId } = req.params;
        const { curriculum_code, curriculum_name } = req.body;
        
        if (!campusId || campusId.trim() === '' || campusId === 'undefined' || campusId === null) {
            return res.status(400).json({
                success: false,
                message: 'Valid campus ID is required'
            });
        }

        if (!curriculumId || curriculumId.trim() === '' || curriculumId === 'undefined' || curriculumId === null) {
            return res.status(400).json({
                success: false,
                message: 'Valid curriculum ID is required'
            });
        }
        
        // Validate at least one field is provided
        if (!curriculum_code && !curriculum_name) {
            return res.status(400).json({
                success: false,
                message: 'At least one field must be provided: curriculum_code or curriculum_name'
            });
        }

        // Build update object with only provided fields
        const updateData = {};
        if (curriculum_code !== undefined) updateData.curriculum_code = curriculum_code;
        if (curriculum_name !== undefined) updateData.curriculum_name = curriculum_name;

        const result = await academicService.updateCurriculum(curriculumId, updateData, campusId);
        
        res.status(200).json({
            success: true,
            message: 'Curriculum updated successfully',
            data: {
                curriculum: result.curriculumData,
                message: result.message
            }
        });
    } catch (error) {
        console.error('Error in updateCurriculum controller:', error);
        
        // Handle specific validation errors
        if (error.message === 'Curriculum not found') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        
        if (error.message.includes('At least one field must be provided') || 
            error.message.includes('alphanumeric') || 
            error.message.includes('maximum') ||
            error.message.includes('already exists')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error while updating curriculum'
        });
    }
};

/**
 * Delete a curriculum
 */
const deleteCurriculum = async (req, res) => {
    try {
        const { campusId, curriculumId } = req.params;
        
        if (!campusId || campusId.trim() === '' || campusId === 'undefined' || campusId === null) {
            return res.status(400).json({
                success: false,
                message: 'Valid campus ID is required'
            });
        }

        if (!curriculumId || curriculumId.trim() === '' || curriculumId === 'undefined' || curriculumId === null) {
            return res.status(400).json({
                success: false,
                message: 'Valid curriculum ID is required'
            });
        }

        const result = await academicService.deleteCurriculum(curriculumId, campusId);
        
        res.status(200).json({
            success: true,
            message: 'Curriculum deleted successfully',
            data: {
                curriculum: result.curriculumData,
                message: result.message
            }
        });
    } catch (error) {
        console.error('Error in deleteCurriculum controller:', error);
        
        if (error.message === 'Curriculum not found') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        if (error.message.includes('being used by academic years')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error while deleting curriculum'
        });
    }
};

/**
 * Get curriculum by ID
 */
const getCurriculumById = async (req, res) => {
    try {
        const { campusId, curriculumId } = req.params;
        
        if (!campusId || campusId.trim() === '' || campusId === 'undefined' || campusId === null) {
            return res.status(400).json({
                success: false,
                message: 'Valid campus ID is required'
            });
        }

        if (!curriculumId || curriculumId.trim() === '' || curriculumId === 'undefined' || curriculumId === null) {
            return res.status(400).json({
                success: false,
                message: 'Valid curriculum ID is required'
            });
        }

        const curriculum = await academicService.getCurriculumById(curriculumId, campusId);
        
        if (!curriculum) {
            return res.status(404).json({
                success: false,
                message: 'Curriculum not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Curriculum retrieved successfully',
            data: curriculum
        });
    } catch (error) {
        console.error('Error in getCurriculumById controller:', error);
        
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching curriculum'
        });
    }
};

// ==================== ACADEMIC YEARS CONTROLLERS ====================

/**
 * Get all academic years for a campus
 */
const getAllAcademicYears = async (req, res) => {
    try {
        const { campusId } = req.params;
        
        if (!campusId || campusId.trim() === '' || campusId === 'undefined' || campusId === null) {
            return res.status(400).json({
                success: false,
                message: 'Valid campus ID is required'
            });
        }

        const academicYears = await academicService.getAllAcademicYears(campusId);
        
        res.status(200).json({
            success: true,
            message: 'Academic years retrieved successfully',
            data: academicYears
        });
    } catch (error) {
        console.error('Error in getAllAcademicYears controller:', error);
        
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching academic years'
        });
    }
};

/**
 * Create a new academic year
 */
const createAcademicYear = async (req, res) => {
    try {
        const { campusId } = req.params;
        const { 
            year_name, 
            year_type, 
            medium, 
            start_date, 
            end_date, 
            fromclass, 
            toclass,
            start_time_of_day,
            end_time_of_day,
            shift_type,
            curriculum_id
        } = req.body;
        
        if (!campusId || campusId.trim() === '' || campusId === 'undefined' || campusId === null) {
            return res.status(400).json({
                success: false,
                message: 'Valid campus ID is required'
            });
        }
        
        // Validate required fields
        if (!year_name || !year_type || !medium || !fromclass || !toclass || !curriculum_id) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required: year_name, year_type, medium, fromclass, toclass, curriculum_id'
            });
        }

        const result = await academicService.createAcademicYear({
            campus_id: campusId,
            year_name,
            year_type,
            medium,
            start_date,
            end_date,
            fromclass,
            toclass,
            start_time_of_day,
            end_time_of_day,
            shift_type,
            curriculum_id
        });
        
        res.status(201).json({
            success: true,
            message: 'Academic year created successfully',
            data: {
                academicYear: result.academicYearData,
                message: result.message
            }
        });
    } catch (error) {
        console.error('Error in createAcademicYear controller:', error);
        
        // Handle specific validation errors
        if (error.message.includes('Missing required fields') || 
            error.message.includes('format') || 
            error.message.includes('must be one of') ||
            error.message.includes('valid date') ||
            error.message.includes('after start date') ||
            error.message.includes('valid integer') ||
            error.message.includes('already exists') ||
            error.message.includes('Invalid curriculum ID')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Internal server error while creating academic year'
        });
    }
};

/**
 * Update an academic year
 */
const updateAcademicYear = async (req, res) => {
    try {
        const { campusId, academicYearId } = req.params;
        const { 
            year_name, 
            year_type, 
            medium, 
            start_date, 
            end_date, 
            fromclass, 
            toclass,
            start_time_of_day,
            end_time_of_day,
            shift_type,
            curriculum_id
        } = req.body;
        
        if (!campusId || campusId.trim() === '' || campusId === 'undefined' || campusId === null) {
            return res.status(400).json({
                success: false,
                message: 'Valid campus ID is required'
            });
        }

        if (!academicYearId || academicYearId.trim() === '' || academicYearId === 'undefined' || academicYearId === null) {
            return res.status(400).json({
                success: false,
                message: 'Valid academic year ID is required'
            });
        }

        // Build update object with only provided fields
        const updateData = {};
        if (year_name !== undefined) updateData.year_name = year_name;
        if (year_type !== undefined) updateData.year_type = year_type;
        if (medium !== undefined) updateData.medium = medium;
        if (start_date !== undefined) updateData.start_date = start_date;
        if (end_date !== undefined) updateData.end_date = end_date;
        if (fromclass !== undefined) updateData.fromclass = fromclass;
        if (toclass !== undefined) updateData.toclass = toclass;
        if (start_time_of_day !== undefined) updateData.start_time_of_day = start_time_of_day;
        if (end_time_of_day !== undefined) updateData.end_time_of_day = end_time_of_day;
        if (shift_type !== undefined) updateData.shift_type = shift_type;
        if (curriculum_id !== undefined) updateData.curriculum_id = curriculum_id;
        
        // Validate at least one field is provided
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'At least one field must be provided for update'
            });
        }

        const result = await academicService.updateAcademicYear(academicYearId, updateData, campusId);
        
        res.status(200).json({
            success: true,
            message: 'Academic year updated successfully',
            data: {
                academicYear: result.academicYearData,
                message: result.message
            }
        });
    } catch (error) {
        console.error('Error in updateAcademicYear controller:', error);
        
        // Handle specific validation errors
        if (error.message === 'Academic year not found') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        
        if (error.message.includes('At least one') || 
            error.message.includes('format') || 
            error.message.includes('must be one of') ||
            error.message.includes('valid date') ||
            error.message.includes('after start date') ||
            error.message.includes('valid integer') ||
            error.message.includes('already exists') ||
            error.message.includes('Invalid curriculum ID')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error while updating academic year'
        });
    }
};

/**
 * Delete an academic year
 */
const deleteAcademicYear = async (req, res) => {
    try {
        const { campusId, academicYearId } = req.params;
        
        if (!campusId || campusId.trim() === '' || campusId === 'undefined' || campusId === null) {
            return res.status(400).json({
                success: false,
                message: 'Valid campus ID is required'
            });
        }

        if (!academicYearId || academicYearId.trim() === '' || academicYearId === 'undefined' || academicYearId === null) {
            return res.status(400).json({
                success: false,
                message: 'Valid academic year ID is required'
            });
        }

        const result = await academicService.deleteAcademicYear(academicYearId, campusId);
        
        res.status(200).json({
            success: true,
            message: 'Academic year deleted successfully',
            data: {
                academicYear: result.academicYearData,
                message: result.message
            }
        });
    } catch (error) {
        console.error('Error in deleteAcademicYear controller:', error);
        
        if (error.message === 'Academic year not found') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        if (error.message.includes('being referenced')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error while deleting academic year'
        });
    }
};

/**
 * Get academic year by ID
 */
const getAcademicYearById = async (req, res) => {
    try {
        const { campusId, academicYearId } = req.params;
        
        if (!campusId || campusId.trim() === '' || campusId === 'undefined' || campusId === null) {
            return res.status(400).json({
                success: false,
                message: 'Valid campus ID is required'
            });
        }

        if (!academicYearId || academicYearId.trim() === '' || academicYearId === 'undefined' || academicYearId === null) {
            return res.status(400).json({
                success: false,
                message: 'Valid academic year ID is required'
            });
        }

        const academicYear = await academicService.getAcademicYearById(academicYearId, campusId);
        
        if (!academicYear) {
            return res.status(404).json({
                success: false,
                message: 'Academic year not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Academic year retrieved successfully',
            data: academicYear
        });
    } catch (error) {
        console.error('Error in getAcademicYearById controller:', error);
        
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching academic year'
        });
    }
};

/**
 * Get academic year options for dropdown
 */
const getAcademicYearOptions = async (req, res) => {
    try {
        const { campusId } = req.params;
        
        if (!campusId || campusId.trim() === '' || campusId === 'undefined' || campusId === null) {
            return res.status(400).json({
                success: false,
                message: 'Valid campus ID is required'
            });
        }

        const academicYearOptions = await academicService.getAcademicYearOptions(campusId);
        
        res.status(200).json({
            success: true,
            message: 'Academic year options retrieved successfully',
            data: academicYearOptions
        });
    } catch (error) {
        console.error('Error in getAcademicYearOptions controller:', error);
        
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching academic year options'
        });
    }
};

/**
 * Get distinct year names for dropdown
 */
const getDistinctYearNames = async (req, res) => {
    try {
        const { campusId } = req.params;
        
        if (!campusId || campusId.trim() === '' || campusId === 'undefined' || campusId === null) {
            return res.status(400).json({
                success: false,
                message: 'Valid campus ID is required'
            });
        }

        const yearNames = await academicService.getDistinctYearNames(campusId);
        
        res.status(200).json({
            success: true,
            message: 'Year names retrieved successfully',
            data: yearNames
        });
    } catch (error) {
        console.error('Error in getDistinctYearNames controller:', error);
        
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching year names'
        });
    }
};

/**
 * Get distinct media for dropdown
 */
const getDistinctMedia = async (req, res) => {
    try {
        const { campusId } = req.params;
        
        if (!campusId || campusId.trim() === '' || campusId === 'undefined' || campusId === null) {
            return res.status(400).json({
                success: false,
                message: 'Valid campus ID is required'
            });
        }

        const media = await academicService.getDistinctMedia(campusId);
        
        res.status(200).json({
            success: true,
            message: 'Media options retrieved successfully',
            data: media
        });
    } catch (error) {
        console.error('Error in getDistinctMedia controller:', error);
        
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching media options'
        });
    }
};

/**
 * Get academic year ID by combination
 */
const getAcademicYearIdByCombo = async (req, res) => {
    try {
        const { campusId } = req.params;
        const { yearName, yearType, curriculumId, medium } = req.query;
        
        if (!campusId || campusId.trim() === '' || campusId === 'undefined' || campusId === null) {
            return res.status(400).json({
                success: false,
                message: 'Valid campus ID is required'
            });
        }

        if (!yearName || !yearType || !curriculumId || !medium) {
            return res.status(400).json({
                success: false,
                message: 'Year name, year type, curriculum ID, and medium are required'
            });
        }

        const result = await academicService.getAcademicYearIdByCombo(campusId, yearName, yearType, curriculumId, medium);
        
        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'No academic year found for this combination. Please add the curriculum and academic year first to use them.'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Academic year ID retrieved successfully',
            data: result
        });
    } catch (error) {
        console.error('Error in getAcademicYearIdByCombo controller:', error);
        
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching academic year ID'
        });
    }
};

module.exports = {
    // Curricula controllers
    getAllCurricula,
    createCurriculum,
    updateCurriculum,
    deleteCurriculum,
    getCurriculumById,
    
    // Academic Years controllers
    getAllAcademicYears,
    createAcademicYear,
    updateAcademicYear,
    deleteAcademicYear,
    getAcademicYearById,
    getAcademicYearOptions,
    getDistinctYearNames,
    getDistinctMedia,
    getAcademicYearIdByCombo
};