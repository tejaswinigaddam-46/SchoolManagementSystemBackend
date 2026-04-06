const employeeSchema = require('@/schemas/employee.schema');

describe('Employee Schema', () => {
  test('createEmployee: valid body passes', () => {
    const body = {
      user: { first_name: 'John', last_name: 'Doe', date_of_birth: '1990-01-01', role: 'Employee' },
      contact: { email: 'john.doe@example.com' },
      employment: {
        employee_id: 'EMP-123',
        designation: 'Teacher',
        department: 'Academics',
        joining_date: '2020-06-01'
      },
      personal: { marital_status: 'Single', gender: 'Male' }
    };
    const user = { tenantId: 'tenant-1', campusId: '550e8400-e29b-41d4-a716-446655440000' };
    const { error: userError } = employeeSchema.createEmployee.user.validate(user);
    const { error } = employeeSchema.createEmployee.body.validate(body);
    expect(userError).toBeUndefined();
    expect(error).toBeUndefined();
  });

  test('createEmployee: missing required sections fails', () => {
    const body = { contact: { email: 'a@b.com' } };
    const { error } = employeeSchema.createEmployee.body.validate(body);
    expect(error).toBeDefined();
  });

  test('updateEmployee: at least one section required', () => {
    const body = {};
    const { error } = employeeSchema.updateEmployee.body.validate(body);
    expect(error).toBeDefined();
  });

  test('updateEmployee: personal.marital_status allowed', () => {
    const body = { personal: { marital_status: 'Married' } };
    const { error } = employeeSchema.updateEmployee.body.validate(body);
    expect(error).toBeUndefined();
  });

  test('getAllEmployees: filter enums enforced', () => {
    const query = { designation: 'Teacher', department: 'Academics', status: 'Active', employment_type: 'Full-time' };
    const { error } = employeeSchema.getAllEmployees.query.validate(query);
    expect(error).toBeUndefined();
    const bad = { designation: 'BadRole' };
    const { error: badErr } = employeeSchema.getAllEmployees.query.validate(bad);
    expect(badErr).toBeDefined();
  });

  test('checkEmployeeIdAvailability: patterns enforced', () => {
    const query = { employee_id: 'EMP-001', campus_id: '550e8400-e29b-41d4-a716-446655440000' };
    const { error } = employeeSchema.checkEmployeeIdAvailability.query.validate(query);
    expect(error).toBeUndefined();
    const bad = { employee_id: '!!', campus_id: 'not-uuid' };
    const { error: badErr } = employeeSchema.checkEmployeeIdAvailability.query.validate(bad);
    expect(badErr).toBeDefined();
  });

  test('getEmployeesByCampus: role required in user context', () => {
    const user = { tenantId: 't1', campusId: '550e8400-e29b-41d4-a716-446655440000', role: 'Admin' };
    const params = { campusId: '550e8400-e29b-41d4-a716-446655440000' };
    const { error: ue } = employeeSchema.getEmployeesByCampus.user.validate(user);
    const { error: pe } = employeeSchema.getEmployeesByCampus.params.validate(params);
    expect(ue).toBeUndefined();
    expect(pe).toBeUndefined();
    const missingRole = { tenantId: 't1', campusId: '550e8400-e29b-41d4-a716-446655440000' };
    const { error: mr } = employeeSchema.getEmployeesByCampus.user.validate(missingRole);
    expect(mr).toBeDefined();
  });
});

