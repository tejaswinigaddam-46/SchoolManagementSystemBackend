const userService = require('@/services/user.service');
const UserModel = require('@/models/user.model');
const bcrypt = require('bcrypt');
const { pool } = require('@/config/database');

jest.mock('@/models/user.model');
jest.mock('@/models/attendance.model');
jest.mock('@/models/student.model');
jest.mock('@/models/employee.model');
jest.mock('@/services/permission.service');
jest.mock('@/services/tenant.service');
jest.mock('@/services/campus.service');
jest.mock('@/utils/logger');
jest.mock('bcrypt');
jest.mock('@/config/database', () => ({
  pool: {
    connect: jest.fn()
  }
}));

describe('User Service', () => {
  let mockClient;

  beforeEach(() => {
    mockClient = {
      query: jest.fn(),
      release: jest.fn()
    };
    pool.connect.mockResolvedValue(mockClient);
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    const userDetails = {
      role: 'Teacher',
      first_name: 'John',
      last_name: 'Doe',
      phone_number: '1234567890',
      date_of_birth: '1990-01-01'
    };
    const context = { tenant_id: 'tenant-1', campus_id: 'campus-1' };

    test('successfully creates a user', async () => {
      UserModel.findByUsername.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue('hashedPassword');
      UserModel.create.mockResolvedValue({ username: 'te-uniqueId', user_id: 1 });
      
      const result = await userService.createUser(userDetails, context);
      
      expect(result).toEqual({ username: 'te-uniqueId', user_id: 1 });
      expect(UserModel.create).toHaveBeenCalled();
      expect(UserModel.createUserStatus).toHaveBeenCalled();
      expect(mockClient.release).toHaveBeenCalled();
    });

    test('handles unique username generation', async () => {
      UserModel.findByUsername
        .mockResolvedValueOnce({ username: 'te-1' })
        .mockResolvedValueOnce(null);
      bcrypt.hash.mockResolvedValue('hashedPassword');
      UserModel.create.mockResolvedValue({ username: 'te-2', user_id: 2 });

      const result = await userService.createUser(userDetails, context);
      expect(UserModel.findByUsername).toHaveBeenCalledTimes(2);
      expect(result.username).toBe('te-2');
    });

    test('throws error on failure', async () => {
      UserModel.findByUsername.mockRejectedValue(new Error('DB Error'));
      await expect(userService.createUser(userDetails, context)).rejects.toThrow('Failed to create user');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('setUserStatus', () => {
    test('successfully sets user status', async () => {
      UserModel.setUserStatus.mockResolvedValue(true);
      await userService.setUserStatus('user1', 'campus1', 'Active');
      expect(UserModel.setUserStatus).toHaveBeenCalledWith('user1', 'campus1', 'Active');
    });

    test('throws error on failure', async () => {
      UserModel.setUserStatus.mockRejectedValue(new Error('DB Error'));
      await expect(userService.setUserStatus('user1', 'campus1', 'Active')).rejects.toThrow('Failed to set user status');
    });
  });

  describe('editUser', () => {
    test('successfully edits a user with password hashing', async () => {
      bcrypt.hash.mockResolvedValue('newHashedPassword');
      UserModel.editUser.mockResolvedValue({ username: 'user1' });

      const updates = { first_name: 'Jane', password: 'newpassword' };
      const result = await userService.editUser('user1', updates);

      expect(result).toEqual({ username: 'user1' });
      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword', 10);
      expect(UserModel.editUser).toHaveBeenCalledWith('user1', expect.objectContaining({
        first_name: 'Jane',
        password_hash: 'newHashedPassword'
      }));
    });

    test('throws error on failure', async () => {
      UserModel.editUser.mockRejectedValue(new Error('DB Error'));
      await expect(userService.editUser('user1', {})).rejects.toThrow('Failed to edit user');
    });
  });

  describe('searchUsers', () => {
    test('successfully searches users', async () => {
      const mockUsers = [{ username: 'user1' }];
      UserModel.searchUsers.mockResolvedValue(mockUsers);

      const result = await userService.searchUsers('John', 'Teacher', 'tenant1', 'campus1');
      expect(result).toEqual(mockUsers);
      expect(UserModel.searchUsers).toHaveBeenCalledWith('John', 'Teacher', 'tenant1', 'campus1');
    });

    test('throws error on failure', async () => {
      UserModel.searchUsers.mockRejectedValue(new Error('DB Error'));
      await expect(userService.searchUsers('John')).rejects.toThrow('Failed to search users');
    });
  });

  describe('getDistinctRoles', () => {
    test('successfully gets distinct roles', async () => {
      const mockRoles = ['Admin', 'Teacher'];
      UserModel.getDistinctRoles.mockResolvedValue(mockRoles);

      const result = await userService.getDistinctRoles('tenant1', 'campus1');
      expect(result).toEqual(mockRoles);
      expect(UserModel.getDistinctRoles).toHaveBeenCalledWith('tenant1', 'campus1');
    });

    test('throws error on failure', async () => {
      UserModel.getDistinctRoles.mockRejectedValue(new Error('DB Error'));
      await expect(userService.getDistinctRoles('tenant1')).rejects.toThrow('DB Error');
    });
  });
});
