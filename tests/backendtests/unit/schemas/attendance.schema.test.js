const schema = require('@/schemas/attendance.schema');

describe('Attendance Schema', () => {
  const user = {
    tenantId: 'demo-tenant',
    campusId: '550e8400-e29b-41d4-a716-446655440000',
    userId: 123,
    role: 'Teacher'
  };

  describe('getAttendance', () => {
    test('validates req.user tenantId and campusId', () => {
      const { error } = schema.getAttendance.user.validate({ tenantId: user.tenantId, campusId: user.campusId });
      expect(error).toBeUndefined();
    });

    test('rejects req.user missing campusId', () => {
      const { error } = schema.getAttendance.user.validate({ tenantId: user.tenantId });
      expect(error).toBeDefined();
    });

    test('rejects req.user invalid campusId uuid', () => {
      const { error } = schema.getAttendance.user.validate({ tenantId: user.tenantId, campusId: 'not-uuid' });
      expect(error).toBeDefined();
    });

    test('accepts query with eventId', () => {
      const { error } = schema.getAttendance.query.validate({ eventId: 'evt-1' });
      expect(error).toBeUndefined();
    });

    test('accepts query with class flow fields', () => {
      const { error } = schema.getAttendance.query.validate({
        classId: 1,
        sectionId: 2,
        date: '2026-01-01',
        academicYearId: 3
      });
      expect(error).toBeUndefined();
    });

    test('rejects query missing both eventId and class flow fields', () => {
      const { error } = schema.getAttendance.query.validate({});
      expect(error).toBeDefined();
    });
  });

  describe('saveAttendance', () => {
    test('validates req.user tenantId, campusId, userId', () => {
      const { error } = schema.saveAttendance.user.validate(user);
      expect(error).toBeUndefined();
    });

    test('rejects req.user missing userId', () => {
      const { error } = schema.saveAttendance.user.validate({ tenantId: user.tenantId, campusId: user.campusId });
      expect(error).toBeDefined();
    });

    test('rejects req.user tenantId equal to "undefined"', () => {
      const { error } = schema.saveAttendance.user.validate({ ...user, tenantId: 'undefined' });
      expect(error).toBeDefined();
    });

    test('accepts minimal valid body', () => {
      const { error } = schema.saveAttendance.body.validate({
        eventId: 'evt-1',
        attendanceData: [{ studentId: 1, status: 'Present' }]
      });
      expect(error).toBeUndefined();
    });

    test('rejects body missing eventId', () => {
      const { error } = schema.saveAttendance.body.validate({
        attendanceData: [{ studentId: 1, status: 'Present' }]
      });
      expect(error).toBeDefined();
    });

    test('rejects body invalid attendanceData item', () => {
      const { error } = schema.saveAttendance.body.validate({
        eventId: 'evt-1',
        attendanceData: [{ status: 'Present' }]
      });
      expect(error).toBeDefined();
    });

    test('rejects body invalid status', () => {
      const { error } = schema.saveAttendance.body.validate({
        eventId: 'evt-1',
        attendanceData: [{ studentId: 1, status: 'P' }]
      });
      expect(error).toBeDefined();
    });
  });
});
