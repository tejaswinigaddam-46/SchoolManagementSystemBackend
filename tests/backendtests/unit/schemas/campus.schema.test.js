const schema = require('@/schemas/campus.schema');

describe('Campus Schema', () => {
  const tenantId = 'demo-tenant';
  const campusId = '550e8400-e29b-41d4-a716-446655440000';

  describe('user', () => {
    test('accepts valid tenantId', () => {
      const { error } = schema.getAllCampuses.user.validate({ tenantId });
      expect(error).toBeUndefined();
    });

    test('rejects tenantId equal to "undefined"', () => {
      const { error } = schema.getAllCampuses.user.validate({ tenantId: 'undefined' });
      expect(error).toBeDefined();
    });

    test('rejects missing tenantId', () => {
      const { error } = schema.getAllCampuses.user.validate({});
      expect(error).toBeDefined();
    });
  });

  describe('params', () => {
    test('accepts valid campus id uuid', () => {
      const { error } = schema.getCampusById.params.validate({ id: campusId });
      expect(error).toBeUndefined();
    });

    test('rejects invalid campus id uuid', () => {
      const { error } = schema.getCampusById.params.validate({ id: 'not-uuid' });
      expect(error).toBeDefined();
    });
  });

  describe('body', () => {
    const validBody = {
      campus_name: 'Main Campus',
      address: 'Street 1',
      phone_number: '+91 9876543210',
      email: 'campus@example.com',
      is_main_campus: true,
      year_established: 2000,
      no_of_floors: 10
    };

    test('accepts valid register payload', () => {
      const { error } = schema.registerCampus.body.validate(validBody);
      expect(error).toBeUndefined();
    });

    test('rejects invalid email', () => {
      const { error } = schema.registerCampus.body.validate({ ...validBody, email: 'not-email' });
      expect(error).toBeDefined();
    });

    test('rejects invalid phone_number', () => {
      const { error } = schema.registerCampus.body.validate({ ...validBody, phone_number: '123' });
      expect(error).toBeDefined();
    });

    test('rejects year_established below 1500', () => {
      const { error } = schema.registerCampus.body.validate({ ...validBody, year_established: 1499 });
      expect(error).toBeDefined();
    });

    test('rejects no_of_floors below 1', () => {
      const { error } = schema.registerCampus.body.validate({ ...validBody, no_of_floors: 0 });
      expect(error).toBeDefined();
    });

    test('rejects no_of_floors above 200', () => {
      const { error } = schema.registerCampus.body.validate({ ...validBody, no_of_floors: 201 });
      expect(error).toBeDefined();
    });
  });
});
