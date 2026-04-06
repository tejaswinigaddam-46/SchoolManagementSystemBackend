const Joi = require('joi');

const userContext = Joi.object({
  tenantId: Joi.string().trim().min(1).invalid('undefined').required(),
  campusId: Joi.string().trim().uuid().invalid('undefined').required()
}).unknown(true);

const params = {
  campusId: Joi.string().trim().uuid().required(),
  subjectId: Joi.number().integer().min(1).required()
};

const createSubjectBody = Joi.object({
  subject_name: Joi.string().trim().min(1).required(),
  subject_code: Joi.string().trim().allow(null, '').optional(),
  category: Joi.string().valid('Academic', 'Co-curricular', 'Sport').required(),
  curriculum_id: Joi.number().integer().min(1).required()
}).unknown(true);

const updateSubjectBody = Joi.object({
  subject_name: Joi.string().trim().min(1).optional(),
  subject_code: Joi.string().trim().allow(null, '').optional(),
  category: Joi.string().valid('Academic', 'Co-curricular', 'Sport').optional(),
  curriculum_id: Joi.number().integer().min(1).optional()
}).min(1).unknown(true);

module.exports = {
  getAllSubjects: {
    user: userContext,
    params: Joi.object({
      campusId: params.campusId
    }),
    query: Joi.object({
      category: Joi.string().valid('Academic', 'Co-curricular', 'Sport').optional(),
      search: Joi.string().trim().allow('').optional()
    })
  },
  getSubjectById: {
    user: userContext,
    params: Joi.object({
      campusId: params.campusId,
      subjectId: params.subjectId
    })
  },
  createSubject: {
    user: userContext,
    params: Joi.object({
      campusId: params.campusId
    }),
    body: createSubjectBody
  },
  updateSubject: {
    user: userContext,
    params: Joi.object({
      campusId: params.campusId,
      subjectId: params.subjectId
    }),
    body: updateSubjectBody
  },
  deleteSubject: {
    user: userContext,
    params: Joi.object({
      campusId: params.campusId,
      subjectId: params.subjectId
    })
  }
};
