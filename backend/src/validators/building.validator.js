const { body, validationResult } = require('express-validator');

// ==================== BUILDING VALIDATION MIDDLEWARE ====================

/**
 * Validation rules for creating a new building
 */
const validateCreateBuilding = [
    body('building_name')
        .trim()
        .notEmpty()
        .withMessage('Building name is required')
        .isLength({ min: 1, max: 100 })
        .withMessage('Building name must be between 1 and 100 characters')
        .matches(/^[a-zA-Z0-9\s\-_.,()]+$/)
        .withMessage('Building name can only contain letters, numbers, spaces, and common punctuation'),

    body('number_of_floors')
        .notEmpty()
        .withMessage('Number of floors is required')
        .isInt({ min: 1, max: 200 })
        .withMessage('Number of floors must be an integer between 1 and 200'),

    // Middleware to check validation results
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(error => error.msg);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errorMessages
            });
        }
        next();
    }
];

/**
 * Validation rules for updating a building
 */
const validateUpdateBuilding = [
    body('building_name')
        .trim()
        .notEmpty()
        .withMessage('Building name is required')
        .isLength({ min: 1, max: 100 })
        .withMessage('Building name must be between 1 and 100 characters')
        .matches(/^[a-zA-Z0-9\s\-_.,()]+$/)
        .withMessage('Building name can only contain letters, numbers, spaces, and common punctuation'),

    body('number_of_floors')
        .notEmpty()
        .withMessage('Number of floors is required')
        .isInt({ min: 1, max: 200 })
        .withMessage('Number of floors must be an integer between 1 and 200'),

    // Middleware to check validation results
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(error => error.msg);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errorMessages
            });
        }
        next();
    }
];

/**
 * Validation for building ID parameter
 */
const validateBuildingId = [
    body('id')
        .isInt({ min: 1 })
        .withMessage('Building ID must be a positive integer'),

    // Middleware to check validation results
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(error => error.msg);
            return res.status(400).json({
                success: false,
                message: 'Invalid building ID',
                errors: errorMessages
            });
        }
        next();
    }
];

module.exports = {
    validateCreateBuilding,
    validateUpdateBuilding,
    validateBuildingId
};