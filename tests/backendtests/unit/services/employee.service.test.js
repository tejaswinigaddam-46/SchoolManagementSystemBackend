jest.mock('@/models/employee.model', () => ({
  isEmployeeIdUnique: jest.fn(),
  createEmployeeWithClient: jest.fn(),
  getAllEmployees: jest.fn(),
  findEmployeeByUsername: jest.fn(),
  updateEmployee: jest.fn(),
  getEmployeeStatistics: jest.fn()
}));
jest.mock('@/config/database', () => {
  const client = { query: jest.fn().mockResolvedValue({}), release: jest.fn() };
  return { pool: { connect: jest.fn().mockResolvedValue(client) } };
});
jest.mock('@/utils/response', () => ({
  createResponse: (success, message, data, statusCode) => ({ success, message, data, statusCode })
}));

const employeeService = require('@/services/employee.service');
const employeeModel = require('@/models/employee.model');

describe('Employee Service', () => {
  test('createEmployee: creates when employee_id unique', async () => {
    employeeModel.isEmployeeIdUnique.mockResolvedValue(true);
    employeeModel.createEmployeeWithClient.mockResolvedValue({
      username: 'emp-abc',
      user_id: 1,
      employee_id: 'EMP-123',
      first_name: 'John',
      last_name: 'Doe'
    });
    const body = {
      user: { first_name: 'John', last_name: 'Doe', date_of_birth: '1990-01-01', role: 'Employee' },
      contact: { email: 'john@example.com' },
      employment: { employee_id: 'EMP-123', designation: 'Teacher', department: 'Academics', joining_date: '2020-01-01' }
    };
    const ctx = { tenant_id: 't1', campus_id: 'c1', role: 'Admin' };
    const res = await employeeService.createEmployee(body, ctx);
    expect(res.success).toBe(true);
    expect(res.data.employee.username).toBe('emp-abc');
  });

  test('createEmployee: throws when employee_id duplicate', async () => {
    employeeModel.isEmployeeIdUnique.mockResolvedValue(false);
    const body = {
      user: { first_name: 'Jane', last_name: 'Doe', date_of_birth: '1992-02-02', role: 'Employee' },
      contact: { email: 'jane@example.com' },
      employment: { employee_id: 'EMP-999', designation: 'Teacher', department: 'Academics', joining_date: '2020-01-01' }
    };
    await expect(employeeService.createEmployee(body, { tenant_id: 't1', campus_id: 'c1', role: 'Admin' }))
      .rejects.toThrow(/already exists/);
  });

  test('getEmployeesByCampus: permission enforcement', async () => {
    await expect(employeeService.getEmployeesByCampus('campus-x', { tenant_id: 't1', campus_id: 'campus-y', role: 'Employee' }))
      .rejects.toThrow(/do not have permission/);
    employeeModel.getAllEmployees.mockResolvedValue({ employees: [], pagination: { total_count: 0 } });
    const res = await employeeService.getEmployeesByCampus('campus-x', { tenant_id: 't1', campus_id: 'campus-x', role: 'Employee' });
    expect(res.success).toBe(true);
  });

  test('updateEmployeeByUsername: duplicate employee_id throws', async () => {
    employeeModel.findEmployeeByUsername.mockResolvedValue({ campus_id: 'c1' });
    employeeModel.isEmployeeIdUnique.mockResolvedValue(false);
    await expect(employeeService.updateEmployeeByUsername('user1', { employment: { employee_id: 'EMP-1' } }, { tenant_id: 't1' }))
      .rejects.toThrow(/already exists/);
  });

  test('checkEmployeeIdAvailability: returns available false/true', async () => {
    employeeModel.isEmployeeIdUnique.mockResolvedValue(true);
    let res = await employeeService.checkEmployeeIdAvailability('EMP-1', 'c1', {});
    expect(res.data.available).toBe(true);
    employeeModel.isEmployeeIdUnique.mockResolvedValue(false);
    res = await employeeService.checkEmployeeIdAvailability('EMP-1', 'c1', {});
    expect(res.data.available).toBe(false);
  });

  test('getEmployeeStatistics: calls model with derived campus', async () => {
    employeeModel.getEmployeeStatistics.mockResolvedValue({ total_employees: 10 });
    const res = await employeeService.getEmployeeStatistics({ tenant_id: 't1', campus_id: 'c1' });
    expect(res.success).toBe(true);
    expect(res.data.total_employees).toBe(10);
  });
});

