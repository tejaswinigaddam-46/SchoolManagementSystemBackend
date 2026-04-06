const schema = require('@/schemas/weekendPolicy.schema');

describe('WeekendPolicy Schema', () => {
  const campusId = '550e8400-e29b-41d4-a716-446655440000';
  const tenantId = 'tenant-123';

  const validUserContext = {
    tenantId,
    campusId
  };

  const validWeekendPolicyBody = {
    academic_year_id: 1,
    is_sunday_holiday: true,
    is_saturday_holiday: false,
    is_saturday_half_day: true
  };

  describe('upsertPolicy', () => {
    test('valid body', () => {
      const { error: userError } = schema.upsertPolicy.user.validate(validUserContext);
      const { error: bodyError } = schema.upsertPolicy.body.validate(validWeekendPolicyBody);
      expect(userError).toBeUndefined();
      expect(bodyError).toBeUndefined();
    });

    test('invalid Saturday holiday and half day together', () => {
      const { error } = schema.upsertPolicy.body.validate({
        ...validWeekendPolicyBody,
        is_saturday_holiday: true,
        is_saturday_half_day: true
      });
      expect(error).toBeDefined();
    });
  });

  describe('getAllPolicies', () => {
    test('valid params', () => {
      const { error } = schema.getAllPolicies.params.validate({ campusId });
      expect(error).toBeUndefined();
    });
  });

  describe('getPolicy', () => {
    test('valid params', () => {
      const { error } = schema.getPolicy.params.validate({ campusId, id: 1 });
      expect(error).toBeUndefined();
    });
  });

  describe('deletePolicy', () => {
    test('valid params', () => {
      const { error } = schema.deletePolicy.params.validate({ campusId, id: 1 });
      expect(error).toBeUndefined();
    });
  });
});
