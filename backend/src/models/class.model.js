const { pool } = require('../config/database');
const logger = require('../utils/logger');

// ==================== CLASS MODEL METHODS ====================

/**
 * Create a new class
 * @param {Object} classData - Class data
 * @param {string} tenantId - School/Tenant ID
 * @param {string} campusId - Campus ID
 * @returns {Promise<Object>} Created class object
 * @throws {Error} If database operation fails
 */
const createClass = async (classData, tenantId, campusId) => {
    const query = `
        INSERT INTO classes (campus_id, class_level, class_name)
        VALUES ($1, $2, $3)
        RETURNING class_id, campus_id, class_level, class_name
    `;
    
    try {
        const result = await pool.query(query, [
            campusId,
            classData.classLevel ? parseInt(classData.classLevel) : null,
            classData.className.trim()
        ]);
        
        logger.info(`Class created successfully: ${classData.className} for campus: ${campusId}`);
        return result.rows[0];
    } catch (error) {
        // Handle unique constraint violation
        if (error.code === '23505' && error.constraint === 'classes_campus_id_class_name_key') {
            throw new Error('A class with this name already exists in this campus');
        }
        logger.error('Error creating class:', error);
        throw error;
    }
};

/**
 * Get all classes for a campus with pagination and filters
 * @param {string} tenantId - School/Tenant ID
 * @param {string} campusId - Campus ID (optional, if not provided gets all for tenant)
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Classes list with pagination info
 */
const getAllClasses = async (tenantId, campusId = null, options = {}) => {
    const { 
        page = 1, 
        limit = 20, 
        search = ''
    } = options;
    
    const offset = (page - 1) * limit;
    
    let whereClause = `WHERE c.campus_id IN (
        SELECT campus_id FROM campuses WHERE tenant_id = $1
    )`;
    let queryParams = [tenantId];
    let paramCounter = 2;
    
    // Add campus filter if provided
    if (campusId) {
        whereClause += ` AND c.campus_id = $${paramCounter}`;
        queryParams.push(campusId);
        paramCounter++;
    }
    
    // Add search filter
    if (search.trim()) {
        whereClause += ` AND c.class_name ILIKE $${paramCounter}`;
        queryParams.push(`%${search.trim()}%`);
        paramCounter++;
    }
    
    const query = `
        SELECT 
            c.class_id, c.campus_id, c.class_level, c.class_name,
            camp.campus_name
        FROM classes c
        LEFT JOIN campuses camp ON c.campus_id = camp.campus_id
        ${whereClause}
        ORDER BY c.class_level ASC, c.class_name ASC
        LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `;
    
    const countQuery = `
        SELECT COUNT(*) as total
        FROM classes c
        ${whereClause}
    `;
    
    try {
        const [classesResult, countResult] = await Promise.all([
            pool.query(query, [...queryParams, limit, offset]),
            pool.query(countQuery, queryParams)
        ]);
        
        const total = parseInt(countResult.rows[0].total);
        const totalPages = Math.ceil(total / limit);
        
        return {
            classes: classesResult.rows,
            pagination: {
                current_page: page,
                total_pages: totalPages,
                total_count: total,
                limit: limit,
                has_next: page < totalPages,
                has_prev: page > 1
            }
        };
    } catch (error) {
        logger.error('Error fetching classes:', error);
        throw error;
    }
};

/**
 * Find class by ID
 * @param {number} classId - Class ID
 * @param {string} tenantId - School/Tenant ID
 * @returns {Promise<Object|null>} Class object or null
 */
const findClassById = async (classId, tenantId) => {
    const query = `
        SELECT 
            c.class_id, c.campus_id, c.class_level, c.class_name,
            camp.campus_name, camp.tenant_id
        FROM classes c
        LEFT JOIN campuses camp ON c.campus_id = camp.campus_id
        WHERE c.class_id = $1 AND camp.tenant_id = $2
    `;
    
    try {
        const result = await pool.query(query, [classId, tenantId]);
        return result.rows[0] || null;
    } catch (error) {
        logger.error('Error finding class by ID:', error);
        throw error;
    }
};

/**
 * Find classes by campus ID
 * @param {string} campusId - Campus ID
 * @param {string} tenantId - School/Tenant ID
 * @returns {Promise<Array>} Array of classes
 */
const findClassesByCampus = async (campusId, tenantId) => {
    const query = `
        SELECT 
            c.class_id, c.campus_id, c.class_level, c.class_name,
            camp.campus_name
        FROM classes c
        LEFT JOIN campuses camp ON c.campus_id = camp.campus_id
        WHERE c.campus_id = $1 AND camp.tenant_id = $2
        ORDER BY c.class_level ASC, c.class_name ASC
    `;
    
    try {
        const result = await pool.query(query, [campusId, tenantId]);
        return result.rows;
    } catch (error) {
        logger.error('Error finding classes by campus:', error);
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
    const allowedUpdates = ['class_level', 'class_name'];
    
    const updates = {};
    if (updateData.classLevel !== undefined) {
        updates.class_level = updateData.classLevel ? parseInt(updateData.classLevel) : null;
    }
    if (updateData.className !== undefined) {
        updates.class_name = updateData.className.trim();
    }
    
    if (Object.keys(updates).length === 0) {
        throw new Error('No valid fields to update');
    }
    
    // Build dynamic query
    const setClause = Object.keys(updates)
        .map((key, index) => `${key} = $${index + 3}`)
        .join(', ');
    
    const query = `
        UPDATE classes 
        SET ${setClause}
        FROM campuses camp
        WHERE classes.class_id = $1 
        AND classes.campus_id = camp.campus_id 
        AND camp.tenant_id = $2
        RETURNING classes.class_id, classes.campus_id, classes.class_level, classes.class_name
    `;
    
    const values = [classId, tenantId, ...Object.values(updates)];
    
    try {
        const result = await pool.query(query, values);
        if (result.rows.length === 0) {
            return null;
        }
        
        logger.info(`Class updated successfully: ID ${classId}`);
        return result.rows[0];
    } catch (error) {
        // Handle unique constraint violation
        if (error.code === '23505' && error.constraint === 'classes_campus_id_class_name_key') {
            throw new Error('A class with this name already exists in this campus');
        }
        logger.error('Error updating class:', error);
        throw error;
    }
};

/**
 * Delete class
 * @param {number} classId - Class ID
 * @param {string} tenantId - School/Tenant ID
 * @returns {Promise<boolean>} True if class was deleted
 */
const deleteClass = async (classId, tenantId) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // First, verify the class exists and belongs to the tenant
        const classCheckQuery = `
            SELECT c.class_id, c.class_name, c.campus_id
            FROM classes c 
            JOIN campuses camp ON c.campus_id = camp.campus_id 
            WHERE c.class_id = $1 AND camp.tenant_id = $2
        `;
        
        const classCheck = await client.query(classCheckQuery, [classId, tenantId]);
        
        if (classCheck.rows.length === 0) {
            throw new Error('Class not found or access denied');
        }
        
        const classToDelete = classCheck.rows[0];
        
        // Check if class has any students enrolled
        const studentCheckQuery = `
            SELECT COUNT(*) as student_count
            FROM student_enrollments se
            JOIN students s ON se.student_id = s.student_id
            WHERE se.class = $1
            AND s.tenant_id = $2
            AND se.status = 'active'
        `;
        
        const studentCheck = await client.query(studentCheckQuery, [classToDelete.class_name, tenantId]);
        const studentCount = parseInt(studentCheck.rows[0].student_count);
        
        if (studentCount > 0) {
            throw new Error(`Cannot delete class "${classToDelete.class_name}". There are ${studentCount} active students enrolled in this class.`);
        }
        
        // Delete the class (simple delete query)
        const deleteQuery = `
            DELETE FROM classes 
            WHERE class_id = $1 
            AND campus_id = $2
            RETURNING class_id
        `;
        
        const result = await client.query(deleteQuery, [classId, classToDelete.campus_id]);
        
        if (result.rows.length === 0) {
            throw new Error('Failed to delete class');
        }
        
        await client.query('COMMIT');
        logger.info(`Class deleted successfully: ID ${classId}, Name: ${classToDelete.class_name}`);
        return true;
        
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error('Error deleting class:', error);
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Check if class name is unique within campus
 * @param {string} className - Class name to check
 * @param {string} campusId - Campus ID
 * @param {number} excludeClassId - Class ID to exclude from check (for updates)
 * @returns {Promise<boolean>} True if class name is available
 */
const isClassNameUnique = async (className, campusId, excludeClassId = null) => {
    let query = 'SELECT 1 FROM classes WHERE class_name = $1 AND campus_id = $2';
    const params = [className.trim(), campusId];
    
    if (excludeClassId) {
        query += ' AND class_id != $3';
        params.push(excludeClassId);
    }
    
    try {
        const result = await pool.query(query, params);
        return result.rows.length === 0;
    } catch (error) {
        logger.error('Error checking class name uniqueness:', error);
        throw error;
    }
};

/**
 * Get class statistics for a campus
 * @param {string} campusId - Campus ID
 * @param {string} tenantId - School/Tenant ID
 * @returns {Promise<Object>} Class statistics
 */
const getClassStatistics = async (campusId, tenantId) => {
    const query = `
        SELECT 
            COUNT(*) as total_classes,
            COUNT(DISTINCT class_level) as total_levels,
            MIN(class_level) as min_level,
            MAX(class_level) as max_level
        FROM classes c
        JOIN campuses camp ON c.campus_id = camp.campus_id
        WHERE camp.tenant_id = $1
        ${campusId ? 'AND c.campus_id = $2' : ''}
    `;
    
    const params = campusId ? [tenantId, campusId] : [tenantId];
    
    try {
        const result = await pool.query(query, params);
        return result.rows[0];
    } catch (error) {
        logger.error('Error getting class statistics:', error);
        throw error;
    }
};
/**
 * Get class by name and campus
 * @param {string} className - Class Name
 * @param {string} campusId - Campus ID
 * @returns {Promise<Object|null>} Class object or null
 */
const getClassByName = async (className, campusId) => {
    const query = `
        SELECT class_id, class_name, class_level, campus_id
        FROM classes 
        WHERE campus_id = $1 AND LOWER(class_name) = LOWER($2)
        LIMIT 1
    `;
    
    try {
        const result = await pool.query(query, [campusId, className.trim()]);
        return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
        logger.error('Error getting class by name:', error);
        throw error;
    }
};

module.exports = {
    createClass,
    getAllClasses,
    getClassByName,
    findClassById,
    findClassesByCampus,
    updateClass,
    deleteClass,
    isClassNameUnique,
    getClassStatistics
};