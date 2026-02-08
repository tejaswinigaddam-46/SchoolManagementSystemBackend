const Joi = require('joi');

// ==================== CLASS VALIDATION SCHEMAS ====================

/**
 * Validation schema for class creation
 */
const classCreationSchema = Joi.object({
    className: Joi.string()
        .trim()
        .min(1)
        .max(50)
        .required()
        .messages({
            'string.empty': 'Class name is required',
            'string.min': 'Class name must be at least 1 character long',
            'string.max': 'Class name cannot exceed 50 characters',
            'any.required': 'Class name is required'
        }),
    
    classLevel: Joi.number()
        .integer()
        .min(1)
        .max(12)
        .required()
        .messages({
            'number.base': 'Class level must be a number',
            'number.integer': 'Class level must be an integer',
            'number.min': 'Class level must be at least 1',
            'number.max': 'Class level cannot exceed 12',
            'any.required': 'Class level is required'
        }),
    
    campusId: Joi.string()
        .uuid()
        .optional()
        .messages({
            'string.guid': 'Campus ID must be a valid UUID'
        })
});

/**
 * Validation schema for class update
 */
const classUpdateSchema = Joi.object({
    className: Joi.string()
        .trim()
        .min(1)
        .max(50)
        .messages({
            'string.empty': 'Class name cannot be empty',
            'string.min': 'Class name must be at least 1 character long',
            'string.max': 'Class name cannot exceed 50 characters'
        }),
    
    classLevel: Joi.number()
        .integer()
        .min(1)
        .max(12)
        .messages({
            'number.base': 'Class level must be a number',
            'number.integer': 'Class level must be an integer',
            'number.min': 'Class level must be at least 1',
            'number.max': 'Class level cannot exceed 12'
        })
}).min(1).messages({
    'object.min': 'At least one field must be provided for update'
});

// ==================== MIDDLEWARE FUNCTIONS ====================

/**
 * Middleware to validate class creation data
 */
const validateClassCreation = (req, res, next) => {
    const { error } = classCreationSchema.validate(req.body, { 
        abortEarly: false,
        stripUnknown: true
    });
    
    if (error) {
        const errors = error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
        }));
        
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors
        });
    }
    
    next();
};

/**
 * Middleware to validate class update data
 */
const validateClassUpdate = (req, res, next) => {
    const { error } = classUpdateSchema.validate(req.body, { 
        abortEarly: false,
        stripUnknown: true
    });
    
    if (error) {
        const errors = error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
        }));
        
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors
        });
    }
    
    next();
};

module.exports = {
    classCreationSchema,
    classUpdateSchema,
    validateClassCreation,
    validateClassUpdate
};