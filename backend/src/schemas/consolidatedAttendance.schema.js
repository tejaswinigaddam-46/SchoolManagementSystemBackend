const Joi = require('joi');

const userContext = Joi.object({
    tenantId: Joi.string().trim().min(1).invalid('undefined').required(),
    campusId: Joi.string().trim().uuid().invalid('undefined').required()
}).unknown(true);

const getConsolidatedAttendanceBody = Joi.object({
    roles: Joi.array().items(Joi.string()).optional(),
    academicYear: Joi.string().optional().allow(null, ''),
    fromDate: Joi.date().iso().required().messages({
        'any.required': 'fromDate is required',
        'date.base': 'fromDate must be a valid date'
    }),
    toDate: Joi.date().iso().required().messages({
        'any.required': 'toDate is required',
        'date.base': 'toDate must be a valid date'
    }),
    classId: Joi.alternatives().try(Joi.number().integer(), Joi.string()).optional().allow(null, ''),
    sectionId: Joi.alternatives().try(Joi.number().integer(), Joi.string()).optional().allow(null, ''),
    limit: Joi.number().integer().min(1).max(50000).optional(),
    offset: Joi.number().integer().min(0).optional()
});

module.exports = {
    getConsolidatedAttendance: {
        user: userContext,
        body: getConsolidatedAttendanceBody
    }
};
