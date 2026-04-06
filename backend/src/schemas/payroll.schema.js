const Joi = require('joi');

const userContext = Joi.object({
  tenantId: Joi.string().trim().min(1).required(),
  campusId: Joi.string().trim().uuid().required(),
  username: Joi.string().required(),
  role: Joi.string().required()
}).unknown(true);

const tenatContext = Joi.object({
  tenantId: Joi.string().trim().min(1).required(),
  campusId: Joi.string().trim().uuid().required(),
}).unknown(true);

const reportBody = Joi.object({
  roles: Joi.array().items(Joi.string().trim()).optional(),
  academicYear: Joi.string().trim().allow(null, '').optional(),
  fromDate: Joi.date().iso().required(),
  toDate: Joi.date().iso().required()
}).unknown(true);

module.exports = {
  getPayrollReport: {
    user: tenatContext,
    body: reportBody
  },
  getMyPayrollReport: {
    user: userContext,
    body: reportBody.fork(['roles'], (schema) => schema.forbidden())
  }
};
