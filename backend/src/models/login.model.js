const { pool } = require('../config/database');
const bcrypt = require('bcrypt');
const logger = require('../utils/logger');

// ==================== USER LOGIN MODEL METHODS ====================

/**
 * Verify user's password
 * @param {string} plainPassword - Plain text password
 * @param {string} hashedPassword - Hashed password from database
 * @returns {Promise<boolean>} True if password matches, false otherwise
 */
const verifyPassword = async (plainPassword, hashedPassword) => {
    try {
        return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
        throw error;
    }
};

module.exports = {
    verifyPassword
};