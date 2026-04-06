const schema = require('@/schemas/payroll.schema');

describe('Payroll Schema', () => {
  const tenantId = 'tenant-123';
  const campusId = '550e8400-e29b-41d4-a716-446655440000';
  const username = 'testuser';
  const role = 'Admin';

  const validUserContext = {
    tenantId,
    campusId,
    username,
    role
  };

  const validReportBody = {
    fromDate: '2026-03-01',
    toDate: '2026-03-31',
    roles: ['Teacher'],
    academicYear: '2025-2026'
  };

  describe('getPayrollReport', () => {
    test('valid request', () => {
      const { error: userError } = schema.getPayrollReport.user.validate(validUserContext);
      const { error: bodyError } = schema.getPayrollReport.body.validate(validReportBody);
      expect(userError).toBeUndefined();
      expect(bodyError).toBeUndefined();
    });

    test('missing required body fields', () => {
      const { error } = schema.getPayrollReport.body.validate({
        roles: ['Teacher']
      });
      expect(error).toBeDefined();
    });
  });

  describe('getMyPayrollReport', () => {
    test('valid request', () => {
      const { error: userError } = schema.getMyPayrollReport.user.validate(validUserContext);
      const { error: bodyError } = schema.getMyPayrollReport.body.validate({
        fromDate: '2026-03-01',
        toDate: '2026-03-31'
      });
      expect(userError).toBeUndefined();
      expect(bodyError).toBeUndefined();
    });

    test('roles forbidden in body', () => {
      const { error } = schema.getMyPayrollReport.body.validate({
        fromDate: '2026-03-01',
        toDate: '2026-03-31',
        roles: ['Teacher']
      });
      expect(error).toBeDefined();
    });
  });
});
