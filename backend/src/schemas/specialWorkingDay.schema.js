const Joi = require('joi');

const userContext = Joi.object({
  tenantId: Joi.string().trim().min(1).required(),
  campusId: Joi.string().trim().uuid().required(),
  username: Joi.string().trim().min(1).optional(),
}).unknown(true);

const specialWorkingDayBody = Joi.object({
  work_date: Joi.date().iso().required(),
  description: Joi.string().trim().min(1).required(),
  academic_year_ids: Joi.array().items(Joi.number().integer().min(1)).min(1).required()
}).unknown(true);

const updateWorkingDayBody = Joi.object({
  academic_year_ids: Joi.array().items(Joi.number().integer().min(1)).min(1).optional()
}).unknown(true);

module.exports = {
  create: {
    user: userContext,
    body: specialWorkingDayBody
  },
  getAll: {
    user: userContext,
    query: Joi.object({
      startDate: Joi.date().iso().optional(),
      endDate: Joi.date().iso().optional(),
      studentUsername: Joi.string().trim().optional()
    })
  },
  update: {
    user: userContext,
    params: Joi.object({
      id: Joi.number().integer().min(1).required()
    }),
    body: updateWorkingDayBody
  },
  delete: {
    user: userContext,
    params: Joi.object({
      id: Joi.number().integer().min(1).required()
    })
  }
};
