// /* UNUSED CODE - Validation middleware not being used anywhere in the codebase
// // These Joi validation utilities are defined but never imported or used in routes/controllers

// const Joi = require('joi');
// const { AppError } = require('./errorHandler');

// /**
//  * Joi validation middleware factory
// const validate = (schema, property = 'body') => {
//   return (req, res, next) => {
//     const { error, value } = schema.validate(req[property], {
//       abortEarly: false, // Include all errors
//       allowUnknown: true, // Allow unknown keys
//       stripUnknown: true // Remove unknown keys
//     });

//     if (error) {
//       const errorMessage = error.details
//         .map(detail => detail.message.replace(/"/g, ''))
//         .join(', ');
      
//       return next(new AppError(`Validation error: ${errorMessage}`, 400));
//     }

//     // Replace the property with the validated value
//     req[property] = value;
//     next();
//   };
// };

// /**
//  * Common validation schemas
//  */
// const commonSchemas = {
//   objectId: Joi.string().trim().min(1).required(),
  
//   pagination: Joi.object({
//     page: Joi.number().integer().min(1).default(1),
//     limit: Joi.number().integer().min(1).max(100).default(10),
//     sortBy: Joi.string().trim(),
//     sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
//     search: Joi.string().trim().allow('')
//   }),

//   tenantId: Joi.string().trim().min(1).required(),
  
//   email: Joi.string().email().lowercase().trim().required(),
  
//   phone: Joi.string().pattern(/^[+]?[\d\s\-\(\)]+$/).min(10).max(15),
  
//   dateRange: Joi.object({
//     startDate: Joi.date().iso(),
//     endDate: Joi.date().iso().min(Joi.ref('startDate'))
//   }),

//   status: Joi.string().valid('active', 'inactive', 'pending', 'suspended').default('active')
// };

// /**
//  * Request sanitization middleware
//  */
// const sanitizeInput = (req, res, next) => {
//   // Sanitize string inputs (basic XSS prevention)
//   const sanitizeString = (str) => {
//     if (typeof str !== 'string') return str;
    
//     return str
//       .replace(/[<>]/g, '') // Remove < and >
//       .trim(); // Remove whitespace
//   };

//   const sanitizeObject = (obj) => {
//     if (obj === null || obj === undefined) return obj;
    
//     if (Array.isArray(obj)) {
//       return obj.map(sanitizeObject);
//     }
    
//     if (typeof obj === 'object') {
//       const sanitized = {};
//       Object.keys(obj).forEach(key => {
//         sanitized[key] = sanitizeObject(obj[key]);
//       });
//       return sanitized;
//     }
    
//     if (typeof obj === 'string') {
//       return sanitizeString(obj);
//     }
    
//     return obj;
//   };

//   // Sanitize request body, query, and params
//   if (req.body) req.body = sanitizeObject(req.body);
//   if (req.query) req.query = sanitizeObject(req.query);
//   if (req.params) req.params = sanitizeObject(req.params);

//   next();
// };

// /**
//  * File upload validation
//  */
// const validateFileUpload = (options = {}) => {
//   const {
//     maxSize = 5 * 1024 * 1024, // 5MB default
//     allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
//     required = false
//   } = options;

//   return (req, res, next) => {
//     if (!req.file && required) {
//       return next(new AppError('File is required', 400));
//     }

//     if (req.file) {
//       // Check file size
//       if (req.file.size > maxSize) {
//         return next(new AppError(`File too large. Maximum size is ${maxSize / 1024 / 1024}MB`, 400));
//       }

//       // Check file type
//       if (!allowedTypes.includes(req.file.mimetype)) {
//         return next(new AppError(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`, 400));
//       }
//     }

//     next();
//   };
// };

// module.exports = {
//   validate,
//   commonSchemas,
//   sanitizeInput,
//   validateFileUpload
// };
// */
