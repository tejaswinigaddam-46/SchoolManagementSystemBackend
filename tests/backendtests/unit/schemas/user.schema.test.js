const schema = require('@/schemas/user.schema');

describe('User Schema', () => {
  const uuid = '550e8400-e29b-41d4-a716-446655440000';
  const tenantId = 'tenant-123';

  describe('createUserController', () => {
    test('user context valid', () => {
      const { error } = schema.createUserController.user.validate({
        tenant_id: tenantId,
        campus_id: uuid
      });
      expect(error).toBeUndefined();
    });

    test('user context invalid campus_id', () => {
      const { error } = schema.createUserController.user.validate({
        tenant_id: tenantId,
        campus_id: 'not-uuid'
      });
      expect(error).toBeDefined();
    });

    test('body valid', () => {
      const { error } = schema.createUserController.body.validate({
        role: 'Teacher',
        first_name: 'John',
        last_name: 'Doe',
        phone_number: '1234567890',
        date_of_birth: '1990-01-01'
      });
      expect(error).toBeUndefined();
    });

    test('body missing required field', () => {
      const { error } = schema.createUserController.body.validate({
        first_name: 'John',
        last_name: 'Doe'
      });
      expect(error).toBeDefined();
    });
  });

  describe('updateUserController', () => {
    test('params valid', () => {
      const { error } = schema.updateUserController.params.validate({ id: 'user123' });
      expect(error).toBeUndefined();
    });

    test('body valid', () => {
      const { error } = schema.updateUserController.body.validate({
        first_name: 'Jane'
      });
      expect(error).toBeUndefined();
    });

    test('body empty invalid', () => {
      const { error } = schema.updateUserController.body.validate({});
      expect(error).toBeDefined();
    });
  });

  describe('updateUserStatus', () => {
    test('body valid', () => {
      const { error } = schema.updateUserStatus.body.validate({ status: 'Active' });
      expect(error).toBeUndefined();
    });

    test('body missing status', () => {
      const { error } = schema.updateUserStatus.body.validate({});
      expect(error).toBeDefined();
    });
  });

  describe('getProfile', () => {
    test('user context valid', () => {
      const { error } = schema.getProfile.user.validate({
        tenant_id: tenantId,
        username: 'johndoe'
      });
      expect(error).toBeUndefined();
    });

    test('user context missing username', () => {
      const { error } = schema.getProfile.user.validate({
        tenant_id: tenantId
      });
      expect(error).toBeDefined();
    });
  });

  describe('searchUsersController', () => {
    test('query valid', () => {
      const { error } = schema.searchUsersController.query.validate({
        search: 'John',
        role: 'Student'
      });
      expect(error).toBeUndefined();
    });

    test('query missing search', () => {
      const { error } = schema.searchUsersController.query.validate({
        role: 'Student'
      });
      expect(error).toBeDefined();
    });
  });

  describe('getDistinctRolesController', () => {
    test('user context valid', () => {
      const { error } = schema.getDistinctRolesController.user.validate({
        tenant_id: tenantId,
        campus_id: uuid
      });
      expect(error).toBeUndefined();
    });
  });

  describe('getUsersForAttendanceController', () => {
    test('body valid', () => {
      const { error } = schema.getUsersForAttendanceController.body.validate({
        roles: ['Student'],
        academicYear: '2024-2025'
      });
      expect(error).toBeUndefined();
    });
  });

  describe('getActiveUsersOfRolesController', () => {
    test('body valid', () => {
      const { error } = schema.getActiveUsersOfRolesController.body.validate({
        roles: ['Student'],
        attendanceDate: '2024-03-28'
      });
      expect(error).toBeUndefined();
    });

    test('body missing roles', () => {
      const { error } = schema.getActiveUsersOfRolesController.body.validate({
        attendanceDate: '2024-03-28'
      });
      expect(error).toBeDefined();
    });
  });

  describe('saveUserAttendanceController', () => {
    test('body valid', () => {
      const { error } = schema.saveUserAttendanceController.body.validate({
        attendanceDate: '2024-03-28',
        academicYear: '2024-2025',
        attendanceData: [
          { username: 'user1', status: 'Present' }
        ]
      });
      expect(error).toBeUndefined();
    });
  });

  describe('getDailyAttendanceController', () => {
    test('body valid', () => {
      const { error } = schema.getDailyAttendanceController.body.validate({
        fromDate: '2024-03-01',
        toDate: '2024-03-31',
        roles: ['Student']
      });
      expect(error).toBeUndefined();
    });

    test('body missing dates', () => {
      const { error } = schema.getDailyAttendanceController.body.validate({
        roles: ['Student']
      });
      expect(error).toBeDefined();
    });
  });
});
