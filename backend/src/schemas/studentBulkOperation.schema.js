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

const exportStudentsBody = Joi.object({
    usernames: Joi.array().items(Joi.string()).min(1).required().messages({
        'array.min': 'No students selected for export',
        'any.required': 'No students selected for export'
    })
});

const uploadStudentsBody = Joi.object({
    campusId: Joi.alternatives().try(Joi.number().integer(), Joi.string()).required().messages({
        'any.required': 'Campus ID is required'
    })
});

const importJobParams = Joi.object({
    jobId: Joi.string().uuid().required()
});


module.exports = {
    exportStudents: {
        user: userContext,
        body: exportStudentsBody
    },
    uploadStudents: {
        user: userContext,
        file: fileSchema,
        body: uploadStudentsBody
    },
    importJobStatus: {
        user: userContext,
        params: importJobParams
    },
    importJobResult: {
        user: userContext,
        params: importJobParams
    },
    updateStudents: {
        user: userContext,
        file: fileSchema
    }
};
