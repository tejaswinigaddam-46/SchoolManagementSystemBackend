const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const config = require('../config');
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
    
    console.log('Decoded token:', JSON.stringify(decoded, null, 2));
    console.log('Decoded role:', decoded.role);
    console.log('Role type:', typeof decoded.role);
    
    // Attach user info to request object
    req.user = {
      tenantId: decoded.tenant.tenant_id,
      campusId: decoded.campus.campus_id,
      roles: Array.isArray(decoded.role) ? decoded.role : [decoded.role?.role || decoded.role],
      role: decoded.role?.role || decoded.role,
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

/* UNUSED CODE - Legacy middleware function not being used anywhere
/**
 * Middleware to protect routes - must run after identifyTenant
 * Looks for JWT in HttpOnly cookie and validates user membership
 * (Legacy function - keeping for backward compatibility)
 */
/*
const protect = async (req, res, next) => {
  try {
    // Look for token in HttpOnly cookie
    const token = req.cookies.token;
    
    if (!token) {
      return res.status(401).json({
        message: "Not authorized, no token."
      });
    }
    
    // Verify the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || config.jwt.secret);
    
    // Ensure token contains required fields
    if (!decoded.userId || !decoded.tenantId) {
      return res.status(401).json({
        message: "Not authorized, token failed."
      });
    }
    
    // Query database to verify user membership and get all roles
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT role 
        FROM memberships 
        WHERE user_id = $1 AND tenant_id = $2
      `;
      const result = await client.query(query, [decoded.userId, decoded.tenantId]);
      
      // If no membership found, user is not authorized
      if (result.rows.length === 0) {
        return res.status(401).json({
          message: "Not authorized, token failed."
        });
      }
      
      // Extract all roles from the result
      const roles = result.rows.map(row => row.role);
      
      // Create user object with all roles
      req.user = {
        id: decoded.userId,
        tenantId: decoded.tenantId,
        roles: roles
      };
      
      // Continue to next middleware
      next();
      
    } finally {
      // Always release the client back to the pool
      client.release();
    }
    
  } catch (error) {
    console.error('Error in protect middleware:', error);
    
    // Handle JWT-specific errors
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: "Not authorized, token failed."
      });
    }
    
    // Handle other errors
    return res.status(401).json({
      message: "Not authorized, token failed."
    });
  }
};
*/

/**
 * Middleware to check if user has at least one of the required roles
 */
const authorize = (...requiredRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    // Check if user has at least one of the required roles
    const userRoles = req.user.roles || [req.user.role];
    const hasRequiredRole = requiredRoles.some(role => 
      userRoles.includes(role)
    );

    if (!hasRequiredRole) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${requiredRoles.join(', ')}`
      });
    }

    next();
  };
};

/**
 * Middleware factory to check if user has any of the required roles
 * Alternative syntax for requireRole(['admin']) instead of authorize('admin')
 */
const requireRole = (requiredRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    // Ensure requiredRoles is an array
    const rolesArray = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

    // Get user roles as array
    const userRoles = req.user.roles || [req.user.role];
    
    // Check if user has at least one of the required roles
    const hasRequiredRole = rolesArray.some(role => 
      userRoles.includes(role)
    );

    if (!hasRequiredRole) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${rolesArray.join(', ')}`
      });
    }

    next();
  };
};

/* UNUSED CODE - Role-based middleware not being used anywhere
/**
 * Middleware to check if user has admin role
 */
/*
const requireAdmin = authorize('Admin');
*/

/* UNUSED CODE - Role-based middleware not being used anywhere
/**
 * Middleware to check if user has teacher role or above
 */
/*
const requireTeacher = authorize('Admin', 'Teacher');
*/

/* UNUSED CODE - Legacy token generation function not being used (loginService.authenticateUser is used instead)
/**
 * Generate JWT token with user and tenant information
 * (Legacy function - use loginService.authenticateUser instead)
 */
/*
const generateToken = (userId, tenantId, expiresIn = '24h') => {
  return jwt.sign(
    { 
      userId, 
      tenantId 
    }, 
    process.env.JWT_SECRET || config.jwt.secret, 
    { 
      expiresIn 
    }
  );
};
*/

/* UNUSED CODE - Password hashing function not being used (bcrypt is used directly in models)
/**
 * Hash password using bcrypt
 */
/*
const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};
*/

/* UNUSED CODE - Password comparison function not being used (bcrypt is used directly in models)
/**
 * Compare password with hash
 */
/*
const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};
*/

/* UNUSED CODE - User lookup function not being used (userModel methods are used instead)
/**
 * Get user by email with password hash (for login)
 */
/*
const getUserByEmail = async (email) => {
  const client = await pool.connect();
  
  try {
    const query = 'SELECT user_id, email, password_hash FROM users WHERE email = $1';
    const result = await client.query(query, [email]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
    
  } finally {
    client.release();
  }
};
*/

/* UNUSED CODE - Membership lookup function not being used (userModel methods are used instead)
/**
 * Get user memberships for a specific tenant
 */
/*
const getUserMemberships = async (userId, tenantId) => {
  const client = await pool.connect();
  
  try {
    const query = `
      SELECT role 
      FROM memberships 
      WHERE user_id = $1 AND tenant_id = $2
    `;
    const result = await client.query(query, [userId, tenantId]);
    
    return result.rows.map(row => row.role);
    
  } finally {
    client.release();
  }
};
*/

module.exports = {
  authenticate,  // Main authentication middleware
  // protect,       // Legacy middleware - UNUSED
  authorize,     // Role-based authorization
   requireRole,   // Alternative role-based authorization
  // requireAdmin,  // Admin role middleware - UNUSED
  // requireTeacher, // Teacher role middleware - UNUSED
  // generateToken, // UNUSED
  // hashPassword, // UNUSED
  // comparePassword, // UNUSED
  // getUserByEmail, // UNUSED
  // getUserMemberships // UNUSED
};
