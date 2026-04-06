const Joi = require('joi');

const userContext = Joi.object({
  tenantId: Joi.string().trim().min(1).invalid('undefined').required(),
  campusId: Joi.string().trim().uuid().invalid('undefined').required()
}).unknown(true);

const params = {
  sectionId: Joi.number().integer().min(1).required()
};

const createSectionBody = Joi.object({
  section_name: Joi.string().trim().min(1).required(),
  class_id: Joi.number().integer().min(1).required(),
  academic_year_id: Joi.number().integer().min(1).required(),
  room_id: Joi.number().integer().min(1).allow(null).optional(),
  primary_teacher_user_id: Joi.number().integer().min(1).allow(null).optional(),
  student_monitor_user_id: Joi.number().integer().min(1).allow(null).optional(),
  capacity: Joi.number().integer().min(1).allow(null).optional()
}).unknown(true);

const updateSectionBody = Joi.object({
  section_name: Joi.string().trim().min(1).optional(),
  class_id: Joi.number().integer().min(1).optional(),
  academic_year_id: Joi.number().integer().min(1).optional(),
  room_id: Joi.number().integer().min(1).allow(null, '').optional(),
  primary_teacher_user_id: Joi.number().integer().min(1).allow(null, '').optional(),
  student_monitor_user_id: Joi.number().integer().min(1).allow(null, '').optional(),
  capacity: Joi.number().integer().min(1).allow(null, '').optional()
}).min(1).unknown(true);

module.exports = {
  getAllSections: {
    user: userContext,
    query: Joi.object({
      page: Joi.number().integer().min(1).optional(),
      limit: Joi.number().integer().min(1).max(100).optional(),
      search: Joi.string().trim().allow('').optional(),
      academic_year_id: Joi.number().integer().optional(),
      class_id: Joi.number().integer().optional()
    })
  },
  createSection: {
    user: userContext,
    body: createSectionBody
  },
  getSectionById: {
    user: userContext,
    params: Joi.object({
      sectionId: params.sectionId
    })
  },
  getSectionSubjects: {
    user: userContext,
    params: Joi.object({
      sectionId: params.sectionId
    })
  },
  updateSection: {
    user: userContext,
    params: Joi.object({
      sectionId: params.sectionId
    }),
    body: updateSectionBody
  },
  deleteSection: {
    user: userContext,
    params: Joi.object({
      sectionId: params.sectionId
    })
  },
  getSectionStatistics: {
    user: userContext
  },
  getFilterOptions: {
    user: userContext
  }
};
