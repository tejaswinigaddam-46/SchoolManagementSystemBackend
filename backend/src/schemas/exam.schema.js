const Joi = require('joi');

const userContext = Joi.object({
  tenantId: Joi.string().trim().min(1).invalid('undefined').required(),
  campusId: Joi.string().trim().uuid().invalid('undefined').required()
}).unknown(true);

const campusContext = Joi.object({
  campusId: Joi.string().trim().uuid().invalid('undefined').required()
}).unknown(true);

const params = {
  id: Joi.string().trim().uuid().min(1).required()
};

const createExamBody = Joi.object({
  event_id: Joi.string().trim().uuid().min(1).required(),
  subject_name: Joi.string().trim().min(1).required(),
  exam_date: Joi.string().trim().min(1).required(),
  total_score: Joi.number().min(0).optional()
}).unknown(true);

const updateExamBody = Joi.object({
  event_id: Joi.string().trim().uuid().min(1).optional(),
  subject_name: Joi.string().trim().min(1).optional(),
  exam_date: Joi.string().trim().min(1).optional(),
  total_score: Joi.number().min(0).optional()
}).min(1).unknown(true);

module.exports = {
  createExam: {
    user: userContext,
    body: createExamBody
  },
  getExams: {
    user: campusContext,
    query: Joi.object({
      academic_year_id: Joi.number().integer().min(1).optional(),
      start_date: Joi.string().trim().optional(),
      end_date: Joi.string().trim().optional()
    }).unknown(true)
  },
  getExamById: {
    params: Joi.object({ id: params.id })
  },
  updateExam: {
    params: Joi.object({ id: params.id }),
    body: updateExamBody
  },
  deleteExam: {
    params: Joi.object({ id: params.id })
  }
};
