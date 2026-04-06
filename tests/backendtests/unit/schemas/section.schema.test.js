const schema = require('@/schemas/section.schema');

describe('Section Schema', () => {
  const uuid = '550e8400-e29b-41d4-a716-446655440000';
  const tenantId = 'tenant-123';

  describe('getAllSections', () => {
    test('user context valid', () => {
      const { error } = schema.getAllSections.user.validate({
        tenantId,
        campusId: uuid
      });
      expect(error).toBeUndefined();
    });

    test('query valid', () => {
      const { error } = schema.getAllSections.query.validate({
        page: 1,
        limit: 10,
        search: 'A',
        academic_year_id: 1,
        class_id: 1
      });
      expect(error).toBeUndefined();
    });
  });

  describe('createSection', () => {
    test('body valid', () => {
      const { error } = schema.createSection.body.validate({
        section_name: 'Section A',
        class_id: 1,
        academic_year_id: 1,
        capacity: 30
      });
      expect(error).toBeUndefined();
    });

    test('body missing required fields', () => {
      const { error } = schema.createSection.body.validate({
        section_name: 'Section A'
      });
      expect(error).toBeDefined();
    });
  });

  describe('getSectionById', () => {
    test('params valid', () => {
      const { error } = schema.getSectionById.params.validate({
        sectionId: 1
      });
      expect(error).toBeUndefined();
    });
  });

  describe('updateSection', () => {
    test('body valid', () => {
      const { error } = schema.updateSection.body.validate({
        section_name: 'Updated Section'
      });
      expect(error).toBeUndefined();
    });

    test('body empty invalid', () => {
      const { error } = schema.updateSection.body.validate({});
      expect(error).toBeDefined();
    });
  });
});
