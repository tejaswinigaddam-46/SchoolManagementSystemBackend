const Joi = require('joi');

const userContext = Joi.object({
  tenantId: Joi.string().trim().min(1).invalid('undefined').required(),
  campusId: Joi.string().trim().uuid().invalid('undefined').required()
}).unknown(true);

const params = {
  campusId: Joi.string().trim().uuid().required(),
  classId: Joi.number().integer().min(1).required()
};

const createClassBody = Joi.object({
  className: Joi.string().trim().min(1).max(50).required(),
  classLevel: Joi.number().integer().min(1).max(12).required()
}).unknown(true);

const updateClassBody = Joi.object({
  className: Joi.string().trim().min(1).max(50).optional(),
  classLevel: Joi.number().integer().min(1).max(12).optional()
}).min(1).unknown(true);

module.exports = {
  getAllClasses: {
    user: userContext,
    query: Joi.object({
      page: Joi.number().integer().min(1).optional(),
      limit: Joi.number().integer().min(1).max(100).optional(),
      search: Joi.string().trim().allow('').optional()
    })
  },
  createClass: {
    user: userContext,
    body: createClassBody
  },
  getClassStatistics: {
    user: userContext
  },
  getClassesByCampus: {
    user: userContext,
    params: Joi.object({
      campusId: params.campusId
    })
  },
  getClassById: {
    user: userContext,
    params: Joi.object({
      classId: params.classId
    })
  },
  updateClass: {
    user: userContext,
    params: Joi.object({
      classId: params.classId
    }),
    body: updateClassBody
  },
  deleteClass: {
    user: userContext,
    params: Joi.object({
      classId: params.classId
    })
  }
};
