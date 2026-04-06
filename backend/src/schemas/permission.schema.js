const Joi = require('joi');

const campusIdSchema = Joi.string().trim().uuid().invalid('undefined').required();

const userContext = Joi.object({
  campusId: campusIdSchema,
  username: Joi.string().trim().min(1).invalid('undefined').required()
}).unknown(true);

const params = {
  code: Joi.string().trim().min(1).max(100).invalid('undefined').required(),
  role_name: Joi.string().trim().min(1).max(100).invalid('undefined').required(),
  permission_code: Joi.string().trim().min(1).max(100).invalid('undefined').required()
};

const createPermissionBody = Joi.object({
  code: params.code,
  name: Joi.string().trim().min(1).max(255).required(),
  description: Joi.string().trim().allow('', null).optional(),
  category: Joi.string().trim().allow('', null).optional()
}).unknown(true);

const updatePermissionBody = Joi.object({
  name: Joi.string().trim().min(1).max(255).optional(),
  description: Joi.string().trim().allow(null).min(1).optional(),
  category: Joi.string().trim().allow(null).min(1).optional()
}).min(1).unknown(true);

const rolePermissionBody = Joi.object({
  role_name: params.role_name,
  permission_code: params.permission_code
}).unknown(true);

module.exports = {
  getPermissionByCode: {
    params: Joi.object({ code: params.code })
  },
  createPermission: {
    body: createPermissionBody
  },
  updatePermission: {
    params: Joi.object({ code: params.code }),
    body: updatePermissionBody
  },
  deletePermission: {
    params: Joi.object({ code: params.code })
  },
  getRolePermissionsForCampus: {
    user: Joi.object({
  campusId: campusIdSchema
}),
    query: Joi.object({
      role_name: Joi.string().trim().min(1).required(),
      permission_code: Joi.string().trim().min(1).required(),
      category: Joi.string().trim().min(1).required()
    })
  },
  createRolePermission: {
    user: userContext,
    body: rolePermissionBody
  },
  deleteRolePermission: {
    user: Joi.object({
  campusId: campusIdSchema
}),
    params: Joi.object({
      role_name: params.role_name,
      permission_code: params.permission_code
    })
  }
};
