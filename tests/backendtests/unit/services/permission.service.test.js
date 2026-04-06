const permissionService = require('@/services/permission.service');
const PermissionModel = require('@/models/permission.model');
const RolePermissionModel = require('@/models/rolePermission.model');

jest.mock('@/models/permission.model');
jest.mock('@/models/rolePermission.model');

describe('Permission Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  describe('Permissions', () => {
    test('getAllPermissions propagates db error', async () => {
      PermissionModel.getAllPermissions.mockRejectedValue(new Error('Database Connection Failed'));
      await expect(permissionService.getAllPermissions()).rejects.toThrow('Database Connection Failed');
    });

    test('getAllPermissions returns data', async () => {
      const mockPermissions = [{ code: 'P1', name: 'Permission 1' }];
      PermissionModel.getAllPermissions.mockResolvedValue(mockPermissions);
      const res = await permissionService.getAllPermissions();
      expect(res).toEqual(mockPermissions);
      expect(PermissionModel.getAllPermissions).toHaveBeenCalled();
    });

    test('getPermissionByCode success', async () => {
      const mockPermission = { code: 'P1', name: 'Permission 1' };
      PermissionModel.getPermissionByCode.mockResolvedValue(mockPermission);
      const res = await permissionService.getPermissionByCode('P1');
      expect(res).toEqual(mockPermission);
      expect(PermissionModel.getPermissionByCode).toHaveBeenCalledWith('P1');
    });

    test('getPermissionByCode not found', async () => {
      PermissionModel.getPermissionByCode.mockResolvedValue(null);
      await expect(permissionService.getPermissionByCode('P1')).rejects.toThrow('Permission not found');
    });

    test('createPermission success', async () => {
      const payload = { code: 'P1', name: 'Permission 1' };
      PermissionModel.getPermissionByCode.mockResolvedValue(null);
      PermissionModel.createPermission.mockResolvedValue(payload);
      const res = await permissionService.createPermission(payload);
      expect(res).toEqual(payload);
      expect(PermissionModel.createPermission).toHaveBeenCalledWith(payload);
    });

    test('createPermission already exists', async () => {
      const payload = { code: 'P1', name: 'Permission 1' };
      PermissionModel.getPermissionByCode.mockResolvedValue(payload);
      await expect(permissionService.createPermission(payload)).rejects.toThrow('Permission with this code already exists');
    });

    test('updatePermission success', async () => {
      const existing = { code: 'P1', name: 'Permission 1' };
      const updated = { code: 'P1', name: 'Updated Permission' };
      PermissionModel.getPermissionByCode.mockResolvedValue(existing);
      PermissionModel.updatePermission.mockResolvedValue(updated);
      const res = await permissionService.updatePermission('P1', { name: 'Updated Permission' });
      expect(res).toEqual(updated);
      expect(PermissionModel.updatePermission).toHaveBeenCalledWith('P1', { name: 'Updated Permission' });
    });

    test('updatePermission not found', async () => {
      PermissionModel.getPermissionByCode.mockResolvedValue(null);
      await expect(permissionService.updatePermission('P1', {})).rejects.toThrow('Permission not found');
    });

    test('updatePermission failed to update', async () => {
      PermissionModel.getPermissionByCode.mockResolvedValue({ code: 'P1' });
      PermissionModel.updatePermission.mockResolvedValue(null);
      await expect(permissionService.updatePermission('P1', {})).rejects.toThrow('Failed to update permission');
    });

    test('deletePermission success', async () => {
      const existing = { code: 'P1' };
      PermissionModel.getPermissionByCode.mockResolvedValue(existing);
      PermissionModel.deletePermission.mockResolvedValue(existing);
      const res = await permissionService.deletePermission('P1');
      expect(res).toEqual(existing);
      expect(PermissionModel.deletePermission).toHaveBeenCalledWith('P1');
    });

    test('deletePermission not found', async () => {
      PermissionModel.getPermissionByCode.mockResolvedValue(null);
      await expect(permissionService.deletePermission('P1')).rejects.toThrow('Permission not found');
    });

    test('deletePermission failed to delete', async () => {
      PermissionModel.getPermissionByCode.mockResolvedValue({ code: 'P1' });
      PermissionModel.deletePermission.mockResolvedValue(null);
      await expect(permissionService.deletePermission('P1')).rejects.toThrow('Failed to delete permission');
    });
  });

  describe('Role Permissions', () => {
    const campusId = '550e8400-e29b-41d4-a716-446655440000';

    test('getRolePermissionsForCampus success', async () => {
      const mockRolePermissions = [{ campus_id: campusId, role_name: 'Admin' }];
      RolePermissionModel.getPermissionsForCampus.mockResolvedValue(mockRolePermissions);
      const res = await permissionService.getRolePermissionsForCampus(campusId);
      expect(res).toEqual(mockRolePermissions);
      expect(RolePermissionModel.getPermissionsForCampus).toHaveBeenCalledWith(campusId, {});
    });

    test('getRolePermission success', async () => {
      const mockItem = { campus_id: campusId, role_name: 'Admin', permission_code: 'P1' };
      RolePermissionModel.getRolePermission.mockResolvedValue(mockItem);
      const res = await permissionService.getRolePermission(campusId, 'Admin', 'P1');
      expect(res).toEqual(mockItem);
    });

    test('getRolePermission not found', async () => {
      RolePermissionModel.getRolePermission.mockResolvedValue(null);
      await expect(permissionService.getRolePermission(campusId, 'Admin', 'P1')).rejects.toThrow('Role permission not found');
    });

    test('createRolePermission success', async () => {
      const mockCreated = { campus_id: campusId, role_name: 'Admin', permission_code: 'P1' };
      RolePermissionModel.getRolePermission.mockResolvedValue(null);
      RolePermissionModel.createRolePermission.mockResolvedValue(mockCreated);
      const res = await permissionService.createRolePermission(campusId, 'Admin', 'P1', 'user1');
      expect(res).toEqual(mockCreated);
      expect(RolePermissionModel.createRolePermission).toHaveBeenCalledWith({
        campus_id: campusId,
        role_name: 'Admin',
        permission_code: 'P1',
        created_by_username: 'user1'
      });
    });

    test('createRolePermission already exists', async () => {
      RolePermissionModel.getRolePermission.mockResolvedValue({ id: 1 });
      await expect(permissionService.createRolePermission(campusId, 'Admin', 'P1', 'user1')).rejects.toThrow('Role permission already exists');
    });

    test('deleteRolePermission success', async () => {
      const mockItem = { id: 1 };
      RolePermissionModel.getRolePermission.mockResolvedValue(mockItem);
      RolePermissionModel.deleteRolePermission.mockResolvedValue(mockItem);
      const res = await permissionService.deleteRolePermission(campusId, 'Admin', 'P1');
      expect(res).toEqual(mockItem);
    });

    test('deleteRolePermission not found', async () => {
      RolePermissionModel.getRolePermission.mockResolvedValue(null);
      await expect(permissionService.deleteRolePermission(campusId, 'Admin', 'P1')).rejects.toThrow('Role permission not found');
    });

    test('deleteRolePermission failed to delete', async () => {
      RolePermissionModel.getRolePermission.mockResolvedValue({ id: 1 });
      RolePermissionModel.deleteRolePermission.mockResolvedValue(null);
      await expect(permissionService.deleteRolePermission(campusId, 'Admin', 'P1')).rejects.toThrow('Failed to delete role permission');
    });
  });
});
