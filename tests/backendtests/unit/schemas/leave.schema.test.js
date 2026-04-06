const schema = require('@/schemas/leave.schema');

describe('Leave Schema', () => {
  const uuid = '550e8400-e29b-41d4-a716-446655440000';

  describe('createLeave', () => {
    test('user context valid', () => {
      const { error } = schema.createLeave.user.validate({ tenantId: 't1', campusId: uuid, username: 'user1' });
      expect(error).toBeUndefined();
    });

    test('body valid', () => {
      const { error } = schema.createLeave.body.validate({
        leave_date: '2024-05-01',
        leave_reason: 'Sick',
        duration_days: 2,
        duration_category: 'Full Day'
      });
      expect(error).toBeUndefined();
    });

    test('body invalid duration_category', () => {
      const { error } = schema.createLeave.body.validate({
        leave_date: '2024-05-01',
        leave_reason: 'Sick',
        duration_days: 2,
        duration_category: 'invalid-category'
      });
      expect(error).toBeDefined();
    });
  });

  describe('updateStatus', () => {
    test('body valid approved', () => {
      const { error } = schema.updateStatus.body.validate({
        status: 'approved'
      });
      expect(error).toBeUndefined();
    });

    test('body valid rejected with reason', () => {
      const { error } = schema.updateStatus.body.validate({
        status: 'rejected',
        status_reason: 'Not enough leave balance'
      });
      expect(error).toBeUndefined();
    });

    test('body invalid rejected without reason', () => {
      const { error } = schema.updateStatus.body.validate({
        status: 'rejected'
      });
      expect(error).toBeDefined();
      expect(error.message).toContain('status_reason is required for rejection');
    });
  });

  describe('deleteLeave', () => {
    test('user context valid (no username required)', () => {
      const { error } = schema.deleteLeave.user.validate({ tenantId: 't1', campusId: uuid });
      expect(error).toBeUndefined();
    });
  });
});
