const schema = require('@/schemas/subject.schema');

describe('Subject Schema', () => {
  const uuid = '550e8400-e29b-41d4-a716-446655440000';
  const tenantId = 'tenant-123';

  describe('getAllSubjects', () => {
    test('params valid', () => {
      const { error } = schema.getAllSubjects.params.validate({
        campusId: uuid
      });
      expect(error).toBeUndefined();
    });

    test('query valid', () => {
      const { error } = schema.getAllSubjects.query.validate({
        category: 'Academic',
        search: 'Math'
      });
      expect(error).toBeUndefined();
    });
  });

  describe('createSubject', () => {
    test('body valid', () => {
      const { error } = schema.createSubject.body.validate({
        subject_name: 'Mathematics',
        category: 'Academic',
        curriculum_id: 1
      });
      expect(error).toBeUndefined();
    });

    test('body invalid category', () => {
      const { error } = schema.createSubject.body.validate({
        subject_name: 'Mathematics',
        category: 'Invalid',
        curriculum_id: 1
      });
      expect(error).toBeDefined();
    });
  });

  describe('updateSubject', () => {
    test('body valid', () => {
      const { error } = schema.updateSubject.body.validate({
        subject_name: 'Advanced Math'
      });
      expect(error).toBeUndefined();
    });
  });
});
