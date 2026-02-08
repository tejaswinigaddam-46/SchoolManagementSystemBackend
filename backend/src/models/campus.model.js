const { pool } = require('../config/database');
const bcrypt = require('bcrypt');

// ==================== CAMPUS MODEL METHODS ====================

/**
 * Get all campuses for a specific tenant
 */
const getAllCampuses = async (tenantId) => {
    // Enhanced tenant ID validation
    if (!tenantId || tenantId.toString().trim() === '' || tenantId === 'undefined' || tenantId === null) {
        throw new Error('Valid tenant ID is required');
    }

    const query = `
        SELECT * FROM campuses 
        WHERE tenant_id = $1
        ORDER BY is_main_campus DESC, created_at DESC;
    `;
    
    try {
        const result = await pool.query(query, [tenantId]);
        return result.rows;
    } catch (error) {
        console.error('Error in getAllCampuses model:', error);
        throw error;
    }
};

/**
 * Create a new campus
 */
const createCampus = async (campusData) => {
    // Enhanced tenant ID validation
    if (!campusData.tenant_id || campusData.tenant_id.toString().trim() === '' || campusData.tenant_id === 'undefined' || campusData.tenant_id === null) {
        throw new Error('Valid tenant ID is required');
    }

    const query = `
        INSERT INTO campuses 
        (campus_name, address, phone_number, email, is_main_campus, year_established, no_of_floors, tenant_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *;
    `;
    const values = [
        campusData.campus_name,
        campusData.address,
        campusData.phone_number,
        campusData.email,
        campusData.is_main_campus,
        campusData.year_established,
        campusData.no_of_floors,
        campusData.tenant_id
    ];
    
    try {
        const result = await pool.query(query, values);
        return result.rows[0]; // Return the complete campus data including ID
    } catch (error) {
        console.error('Error creating campus in model:', error, values);
        throw error;
    }
};

/**
 * Update a campus by ID for a specific tenant
 */
const updateCampus = async (campusId, campusData, tenantId) => {
    // Enhanced tenant ID validation
    if (!tenantId || tenantId.toString().trim() === '' || tenantId === 'undefined' || tenantId === null) {
        throw new Error('Valid tenant ID is required');
    }

    // Enhanced campus ID validation
    if (!campusId || campusId.toString().trim() === '' || campusId === 'undefined' || campusId === null) {
        throw new Error('Valid campus ID is required');
    }

    const query = `
        UPDATE campuses 
        SET campus_name = $1, address = $2, phone_number = $3, email = $4, 
            is_main_campus = $5, year_established = $6, no_of_floors = $7, updated_at = NOW()
        WHERE campus_id = $8 AND tenant_id = $9
        RETURNING *;
    `;
    const values = [
        campusData.campus_name,
        campusData.address,
        campusData.phone_number,
        campusData.email,
        campusData.is_main_campus,
        campusData.year_established,
        campusData.no_of_floors,
        campusId,
        tenantId
    ];
    
    try {
        const result = await pool.query(query, values);
        return result.rows[0];
    } catch (error) {
        console.error('Error updating campus in model:', error, values);
        throw error;
    }
};

/**
 * Delete a campus by ID for a specific tenant
 */
const deleteCampus = async (campusId, tenantId) => {
    // Enhanced tenant ID validation
    if (!tenantId || tenantId.toString().trim() === '' || tenantId === 'undefined' || tenantId === null) {
        throw new Error('Valid tenant ID is required');
    }

    // Enhanced campus ID validation
    if (!campusId || campusId.toString().trim() === '' || campusId === 'undefined' || campusId === null) {
        throw new Error('Valid campus ID is required');
    }

    const query = `
        DELETE FROM campuses 
        WHERE campus_id = $1 AND tenant_id = $2
        RETURNING *;
    `;
    
    try {
        const result = await pool.query(query, [campusId, tenantId]);
        return result.rows[0];
    } catch (error) {
        console.error('Error deleting campus in model:', error);
        throw error;
    }
};

/**
 * Get a campus by ID for a specific tenant
 */
const getCampusById = async (campusId, tenantId) => {
    // Enhanced tenant ID validation
    if (!tenantId || tenantId.toString().trim() === '' || tenantId === 'undefined' || tenantId === null) {
        throw new Error('Valid tenant ID is required');
    }

    // Enhanced campus ID validation
    if (!campusId || campusId.toString().trim() === '' || campusId === 'undefined' || campusId === null) {
        throw new Error('Valid campus ID is required');
    }

    const query = `
        SELECT * FROM campuses 
        WHERE campus_id = $1 AND tenant_id = $2;
    `;
    
    try {
        const result = await pool.query(query, [campusId, tenantId]);
        return result.rows[0];
    } catch (error) {
        console.error('Error getting campus by ID in model:', error);
        throw error;
    }
};

module.exports = {
    getAllCampuses,
    createCampus,
    updateCampus,
    deleteCampus,
    getCampusById
};