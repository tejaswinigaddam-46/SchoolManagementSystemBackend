const Joi = require('joi');

const userContext = Joi.object({
  tenantId: Joi.string().trim().min(1).invalid('undefined').required(),
  campusId: Joi.string().trim().uuid().invalid('undefined').required()
}).unknown(true);

const params = {
  id: Joi.string().trim().uuid().min(1).required(),
  examId: Joi.string().trim().uuid().min(1).required(),
  studentId: Joi.string().trim().min(3).required()
};

const createBody = Joi.object({
  exam_id: Joi.string().trim().uuid().min(1).required(),
  student_username: Joi.string().trim().min(3).required(),
  attendance_status: Joi.string().trim().valid('Present','Absent').optional(),
  obtained_score: Joi.number().min(0).optional(),
  notes: Joi.string().trim().optional()
}).required();

const bulkBody = Joi.object({
  results: Joi.array().items(Joi.object({
    exam_id: Joi.string().trim().uuid().min(1).required(),
    student_username: Joi.string().trim().min(3).required(),
    attendance_status: Joi.string().trim().valid('Present','Absent').optional(),
    obtained_score: Joi.number().min(0).optional(),
    notes: Joi.string().trim().optional()
  })).min(1).required()
});

const updateBody = Joi.object({
  attendance_status: Joi.string().trim().valid('Present','Absent').optional(),
  obtained_score: Joi.number().min(0).optional(),
  is_passed: Joi.boolean().optional(),
  notes: Joi.string().trim().optional()
}).min(1);

module.exports = {
  createExamResult: {
    user: userContext,
    body: createBody
  },
  bulkCreateExamResults: {
    user: userContext,
    body: bulkBody
  },
  getExamResultById: {
    user: userContext,
    params: Joi.object({ id: params.id })
  },
  updateExamResult: {
    user: userContext,
    params: Joi.object({ id: params.id }),
    body: updateBody
  },
  deleteExamResult: {
    user: userContext,
    params: Joi.object({ id: params.id })
  },
  getExamResultsByExamId: {
    user: userContext,
    params: Joi.object({ examId: params.examId })
  },
  getExamResultsByStudentId: {
    user: userContext,
    params: Joi.object({ studentId: params.studentId })
  }
};
