const { pool } = require('../config/database');

// ==================== BUILDING MODEL METHODS ====================

/**
 * Get all buildings for a specific campus
 */
const getAllBuildings = async (campusId) => {
    // Enhanced campus ID validation
    if (!campusId || campusId.toString().trim() === '' || campusId === 'undefined' || campusId === null) {
        throw new Error('Valid campus ID is required');
    }

    const query = `
        SELECT * FROM buildings 
        WHERE campus_id = $1
        ORDER BY building_name ASC;
    `;
    
    try {
        const result = await pool.query(query, [campusId]);
        return result.rows;
    } catch (error) {
        console.error('Error in getAllBuildings model:', error);
        throw error;
    }
};

/**
 * Create a new building
 */
const createBuilding = async (buildingData) => {
    // Enhanced campus ID validation
    if (!buildingData.campus_id || buildingData.campus_id.toString().trim() === '' || buildingData.campus_id === 'undefined' || buildingData.campus_id === null) {
        throw new Error('Valid campus ID is required');
    }

    const query = `
        INSERT INTO buildings 
        (campus_id, building_name, number_of_floors)
        VALUES ($1, $2, $3)
        RETURNING *;
    `;
    const values = [
        buildingData.campus_id,
        buildingData.building_name,
        buildingData.number_of_floors
    ];
    
    try {
        const result = await pool.query(query, values);
        return result.rows[0]; // Return the complete building data including ID
    } catch (error) {
        console.error('Error creating building in model:', error, values);
        // Handle unique constraint violation (duplicate building name in same campus)
        if (error.code === '23505' && error.constraint === 'buildings_campus_id_building_name_key') {
            throw new Error('A building with this name already exists in the campus');
        }
        throw error;
    }
};

/**
 * Update a building by ID for a specific campus
 */
const updateBuilding = async (buildingId, buildingData, campusId) => {
    // Enhanced campus ID validation
    if (!campusId || campusId.toString().trim() === '' || campusId === 'undefined' || campusId === null) {
        throw new Error('Valid campus ID is required');
    }

    // Enhanced building ID validation
    if (!buildingId || buildingId.toString().trim() === '' || buildingId === 'undefined' || buildingId === null) {
        throw new Error('Valid building ID is required');
    }

    const query = `
        UPDATE buildings 
        SET building_name = $1, number_of_floors = $2
        WHERE building_id = $3 AND campus_id = $4
        RETURNING *;
    `;
    const values = [
        buildingData.building_name,
        buildingData.number_of_floors,
        buildingId,
        campusId
    ];
    
    try {
        const result = await pool.query(query, values);
        return result.rows[0];
    } catch (error) {
        console.error('Error updating building in model:', error, values);
        // Handle unique constraint violation (duplicate building name in same campus)
        if (error.code === '23505' && error.constraint === 'buildings_campus_id_building_name_key') {
            throw new Error('A building with this name already exists in the campus');
        }
        throw error;
    }
};

/**
 * Delete a building by ID for a specific campus
 */
const deleteBuilding = async (buildingId, campusId) => {
    // Enhanced campus ID validation
    if (!campusId || campusId.toString().trim() === '' || campusId === 'undefined' || campusId === null) {
        throw new Error('Valid campus ID is required');
    }

    // Enhanced building ID validation
    if (!buildingId || buildingId.toString().trim() === '' || buildingId === 'undefined' || buildingId === null) {
        throw new Error('Valid building ID is required');
    }

    const query = `
        DELETE FROM buildings 
        WHERE building_id = $1 AND campus_id = $2
        RETURNING *;
    `;
    
    try {
        const result = await pool.query(query, [buildingId, campusId]);
        return result.rows[0];
    } catch (error) {
        console.error('Error deleting building in model:', error);
        throw error;
    }
};

/**
 * Get a building by ID for a specific campus
 */
const getBuildingById = async (buildingId, campusId) => {
    // Enhanced campus ID validation
    if (!campusId || campusId.toString().trim() === '' || campusId === 'undefined' || campusId === null) {
        throw new Error('Valid campus ID is required');
    }

    // Enhanced building ID validation
    if (!buildingId || buildingId.toString().trim() === '' || buildingId === 'undefined' || buildingId === null) {
        throw new Error('Valid building ID is required');
    }

    const query = `
        SELECT * FROM buildings 
        WHERE building_id = $1 AND campus_id = $2;
    `;
    
    try {
        const result = await pool.query(query, [buildingId, campusId]);
        return result.rows[0];
    } catch (error) {
        console.error('Error getting building by ID in model:', error);
        throw error;
    }
};

/**
 * Check if building name exists in campus (for validation)
 */
const buildingNameExists = async (buildingName, campusId, excludeBuildingId = null) => {
    // Enhanced campus ID validation
    if (!campusId || campusId.toString().trim() === '' || campusId === 'undefined' || campusId === null) {
        throw new Error('Valid campus ID is required');
    }

    let query = `
        SELECT building_id FROM buildings 
        WHERE LOWER(building_name) = LOWER($1) AND campus_id = $2
    `;
    let values = [buildingName, campusId];

    // Exclude the current building when updating
    if (excludeBuildingId) {
        query += ` AND building_id != $3`;
        values.push(excludeBuildingId);
    }
    
    try {
        const result = await pool.query(query, values);
        return result.rows.length > 0;
    } catch (error) {
        console.error('Error checking building name existence in model:', error);
        throw error;
    }
};

module.exports = {
    getAllBuildings,
    createBuilding,
    updateBuilding,
    deleteBuilding,
    getBuildingById,
    buildingNameExists
};