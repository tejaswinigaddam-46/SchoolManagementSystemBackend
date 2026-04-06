const Joi = require('joi');

const userContext = Joi.object({
  tenantId: Joi.string().trim().min(1).required(),
  campusId: Joi.string().trim().uuid().required()
}).unknown(true);

const weekendPolicyBody = Joi.object({
  academic_year_id: Joi.number().integer().min(1).required(),
  is_sunday_holiday: Joi.boolean().default(true),
  is_saturday_holiday: Joi.boolean().default(true),
  is_saturday_half_day: Joi.boolean().default(false)
}).custom((value, helpers) => {
  if (value.is_saturday_holiday && value.is_saturday_half_day) {
    return helpers.message('Saturday cannot be both a full holiday and a half day');
  }
  return value;
}).unknown(true);

module.exports = {
  upsertPolicy: {
    user: userContext,
    params: Joi.object({
      campusId: Joi.string().trim().uuid().required()
    }),
    body: weekendPolicyBody
  },
  getAllPolicies: {
    user: userContext,
    params: Joi.object({
      campusId: Joi.string().trim().uuid().required()
    })
  },
  getPolicy: {
    user: userContext,
    params: Joi.object({
      campusId: Joi.string().trim().uuid().required(),
      id: Joi.number().integer().min(1).required()
    })
  },
  deletePolicy: {
    user: userContext,
    params: Joi.object({
      campusId: Joi.string().trim().uuid().required(),
      id: Joi.number().integer().min(1).required()
    })
  }
};
