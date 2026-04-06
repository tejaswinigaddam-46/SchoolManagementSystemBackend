const Joi = require('joi');

/**
 * A generic validation middleware that uses Joi to validate request data.
 * @param {object} schemas - An object containing Joi schemas for 'body', 'query', and/or 'params'.
 * @returns {function} Express middleware function.
 */
const validate = (schemas) => (req, res, next) => {
  const validationErrors = [];

  // Validate params, query, body, user, and tenant
  ['params', 'query', 'body', 'user', 'tenant', 'tenantId'].forEach(key => {
    if (schemas[key]) {
      const { error } = schemas[key].validate(req[key], { abortEarly: false });
      if (error) {
        validationErrors.push(...error.details.map(d => ({ ...d, source: key })));
      }
    }
  });

  if (validationErrors.length > 0) {
    const errorResponse = validationErrors.map(({ message, path, source }) => ({ 
      message: message.replace(/\"/g, "'"), 
      field: path.join('.'),
      source
    }));
    return res.status(400).json({ success: false, message: "Validation failed", errors: errorResponse });
  }

  next();
};

module.exports = validate;
