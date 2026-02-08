const { body, param, query } = require('express-validator');

/**
 * Section Validators: Input validation for section management
 */
const SectionValidators = {
    /**
     * Validation rules for creating a section
     */
    createSection: [
        body('academic_year_id')
            .notEmpty()
            .withMessage('Academic year ID is required')
            .isInt({ min: 1 })
            .withMessage('Academic year ID must be a positive integer'),
        
        body('class_id')
            .notEmpty()
            .withMessage('Class ID is required')
            .isInt({ min: 1 })
            .withMessage('Class ID must be a positive integer'),
        
        body('curriculum_id')
            .optional({ checkFalsy: true })
            .isInt({ min: 1 })
            .withMessage('Curriculum ID must be a positive integer'),
        
        body('section_name')
            .notEmpty()
            .withMessage('Section name is required')
            .isLength({ min: 1, max: 20 })
            .withMessage('Section name must be between 1 and 20 characters')
            .matches(/^[a-zA-Z0-9\s\-]+$/)
            .withMessage('Section name can only contain letters, numbers, spaces, and hyphens'),
        
        body('room_id')
            .optional({ checkFalsy: true })
            .isInt({ min: 1 })
            .withMessage('Room ID must be a positive integer'),
        
        body('primary_teacher_user_id')
            .optional({ checkFalsy: true })
            .isInt({ min: 1 })
            .withMessage('Primary teacher user ID must be a positive integer'),
        
        body('student_monitor_user_id')
            .optional({ checkFalsy: true })
            .isInt({ min: 1 })
            .withMessage('Student monitor user ID must be a positive integer'),
        
        body('capacity')
            .optional({ checkFalsy: true })
            .isInt({ min: 1, max: 1000 })
            .withMessage('Capacity must be between 1 and 1000')
    ],

    /**
     * Validation rules for updating a section
     */
    updateSection: [
        param('sectionId')
            .notEmpty()
            .withMessage('Section ID is required')
            .isInt({ min: 1 })
            .withMessage('Section ID must be a positive integer'),
        
        body('academic_year_id')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Academic year ID must be a positive integer'),
        
        body('class_id')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Class ID must be a positive integer'),
        
        body('curriculum_id')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Curriculum ID must be a positive integer'),
        
        body('section_name')
            .optional()
            .isLength({ min: 1, max: 20 })
            .withMessage('Section name must be between 1 and 20 characters')
            .matches(/^[a-zA-Z0-9\s\-]+$/)
            .withMessage('Section name can only contain letters, numbers, spaces, and hyphens'),
        
        body('room_id')
            .optional({ checkFalsy: true })
            .isInt({ min: 1 })
            .withMessage('Room ID must be a positive integer'),
        
        body('primary_teacher_user_id')
            .optional({ checkFalsy: true })
            .isInt({ min: 1 })
            .withMessage('Primary teacher user ID must be a positive integer'),
        
        body('student_monitor_user_id')
            .optional({ checkFalsy: true })
            .isInt({ min: 1 })
            .withMessage('Student monitor user ID must be a positive integer'),
        
        body('capacity')
            .optional({ checkFalsy: true })
            .isInt({ min: 1, max: 1000 })
            .withMessage('Capacity must be between 1 and 1000')
    ],

    /**
     * Validation rules for section ID parameter
     */
    sectionId: [
        param('sectionId')
            .notEmpty()
            .withMessage('Section ID is required')
            .isInt({ min: 1 })
            .withMessage('Section ID must be a positive integer')
    ],

    /**
     * Validation rules for query parameters
     */
    queryParams: [
        query('page')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Page must be a positive integer'),
        
        query('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Limit must be between 1 and 100'),
        
        query('search')
            .optional()
            .isLength({ max: 100 })
            .withMessage('Search term must not exceed 100 characters'),
        
        query('academic_year_id')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Academic year ID must be a positive integer'),
        
        query('class_id')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Class ID must be a positive integer')
    ]
};

module.exports = SectionValidators;