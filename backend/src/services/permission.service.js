const PermissionModel = require('../models/permission.model');
const RolePermissionModel = require('../models/rolePermission.model');

const PermissionService = {
  getAllPermissions: async () => {
    const permissions = await PermissionModel.getAllPermissions();
    return permissions;
  },

  getPermissionByCode: async (code) => {
    const permission = await PermissionModel.getPermissionByCode(code);
    if (!permission) {
      throw new Error('Permission not found');
    }
    return permission;
  },

  createPermission: async (data) => {
    const existing = await PermissionModel.getPermissionByCode(data.code);
    if (existing) {
      throw new Error('Permission with this code already exists');
    }
    const created = await PermissionModel.createPermission(data);
    return created;
  },

  updatePermission: async (code, data) => {
    const existing = await PermissionModel.getPermissionByCode(code);
    if (!existing) {
      throw new Error('Permission not found');
    }
    const updated = await PermissionModel.updatePermission(code, data);
    if (!updated) {
      throw new Error('Failed to update permission');
    }
    return updated;
  },

  deletePermission: async (code) => {
    const existing = await PermissionModel.getPermissionByCode(code);
    if (!existing) {
      throw new Error('Permission not found');
    }
    const deleted = await PermissionModel.deletePermission(code);
    if (!deleted) {
      throw new Error('Failed to delete permission');
    }
    return deleted;
  },

  getRolePermissionsForCampus: async (campusId, filters = {}) => {
    const permissions = await RolePermissionModel.getPermissionsForCampus(campusId, filters);
    return permissions;
  },

  getRolePermission: async (campusId, roleName, permissionCode) => {
    const item = await RolePermissionModel.getRolePermission(campusId, roleName, permissionCode);
    if (!item) {
      throw new Error('Role permission not found');
    }
    return item;
  },

  createRolePermission: async (campusId, roleName, permissionCode, createdByUsername) => {
    const existing = await RolePermissionModel.getRolePermission(campusId, roleName, permissionCode);
    if (existing) {
      throw new Error('Role permission already exists');
    }
    const created = await RolePermissionModel.createRolePermission({
      campus_id: campusId,
      role_name: roleName,
      permission_code: permissionCode,
      created_by_username: createdByUsername
    });
    return created;
  },

  deleteRolePermission: async (campusId, roleName, permissionCode) => {
    const existing = await RolePermissionModel.getRolePermission(campusId, roleName, permissionCode);
    if (!existing) {
      throw new Error('Role permission not found');
    }
    const deleted = await RolePermissionModel.deleteRolePermission(campusId, roleName, permissionCode);
    if (!deleted) {
      throw new Error('Failed to delete role permission');
    }
    return deleted;
  }
};

module.exports = PermissionService;

