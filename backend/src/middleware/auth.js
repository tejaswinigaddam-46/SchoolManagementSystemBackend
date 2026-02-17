const loginService = require('../services/login.service');

/**
 * Middleware to authenticate users using JWT tokens
 * Extracts token from Authorization header and validates it
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify the JWT token using our user service
    const decoded = await loginService.verifyToken(token);
    
    req.user = {
      tenantId: decoded.tenant.tenant_id,
      campusId: decoded.campus.campus_id,
      roles: Array.isArray(decoded.role) ? decoded.role : [decoded.role?.role || decoded.role],
      role: decoded.role?.role || decoded.role,
      permissions: Array.isArray(decoded.permissions) ? decoded.permissions : [],
      firstName: decoded.user.first_name,
      lastName: decoded.user.last_name,
      middleName: decoded.user.middle_name,
      username: decoded.user.username,
      userId: decoded.user.user_id,
      user_id: decoded.user.user_id,
      tenant: decoded.tenant,
      campus: decoded.campus
    };
    
    console.log('Final req.user:', JSON.stringify(req.user, null, 2));
    
    // Also attach tenantId and campusId for compatibility with existing middleware
    req.tenantId = decoded.tenant.tenant_id;
    req.campusId = decoded.campus.campus_id;
    
    next();
    
  } catch (error) {
    console.error('Error in authenticate middleware:', error);
    
    if (error.message.includes('Invalid or expired')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid or expired token.'
      });
    }
    
    return res.status(401).json({
      success: false,
      message: 'Access denied. Authentication failed.'
    });
  }
};

// Legacy role-based middleware removed in favor of permission-based checks

const requirePermission = (requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    const permissionsArray = Array.isArray(requiredPermissions)
      ? requiredPermissions
      : [requiredPermissions];

    const userPermissions = Array.isArray(req.user.permissions)
      ? req.user.permissions
      : [];

    const hasRequiredPermission = permissionsArray.some(permission =>
      userPermissions.includes(permission)
    );

    if (!hasRequiredPermission) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required permissions: ${permissionsArray.join(', ')}`
      });
    }

    next();
  };
};


module.exports = {
  authenticate,
  requirePermission
};
