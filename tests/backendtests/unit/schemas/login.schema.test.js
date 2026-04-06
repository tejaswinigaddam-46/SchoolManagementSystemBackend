const schema = require('@/schemas/login.schema');

describe('Login Schema', () => {
  describe('login', () => {
    test('tenantId valid', () => {
      const { error } = schema.login.tenantId.validate('t1');
      expect(error).toBeUndefined();
    });

    test('tenantId invalid (empty)', () => {
      const { error } = schema.login.tenantId.validate('');
      expect(error).toBeDefined();
    });

    test('body valid', () => {
      const { error } = schema.login.body.validate({
        username: 'user1',
        password: 'password123'
      });
      expect(error).toBeUndefined();
    });

    test('body invalid missing password', () => {
      const { error } = schema.login.body.validate({
        username: 'user1'
      });
      expect(error).toBeDefined();
    });
  });

  describe('resolveTenant', () => {
    test('body valid mobile number', () => {
      const { error } = schema.resolveTenant.body.validate({
        mobileNumber: '9876543210'
      });
      expect(error).toBeUndefined();
    });

    test('body invalid mobile number', () => {
      const { error } = schema.resolveTenant.body.validate({
        mobileNumber: '123'
      });
      expect(error).toBeDefined();
    });
  });

  describe('changePassword', () => {
    test('user context valid', () => {
      const { error } = schema.changePassword.user.validate({
        username: 'user1',
        tenantId: 't1'
      });
      expect(error).toBeUndefined();
    });

    test('body valid', () => {
      const { error } = schema.changePassword.body.validate({
        currentPassword: 'password123',
        newPassword: 'newpassword123'
      });
      expect(error).toBeUndefined();
    });
  });

  describe('verifyToken', () => {
    test('body valid', () => {
      const { error } = schema.verifyToken.body.validate({
        token: 'header.payload.signature'
      });
      expect(error).toBeUndefined();
    });
  });
});
