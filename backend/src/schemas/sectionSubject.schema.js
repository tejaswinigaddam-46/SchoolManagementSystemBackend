const Joi = require('joi');

const userContext = Joi.object({
  tenantId: Joi.string().trim().min(1).invalid('undefined').required(),
  campusId: Joi.string().trim().uuid().invalid('undefined').required()
}).unknown(true);

const assignmentSchema = Joi.object({
  section_id: Joi.number().integer().min(1).required(),
  subject_id: Joi.number().integer().min(1).required(),
  teacher_user_id: Joi.number().integer().min(1).allow(null).optional()
});

module.exports = {
  bulkAssign: {
    user: userContext,
    body: Joi.object({
      assignments: Joi.array().items(assignmentSchema).min(1).required()
    })
  },
  listBySections: {
    user: userContext,
    query: Joi.object({
      section_ids: Joi.string().trim().required()
    })
  },
  unassign: {
    user: userContext,
    body: Joi.object({
      section_id: Joi.number().integer().min(1).required(),
      subject_ids: Joi.array().items(Joi.number().integer().min(1)).min(1).required()
    })
  }
};
