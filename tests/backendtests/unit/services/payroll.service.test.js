const payrollService = require('@/services/payroll.service');
const consolidatedAttendanceService = require('@/services/consolidatedAttendance.service');
const employeeModel = require('@/models/employee.model');

jest.mock('@/services/consolidatedAttendance.service');
jest.mock('@/models/employee.model');
jest.mock('@/utils/logger');

describe('Payroll Service', () => {
  const campusId = 'campus-uuid';
  const tenantId = 'tenant-123';
  const roles = ['Teacher'];
  const yearName = '2025-2026';
  const startDate = '2026-03-01';
  const endDate = '2026-03-31';

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPayrollReport', () => {
    test('successfully generates payroll report', async () => {
      const mockAttendance = [
        {
          username: 'user1',
          first_name: 'First',
          last_name: 'Last',
          role: 'Teacher',
          status: 'Present',
          is_holiday: false
        },
        {
          username: 'user1',
          first_name: 'First',
          last_name: 'Last',
          role: 'Teacher',
          status: 'No Attendance',
          is_holiday: true
        }
      ];

      const mockSalaries = [
        { username: 'user1', salary: 3000 }
      ];

      consolidatedAttendanceService.getConsolidatedAttendance.mockResolvedValue(mockAttendance);
      employeeModel.getEmployeeSalaries.mockResolvedValue(mockSalaries);

      const result = await payrollService.getPayrollReport(campusId, roles, yearName, startDate, endDate, tenantId);

      expect(result).toHaveLength(1);
      const userResult = result[0];
      expect(userResult.username).toBe('user1');
      expect(userResult.present_days).toBe(1);
      expect(userResult.holidays).toBe(1);
      expect(userResult.payroll_days).toBe(2);
      expect(userResult.daily_pay).toBe(100); // 3000 / 30
      expect(userResult.total_pay).toBe(200); // 2 * 100
    });

    test('handles empty attendance', async () => {
      consolidatedAttendanceService.getConsolidatedAttendance.mockResolvedValue([]);
      const result = await payrollService.getPayrollReport(campusId, roles, yearName, startDate, endDate, tenantId);
      expect(result).toEqual([]);
    });
  });

  describe('getMyPayrollReport', () => {
    test('returns report for specific user', async () => {
      const mockAttendance = [
        { username: 'user1', role: 'Teacher', status: 'Present', is_holiday: false },
        { username: 'user2', role: 'Teacher', status: 'Present', is_holiday: false }
      ];
      const mockSalaries = [
        { username: 'user1', salary: 3000 },
        { username: 'user2', salary: 3000 }
      ];

      consolidatedAttendanceService.getConsolidatedAttendance.mockResolvedValue(mockAttendance);
      employeeModel.getEmployeeSalaries.mockResolvedValue(mockSalaries);

      const result = await payrollService.getMyPayrollReport(campusId, 'user1', 'Teacher', yearName, startDate, endDate, tenantId);
      
      expect(result).toHaveLength(1);
      expect(result[0].username).toBe('user1');
    });
  });
});
