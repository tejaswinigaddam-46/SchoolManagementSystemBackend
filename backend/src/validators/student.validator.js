const Joi = require('joi');

// ==================== STUDENT VALIDATION SCHEMAS ====================

/**
 * Validation schema for student registration
 */
const studentRegistrationSchema = Joi.object({
    // Basic Information
    firstName: Joi.string()
        .trim()
        .min(1)
        .max(100)
        .required()
        .messages({
            'string.empty': 'First name is required',
            'string.min': 'First name must be at least 1 character long',
            'string.max': 'First name cannot exceed 100 characters',
            'any.required': 'First name is required'
        }),
    
    middleName: Joi.string()
        .trim()
        .max(100)
        .allow('', null)
        .messages({
            'string.max': 'Middle name cannot exceed 100 characters'
        }),
    
    lastName: Joi.string()
        .trim()
        .min(1)
        .max(100)
        .required()
        .messages({
            'string.empty': 'Last name is required',
            'string.min': 'Last name must be at least 1 character long',
            'string.max': 'Last name cannot exceed 100 characters',
            'any.required': 'Last name is required'
        }),
    
    admissionNumber: Joi.string()
        .trim()
        .min(1)
        .max(20)
        .required()
        .pattern(/^[A-Za-z0-9\-_]+$/)
        .messages({
            'string.empty': 'Admission number is required',
            'string.min': 'Admission number must be at least 1 character long',
            'string.max': 'Admission number cannot exceed 20 characters',
            'string.pattern.base': 'Admission number can only contain letters, numbers, hyphens, and underscores',
            'any.required': 'Admission number is required'
        }),
    
    dateOfBirth: Joi.date()
        .max('now')
        .min('1900-01-01')
        .required()
        .messages({
            'date.base': 'Invalid date of birth',
            'date.max': 'Date of birth cannot be in the future',
            'date.min': 'Date of birth cannot be before 1900',
            'any.required': 'Date of birth is required'
        }),
    
    gender: Joi.string()
        .trim()
        .valid('Male', 'Female', 'Other')
        .allow('', null)
        .messages({
            'any.only': 'Gender must be Male, Female, or Other'
        }),
    
    bloodGroup: Joi.string()
        .trim()
        .valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')
        .allow('', null)
        .messages({
            'any.only': 'Blood group must be A+, A-, B+, B-, AB+, AB-, O+, or O-'
        }),
    
    nationality: Joi.string()
        .trim()
        .max(50)
        .allow('', null)
        .messages({
            'string.max': 'Nationality cannot exceed 50 characters'
        }),
    
    admissionDate: Joi.date()
        .allow('', null)
        .messages({
            'date.base': 'Invalid admission date'
        }),

    // Academic Information
    academic_year_id: Joi.number()
        .integer()
        .positive()
        .required()
        .messages({
            'number.base': 'Academic year ID must be a number',
            'number.integer': 'Academic year ID must be an integer',
            'number.positive': 'Academic year ID must be positive',
            'any.required': 'Academic year ID is required'
        }),
    
    class: Joi.string()
        .trim()
        .min(1)
        .max(20)
        .required()
        .messages({
            'string.empty': 'Class is required',
            'string.min': 'Class must be at least 1 character long',
            'string.max': 'Class cannot exceed 20 characters',
            'any.required': 'Class is required'
        }),
    
    

    // Contact Information (optional for basic registration)
    email: Joi.string()
        .trim()
        .email()
        .allow('', null)
        .messages({
            'string.email': 'Please provide a valid email address'
        }),
    
    phoneNumber: Joi.string()
        .trim()
        .pattern(/^[\+]?[1-9][\d]{0,15}$/)
        .allow('', null)
        .messages({
            'string.pattern.base': 'Please provide a valid phone number'
        }),

    // Additional fields from frontend
    religion: Joi.string().trim().max(50).allow('', null),
    caste: Joi.string().trim().max(50).allow('', null),
    category: Joi.string().trim().valid('General', 'OBC', 'SC', 'ST', 'EWS').allow('', null),
    previousSchool: Joi.string().trim().max(200).allow('', null),
    transferCertificateNumber: Joi.string().trim().max(50).allow('', null),
    admissionType: Joi.string().trim().valid('New', 'Transfer', 'Re-admission').allow('', null),
    currentAddress: Joi.string().trim().max(500).allow('', null),
    permanentAddress: Joi.string().trim().max(500).allow('', null),
    city: Joi.string().trim().max(100).allow('', null),
    state: Joi.string().trim().max(100).allow('', null),
    pincode: Joi.string().trim().pattern(/^\d{6}$/).allow('', null),
    country: Joi.string().trim().max(100).allow('', null),
    fatherName: Joi.string().trim().max(200).allow('', null),
    fatherOccupation: Joi.string().trim().max(100).allow('', null),
    fatherPhone: Joi.string().trim().pattern(/^[\+]?[1-9][\d]{0,15}$/).allow('', null),
    fatherIncome: Joi.number().positive().allow('', null),
    motherName: Joi.string().trim().max(200).allow('', null),
    motherOccupation: Joi.string().trim().max(100).allow('', null),
    motherPhone: Joi.string().trim().pattern(/^[\+]?[1-9][\d]{0,15}$/).allow('', null),
    motherIncome: Joi.number().positive().allow('', null),
    guardianName: Joi.string().trim().max(200).allow('', null),
    guardianRelation: Joi.string().trim().valid('Father', 'Mother', 'Grandfather', 'Grandmother', 'Uncle', 'Aunt', 'Other').allow('', null),
    emergencyContactName: Joi.string().trim().max(200).allow('', null),
    emergencyContactPhone: Joi.string().trim().pattern(/^[\+]?[1-9][\d]{0,15}$/).allow('', null),
    emergencyContactRelation: Joi.string().trim().valid('Parent', 'Guardian', 'Relative', 'Friend', 'Other').allow('', null),
    medicalConditions: Joi.string().trim().max(500).allow('', null),
    allergies: Joi.string().trim().max(500).allow('', null),
    height: Joi.number().positive().max(300).allow('', null), // in cm
    weight: Joi.number().positive().max(500).allow('', null), // in kg
    transportMode: Joi.string().trim().valid('School Bus', 'Private Vehicle', 'Walking', 'Public Transport').allow('', null),
    hostelRequired: Joi.string().trim().valid('Yes', 'No').allow('', null),
    scholarshipApplied: Joi.string().trim().valid('Yes', 'No').allow('', null),
    documentsSubmitted: Joi.string().trim().valid('Complete', 'Partial', 'Pending').allow('', null)
});

/**
 * Validation schema for student update
 */
const studentUpdateSchema = Joi.object({
    firstName: Joi.string()
        .trim()
        .min(1)
        .max(100)
        .messages({
            'string.empty': 'First name cannot be empty',
            'string.min': 'First name must be at least 1 character long',
            'string.max': 'First name cannot exceed 100 characters'
        }),
    
    middleName: Joi.string()
        .trim()
        .max(100)
        .allow('', null)
        .messages({
            'string.max': 'Middle name cannot exceed 100 characters'
        }),
    
    lastName: Joi.string()
        .trim()
        .min(1)
        .max(100)
        .messages({
            'string.empty': 'Last name cannot be empty',
            'string.min': 'Last name must be at least 1 character long',
            'string.max': 'Last name cannot exceed 100 characters'
        }),
    
    dateOfBirth: Joi.date()
        .max('now')
        .min('1900-01-01')
        .messages({
            'date.base': 'Invalid date of birth',
            'date.max': 'Date of birth cannot be in the future',
            'date.min': 'Date of birth cannot be before 1900'
        }),
    
    gender: Joi.string()
        .trim()
        .valid('Male', 'Female', 'Other')
        .allow('', null)
        .messages({
            'any.only': 'Gender must be Male, Female, or Other'
        }),
    
    bloodGroup: Joi.string()
        .trim()
        .valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')
        .allow('', null)
        .messages({
            'any.only': 'Blood group must be A+, A-, B+, B-, AB+, AB-, O+, or O-'
        }),
    
    nationality: Joi.string()
        .trim()
        .max(50)
        .allow('', null)
        .messages({
            'string.max': 'Nationality cannot exceed 50 characters'
        }),
    
    studentPhotoUrl: Joi.string()
        .trim()
        .uri()
        .allow('', null)
        .messages({
            'string.uri': 'Student photo URL must be a valid URL'
        })
}).min(1).messages({
    'object.min': 'At least one field must be provided for update'
});

/**
 * Validation schema for student enrollment update
 */
const studentEnrollmentUpdateSchema = Joi.object({
    academicYear: Joi.string()
        .trim()
        .pattern(/^\d{4}-\d{4}$/)
        .messages({
            'string.pattern.base': 'Academic year must be in format YYYY-YYYY (e.g., 2024-2025)'
        }),
    
    class: Joi.string()
        .trim()
        .min(1)
        .max(20)
        .messages({
            'string.empty': 'Class cannot be empty',
            'string.min': 'Class must be at least 1 character long',
            'string.max': 'Class cannot exceed 20 characters'
        }),
    
    section: Joi.string()
        .trim()
        .min(1)
        .max(20)
        .messages({
            'string.empty': 'Section cannot be empty',
            'string.min': 'Section must be at least 1 character long',
            'string.max': 'Section cannot exceed 20 characters'
        }),
    
    rollNumber: Joi.string()
        .trim()
        .min(1)
        .max(20)
        .messages({
            'string.empty': 'Roll number cannot be empty',
            'string.min': 'Roll number must be at least 1 character long',
            'string.max': 'Roll number cannot exceed 20 characters'
        }),
    
    status: Joi.string()
        .trim()
        .valid('active', 'promoted', 'repeated', 'transferred', 'inactive')
        .messages({
            'any.only': 'Status must be active, promoted, repeated, transferred, or inactive'
        })
}).min(1).messages({
    'object.min': 'At least one field must be provided for update'
});

// ==================== MIDDLEWARE FUNCTIONS ====================

/**
 * Middleware to validate student registration data
 */
const validateStudentRegistration = (req, res, next) => {
    const { error } = studentRegistrationSchema.validate(req.body, { 
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
 * Middleware to validate student update data
 */
const validateStudentUpdate = (req, res, next) => {
    const { error } = studentUpdateSchema.validate(req.body, { 
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
 * Middleware to validate student enrollment update data
 */
const validateStudentEnrollmentUpdate = (req, res, next) => {
    const { error } = studentEnrollmentUpdateSchema.validate(req.body, { 
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
    studentRegistrationSchema,
    studentUpdateSchema,
    studentEnrollmentUpdateSchema,
    validateStudentRegistration,
    validateStudentUpdate,
    validateStudentEnrollmentUpdate
};