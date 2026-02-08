const { pool } = require('../config/database');

// ==================== CURRICULA MODEL METHODS ====================

/**
 * Get all curricula for a specific campus
 */
const getAllCurricula = async (campusId) => {
    if (!campusId || campusId.toString().trim() === '' || campusId === 'undefined' || campusId === null) {
        throw new Error('Valid campus ID is required');
    }

    const query = `
        SELECT * FROM curricula 
        WHERE campus_id = $1
        ORDER BY curriculum_name ASC;
    `;
    
    try {
        const result = await pool.query(query, [campusId]);
        return result.rows;
    } catch (error) {
        console.error('Error in getAllCurricula model:', error);
        throw error;
    }
};

/**
 * Create a new curriculum
 */
const createCurriculum = async (curriculumData) => {
    if (!curriculumData.campus_id || curriculumData.campus_id.toString().trim() === '' || curriculumData.campus_id === 'undefined' || curriculumData.campus_id === null) {
        throw new Error('Valid campus ID is required');
    }

    const query = `
        INSERT INTO curricula 
        (campus_id, curriculum_code, curriculum_name)
        VALUES ($1, $2, $3)
        RETURNING *;
    `;
    const values = [
        curriculumData.campus_id,
        curriculumData.curriculum_code,
        curriculumData.curriculum_name
    ];
    
    try {
        const result = await pool.query(query, values);
        return result.rows[0];
    } catch (error) {
        console.error('Error creating curriculum in model:', error, values);
        throw error;
    }
};

/**
 * Update a curriculum by ID for a specific campus
 */
const updateCurriculum = async (curriculumId, curriculumData, campusId) => {
    if (!campusId || campusId.toString().trim() === '' || campusId === 'undefined' || campusId === null) {
        throw new Error('Valid campus ID is required');
    }

    if (!curriculumId || curriculumId.toString().trim() === '' || curriculumId === 'undefined' || curriculumId === null) {
        throw new Error('Valid curriculum ID is required');
    }

    // Build dynamic query based on provided fields
    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    // Define the field mappings
    const fieldMappings = {
        curriculum_code: 'curriculum_code',
        curriculum_name: 'curriculum_name'
    };

    // Build SET clause dynamically
    Object.keys(fieldMappings).forEach(field => {
        if (curriculumData.hasOwnProperty(field) && curriculumData[field] !== undefined) {
            updateFields.push(`${fieldMappings[field]} = $${paramIndex}`);
            values.push(curriculumData[field]);
            paramIndex++;
        }
    });

    if (updateFields.length === 0) {
        throw new Error('No valid fields provided for update');
    }

    // Add WHERE clause parameters
    const curriculumIdParam = paramIndex++;
    const campusIdParam = paramIndex++;
    
    values.push(curriculumId, campusId);

    const query = `
        UPDATE curricula 
        SET ${updateFields.join(', ')}
        WHERE curriculum_id = $${curriculumIdParam} AND campus_id = $${campusIdParam}
        RETURNING *;
    `;
    
    try {
        const result = await pool.query(query, values);
        return result.rows[0];
    } catch (error) {
        console.error('Error updating curriculum in model:', error, { query, values });
        throw error;
    }
};

/**
 * Delete a curriculum by ID for a specific campus
 */
const deleteCurriculum = async (curriculumId, campusId) => {
    if (!campusId || campusId.toString().trim() === '' || campusId === 'undefined' || campusId === null) {
        throw new Error('Valid campus ID is required');
    }

    if (!curriculumId || curriculumId.toString().trim() === '' || curriculumId === 'undefined' || curriculumId === null) {
        throw new Error('Valid curriculum ID is required');
    }

    const query = `
        DELETE FROM curricula 
        WHERE curriculum_id = $1 AND campus_id = $2
        RETURNING *;
    `;
    
    try {
        const result = await pool.query(query, [curriculumId, campusId]);
        return result.rows[0];
    } catch (error) {
        console.error('Error deleting curriculum in model:', error);
        throw error;
    }
};

/**
 * Get a curriculum by ID for a specific campus
 */
const getCurriculumById = async (curriculumId, campusId) => {
    if (!campusId || campusId.toString().trim() === '' || campusId === 'undefined' || campusId === null) {
        throw new Error('Valid campus ID is required');
    }

    if (!curriculumId || curriculumId.toString().trim() === '' || curriculumId === 'undefined' || curriculumId === null) {
        throw new Error('Valid curriculum ID is required');
    }

    const query = `
        SELECT * FROM curricula 
        WHERE curriculum_id = $1 AND campus_id = $2;
    `;
    
    try {
        const result = await pool.query(query, [curriculumId, campusId]);
        return result.rows[0];
    } catch (error) {
        console.error('Error getting curriculum by ID in model:', error);
        throw error;
    }
};

// ==================== ACADEMIC YEARS MODEL METHODS ====================

/**
 * Get all academic years for a specific campus
 */
const getAllAcademicYears = async (campusId) => {
    if (!campusId || campusId.toString().trim() === '' || campusId === 'undefined' || campusId === null) {
        throw new Error('Valid campus ID is required');
    }

    const query = `
        SELECT ay.*, c.curriculum_name, c.curriculum_code 
        FROM academic_years ay
        LEFT JOIN curricula c ON ay.curriculum_id = c.curriculum_id
        WHERE ay.campus_id = $1
        ORDER BY ay.year_name DESC, ay.medium ASC;
    `;
    
    try {
        const result = await pool.query(query, [campusId]);
        return result.rows;
    } catch (error) {
        console.error('Error in getAllAcademicYears model:', error);
        throw error;
    }
};

/**
 * Create a new academic year
 */
const createAcademicYear = async (academicYearData) => {
    if (!academicYearData.campus_id || academicYearData.campus_id.toString().trim() === '' || academicYearData.campus_id === 'undefined' || academicYearData.campus_id === null) {
        throw new Error('Valid campus ID is required');
    }

    const query = `
        INSERT INTO academic_years 
        (campus_id, year_name, year_type, medium, start_date, end_date, fromclass, toclass, 
         start_time_of_day, end_time_of_day, shift_type, curriculum_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *;
    `;
    const values = [
        academicYearData.campus_id,
        academicYearData.year_name,
        academicYearData.year_type,
        academicYearData.medium,
        academicYearData.start_date,
        academicYearData.end_date,
        academicYearData.fromclass,
        academicYearData.toclass,
        academicYearData.start_time_of_day,
        academicYearData.end_time_of_day,
        academicYearData.shift_type,
        academicYearData.curriculum_id
    ];
    
    try {
        const result = await pool.query(query, values);
        return result.rows[0];
    } catch (error) {
        console.error('Error creating academic year in model:', error, values);
        throw error;
    }
};

/**
 * Update an academic year by ID for a specific campus
 */
const updateAcademicYear = async (academicYearId, academicYearData, campusId) => {
    if (!campusId || campusId.toString().trim() === '' || campusId === 'undefined' || campusId === null) {
        throw new Error('Valid campus ID is required');
    }

    if (!academicYearId || academicYearId.toString().trim() === '' || academicYearId === 'undefined' || academicYearId === null) {
        throw new Error('Valid academic year ID is required');
    }

    // Build dynamic query based on provided fields
    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    // Define the field mappings
    const fieldMappings = {
        year_name: 'year_name',
        year_type: 'year_type',
        medium: 'medium',
        start_date: 'start_date',
        end_date: 'end_date',
        fromclass: 'fromclass',
        toclass: 'toclass',
        start_time_of_day: 'start_time_of_day',
        end_time_of_day: 'end_time_of_day',
        shift_type: 'shift_type',
        curriculum_id: 'curriculum_id'
    };

    // Build SET clause dynamically
    Object.keys(fieldMappings).forEach(field => {
        if (academicYearData.hasOwnProperty(field) && academicYearData[field] !== undefined) {
            updateFields.push(`${fieldMappings[field]} = $${paramIndex}`);
            values.push(academicYearData[field]);
            paramIndex++;
        }
    });

    if (updateFields.length === 0) {
        throw new Error('No valid fields provided for update');
    }

    // Add WHERE clause parameters
    const academicYearIdParam = paramIndex++;
    const campusIdParam = paramIndex++;
    
    values.push(academicYearId, campusId);

    const query = `
        UPDATE academic_years 
        SET ${updateFields.join(', ')}
        WHERE academic_year_id = $${academicYearIdParam} AND campus_id = $${campusIdParam}
        RETURNING *;
    `;
    
    try {
        const result = await pool.query(query, values);
        return result.rows[0];
    } catch (error) {
        console.error('Error updating academic year in model:', error, { query, values });
        throw error;
    }
};

/**
 * Delete an academic year by ID for a specific campus
 */
const deleteAcademicYear = async (academicYearId, campusId) => {
    if (!campusId || campusId.toString().trim() === '' || campusId === 'undefined' || campusId === null) {
        throw new Error('Valid campus ID is required');
    }

    if (!academicYearId || academicYearId.toString().trim() === '' || academicYearId === 'undefined' || academicYearId === null) {
        throw new Error('Valid academic year ID is required');
    }

    const query = `
        DELETE FROM academic_years 
        WHERE academic_year_id = $1 AND campus_id = $2
        RETURNING *;
    `;
    
    try {
        const result = await pool.query(query, [academicYearId, campusId]);
        return result.rows[0];
    } catch (error) {
        console.error('Error deleting academic year in model:', error);
        throw error;
    }
};

/**
 * Get an academic year by ID for a specific campus
 */
const getAcademicYearById = async (academicYearId, campusId) => {
    if (!campusId || campusId.toString().trim() === '' || campusId === 'undefined' || campusId === null) {
        throw new Error('Valid campus ID is required');
    }

    if (!academicYearId || academicYearId.toString().trim() === '' || academicYearId === 'undefined' || academicYearId === null) {
        throw new Error('Valid academic year ID is required');
    }

    const query = `
        SELECT ay.*, c.curriculum_name, c.curriculum_code 
        FROM academic_years ay
        LEFT JOIN curricula c ON ay.curriculum_id = c.curriculum_id
        WHERE ay.academic_year_id = $1 AND ay.campus_id = $2;
    `;
    
    try {
        const result = await pool.query(query, [academicYearId, campusId]);
        return result.rows[0];
    } catch (error) {
        console.error('Error getting academic year by ID in model:', error);
        throw error;
    }
};

/**
 * Get academic year options for dropdown (joins academic_years and curricula)
 */
const getAcademicYearOptions = async (campusId) => {
    if (!campusId || campusId.toString().trim() === '' || campusId === 'undefined' || campusId === null) {
        throw new Error('Valid campus ID is required');
    }

    const query = `
        SELECT
            ay.academic_year_id,
            ay.year_name,
            ay.year_type,
            ay.medium,
            c.curriculum_code,
            c.curriculum_name
        FROM
            academic_years AS ay
        JOIN
            curricula AS c ON ay.curriculum_id = c.curriculum_id
        WHERE
            ay.campus_id = $1
        ORDER BY ay.year_name DESC, c.curriculum_code ASC, ay.medium ASC;
    `;
    
    try {
        const result = await pool.query(query, [campusId]);
        return result.rows;
    } catch (error) {
        console.error('Error in getAcademicYearOptions model:', error);
        throw error;
    }
};

/**
 * Get distinct year names for dropdown
 */
const getDistinctYearNames = async (campusId) => {
    if (!campusId || campusId.toString().trim() === '' || campusId === 'undefined' || campusId === null) {
        throw new Error('Valid campus ID is required');
    }

    const query = `
        SELECT DISTINCT year_name
        FROM academic_years
        WHERE campus_id = $1
        ORDER BY year_name DESC;
    `;
    
    try {
        const result = await pool.query(query, [campusId]);
        return result.rows;
    } catch (error) {
        console.error('Error in getDistinctYearNames model:', error);
        throw error;
    }
};

/**
 * Get distinct media for dropdown
 */
const getDistinctMedia = async (campusId) => {
    if (!campusId || campusId.toString().trim() === '' || campusId === 'undefined' || campusId === null) {
        throw new Error('Valid campus ID is required');
    }

    const query = `
        SELECT DISTINCT medium
        FROM academic_years
        WHERE campus_id = $1
        ORDER BY medium ASC;
    `;
    
    try {
        const result = await pool.query(query, [campusId]);
        return result.rows;
    } catch (error) {
        console.error('Error in getDistinctMedia model:', error);
        throw error;
    }
};

/**
 * Get academic year ID by year name, year type, curriculum, and medium combination
 */
const getAcademicYearIdByCombo = async (campusId, yearName, yearType, curriculumId, medium) => {
    if (!campusId || campusId.toString().trim() === '' || campusId === 'undefined' || campusId === null) {
        throw new Error('Valid campus ID is required');
    }

    const query = `
        SELECT academic_year_id
        FROM academic_years
        WHERE campus_id = $1 AND year_name = $2 AND year_type = $3 AND curriculum_id = $4 AND medium = $5;
    `;
    
    try {
        const result = await pool.query(query, [campusId, yearName, yearType, curriculumId, medium]);
        return result.rows[0];
    } catch (error) {
        console.error('Error in getAcademicYearIdByCombo model:', error);
        throw error;
    }
};

module.exports = {
    // Curricula methods
    getAllCurricula,
    createCurriculum,
    updateCurriculum,
    deleteCurriculum,
    getCurriculumById,
    
    // Academic Years methods
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