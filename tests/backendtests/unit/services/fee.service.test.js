const feeService = require('@/services/fee.service');
const feeModel = require('@/models/fee.model');
const classModel = require('@/models/class.model');
const studentModel = require('@/models/student.model');
const { pool } = require('@/config/database');

jest.mock('@/models/fee.model');
jest.mock('@/models/class.model');
jest.mock('@/models/student.model');
jest.mock('@/config/database', () => ({
  pool: {
    connect: jest.fn()
  }
}));
jest.mock('@/utils/logger');

describe('Fee Service', () => {
  const tenantId = 'tenant-123';
  const campusId = 'campus-uuid';
  const feeTypeId = 'fee-type-uuid';
  const feeStructureId = 'fee-structure-uuid';
  const studentId = 'student-uuid';

  const mockClient = {
    query: jest.fn(),
    release: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    pool.connect.mockResolvedValue(mockClient);
  });

  describe('createFeeType', () => {
    test('successfully creates a fee type', async () => {
      const data = { campus_id: campusId, fee_type_name: 'Tuition', description: 'Desc' };
      feeModel.createFeeType.mockResolvedValue({ id: feeTypeId, ...data });

      const result = await feeService.createFeeType(tenantId, data);

      expect(result.id).toBe(feeTypeId);
      expect(feeModel.createFeeType).toHaveBeenCalled();
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('createFeeStructure', () => {
    test('successfully creates fee structure with installments', async () => {
      const data = {
        campus_id: campusId,
        academic_year_id: 1,
        class_id: 10,
        fee_type_id: feeTypeId,
        total_amount: 1000,
        installments: [{ installment_name: 'I1', due_date: '2026-01-01', amount: 1000 }]
      };

      classModel.getClassNameById.mockResolvedValue('Grade 1');
      feeModel.createFeeStructureWithInstallments.mockResolvedValue({ fee_structure_id: feeStructureId });

      const result = await feeService.createFeeStructure(tenantId, data);

      expect(result.fee_structure_id).toBe(feeStructureId);
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('getStudentFeeDues', () => {
    test('returns enriched student dues', async () => {
      const filters = { class_id: 10 };
      const mockDues = [
        { student_id: studentId, amount: 500, balance_amount: 500 }
      ];
      const mockStudents = [
        { username: 'student1', first_name: 'John', last_name: 'Doe', admission_number: 'A001' }
      ];

      // Need to mock toStudentUUID to match studentId
      const { v5: uuidv5 } = require('uuid');
      const NAMESPACE_STUDENT = '4d8a1f6c-0cb0-4c3e-9e5d-4f9fd1fbb002';
      const expectedStudentId = uuidv5('student1', NAMESPACE_STUDENT);
      mockDues[0].student_id = expectedStudentId;

      classModel.getClassNameById.mockResolvedValue('Grade 1');
      feeModel.getStudentFeeDues.mockResolvedValue(mockDues);
      studentModel.getStudentDetailsForTenant.mockResolvedValue(mockStudents);

      const result = await feeService.getStudentFeeDues(tenantId, campusId, filters);

      expect(result).toHaveLength(1);
      expect(result[0].student_name).toBe('John Doe');
      expect(result[0].admission_number).toBe('A001');
    });
  });

  describe('collectPayment', () => {
    test('successfully collects payment via waterfall', async () => {
      const data = {
        tenant_id: tenantId,
        student_username: 'student1',
        total_amount_received: 1000,
        payment_method: 'Cash',
        collected_by: 1
      };

      const mockDues = [
        { due_id: 'due1', balance_amount: 600 },
        { due_id: 'due2', balance_amount: 600 }
      ];

      feeModel.getUnpaidDuesByStudent.mockResolvedValue(mockDues);
      feeModel.insertPayment.mockResolvedValue({ payment_id: 'pay1' });

      const result = await feeService.collectPayment(data);

      expect(result.payment.payment_id).toBe('pay1');
      expect(feeModel.reduceDueBalance).toHaveBeenCalledTimes(2);
      expect(feeModel.insertPaymentAllocation).toHaveBeenCalledTimes(2);
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });
  });
});
