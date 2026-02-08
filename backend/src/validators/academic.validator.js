const { body, param } = require('express-validator');

// ==================== CURRICULA VALIDATORS ====================

/**
 * Validation rules for creating a curriculum
 */
const validateCreateCurriculum = [
    param('campusId')
        .isUUID()
        .withMessage('Campus ID must be a valid UUID'),
    
    body('curriculum_code')
        .trim()
        .notEmpty()
        .withMessage('Curriculum code is required')
        .isLength({ min: 1, max: 20 })
        .withMessage('Curriculum code must be between 1 and 20 characters')
        .matches(/^[A-Za-z0-9_-]+$/)
        .withMessage('Curriculum code must contain only alphanumeric characters, underscores, and hyphens'),
    
    body('curriculum_name')
        .trim()
        .notEmpty()
        .withMessage('Curriculum name is required')
        .isLength({ min: 1, max: 100 })
        .withMessage('Curriculum name must be between 1 and 100 characters')
];

/**
 * Validation rules for updating a curriculum
 */
const validateUpdateCurriculum = [
    param('campusId')
        .isUUID()
        .withMessage('Campus ID must be a valid UUID'),
    
    param('curriculumId')
        .isInt({ min: 1 })
        .withMessage('Curriculum ID must be a positive integer'),
    
    body('curriculum_code')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Curriculum code cannot be empty if provided')
        .isLength({ min: 1, max: 20 })
        .withMessage('Curriculum code must be between 1 and 20 characters')
        .matches(/^[A-Za-z0-9_-]+$/)
        .withMessage('Curriculum code must contain only alphanumeric characters, underscores, and hyphens'),
    
    body('curriculum_name')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Curriculum name cannot be empty if provided')
        .isLength({ min: 1, max: 100 })
        .withMessage('Curriculum name must be between 1 and 100 characters')
];

/**
 * Validation rules for curriculum ID parameter
 */
const validateCurriculumId = [
    param('campusId')
        .isUUID()
        .withMessage('Campus ID must be a valid UUID'),
    
    param('curriculumId')
        .isInt({ min: 1 })
        .withMessage('Curriculum ID must be a positive integer')
];

// ==================== ACADEMIC YEARS VALIDATORS ====================

/**
 * Validation rules for creating an academic year
 */
const validateCreateAcademicYear = [
    param('campusId')
        .isUUID()
        .withMessage('Campus ID must be a valid UUID'),
    
    body('year_name')
        .trim()
        .notEmpty()
        .withMessage('Year name is required')
        .matches(/^\d{4}-\d{4}$/)
        .withMessage('Year name must be in format YYYY-YYYY (e.g., 2025-2026)'),
    
    body('year_type')
        .trim()
        .notEmpty()
        .withMessage('Year type is required')
        .isIn(['Current year', 'Previous year', 'Next year'])
        .withMessage('Year type must be one of: Current year, Previous year, Next year'),
    
    body('medium')
        .trim()
        .notEmpty()
        .withMessage('Medium is required')
        .isLength({ min: 1, max: 20 })
        .withMessage('Medium must be between 1 and 20 characters'),
    
    body('start_date')
        .optional()
        .isISO8601()
        .withMessage('Start date must be a valid date in ISO 8601 format')
        .toDate(),
    
    body('end_date')
        .optional()
        .isISO8601()
        .withMessage('End date must be a valid date in ISO 8601 format')
        .toDate(),
    
    body('fromclass')
        .trim()
        .notEmpty()
        .withMessage('From class is required')
        .isLength({ min: 1, max: 20 })
        .withMessage('From class must be between 1 and 20 characters'),
    
    body('toclass')
        .trim()
        .notEmpty()
        .withMessage('To class is required')
        .isLength({ min: 1, max: 20 })
        .withMessage('To class must be between 1 and 20 characters'),
    
    body('start_time_of_day')
        .optional()
        .isLength({ min: 1, max: 20 })
        .withMessage('Start time of day must be between 1 and 20 characters'),
    
    body('end_time_of_day')
        .optional()
        .isLength({ min: 1, max: 20 })
        .withMessage('End time of day must be between 1 and 20 characters'),
    
    body('shift_type')
        .optional()
        .isLength({ min: 1, max: 20 })
        .withMessage('Shift type must be between 1 and 20 characters'),
    
    body('curriculum_id')
        .isInt({ min: 1 })
        .withMessage('Curriculum ID must be a positive integer'),
    
    // Custom validator to check that end_date is after start_date
    body('end_date').custom((value, { req }) => {
        if (value && req.body.start_date) {
            const startDate = new Date(req.body.start_date);
            const endDate = new Date(value);
            if (endDate <= startDate) {
                throw new Error('End date must be after start date');
            }
        }
        return true;
    })
];

/**
 * Validation rules for updating an academic year
 */
const validateUpdateAcademicYear = [
    param('campusId')
        .isUUID()
        .withMessage('Campus ID must be a valid UUID'),
    
    param('academicYearId')
        .isInt({ min: 1 })
        .withMessage('Academic year ID must be a positive integer'),
    
    body('year_name')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Year name cannot be empty if provided')
        .matches(/^\d{4}-\d{4}$/)
        .withMessage('Year name must be in format YYYY-YYYY (e.g., 2025-2026)'),
    
    body('year_type')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Year type cannot be empty if provided')
        .isIn(['Current year', 'Previous year', 'Next year'])
        .withMessage('Year type must be one of: Current year, Previous year, Next year'),
    
    body('medium')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Medium cannot be empty if provided')
        .isLength({ min: 1, max: 20 })
        .withMessage('Medium must be between 1 and 20 characters'),
    
    body('start_date')
        .optional()
        .isISO8601()
        .withMessage('Start date must be a valid date in ISO 8601 format')
        .toDate(),
    
    body('end_date')
        .optional()
        .isISO8601()
        .withMessage('End date must be a valid date in ISO 8601 format')
        .toDate(),
    
    body('fromclass')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('From class cannot be empty if provided')
        .isLength({ min: 1, max: 20 })
        .withMessage('From class must be between 1 and 20 characters'),
    
    body('toclass')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('To class cannot be empty if provided')
        .isLength({ min: 1, max: 20 })
        .withMessage('To class must be between 1 and 20 characters'),
    
    body('start_time_of_day')
        .optional()
        .isLength({ min: 1, max: 20 })
        .withMessage('Start time of day must be between 1 and 20 characters'),
    
    body('end_time_of_day')
        .optional()
        .isLength({ min: 1, max: 20 })
        .withMessage('End time of day must be between 1 and 20 characters'),
    
    body('shift_type')
        .optional()
        .isLength({ min: 1, max: 20 })
        .withMessage('Shift type must be between 1 and 20 characters'),
    
    body('curriculum_id')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Curriculum ID must be a positive integer'),
    
    // Custom validator to check that end_date is after start_date
    body('end_date').custom((value, { req }) => {
        if (value && req.body.start_date) {
            const startDate = new Date(req.body.start_date);
            const endDate = new Date(value);
            if (endDate <= startDate) {
                throw new Error('End date must be after start date');
            }
        }
        return true;
    })
];

/**
 * Validation rules for academic year ID parameter
 */
const validateAcademicYearId = [
    param('campusId')
        .isUUID()
        .withMessage('Campus ID must be a valid UUID'),
    
    param('academicYearId')
        .isInt({ min: 1 })
        .withMessage('Academic year ID must be a positive integer')
];

/**
 * Validation rules for campus ID parameter only
 */
const validateCampusId = [
    param('campusId')
        .isUUID()
        .withMessage('Campus ID must be a valid UUID')
];

module.exports = {
    // Curricula validators
    validateCreateCurriculum,
    validateUpdateCurriculum,
    validateCurriculumId,
    
    // Academic Years validators
    validateCreateAcademicYear,
    validateUpdateAcademicYear,
    validateAcademicYearId,
    
    // Common validators
    validateCampusId
};