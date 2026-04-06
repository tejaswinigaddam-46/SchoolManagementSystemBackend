const loginService = require('@/services/login.service');
const loginModel = require('@/models/login.model');
const userModel = require('@/models/user.model');
const tenantService = require('@/services/tenant.service');
const campusService = require('@/services/campus.service');
const PermissionService = require('@/services/permission.service');
const jwt = require('jsonwebtoken');

jest.mock('@/models/login.model');
jest.mock('@/models/user.model');
jest.mock('@/services/tenant.service');
jest.mock('@/services/campus.service');
jest.mock('@/services/permission.service');
jest.mock('jsonwebtoken');

describe('Login Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('authenticateUser', () => {
    test('authenticates successfully and returns tokens', async () => {
      userModel.findByUsername.mockResolvedValue({ username: 'user1', password_hash: 'hash' });
      loginModel.verifyPassword.mockResolvedValue(true);
      userModel.isUserMemberOfTenant.mockResolvedValue(true);
      userModel.getUserRoleForTenant.mockResolvedValue('Admin');
      tenantService.getTenantById.mockResolvedValue({ tenant_id: 't1' });
      userModel.getUserCampusId.mockResolvedValue('c1');
      campusService.getCampusById.mockResolvedValue({ campus_id: 'c1' });
      PermissionService.getRolePermissionsForCampus.mockResolvedValue([{ permission_code: 'ALL' }]);

      jwt.sign.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');

      const result = await loginService.authenticateUser({ username: 'user1', password: 'pwd' }, 't1');

      expect(result.tokens.access_token).toBe('access-token');
      expect(result.tokens.refresh_token).toBe('refresh-token');
      expect(result.role).toBe('Admin');
      expect(result.permissions).toEqual(['ALL']);
    });

    test('throws error if user not found', async () => {
      userModel.findByUsername.mockResolvedValue(null);
      await expect(loginService.authenticateUser({ username: 'u', password: 'p' }, 't1'))
        .rejects.toThrow('Invalid username or password');
    });

    test('throws error if password invalid', async () => {
      userModel.findByUsername.mockResolvedValue({ username: 'u' });
      loginModel.verifyPassword.mockResolvedValue(false);
      await expect(loginService.authenticateUser({ username: 'u', password: 'p' }, 't1'))
        .rejects.toThrow('Invalid username or password');
    });
  });

  describe('refreshAccessToken', () => {
    test('refreshes token successfully', async () => {
      jwt.verify.mockReturnValue({ type: 'refresh', username: 'u1', tenantId: 't1' });
      userModel.findByUsername.mockResolvedValue({ username: 'u1' });
      userModel.isUserMemberOfTenant.mockResolvedValue(true);
      userModel.getUserRoleForTenant.mockResolvedValue('Student');
      tenantService.getTenantById.mockResolvedValue({ tenant_id: 't1' });
      userModel.getUserCampusId.mockResolvedValue('c1');
      campusService.getCampusById.mockResolvedValue({ campus_id: 'c1' });
      PermissionService.getRolePermissionsForCampus.mockResolvedValue([]);

      jwt.sign.mockReturnValue('new-access-token');

      const result = await loginService.refreshAccessToken('valid-refresh-token');
      expect(result.access_token).toBe('new-access-token');
    });

    test('throws error if token type invalid', async () => {
      jwt.verify.mockReturnValue({ type: 'access' });
      await expect(loginService.refreshAccessToken('token'))
        .rejects.toThrow('Invalid token type');
    });
  });

  describe('verifyToken', () => {
    test('verifies token successfully', async () => {
      const decoded = { user: { username: 'u1' }, tenant: { tenant_id: 't1' } };
      jwt.verify.mockReturnValue(decoded);
      userModel.findByUsername.mockResolvedValue({ username: 'u1' });
      userModel.isUserMemberOfTenant.mockResolvedValue(true);

      const result = await loginService.verifyToken('valid-token');
      expect(result).toEqual(decoded);
    });

    test('throws error if token expired', async () => {
      const err = new Error('expired');
      err.name = 'TokenExpiredError';
      jwt.verify.mockImplementation(() => { throw err; });
      await expect(loginService.verifyToken('token'))
        .rejects.toThrow('Invalid or expired token');
    });
  });

  describe('changeUserPassword', () => {
    test('changes password successfully', async () => {
      userModel.findByUsername.mockResolvedValue({ username: 'u1' });
      userModel.isUserMemberOfTenant.mockResolvedValue(true);
      loginModel.verifyPassword.mockResolvedValue(true);
      userModel.editUser.mockResolvedValue({ username: 'u1' });

      const result = await loginService.changeUserPassword('u1', { currentPassword: 'p1', newPassword: 'p2' }, 't1');
      expect(result.message).toBe('Password updated successfully');
      expect(userModel.editUser).toHaveBeenCalledWith('u1', { password: 'p2' });
    });

    test('throws error if current password incorrect', async () => {
      userModel.findByUsername.mockResolvedValue({ username: 'u1' });
      userModel.isUserMemberOfTenant.mockResolvedValue(true);
      loginModel.verifyPassword.mockResolvedValue(false);

      await expect(loginService.changeUserPassword('u1', { currentPassword: 'p1', newPassword: 'p2' }, 't1'))
        .rejects.toThrow('Current password is incorrect');
    });
  });

  describe('resolveTenantsByMobile', () => {
    test('resolves tenants successfully', async () => {
      userModel.findTenantsAndUsersByMobile.mockResolvedValue([{ tenant_id: 't1' }]);
      const result = await loginService.resolveTenantsByMobile('1234567890');
      expect(result).toEqual([{ tenant_id: 't1' }]);
    });
  });
});
