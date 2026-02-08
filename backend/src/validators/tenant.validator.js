// /* UNUSED CODE - Tenant validators not being used anywhere in the codebase
// // These Joi validation schemas are defined but never imported or used in routes/controllers

// const Joi = require('joi');
// const { body, param } = require('express-validator')

// // ==================== TENANT VALIDATION SCHEMAS ====================

// /**
//  * Validation schema for tenant registration
//  */
// const registerTenantSchema = Joi.object({
//     tenantName: Joi.string()
//         .trim()
//         .min(2)
//         .max(255)
//         .required()
//         .messages({
//             'string.empty': 'Tenant name is required',
//             'string.min': 'Tenant name must be at least 2 characters long',
//             'string.max': 'Tenant name must not exceed 255 characters',
//             'any.required': 'Tenant name is required'
//         }),
    
//     subdomain: Joi.string()
//         .trim()
//         .lowercase()
//         .min(2)
//         .max(63)
//         .pattern(/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/)
//         .required()
//         .messages({
//             'string.empty': 'Subdomain is required',
//             'string.min': 'Subdomain must be at least 2 characters long',
//             'string.max': 'Subdomain must not exceed 63 characters',
//             'string.pattern.base': 'Subdomain must contain only lowercase letters, numbers, and hyphens',
//             'any.required': 'Subdomain is required'
//         }),
    
//     yearFounded: Joi.number()
//         .integer()
//         .min(1800)
//         .max(new Date().getFullYear())
//         .optional()
//         .allow('')
//         .messages({
//             'number.base': 'Year founded must be a number',
//             'number.integer': 'Year founded must be a whole number',
//             'number.min': 'Year founded must be 1800 or later',
//             'number.max': `Year founded cannot be later than ${new Date().getFullYear()}`
//         }),
    
//     logoUrl: Joi.string()
//         .trim()
//         .uri()
//         .optional()
//         .allow('')
//         .messages({
//             'string.uri': 'Logo URL must be a valid URL'
//         }),
    
//     websiteUrl: Joi.string()
//         .trim()
//         .uri()
//         .optional()
//         .allow('')
//         .messages({
//             'string.uri': 'Website URL must be a valid URL'
//         }),
    
//     adminName: Joi.string()
//         .trim()
//         .min(2)
//         .max(255)
//         .required()
//         .messages({
//             'string.empty': 'Admin name is required',
//             'string.min': 'Admin name must be at least 2 characters long',
//             'string.max': 'Admin name must not exceed 255 characters',
//             'any.required': 'Admin name is required'
//         }),
    
//     adminEmail: Joi.string()
//         .trim()
//         .lowercase()
//         .email()
//         .max(255)
//         .required()
//         .messages({
//             'string.empty': 'Admin email is required',
//             'string.email': 'Admin email must be a valid email address',
//             'string.max': 'Admin email must not exceed 255 characters',
//             'any.required': 'Admin email is required'
//         }),
    
//     adminPassword: Joi.string()
//         .min(8)
//         .max(128)
//         .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
//         .required()
//         .messages({
//             'string.empty': 'Admin password is required',
//             'string.min': 'Admin password must be at least 8 characters long',
//             'string.max': 'Admin password must not exceed 128 characters',
//             'string.pattern.base': 'Admin password must contain at least one lowercase letter, one uppercase letter, and one number',
//             'any.required': 'Admin password is required'
//         })
// });

// /**
//  * Validation schema for updating tenant information
//  */
// const updateTenantSchema = Joi.object({
//     tenant_name: Joi.string()
//         .trim()
//         .min(2)
//         .max(255)
//         .optional()
//         .messages({
//             'string.empty': 'Tenant name cannot be empty',
//             'string.min': 'Tenant name must be at least 2 characters long',
//             'string.max': 'Tenant name must not exceed 255 characters'
//         }),
    
//     year_founded: Joi.number()
//         .integer()
//         .min(1800)
//         .max(new Date().getFullYear())
//         .optional()
//         .messages({
//             'number.base': 'Year founded must be a number',
//             'number.integer': 'Year founded must be a whole number',
//             'number.min': 'Year founded must be 1800 or later',
//             'number.max': `Year founded cannot be later than ${new Date().getFullYear()}`
//         }),
    
//     logo_url: Joi.string()
//         .trim()
//         .uri()
//         .optional()
//         .allow('')
//         .messages({
//             'string.uri': 'Logo URL must be a valid URL'
//         }),
    
//     website: Joi.string()
//         .trim()
//         .pattern(/^https?:\/\/.+/)
//         .optional()
//         .allow('')
//         .messages({
//             'string.pattern.base': 'Website must be a valid URL starting with http:// or https://'
//         })
// }).min(1).messages({
//     'object.min': 'At least one field must be provided for update'
// });

// /**
//  * Validation schema for subdomain parameter
//  */
// const subdomainParamSchema = Joi.object({
//     subdomain: Joi.string()
//         .trim()
//         .lowercase()
//         .min(2)
//         .max(63)
//         .pattern(/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/)
//         .required()
//         .messages({
//             'string.empty': 'Subdomain parameter is required',
//             'string.min': 'Subdomain must be at least 2 characters long',
//             'string.max': 'Subdomain must not exceed 63 characters',
//             'string.pattern.base': 'Subdomain must contain only lowercase letters, numbers, and hyphens',
//             'any.required': 'Subdomain parameter is required'
//         })
// });

// /**
//  * Validation schema for email parameter
//  */
// const emailParamSchema = Joi.object({
//     email: Joi.string()
//         .trim()
//         .lowercase()
//         .email()
//         .max(255)
//         .required()
//         .messages({
//             'string.empty': 'Email parameter is required',
//             'string.email': 'Email must be a valid email address',
//             'string.max': 'Email must not exceed 255 characters',
//             'any.required': 'Email parameter is required'
//         })
// });

// /**
//  * Validation schema for tenant ID parameter
//  */
// const tenantIdParamSchema = Joi.object({
//     tenantId: Joi.string()
//         .uuid()
//         .required()
//         .messages({
//             'string.empty': 'Tenant ID parameter is required',
//             'string.uuid': 'Tenant ID must be a valid UUID',
//             'any.required': 'Tenant ID parameter is required'
//         })
// });

// /**
//  * Tenant Registration Validator
//  * Validates tenant registration data
//  */
// const tenantRegistrationValidator = [
//   body('tenantName')
//     .notEmpty()
//     .withMessage('School name is required')
//     .isLength({ min: 2, max: 100 })
//     .withMessage('School name must be between 2 and 100 characters')
//     .trim(),

//   body('subdomain')
//     .notEmpty()
//     .withMessage('Subdomain is required')
//     .isLength({ min: 2, max: 20 })
//     .withMessage('Subdomain must be between 2 and 20 characters')
//     .matches(/^[a-z0-9-]+$/)
//     .withMessage('Subdomain can only contain lowercase letters, numbers, and hyphens')
//     .custom((value) => {
//       const reservedSubdomains = ['www', 'api', 'admin', 'mail', 'ftp', 'app', 'dashboard']
//       if (reservedSubdomains.includes(value)) {
//         throw new Error('This subdomain is reserved')
//       }
//       return true
//     })
//     .trim(),

//   body('yearFounded')
//     .optional({ checkFalsy: true })
//     .isInt({ min: 1800, max: new Date().getFullYear() })
//     .withMessage(`Year founded must be between 1800 and ${new Date().getFullYear()}`)
//     .toInt(),

//   body('logoUrl')
//     .optional({ checkFalsy: true })
//     .isURL()
//     .withMessage('Logo URL must be a valid URL')
//     .trim(),

//   body('websiteUrl')
//     .optional({ checkFalsy: true })
//     .isURL()
//     .withMessage('Website URL must be a valid URL')
//     .trim(),

//   body('adminName')
//     .notEmpty()
//     .withMessage('Administrator name is required')
//     .isLength({ min: 2, max: 50 })
//     .withMessage('Administrator name must be between 2 and 50 characters')
//     .trim(),

//   body('adminEmail')
//     .isEmail()
//     .withMessage('Valid email address is required')
//     .normalizeEmail()
//     .isLength({ max: 100 })
//     .withMessage('Email address is too long'),

//   body('adminPassword')
//     .isLength({ min: 8 })
//     .withMessage('Password must be at least 8 characters long')
//     .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
//     .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
// ]

// /**
//  * Subdomain validation
//  */
// const validateSubdomain = [
//   param('subdomain')
//     .notEmpty()
//     .withMessage('Subdomain is required')
//     .matches(/^[a-z0-9-]+$/)
//     .withMessage('Invalid subdomain format')
//     .isLength({ min: 2, max: 20 })
//     .withMessage('Subdomain must be between 2 and 20 characters')
// ]

// /**
//  * Email validation
//  */
// const validateEmail = [
//   param('email')
//     .isEmail()
//     .withMessage('Valid email address is required')
//     .normalizeEmail()
// ]

// module.exports = {
//     registerTenantSchema,
//     updateTenantSchema,
//     subdomainParamSchema,
//     emailParamSchema,
//     tenantIdParamSchema,
//     tenantRegistrationValidator,
//     validateSubdomain,
//     validateEmail
// };
// */