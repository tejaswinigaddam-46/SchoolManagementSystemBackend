const schema = require('@/schemas/holiday.schema');

describe('Holiday Schema', () => {
  const campusId = '550e8400-e29b-41d4-a716-446655440000';
  const tenantId = 'tenant-123';
  const role = 'Admin';
  const username = 'testuser';

  const validUserContext = {
    tenantId,
    campusId,
    role,
    username
  };

  const validHolidayBody = {
    holiday_name: 'New Year',
    duration_category: 'full_day',
    start_date: '2026-01-01',
    end_date: '2026-01-01',
    holiday_type: 'General',
    is_paid: true,
    academic_year_ids: [1, 2]
  };

  describe('checkDate', () => {
    test('valid request', () => {
      const { error: userError } = schema.checkDate.user.validate(validUserContext);
      const { error: paramsError } = schema.checkDate.params.validate({ campusId });
      const { error: queryError } = schema.checkDate.query.validate({
        date: '2026-01-01',
        academicYearId: 1
      });
      expect(userError).toBeUndefined();
      expect(paramsError).toBeUndefined();
      expect(queryError).toBeUndefined();
    });
  });

  describe('getAllHolidays', () => {
    test('valid query', () => {
      const { error } = schema.getAllHolidays.query.validate({
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        username: 'student1'
      });
      expect(error).toBeUndefined();
    });
  });

  describe('createHoliday', () => {
    test('valid body', () => {
      const { error } = schema.createHoliday.body.validate(validHolidayBody);
      expect(error).toBeUndefined();
    });

    test('invalid duration_category', () => {
      const { error } = schema.createHoliday.body.validate({
        ...validHolidayBody,
        duration_category: 'invalid'
      });
      expect(error).toBeDefined();
    });
  });

  describe('updateHoliday', () => {
    test('valid body', () => {
      const { error } = schema.updateHoliday.body.validate({
        holiday_name: 'Updated Name'
      });
      expect(error).toBeUndefined();
    });
  });
});
