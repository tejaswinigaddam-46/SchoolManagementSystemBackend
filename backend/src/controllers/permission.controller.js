const PermissionService = require('../services/permission.service');
const { successResponse, errorResponse } = require('../utils/response');

const PermissionController = {
  getAllPermissions: async (req, res) => {
    try {
      const permissions = await PermissionService.getAllPermissions();
      return successResponse(res, 'Permissions fetched successfully', { permissions });
    } catch (error) {
      return errorResponse(res, error.message || 'Failed to fetch permissions', 500);
    }
  },

  getPermissionByCode: async (req, res) => {
    try {
      const { code } = req.params;
      const permission = await PermissionService.getPermissionByCode(code);
      return successResponse(res, 'Permission fetched successfully', { permission });
    } catch (error) {
      const statusCode = error.message === 'Permission not found' ? 404 : 400;
      return errorResponse(res, error.message || 'Failed to fetch permission', statusCode);
    }
  },

  createPermission: async (req, res) => {
    try {
      const created = await PermissionService.createPermission(req.body);
      return successResponse(res, 'Permission created successfully', { permission: created }, 201);
    } catch (error) {
      const statusCode = error.message.includes('already exists') ? 409 : 400;
      return errorResponse(res, error.message || 'Failed to create permission', statusCode);
    }
  },

  updatePermission: async (req, res) => {
    try {
      const { code } = req.params;
      const updated = await PermissionService.updatePermission(code, req.body);
      return successResponse(res, 'Permission updated successfully', { permission: updated });
    } catch (error) {
      let statusCode = 400;
      if (error.message === 'Permission not found') {
        statusCode = 404;
      }
      return errorResponse(res, error.message || 'Failed to update permission', statusCode);
    }
  },

  deletePermission: async (req, res) => {
    try {
      const { code } = req.params;
      const deleted = await PermissionService.deletePermission(code);
      return successResponse(res, 'Permission deleted successfully', { permission: deleted });
    } catch (error) {
      const statusCode = error.message === 'Permission not found' ? 404 : 400;
      return errorResponse(res, error.message || 'Failed to delete permission', statusCode);
    }
  },

  getRolePermissionsForCampus: async (req, res) => {
    try {
      const campusId = req.user.campusId;
      const filters = {
        role_name: req.query.role_name,
        permission_code: req.query.permission_code,
        category: req.query.category
      };
      const items = await PermissionService.getRolePermissionsForCampus(campusId, filters);
      return successResponse(res, 'Role permissions fetched successfully', { items });
    } catch (error) {
      return errorResponse(res, error.message || 'Failed to fetch role permissions', 500);
    }
  },

  createRolePermission: async (req, res) => {
    try {
      const campusId = req.user.campusId;
      const username = req.user.username;
      const { role_name, permission_code } = req.body;
      const created = await PermissionService.createRolePermission(
        campusId,
        role_name,
        permission_code,
        username
      );
      return successResponse(res, 'Role permission created successfully', { item: created }, 201);
    } catch (error) {
      const statusCode = error.message.includes('already exists') ? 409 : 400;
      return errorResponse(res, error.message || 'Failed to create role permission', statusCode);
    }
  },

  deleteRolePermission: async (req, res) => {
    try {
      const campusId = req.user.campusId;
      const { role_name, permission_code } = req.params;
      const deleted = await PermissionService.deleteRolePermission(
        campusId,
        role_name,
        permission_code
      );
      return successResponse(res, 'Role permission deleted successfully', { item: deleted });
    } catch (error) {
      const statusCode = error.message === 'Role permission not found' ? 404 : 400;
      return errorResponse(res, error.message || 'Failed to delete role permission', statusCode);
    }
  }
};

module.exports = PermissionController;
