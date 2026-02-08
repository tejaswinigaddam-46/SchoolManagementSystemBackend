const Joi = require('joi');

// ==================== ROOM VALIDATION SCHEMAS ====================

/**
 * Validation schema for room creation
 */
const roomCreationSchema = Joi.object({
    building_id: Joi.number()
        .integer()
        .min(1)
        .required()
        .messages({
            'number.base': 'Building ID must be a number',
            'number.integer': 'Building ID must be an integer',
            'number.min': 'Building ID must be a positive integer',
            'any.required': 'Building ID is required'
        }),

    room_number: Joi.string()
        .trim()
        .min(1)
        .max(20)
        .required()
        .messages({
            'string.empty': 'Room number is required',
            'string.min': 'Room number must be at least 1 character long',
            'string.max': 'Room number cannot exceed 20 characters',
            'any.required': 'Room number is required'
        }),

    floor_number: Joi.number()
        .integer()
        .min(0)
        .max(200)
        .required()
        .messages({
            'number.base': 'Floor number must be a number',
            'number.integer': 'Floor number must be an integer',
            'number.min': 'Floor number must be at least 0',
            'number.max': 'Floor number cannot exceed 200',
            'any.required': 'Floor number is required'
        }),

    room_type: Joi.string()
        .trim()
        .min(1)
        .required()
        .messages({
            'string.empty': 'Room type is required',
            'string.min': 'Room type cannot be empty',
            'any.required': 'Room type is required'
        }),

    capacity: Joi.number()
        .integer()
        .min(1)
        .max(1000)
        .allow(null)
        .optional()
        .messages({
            'number.base': 'Capacity must be a number',
            'number.integer': 'Capacity must be an integer',
            'number.min': 'Capacity must be at least 1',
            'number.max': 'Capacity cannot exceed 1000'
        })
});

/**
 * Validation schema for room update
 */
const roomUpdateSchema = Joi.object({
    room_number: Joi.string()
        .trim()
        .min(1)
        .max(20)
        .messages({
            'string.empty': 'Room number cannot be empty',
            'string.min': 'Room number must be at least 1 character long',
            'string.max': 'Room number cannot exceed 20 characters'
        }),

    floor_number: Joi.number()
        .integer()
        .min(0)
        .max(200)
        .messages({
            'number.base': 'Floor number must be a number',
            'number.integer': 'Floor number must be an integer',
            'number.min': 'Floor number must be at least 0',
            'number.max': 'Floor number cannot exceed 200'
        }),

    room_type: Joi.string()
        .trim()
        .min(1)
        .messages({
            'string.empty': 'Room type cannot be empty',
            'string.min': 'Room type cannot be empty'
        }),

    capacity: Joi.number()
        .integer()
        .min(1)
        .max(1000)
        .allow(null)
        .messages({
            'number.base': 'Capacity must be a number',
            'number.integer': 'Capacity must be an integer',
            'number.min': 'Capacity must be at least 1',
            'number.max': 'Capacity cannot exceed 1000'
        })
}).min(1).messages({
    'object.min': 'At least one field must be provided for update'
});

/**
 * Validation schema for room ID parameter
 */
const roomIdSchema = Joi.object({
    id: Joi.number()
        .integer()
        .min(1)
        .required()
        .messages({
            'number.base': 'Room ID must be a number',
            'number.integer': 'Room ID must be an integer',
            'number.min': 'Room ID must be a positive integer',
            'any.required': 'Room ID is required'
        })
});

/**
 * Validation schema for building ID parameter
 */
const buildingIdSchema = Joi.object({
    buildingId: Joi.number()
        .integer()
        .min(1)
        .required()
        .messages({
            'number.base': 'Building ID must be a number',
            'number.integer': 'Building ID must be an integer',
            'number.min': 'Building ID must be a positive integer',
            'any.required': 'Building ID is required'
        })
});

// ==================== MIDDLEWARE FUNCTIONS ====================

/**
 * Middleware to validate room creation data
 */
const validateRoomCreation = (req, res, next) => {
    const { error } = roomCreationSchema.validate(req.body, { 
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
 * Middleware to validate room update data
 */
const validateRoomUpdate = (req, res, next) => {
    const { error } = roomUpdateSchema.validate(req.body, { 
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
 * Middleware to validate room ID parameter
 */
const validateRoomId = (req, res, next) => {
    const { error } = roomIdSchema.validate(req.params, { 
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
 * Middleware to validate building ID parameter
 */
const validateBuildingId = (req, res, next) => {
    const { error } = buildingIdSchema.validate(req.params, { 
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
    roomCreationSchema,
    roomUpdateSchema,
    roomIdSchema,
    buildingIdSchema,
    validateRoomCreation,
    validateRoomUpdate,
    validateRoomId,
    validateBuildingId
};