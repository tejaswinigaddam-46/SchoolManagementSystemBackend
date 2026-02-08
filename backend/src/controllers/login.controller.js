const loginservice = require('../services/login.service');

// ==================== USER LOGIN CONTROLLERS ====================

/**
 * User login endpoint
 * POST /api/auth/login
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const login = async (req, res) => {
    const { username, password } = req.body;
    try {

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required'
            });
        }

        // Get tenant ID from middleware (identifyTenant should have attached it to req.tenantId)
        const tenantId = req.tenantId;
        if (!tenantId) {
            return res.status(400).json({
                success: false,
                message: 'Tenant identification is required'
            });
        }

        const authResult = await loginservice.authenticateUser({
            username,
            password
        }, tenantId);
        
        // Set HTTP-only secure cookie for refresh token
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        };
        
        res.cookie('refreshToken', authResult.tokens.refresh_token, cookieOptions);
        
        // Return response (access token can be stored in memory by frontend)
        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user: authResult.user,
                tenant: authResult.tenant,
                role: authResult.role,
                campus: authResult.campus,
                access_token: authResult.tokens.access_token,
                token_type: authResult.tokens.token_type,
                expires_in: authResult.tokens.expires_in
            }
        });
    } catch (error) {
        console.error('Error in login controller:', error);
        
        // Handle specific authentication errors
        if (error.message.includes('Invalid username or password') ||
            error.message.includes('Access denied') ||
            error.message.includes('not authorized') ||
            error.message.includes('required')) {
            return res.status(401).json({
                success: false,
                message: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Internal server error during login ' + error.message + ' ' + username
        });
    }
};

/**
 * Refresh access token
 * POST /api/auth/refresh
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const refreshToken = async (req, res) => {
    try {
        // Get refresh token from HTTP-only cookie
        const refreshToken = req.cookies.refreshToken;
        
        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token not found'
            });
        }

        const tokenResult = await loginservice.refreshAccessToken(refreshToken);
        
        res.status(200).json({
            success: true,
            data: tokenResult
        });
    } catch (error) {
        console.error('Error in refreshToken controller:', error);
        
        if (error.message.includes('Invalid or expired')) {
            // Clear the invalid refresh token cookie
            res.clearCookie('refreshToken');
            
            return res.status(401).json({
                success: false,
                message: 'Refresh token is invalid or expired'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Internal server error during token refresh'
        });
    }
};

/**
 * User logout
 * POST /api/auth/logout
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const logout = async (req, res) => {
    try {
        // Clear the refresh token cookie
        res.clearCookie('refreshToken');
        
        res.status(200).json({
            success: true,
            message: 'Logout successful'
        });
    } catch (error) {
        console.error('Error in logout controller:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during logout'
        });
    }
};

/**
 * Change user password
 * PUT /api/auth/change-password
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const changePassword = async (req, res) => {
    try {
        const username = req.user?.username;
        const tenantId = req.user?.tenantId;
        const { currentPassword, newPassword } = req.body;
        
        if (!username || !tenantId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required'
            });
        }

        const result = await loginservice.changeUserPassword(username, {
            currentPassword,
            newPassword
        }, tenantId);
        
        res.status(200).json({
            success: true,
            message: result.message
        });
    } catch (error) {
        console.error('Error in changePassword controller:', error);
        
        if (error.message.includes('Current password is incorrect')) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }
        
        if (error.message.includes('must be at least') ||
            error.message.includes('required')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        
        if (error.message.includes('not found') || error.message.includes('not a member')) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Internal server error while changing password'
        });
    }
};

/**
 * Verify token endpoint (for testing/debugging)
 * POST /api/auth/verify
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const verifyToken = async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;
        
        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Token is required'
            });
        }

        const decoded = await loginservice.verifyToken(token);
        
        res.status(200).json({
            success: true,
            data: {
                valid: true,
                decoded: decoded
            }
        });
    } catch (error) {
        console.error('Error in verifyToken controller:', error);
        
        if (error.message.includes('Invalid or expired')) {
            return res.status(401).json({
                success: false,
                message: error.message,
                data: {
                    valid: false
                }
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Internal server error during token verification'
        });
    }
};

module.exports = {
    login,
    refreshToken,
    logout,
    changePassword,
    verifyToken
};