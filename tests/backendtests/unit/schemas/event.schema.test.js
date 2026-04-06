const schema = require('@/schemas/event.schema');

describe('Event Schema', () => {
  const user = {
    tenantId: 'demo-tenant',
    campusId: '550e8400-e29b-41d4-a716-446655440000',
    userId: 10
  };

  describe('user', () => {
    test('accepts valid user context', () => {
      const { error } = schema.getEvents.user.validate(user);
      expect(error).toBeUndefined();
    });

    test('rejects invalid campusId uuid', () => {
      const { error } = schema.getEvents.user.validate({ ...user, campusId: 'not-uuid' });
      expect(error).toBeDefined();
    });

    test('rejects missing userId', () => {
      const { error } = schema.getEvents.user.validate({ tenantId: user.tenantId, campusId: user.campusId });
      expect(error).toBeDefined();
    });
  });

  describe('params', () => {
    it('accepts valid id', () => {
      const { error } = schema.updateEvent.params.validate({ id: '123e4567-e89b-12d3-a456-426614174000' });
      expect(error).toBeUndefined();
    });

    it('rejects invalid id', () => {
      const { error } = schema.updateEvent.params.validate({ id: 'invalid-uuid' });
      expect(error).toBeDefined();
    });
  });

  describe('query', () => {
    test('getEvents accepts academic_year_id', () => {
      const { error } = schema.getEvents.query.validate({ academic_year_id: 1 });
      expect(error).toBeUndefined();
    });

    test('getEvents accepts empty academic_year_id', () => {
      const { error } = schema.getEvents.query.validate({ academic_year_id: '' });
      expect(error).toBeUndefined();
    });

    test('updateEvent requires instanceDate when mode is single', () => {
      const { error } = schema.updateEvent.query.validate({ mode: 'single' });
      expect(error).toBeDefined();
    });

    test('updateEvent accepts instanceDate when mode is single', () => {
      const { error } = schema.updateEvent.query.validate({ mode: 'single', instanceDate: '2026-01-01' });
      expect(error).toBeUndefined();
    });
  });

  describe('body', () => {
    test('createEvent accepts minimal valid payload with time strings', () => {
      const body = {
        event_name: 'Event A',
        event_type: 'Meeting',
        academic_year_id: 1,
        start_date: '2026-01-01',
        end_date: '2026-01-01',
        start_time: '09:00:00',
        end_time: '10:00:00'
      };

      const { error } = schema.createEvent.body.validate(body);
      expect(error).toBeUndefined();
    });

    test('createEvent accepts ISO timestamps for time/date fields', () => {
      const body = {
        event_name: 'Event A',
        event_type: 'Meeting',
        academic_year_id: 1,
        start_date: '2026-01-01T00:00:00.000Z',
        end_date: '2026-01-01T00:00:00.000Z',
        start_time: '2026-01-01T00:00:00.000Z',
        end_time: '2026-01-01T01:00:00.000Z'
      };

      const { error } = schema.createEvent.body.validate(body);
      expect(error).toBeUndefined();
    });

    test('createEvent rejects missing required fields', () => {
      const { error } = schema.createEvent.body.validate({ event_name: 'X' });
      expect(error).toBeDefined();
    });

    test('updateEvent rejects empty payload', () => {
      const { error } = schema.updateEvent.body.validate({});
      expect(error).toBeDefined();
    });

    test('updateEvent rejects payload with only unknown fields', () => {
      const { error } = schema.updateEvent.body.validate({ foo: 'bar' });
      expect(error).toBeDefined();
    });

    test('updateEvent accepts payload with one known field', () => {
      const { error } = schema.updateEvent.body.validate({ event_name: 'Updated' });
      expect(error).toBeUndefined();
    });
  });
});
