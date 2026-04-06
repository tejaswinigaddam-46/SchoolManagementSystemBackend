const tenantService = require('../services/tenant.service');

// ==================== TENANT CONTROLLERS ====================

/**
 * Register a new tenant (school) with admin user
 * POST /api/register-tenant
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const registerTenant = async (req, res) => {
    try {
        const { tenantName, subdomain, tenantPhone, yearFounded, logoUrl, websiteUrl, adminFirstName,
            adminMiddleName,
            adminLastName,
            adminPhone,
            adminDOB,
            campusName, campusAddress, campusPhone, campusEmail, campusYearEstablished, campusNoOfFloors } = req.body;


        const result = await tenantService.registerTenant({
            tenantName,
            subdomain,
            tenantPhone,
            yearFounded,
            logoUrl,
            websiteUrl,
            adminFirstName,
            adminMiddleName,
            adminLastName,
            adminPhone,
            adminDOB,
            campusName,
            campusAddress,
            campusPhone,
            campusEmail,
            campusYearEstablished,
            campusNoOfFloors
            
        });
        
        res.status(201).json({
            success: true,
            message: 'Tenant registered successfully',
            data: {
                tenant: result.tenant,
                admin: result.admin,
                subdomain: result.tenant.subdomain
            }
        });
    } catch (error) {
        console.error('Error in registerTenant controller:', error);
        
        // Handle specific validation errors
        if (error.message.includes('already taken') || 
            error.message.includes('already in use') ||
            error.message.includes('required') ||
            error.message.includes('format') ||
            error.message.includes('characters') ||
            error.message.includes('valid') ||
            error.message.includes('URL')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Internal server error while registering tenant'
        });
    }
};

/**
 * Get tenant by subdomain
 * GET /api/tenants/subdomain/:subdomain
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getTenantBySubdomain = async (req, res) => {
    try {
        const { subdomain } = req.params;

        const tenant = await tenantService.getTenantBySubdomain(subdomain);
        
        if (!tenant) {
            return res.status(404).json({
                success: false,
                message: 'Tenant not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: tenant
        });
    } catch (error) {
        console.error('Error in getTenantBySubdomain controller:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching tenant'
        });
    }
};

/**
 * Get tenant by ID
 * GET /api/tenants/:tenantId
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getTenantById = async (req, res) => {
    try {
        const { tenantId } = req.params;

        const tenant = await tenantService.getTenantById(tenantId);
        
        if (!tenant) {
            return res.status(404).json({
                success: false,
                message: 'Tenant not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: tenant
        });
    } catch (error) {
        console.error('Error in getTenantById controller:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching tenant'
        });
    }
};

/**
 * Get all tenants (admin only)
 * GET /api/tenants
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllTenants = async (req, res) => {
    try {
        const tenants = await tenantService.getAllTenants();
        
        res.status(200).json({
            success: true,
            data: tenants,
            count: tenants.length
        });
    } catch (error) {
        console.error('Error in getAllTenants controller:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching tenants'
        });
    }
};

/**
 * Update tenant information
 * PUT /api/tenants/:tenantId
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateTenant = async (req, res) => {
    try {
        const { tenantId } = req.params;
        const updateData = req.body;
        // Remove fields that shouldn't be updated
        delete updateData.tenant_id;
        delete updateData.subdomain;
        delete updateData.created_at;
        delete updateData.updated_at;

        const updatedTenant = await tenantService.updateTenant(tenantId, updateData);
        
        if (!updatedTenant) {
            return res.status(404).json({
                success: false,
                message: 'Tenant not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Tenant updated successfully',
            data: updatedTenant
        });
    } catch (error) {
        console.error('Error in updateTenant controller:', error);
        
        if (error.message.includes('not found') || 
            error.message.includes('required') ||
            error.message.includes('cannot be empty') ||
            error.message.includes('must be') ||
            error.message.includes('valid')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Internal server error while updating tenant'
        });
    }
};

/**
 * Get tenant statistics
 * GET /api/tenants/:tenantId/statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getTenantStatistics = async (req, res) => {
    try {
        const { tenantId } = req.params;
        const statistics = await tenantService.getTenantStatistics(tenantId);
        
        res.status(200).json({
            success: true,
            data: statistics
        });
    } catch (error) {
        console.error('Error in getTenantStatistics controller:', error);
        
        if (error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching tenant statistics'
        });
    }
};

/**
 * Check subdomain availability
 * GET /api/tenants/check-subdomain/:subdomain
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const checkSubdomainAvailability = async (req, res) => {
    try {
        const { subdomain } = req.params;
        const result = await tenantService.checkSubdomainAvailability(subdomain);
        
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error in checkSubdomainAvailability controller:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while checking subdomain availability'
        });
    }
};

/**
 * Check email availability
 * GET /api/tenants/check-email/:email
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const checkEmailAvailability = async (req, res) => {
    try {
        const { email } = req.params;
        const result = await tenantService.checkEmailAvailability(email);
        
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error in checkEmailAvailability controller:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while checking email availability'
        });
    }
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