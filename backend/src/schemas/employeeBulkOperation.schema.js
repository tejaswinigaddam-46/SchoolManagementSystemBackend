const Joi = require('joi');

const userContext = Joi.object({
    tenantId: Joi.string().trim().min(1).invalid('undefined').required(),
    campusId: Joi.string().trim().uuid().invalid('undefined').required(),
    role: Joi.string().optional()
}).unknown(true);

const fileSchema = Joi.object({
    path: Joi.string().required().messages({
        'any.required': 'No file uploaded or file path missing'
    })
}).unknown(true);

const exportEmployeesBody = Joi.object({
    usernames: Joi.array().items(Joi.string()).min(1).required().messages({
        'array.min': 'No employees selected for export',
        'any.required': 'No employees selected for export'
    })
});

const uploadEmployeesBody = Joi.object({
    campusId: Joi.alternatives().try(Joi.number().integer(), Joi.string()).optional().allow(null, '')
});


module.exports = {
    exportEmployees: {
        user: userContext,
        body: exportEmployeesBody
    },
    uploadEmployees: {
        user: userContext,
        file: fileSchema,
        body: uploadEmployeesBody
    },
    updateEmployees: {
        user: userContext,
        file: fileSchema
    }
};
