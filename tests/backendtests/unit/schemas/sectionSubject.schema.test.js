const schema = require('@/schemas/sectionSubject.schema');

describe('SectionSubject Schema', () => {
  const uuid = '550e8400-e29b-41d4-a716-446655440000';
  const tenantId = 'tenant-123';

  describe('bulkAssign', () => {
    test('body valid', () => {
      const { error } = schema.bulkAssign.body.validate({
        assignments: [
          { section_id: 1, subject_id: 1, teacher_user_id: 41 }
        ]
      });
      expect(error).toBeUndefined();
    });

    test('body missing assignments', () => {
      const { error } = schema.bulkAssign.body.validate({});
      expect(error).toBeDefined();
    });
  });

  describe('listBySections', () => {
    test('query valid', () => {
      const { error } = schema.listBySections.query.validate({
        section_ids: '1,2,3'
      });
      expect(error).toBeUndefined();
    });
  });

  describe('unassign', () => {
    test('body valid', () => {
      const { error } = schema.unassign.body.validate({
        section_id: 1,
        subject_ids: [1, 2]
      });
      expect(error).toBeUndefined();
    });
  });
});
