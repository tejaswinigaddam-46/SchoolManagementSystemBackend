const loginModel = require('../models/login.model');
const userModel = require('../models/user.model');
const jwt = require('jsonwebtoken');
const config = require('../config');
const tenantService  = require('../services/tenant.service');
const campusService  = require('../services/campus.service');
const logger = require('../utils/logger');

// ==================== USER SERVICE METHODS ====================

/**
 * Authenticate user and generate JWT token
 * @param {Object} loginData - Login credentials
 * @param {string} loginData.username - User's username
 * @param {string} loginData.password - User's password
 * @param {string} tenantId - Tenant ID from middleware
 * @returns {Promise<Object>} Authentication result with token and user data
 * @throws {Error} If authentication fails
 */
const authenticateUser = async (loginData, tenantId) => {
    logger.info('authenticateUser method called', {
        method: 'authenticateUser',
        parameters: { username: loginData.username, tenantId, password: '[REDACTED]' }
    });
    
    const { username, password } = loginData;
    
    if (!username?.trim()) {
        logger.error('Username is required in authenticateUser', {
            method: 'authenticateUser',
            error: 'Username is required'
        });
        throw new Error('Username is required');
    }
    
    if (!password?.trim()) {
        logger.error('Password is required in authenticateUser', {
            method: 'authenticateUser',
            error: 'Password is required'
        });
        throw new Error('Password is required');
    }
    
    if (!tenantId) {
        logger.error('Tenant identification is required in authenticateUser', {
            method: 'authenticateUser',
            error: 'Tenant identification is required'
        });
        throw new Error('Tenant identification is required');
    }
    
    console.log('Authenticating user:', username, 'for tenant:', tenantId);
    
    try {
    
    const user = await userModel.findByUsername(username);
    if (!user) {
        throw new Error('Invalid username or password');
    }
    
    const isPasswordValid = await loginModel.verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
        throw new Error('Invalid username or password');
    }
    
    const isMember = await userModel.isUserMemberOfTenant(user.username, tenantId);
    if (!isMember) {
        throw new Error('Access denied: User is not authorized for this school');
    }
    const role = await userModel.getUserRoleForTenant(user.username, tenantId);
    const tenantDetails = await tenantService.getTenantById(tenantId);
    
    if (!tenantDetails) {
        throw new Error('Tenant not found:', tenantId);
    }

    const campusId = await userModel.getUserCampusId(user.username, tenantId);
    const campusDetails = await campusService.getCampusById(campusId, tenantId);

    const tokenPayload = {
        user: {
            user_id: user.user_id,
            username: user.username,
            first_name: user.first_name,
            middle_name: user.middle_name,
            last_name: user.last_name,
            phone_number: user.phone_number,
            created_at: user.created_at
        },
        tenant: {
            tenant_id: tenantDetails.tenant_id,
            tenant_name: tenantDetails.tenant_name,
            subdomain: tenantDetails.subdomain
        },
        role: role,
        campus:  {
            campus_id: campusDetails.campus_id,
            campus_name: campusDetails.campus_name,
            is_main_campus: campusDetails.is_main_campus
        } 
    };
    
    const accessToken = jwt.sign(
        tokenPayload,
        config.jwt.secret,
        { 
            expiresIn: config.jwt.expiresIn || '24h',
            issuer: config.jwt.issuer || 'sms-backend',
            audience: config.jwt.audience || 'sms-client'
        }
    );
    
    const refreshToken = jwt.sign(
        {
            username: user.username,
            tenantId: tenantId,
            type: 'refresh'
        },
        config.jwt.refreshSecret || config.jwt.secret,
        { 
            expiresIn: config.jwt.refreshExpiresIn || '7d',
            issuer: config.jwt.issuer || 'sms-backend',
            audience: config.jwt.audience || 'sms-client'
        }
    );
    
        const result = {
            user: {
                user_id: user.user_id,
                username: user.username,
                first_name: user.first_name,
                middle_name: user.middle_name,
                last_name: user.last_name,
                phone_number: user.phone_number,
                created_at: user.created_at
            },
            tenant: {
                tenant_id: tenantDetails.tenant_id,
                tenant_name: tenantDetails.tenant_name,
                subdomain: tenantDetails.subdomain
            },
            role: role,
            campus:  {
                campus_id: campusDetails.campus_id,
                campus_name: campusDetails.campus_name,
                is_main_campus: campusDetails.is_main_campus
            } ,
            tokens: {
                access_token: accessToken,
                refresh_token: refreshToken,
                token_type: 'Bearer',
                expires_in: config.jwt.expiresIn || '24h'
            }
        };
        
        logger.info('authenticateUser method completed successfully', {
            method: 'authenticateUser',
            response: {
                user: {
                    user_id: result.user.user_id,
                    username: result.user.username,
                    first_name: result.user.first_name,
                    middle_name: result.user.middle_name,
                    last_name: result.user.last_name,
                    phone_number: result.user.phone_number,
                    created_at: result.user.created_at
                },
                tenant: {
                    tenant_id: result.tenant.tenant_id,
                    tenant_name: result.tenant.tenant_name,
                    subdomain: result.tenant.subdomain
                },
                role: result.role,
                campus:  {
                    campus_id: result.campus.campus_id,
                    campus_name: result.campus.campus_name,
                    is_main_campus: result.campus.is_main_campus
                } ,
                hasTokens: !!result.tokens.access_token
            }
        });
        
        return result;
    } catch (error) {
        logger.error('Error in authenticateUser method', {
            method: 'authenticateUser',
            error: error.message,
            parameters: { username, tenantId }
        });
        throw error;
    }
};

/**
 * Refresh JWT token
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<Object>} New access token
 * @throws {Error} If refresh token is invalid
 */
const refreshAccessToken = async (refreshToken) => {
    logger.info('refreshAccessToken method called', {
        method: 'refreshAccessToken',
        parameters: { hasRefreshToken: !!refreshToken }
    });
    
    if (!refreshToken) {
        logger.error('Refresh token is required in refreshAccessToken', {
            method: 'refreshAccessToken',
            error: 'Refresh token is required'
        });
        throw new Error('Refresh token is required');
    }
    
    try {
        // Verify refresh token
        const decoded = jwt.verify(
            refreshToken, 
            config.jwt.refreshSecret || config.jwt.secret,
            {
                issuer: config.jwt.issuer || 'sms-backend',
                audience: config.jwt.audience || 'sms-client'
            }
        );
        
        if (decoded.type !== 'refresh') {
            throw new Error('Invalid token type');
        }
        
        // Check if user still exists
        const user = await userModel.findByUsername(decoded.username);
        if (!user) {
        throw new Error('user not found');
         }
        
        // Check if user is member of current tenant
        const isMember = await userModel.isUserMemberOfTenant(decoded.username, decoded.tenantId);
        if (!isMember) {
            throw new Error('User is no longer a member of this tenant');
        }
        
        // Get updated roles
        const role = await userModel.getUserRoleForTenant(decoded.username, decoded.tenantId);

        const tenantDetails = await tenantService.getTenantById(decoded.tenantId);
    
        if (!tenantDetails) {
            throw new Error('Tenant not found:', decoded.tenantId);
        }

        const campusId = await userModel.getUserCampusId(user.username, decoded.tenantId);
        const campusDetails = await campusService.getCampusById(campusId, decoded.tenantId);
        
        // Generate new access token
        const tokenPayload = {
            user: {
                user_id: user.user_id,
                username: user.username,
                first_name: user.first_name,
                middle_name: user.middle_name,
                last_name: user.last_name,
                phone_number: user.phone_number,
                created_at: user.created_at
            },
            tenant: {
                tenant_id: tenantDetails.tenant_id,
                tenant_name: tenantDetails.tenant_name,
                subdomain: tenantDetails.subdomain
            },
            role: role,
            campus:  {
                campus_id: campusDetails.campus_id,
                campus_name: campusDetails.campus_name,
                is_main_campus: campusDetails.is_main_campus
            } 
        };
        
        const accessToken = jwt.sign(
            tokenPayload,
            config.jwt.secret,
            { 
                expiresIn: config.jwt.expiresIn || '24h',
                issuer: config.jwt.issuer || 'sms-backend',
                audience: config.jwt.audience || 'sms-client'
            }
        );
        
        const result = {
            access_token: accessToken,
            token_type: 'Bearer',
            expires_in: config.jwt.expiresIn || '24h'
        };
        
        logger.info('refreshAccessToken method completed successfully', {
            method: 'refreshAccessToken',
            response: { hasAccessToken: !!result.access_token, tokenType: result.token_type }
        });
        
        return result;
        
    } catch (error) {
        logger.error('Error in refreshAccessToken method', {
            method: 'refreshAccessToken',
            error: error.message
        });
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            throw new Error('Invalid or expired refresh token');
        }
        throw error;
    }
};

/**
 * Verify JWT token and return user data
 * @param {string} token - JWT access token
 * @returns {Promise<Object>} Decoded token data
 * @throws {Error} If token is invalid
 */
const verifyToken = async (token) => {
    logger.info('verifyToken method called', {
        method: 'verifyToken',
        parameters: { hasToken: !!token }
    });
    
    if (!token) {
        logger.error('Token is required in verifyToken', {
            method: 'verifyToken',
            error: 'Token is required'
        });
        throw new Error('Token is required');
    }
    
    try {
        const decoded = jwt.verify(
            token, 
            config.jwt.secret,
            {
                issuer: config.jwt.issuer || 'sms-backend',
                audience: config.jwt.audience || 'sms-client'
            }
        );
        
        // Fix: Access nested token structure correctly
        const username = decoded.user?.username;
        const tenantId = decoded.tenant?.tenant_id;
        
        if (!username) {
            throw new Error('Invalid token structure: username not found');
        }
        
        if (!tenantId) {
            throw new Error('Invalid token structure: tenant ID not found');
        }
        
        // Verify user still exists
        const user = await userModel.findByUsername(username);
        if (!user) {
            throw new Error(`User not found: ${username}`);
        }
        
        const isMember = await userModel.isUserMemberOfTenant(username, tenantId);
        if (!isMember) {
            throw new Error('User is no longer a member of this tenant');
        }
        
        logger.info('verifyToken method completed successfully', {
            method: 'verifyToken',
            response: { username: decoded.user?.username, tenantId: decoded.tenant?.tenant_id }
        });
        
        return decoded;
        
    } catch (error) {
        logger.error('Error in verifyToken method', {
            method: 'verifyToken',
            error: error.message
        });
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            throw new Error('Invalid or expired token');
        }
        throw error;
    }
};
/**
 * Change user password
 * @param {string} username - Username
 * @param {Object} passwordData - Password change data
 * @param {string} passwordData.currentPassword - Current password
 * @param {string} passwordData.newPassword - New password
 * @param {string} tenantId - Tenant's ID
 * @returns {Promise<Object>} Success confirmation
 * @throws {Error} If validation fails or current password is incorrect
 */
const changeUserPassword = async (username, passwordData, tenantId) => {
    logger.info('changeUserPassword method called', {
        method: 'changeUserPassword',
        parameters: { username, tenantId, hasCurrentPassword: !!passwordData.currentPassword, hasNewPassword: !!passwordData.newPassword }
    });
    
    const { currentPassword, newPassword } = passwordData;
    
    if (!username) {
        logger.error('Username is required in changeUserPassword', {
            method: 'changeUserPassword',
            error: 'Username is required'
        });
        throw new Error('Username is required');
    }
    
    if (!tenantId) {
        logger.error('Tenant ID is required in changeUserPassword', {
            method: 'changeUserPassword',
            error: 'Tenant ID is required'
        });
        throw new Error('Tenant ID is required');
    }
    
    if (!currentPassword) {
        logger.error('Current password is required in changeUserPassword', {
            method: 'changeUserPassword',
            error: 'Current password is required'
        });
        throw new Error('Current password is required');
    }
    
    if (!newPassword) {
        logger.error('New password is required in changeUserPassword', {
            method: 'changeUserPassword',
            error: 'New password is required'
        });
        throw new Error('New password is required');
    }
    
    if (newPassword.length < 8) {
        logger.error('New password must be at least 8 characters long in changeUserPassword', {
            method: 'changeUserPassword',
            error: 'New password must be at least 8 characters long'
        });
        throw new Error('New password must be at least 8 characters long');
    }
    
    try {
    
    // Verify user still exists
    const user = await userModel.findByUsername(username);
    if (!user) {
        throw new Error('User not found');
    }
    
    const isMember = await userModel.isUserMemberOfTenant(username, tenantId);
    if (!isMember) {
        throw new Error('User is no longer a member of this tenant');
    }
    
    // Verify current password
    const isCurrentPasswordValid = await loginModel.verifyPassword(currentPassword, user.password_hash);
    if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
    }
    
        // Update password
        const updatedUser = await userModel.editUser(username, { password: newPassword });
        if (!updatedUser) {
            logger.error('Failed to update password for user in changeUserPassword', {
                method: 'changeUserPassword',
                error: 'Failed to update password',
                username
            });
            console.error('Failed to update password for user:', username);
            return { error: 'Failed to update password' };
        }
        
        const result = { message: 'Password updated successfully', user: updatedUser };
        
        logger.info('changeUserPassword method completed successfully', {
            method: 'changeUserPassword',
            response: { success: true, username, message: result.message }
        });
        
        return result;
    } catch (error) {
        logger.error('Error in changeUserPassword method', {
            method: 'changeUserPassword',
            error: error.message,
            parameters: { username, tenantId }
        });
        throw error;
    }
};

module.exports = {
    authenticateUser,
    refreshAccessToken,
    verifyToken,
    changeUserPassword,
};