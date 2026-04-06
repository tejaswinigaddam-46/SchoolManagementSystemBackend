const Joi = require('joi');

const tenantHeader = Joi.object({
  tenantId: Joi.string().trim().min(1).optional()
}).unknown(true);

module.exports = {
  login: {
    tenantId: Joi.string().trim().min(1).required(),
    body: Joi.object({
      username: Joi.string().trim().min(3).required(),
      password: Joi.string().min(6).required()
    })
  },
  refresh: {
    // No body; refresh token comes from cookies. Keep empty.
  },
  resolveTenant: {
    body: Joi.object({
      mobileNumber: Joi.string().trim().pattern(/^\+?[1-9]\d{9,14}$/).required()
    })
  },
  changePassword: {
    user: Joi.object({
      username: Joi.string().trim().min(3).required(),
      tenantId: Joi.string().trim().min(1).required()
    }).unknown(true),
    body: Joi.object({
      currentPassword: Joi.string().min(6).required(),
      newPassword: Joi.string().min(8).required()
    })
  },
  verifyToken: {
    body: Joi.object({
      token: Joi.string().trim().optional()
    }).unknown(true)
  }
};

