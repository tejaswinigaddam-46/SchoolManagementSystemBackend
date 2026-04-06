const Joi = require('joi');

const userContext = Joi.object({
  tenantId: Joi.string().trim().min(1).required(),
  campusId: Joi.string().trim().uuid().required(),
  role: Joi.string().required(),
  username: Joi.string().required()
}).unknown(true);

const holidayBody = Joi.object({
  holiday_name: Joi.string().trim().min(1).required(),
  duration_category: Joi.string().valid('full_day', 'half_day', 'Full Day', 'Half Day').required(),
  start_date: Joi.date().iso().required(),
  end_date: Joi.date().iso().allow(null).optional(),
  holiday_type: Joi.string().trim().allow(null, '').optional(),
  is_paid: Joi.boolean().optional(),
  academic_year_ids: Joi.array().items(Joi.number().integer().min(1)).allow(null).optional()
}).unknown(true);

module.exports = {
  checkDate: {
    user: userContext,
    params: Joi.object({
      campusId: Joi.string().trim().uuid().required()
    }),
    query: Joi.object({
      date: Joi.date().iso().required(),
      academicYearId: Joi.number().integer().min(1).required()
    })
  },
  getAllHolidays: {
    user: userContext,
    params: Joi.object({
      campusId: Joi.string().trim().uuid().required()
    }),
    query: Joi.object({
      startDate: Joi.date().iso().optional(),
      endDate: Joi.date().iso().optional(),
      username: Joi.string().trim().min(1).optional()
    }).unknown(true)
  },
  getCalculatedHolidays: {
    user: userContext,
    params: Joi.object({
      campusId: Joi.string().trim().uuid().required()
    }),
    query: Joi.object({
      startDate: Joi.date().iso().required(),
      endDate: Joi.date().iso().required(),
      academicYearId: Joi.number().integer().min(1).optional()
    })
  },
  createHoliday: {
    user: userContext,
    params: Joi.object({
      campusId: Joi.string().trim().uuid().required()
    }),
    body: holidayBody
  },
  updateHoliday: {
    user: userContext,
    params: Joi.object({
      campusId: Joi.string().trim().uuid().required(),
      id: Joi.number().integer().min(1).required()
    }),
    body: holidayBody.fork(['holiday_name', 'duration_category', 'start_date'], (schema) => schema.optional())
  },
  deleteHoliday: {
    user: userContext,
    params: Joi.object({
      campusId: Joi.string().trim().uuid().required(),
      id: Joi.number().integer().min(1).required()
    })
  }
};
