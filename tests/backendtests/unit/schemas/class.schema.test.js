const schema = require('@/schemas/class.schema');

describe('Class Schema', () => {
  const tenantId = 'demo-tenant';
  const campusId = '550e8400-e29b-41d4-a716-446655440000';

  describe('user', () => {
    test('accepts valid tenantId and campusId', () => {
      const { error } = schema.getAllClasses.user.validate({ tenantId, campusId });
      expect(error).toBeUndefined();
    });

    test('rejects tenantId equal to "undefined"', () => {
      const { error } = schema.getAllClasses.user.validate({ tenantId: 'undefined', campusId });
      expect(error).toBeDefined();
    });

    test('rejects invalid campusId uuid', () => {
      const { error } = schema.getAllClasses.user.validate({ tenantId, campusId: 'not-uuid' });
      expect(error).toBeDefined();
    });
  });

  describe('params', () => {
    test('accepts valid classId', () => {
      const { error } = schema.getClassById.params.validate({ classId: 1 });
      expect(error).toBeUndefined();
    });

    test('rejects invalid classId', () => {
      const { error } = schema.getClassById.params.validate({ classId: 0 });
      expect(error).toBeDefined();
    });

    test('accepts valid campusId for campus routes', () => {
      const { error } = schema.getClassesByCampus.params.validate({ campusId });
      expect(error).toBeUndefined();
    });

    test('rejects invalid campusId for campus routes', () => {
      const { error } = schema.getClassesByCampus.params.validate({ campusId: 'not-uuid' });
      expect(error).toBeDefined();
    });
  });

  describe('query', () => {
    test('accepts valid pagination query', () => {
      const { error } = schema.getAllClasses.query.validate({ page: 1, limit: 20, search: '' });
      expect(error).toBeUndefined();
    });

    test('rejects invalid page', () => {
      const { error } = schema.getAllClasses.query.validate({ page: 0 });
      expect(error).toBeDefined();
    });

    test('rejects limit above 100', () => {
      const { error } = schema.getAllClasses.query.validate({ limit: 101 });
      expect(error).toBeDefined();
    });
  });

  describe('body', () => {
    test('accepts valid create class payload', () => {
      const { error } = schema.createClass.body.validate({ className: 'Class A', classLevel: 5 });
      expect(error).toBeUndefined();
    });

    test('rejects missing className', () => {
      const { error } = schema.createClass.body.validate({ classLevel: 5 });
      expect(error).toBeDefined();
    });

    test('rejects className longer than 50 chars', () => {
      const { error } = schema.createClass.body.validate({ className: 'a'.repeat(51), classLevel: 5 });
      expect(error).toBeDefined();
    });

    test('rejects classLevel out of range', () => {
      const { error } = schema.createClass.body.validate({ className: 'Class A', classLevel: 13 });
      expect(error).toBeDefined();
    });

    test('rejects empty update payload', () => {
      const { error } = schema.updateClass.body.validate({});
      expect(error).toBeDefined();
    });

    test('accepts update payload with one field', () => {
      const { error } = schema.updateClass.body.validate({ className: 'Updated' });
      expect(error).toBeUndefined();
    });
  });
});
