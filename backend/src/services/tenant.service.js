const tenantModel = require('../models/tenant.model');

// ==================== TENANT SERVICE METHODS ====================

/**
 * Register a new tenant with admin user
 * @param {Object} registrationData - Registration data
 * @param {string} registrationData.tenantName - Name of the tenant/school
 * @param {string} registrationData.subdomain - Subdomain for the tenant
 * @param {string} registrationData.tenantPhone - Phone number for the school/tenant
 * @param {number} registrationData.yearFounded - Year the school was founded (required)
 * @param {string} registrationData.logoUrl - URL to the school's logo image (required)
 * @param {string} registrationData.websiteUrl - URL to the school's website (required)
 * @param {string} registrationData.adminName - Admin's full name
 * @param {string} registrationData.adminPhone - Admin's phone number
 * @param {string} registrationData.adminPassword - Admin's password
 * @param {string} registrationData.campusName - Main campus name
 * @param {string} registrationData.campusAddress - Main campus address
 * @param {string} registrationData.campusPhone - Main campus phone number
 * @param {string} registrationData.campusEmail - Main campus email
 * @param {number} registrationData.campusYearEstablished - Year the campus was established
 * @param {number} registrationData.campusNoOfFloors - Number of floors in the campus
 * @returns {Promise<Object>} Created tenant, admin, and campus data
 * @throws {Error} If validation fails or database operation fails
 */
const registerTenant = async (registrationData) => {
    const { tenantName, subdomain, tenantPhone, yearFounded, logoUrl, websiteUrl, adminFirstName, adminMiddleName, adminLastName, adminPhone, adminDOB,
        campusName, campusAddress, campusPhone, campusEmail, campusYearEstablished, campusNoOfFloors } = registrationData;

    // Check if subdomain already exists
    const subdomainExists = await tenantModel.checkSubdomainExists(subdomain.toLowerCase());
    if (subdomainExists) {
        throw new Error('Subdomain is already taken');
    }
    
    
    // Normalize phone numbers
    const normalizedAdminPhone = adminPhone.replace(/[\s-]/g, '').replace(/^(\+91|91)/, '+91');
    const normalizedTenantPhone = tenantPhone.replace(/[\s-]/g, '').replace(/^(\+91|91)/, '+91');
    
    // Prepare data for creation
    const tenantData = {
        tenantName: tenantName.trim(),
        subdomain: subdomain.toLowerCase().trim(),
        tenantPhone: normalizedTenantPhone,
        yearFounded: yearFounded,
        logoUrl: logoUrl.trim(),
        websiteUrl: websiteUrl.trim(),
        adminFirstName: adminFirstName.trim(),
        adminMiddleName: adminMiddleName.trim(),
        adminLastName: adminLastName.trim(),
        adminPhone: normalizedAdminPhone,
        adminDOB: adminDOB,
    };

    const campusData = {
        campus_name: campusName.trim(),
        address: campusAddress.trim(),
        phone_number: campusPhone?.trim() || '',
        email: campusEmail?.trim() || '',
        is_main_campus: true,
        year_established: campusYearEstablished ? parseInt(campusYearEstablished) : null,
        no_of_floors: parseInt(campusNoOfFloors),
        tenant_id: null // will be set after tenant creation
    };
    
    // Create tenant with admin user and campus in transaction
    // (create tenant, then campus, then user, then membership)
    try {
        const result = await tenantModel.createTenantWithSuperadmin(tenantData, campusData);
        
        return {
            tenant: result.tenant,
            admin: result.admin,
            campusId: result.campus.campus_id
        };
    } catch (error) {
        throw error;
    }
};

/**
 * Get tenant by subdomain
 * @param {string} subdomain - The subdomain to search for
 * @returns {Promise<Object|null>} Tenant object or null if not found
 * @throws {Error} If database operation fails
 */
const getTenantBySubdomain = async (subdomain) => {
    return await tenantModel.findTenantBySubdomain(subdomain.toLowerCase().trim());
};

/**
 * Get tenant by ID
 * @param {string} tenantId - The tenant ID to search for
 * @returns {Promise<Object|null>} Tenant object or null if not found
 * @throws {Error} If database operation fails
 */
const getTenantById = async (tenantId) => {    
    return await tenantModel.findTenantById(tenantId);
};

/**
 * Get all tenants with statistics
 * @returns {Promise<Array>} Array of tenant objects with user counts
 * @throws {Error} If database operation fails
 */
const getAllTenants = async () => {
    return await tenantModel.getAllTenants();
};

/**
 * Update tenant information
 * @param {string} tenantId - The tenant ID to update
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object|null>} Updated tenant object or null if not found
 * @throws {Error} If validation fails or database operation fails
 */
const updateTenant = async (tenantId, updateData) => {
    // Check if tenant exists
    const existingTenant = await tenantModel.findTenantById(tenantId);
    if (!existingTenant) {
        throw new Error('Tenant not found');
    }
    
    // Trim string values
    const cleanedData = {};
    Object.keys(updateData).forEach(key => {
        if (typeof updateData[key] === 'string') {
            cleanedData[key] = updateData[key].trim();
        } else {
            cleanedData[key] = updateData[key];
        }
    });
    
    return await tenantModel.updateTenant(tenantId, cleanedData);
};

/**
 * Get detailed tenant statistics
 * @param {string} tenantId - The tenant ID
 * @returns {Promise<Object>} Detailed tenant statistics
 * @throws {Error} If validation fails or database operation fails
 */
const getTenantStatistics = async (tenantId) => {
    // Check if tenant exists
    const tenant = await tenantModel.findTenantById(tenantId);
    if (!tenant) {
        throw new Error('Tenant not found');
    }
    
    const statistics = await tenantModel.getTenantStatistics(tenantId);
    
    return {
        tenant_info: {
            tenant_id: tenant.tenant_id,
            tenant_name: tenant.tenant_name,
            subdomain: tenant.subdomain,
            created_at: tenant.created_at
        },
        statistics
    };
};

/**
 * Validate subdomain availability
 * @param {string} subdomain - The subdomain to check
 * @returns {Promise<Object>} Availability status
 * @throws {Error} If validation fails or database operation fails
 */
const checkSubdomainAvailability = async (subdomain) => {    
    // Validate subdomain format
    const subdomainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;
    if (!subdomainRegex.test(subdomain.toLowerCase())) {
        return {
            available: false,
            message: 'Subdomain must contain only lowercase letters, numbers, and hyphens (2-63 characters)'
        };
    }
    
    const exists = await tenantModel.checkSubdomainExists(subdomain.toLowerCase());
    
    return {
        available: !exists,
        message: exists ? 'Subdomain is already taken' : 'Subdomain is available'
    };
};

/**
 * Validate email availability
 * @param {string} email - The email to check
 * @returns {Promise<Object>} Availability status
 * @throws {Error} If validation fails or database operation fails
 */
const checkEmailAvailability = async (email) => {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return {
            available: false,
            message: 'Invalid email format'
        };
    }
    
    const exists = await tenantModel.checkEmailExists(email.toLowerCase());
    
    return {
        available: !exists,
        message: exists ? 'Email is already in use' : 'Email is available'
    };
};

module.exports = {
    registerTenant,
    getTenantBySubdomain,
    getTenantById,
    getAllTenants,
    updateTenant,
    getTenantStatistics,
    checkSubdomainAvailability,
    checkEmailAvailability
};