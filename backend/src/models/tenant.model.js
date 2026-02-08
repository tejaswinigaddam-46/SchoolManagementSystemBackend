const { pool } = require('../config/database');
const bcrypt = require('bcrypt');
const { createUserWithContext } = require('../services/user.service');

// ==================== TENANT MODEL METHODS ====================

/**
 * Check if subdomain already exists
 * @param {string} subdomain - The subdomain to check
 * @returns {Promise<boolean>} True if subdomain exists, false otherwise
 * @throws {Error} If database operation fails
 */
const checkSubdomainExists = async (subdomain) => {
    const query = `
        SELECT subdomain 
        FROM tenants 
        WHERE subdomain = $1
    `;
    
    try {
        const result = await pool.query(query, [subdomain]);
        return result.rows.length > 0;
    } catch (error) {
        throw error;
    }
};

/**
 * Check if email already exists in users table
 * @param {string} email - The email to check
 * @returns {Promise<boolean>} True if email exists, false otherwise
 * @throws {Error} If database operation fails
 */
const checkEmailExists = async (email) => {
    const query = `
        SELECT email 
        FROM users 
        WHERE email = $1
    `;
    
    try {
        const result = await pool.query(query, [email]);
        return result.rows.length > 0;
    } catch (error) {
        throw error;
    }
};

/**
 * Create new tenant with admin user in a transaction
 * @param {Object} tenantData - Tenant registration data
 * @param {string} tenantData.tenantName - Name of the tenant/school
 * @param {string} tenantData.subdomain - Subdomain for the tenant
 * @param {string} tenantData.tenantPhone - Phone number for the school/tenant
 * @param {string} tenantData.yearFounded - Year the school was founded (optional)
 * @param {string} tenantData.logoUrl - URL to the school's logo image (optional)
 * @param {string} tenantData.websiteUrl - URL to the school's website (optional)
 * @param {string} tenantData.adminName - Admin's full name
 * @param {string} tenantData.adminPhone - Admin's phone number
 * @param {string} tenantData.adminPassword - Admin's password (will be hashed)
 * @returns {Promise<Object>} Created tenant and admin user data
 * @throws {Error} If database operation fails
 */
const createTenantWithAdmin = async (tenantData, campusData, req = {}, res) => {
    req.body = req.body || {}; // Ensure req.body is initialized

    const client = await pool.connect();

    try {
        // Start transaction
        await client.query('BEGIN');

        // Step 1: Create Tenant
        const createTenantQuery = `
            INSERT INTO tenants (tenant_name, subdomain, phone_number, year_founded, logo_url, website, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
            RETURNING tenant_id, tenant_name, subdomain, phone_number, year_founded, logo_url, website, created_at
        `;

        const tenantResult = await client.query(createTenantQuery, [
            tenantData.tenantName,
            tenantData.subdomain,
            tenantData.tenantPhone,
            tenantData.yearFounded,
            tenantData.logoUrl,
            tenantData.websiteUrl
        ]);
        const newTenant = tenantResult.rows[0];

        // Step 2: Create Campus
        const createCampusQuery = `
            INSERT INTO campuses (campus_name, address, phone_number, email, is_main_campus, year_established, no_of_floors, tenant_id, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
            RETURNING campus_id, campus_name, address, phone_number, email, is_main_campus, year_established, no_of_floors
        `;

        const campusResult = await client.query(createCampusQuery, [
            campusData.campus_name,
            campusData.address,
            campusData.phone_number,
            campusData.email,
            campusData.is_main_campus,
            campusData.year_established,
            campusData.no_of_floors,
            newTenant.tenant_id
        ]);
        const newCampus = campusResult.rows[0];

        // Step 3: Create Admin User using createUserWithContext
        req.body = {
            first_name: tenantData.adminFirstName,
            middle_name: tenantData.adminMiddleName,
            last_name: tenantData.adminLastName,
            phone_number: tenantData.adminPhone,
            role: 'Admin',
            date_of_birth: tenantData.adminDOB
        };
        req.user = {
            tenant_id: newTenant.tenant_id,
            campus_id: newCampus.campus_id
        };
        await createUserWithContext(req.body, req.user, client);

        // Commit transaction
        await client.query('COMMIT');

        return {
            tenant: newTenant,
            campus: newCampus
        };
    } catch (error) {
        // Rollback transaction on error
        await client.query('ROLLBACK');
        throw error;
    } finally {
        // Release client back to pool
        client.release();
    }
};

/**
 * Find tenant by subdomain
 * @param {string} subdomain - The subdomain to search for
 * @returns {Promise<Object|null>} Tenant object or null if not found
 * @throws {Error} If database operation fails
 */
const findTenantBySubdomain = async (subdomain) => {
    const query = `
        SELECT tenant_id, tenant_name, subdomain, year_founded, logo_url, website, created_at, updated_at
        FROM tenants 
        WHERE subdomain = $1
    `;
    
    try {
        const result = await pool.query(query, [subdomain]);
        return result.rows[0] || null;
    } catch (error) {
        throw error;
    }
};

/**
 * Find tenant by ID
 * @param {string} tenantId - The tenant ID to search for
 * @returns {Promise<Object|null>} Tenant object or null if not found
 * @throws {Error} If database operation fails
 */
const findTenantById = async (tenantId) => {
    const query = `
        SELECT tenant_id, tenant_name, subdomain, year_founded, logo_url, website, created_at, updated_at
        FROM tenants 
        WHERE tenant_id = $1
    `;
    
    try {
        const result = await pool.query(query, [tenantId]);
        return result.rows[0] || null;
    } catch (error) {
        throw error;
    }
};

/**
 * Get all tenants (for admin purposes)
 * @returns {Promise<Array>} Array of tenant objects
 * @throws {Error} If database operation fails
 */
const getAllTenants = async () => {
    const query = `
        SELECT 
            t.tenant_id, 
            t.tenant_name, 
            t.subdomain, 
            t.year_founded, 
            t.logo_url, 
            t.website, 
            t.created_at, 
            t.updated_at,
            COUNT(m.user_id) as total_users
        FROM tenants t
        LEFT JOIN memberships m ON t.tenant_id = m.tenant_id
        GROUP BY t.tenant_id, t.tenant_name, t.subdomain, t.year_founded, t.logo_url, t.website, t.created_at, t.updated_at
        ORDER BY t.created_at DESC
    `;
    
    try {
        const result = await pool.query(query);
        return result.rows.map(row => ({
            ...row,
            total_users: parseInt(row.total_users)
        }));
    } catch (error) {
        throw error;
    }
};

/**
 * Update tenant information
 * @param {string} tenantId - The tenant ID to update
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object|null>} Updated tenant object or null if not found
 * @throws {Error} If database operation fails
 */
const updateTenant = async (tenantId, updateData) => {
    const allowedUpdates = ['tenant_name', 'year_founded', 'logo_url', 'website'];
    const updates = {};
    
    // Filter only allowed fields
    Object.keys(updateData).forEach(key => {
        if (allowedUpdates.includes(key) && updateData[key] !== undefined) {
            updates[key] = updateData[key];
        }
    });
    
    if (Object.keys(updates).length === 0) {
        throw new Error('No valid fields to update');
    }
    
    // Build dynamic query
    const setClause = Object.keys(updates)
        .map((key, index) => `${key} = $${index + 2}`)
        .join(', ');
    
    const query = `
        UPDATE tenants 
        SET ${setClause}, updated_at = NOW()
        WHERE tenant_id = $1
        RETURNING tenant_id, tenant_name, subdomain, year_founded, logo_url, website, created_at, updated_at
    `;
    
    const values = [tenantId, ...Object.values(updates)];
    
    try {
        const result = await pool.query(query, values);
        return result.rows[0] || null;
    } catch (error) {
        throw error;
    }
};

// /**
//  * Get tenant statistics
//  * @param {string} tenantId - The tenant ID
//  * @returns {Promise<Object>} Tenant statistics
//  * @throws {Error} If database operation fails
//  */
// const getTenantStatistics = async (tenantId) => {
//     const queries = {
//         totalUsers: `
//             SELECT COUNT(*) as count 
//             FROM memberships 
//             WHERE tenant_id = $1
//         `,
//         usersByRole: `
//             SELECT role, COUNT(*) as count 
//             FROM memberships 
//             WHERE tenant_id = $1 
//             GROUP BY role
//             ORDER BY role
//         `,
//         totalCampuses: `
//             SELECT COUNT(*) as count 
//             FROM campuses 
//             WHERE tenant_id = $1
//         `
//     };
    
//     try {
//         const [totalUsersResult, usersByRoleResult, totalCampusesResult] = await Promise.all([
//             pool.query(queries.totalUsers, [tenantId]),
//             pool.query(queries.usersByRole, [tenantId]),
//             pool.query(queries.totalCampuses, [tenantId])
//         ]);
        
//         return {
//             total_users: parseInt(totalUsersResult.rows[0].count),
//             users_by_role: usersByRoleResult.rows.map(row => ({
//                 role: row.role,
//                 count: parseInt(row.count)
//             })),
//             total_campuses: parseInt(totalCampusesResult.rows[0].count)
//         };
//     } catch (error) {
//         throw error;
//     }
// };

module.exports = {
    checkSubdomainExists,
    checkEmailExists,
    createTenantWithAdmin,
    findTenantBySubdomain,
    findTenantById,
    getAllTenants,
    updateTenant,
    //getTenantStatistics
};