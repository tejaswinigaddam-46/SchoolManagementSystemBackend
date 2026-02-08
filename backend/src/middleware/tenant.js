//const { AppError } = require('./errorHandler');
const { pool } = require('../config/database');

/**
 * Middleware to identify tenant based on subdomain
 * Extracts subdomain from hostname and looks up tenant in database
 */
const identifyTenant = async (req, res, next) => {
  try {
    // Extract hostname from request or custom header
    let hostname = req.hostname || req.get('host');
    let subdomain = null;
    
    // Check for custom subdomain header (from Vite proxy or frontend)
    const customSubdomain = req.get('X-Tenant-Subdomain') || req.get('X-Subdomain');
    if (customSubdomain) {
      subdomain = customSubdomain;
      console.log('Using custom subdomain from header:', subdomain);
    } else {
      // Split hostname to get subdomain
      // For example: 'srichaitanya.localhost.com' -> ['srichaitanya', 'localhost', 'com']
      const hostParts = hostname.split('.');
      
      // If there are 3 or more parts, extract subdomain (first part)
      if (hostParts.length >= 3) {
        subdomain = hostParts[0];
      }
      
      // Handle localhost development scenarios
      if (hostname === 'localhost' || hostname.startsWith('localhost:') || hostname.startsWith('127.0.0.1')) {
        console.log('Development environment detected on localhost');
        
        // In development, check if there's a tenant ID in query params or headers
        const devTenantId = req.query.tenantId || req.headers['x-tenant-id'];
        if (devTenantId) {
          subdomain = devTenantId;
          console.log('Using development tenant ID:', subdomain);
        } else {
          // For development without subdomain, use a default tenant
          subdomain = 'default-tenant';
          console.log('Using default tenant for development');
        }
      }
    }
    
    console.log('Extracted subdomain:', subdomain);
    
    // If no subdomain found or it's a common non-tenant subdomain, handle appropriately
    if (!subdomain || ['www', 'api', 'admin'].includes(subdomain)) {
      console.log('No valid subdomain found or invalid subdomain:', subdomain);
      
      return res.status(400).json({
        success: false,
        message: "Tenant identification required. Please access via your school's subdomain."
      });
    }
    
    console.log('Attempting to identify tenant for subdomain:', subdomain);
    
    // Query database to find tenant by subdomain
    const client = await pool.connect();
    
    try {
      const query = 'SELECT tenant_id FROM tenants WHERE subdomain = $1';
      const result = await client.query(query, [subdomain]);
      
      // If no tenant found in database
      if (result.rows.length === 0) {
        console.log('Tenant not found in database for subdomain:', subdomain);
        
        return res.status(404).json({
          success: false,
          message: "School not found. Please check your subdomain or contact support."
        });
      }
      
      // Attach tenant_id to request object
      req.tenantId = result.rows[0].tenant_id;
      console.log('Tenant identified:', req.tenantId);
      
      next();
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Error in identifyTenant middleware:', error);
    
    // Return 500 error for database or other errors
    return res.status(500).json({
      success: false,
      message: "Internal server error while identifying tenant."
    });
  }
};

module.exports = {
  // tenantResolver,
  // requireFeature,
  // extractTenantFromSubdomain,
  // validateTenant,
  identifyTenant
};
