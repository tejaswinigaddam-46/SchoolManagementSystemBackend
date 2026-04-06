const schema = require('@/schemas/specialWorkingDay.schema');

describe('SpecialWorkingDay Schema', () => {
  const campusId = '550e8400-e29b-41d4-a716-446655440000';
  const tenantId = 'tenant-123';
  const username = 'testuser';

  const validUserContext = {
    tenantId,
    campusId,
    username
  };

  const validSpecialWorkingDayBody = {
    work_date: '2026-03-29',
    description: 'Special working day',
    academic_year_ids: [1, 2]
  };

  describe('create', () => {
    test('valid body', () => {
      const { error: userError } = schema.create.user.validate(validUserContext);
      const { error: bodyError } = schema.create.body.validate(validSpecialWorkingDayBody);
      expect(userError).toBeUndefined();
      expect(bodyError).toBeUndefined();
    });

    test('missing required body fields', () => {
      const { error } = schema.create.body.validate({
        description: 'Special working day'
      });
      expect(error).toBeDefined();
    });
  });

  describe('getAll', () => {
    test('valid query', () => {
      const { error } = schema.getAll.query.validate({
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        studentUsername: 'student1'
      });
      expect(error).toBeUndefined();
    });
  });

  describe('update', () => {
    test('valid body', () => {
      const { error } = schema.update.body.validate({
        academic_year_ids: [1]
      });
      expect(error).toBeUndefined();
    });
  });
});
