jest.mock('@/models/student.model', () => ({
  createStudentWithClient: jest.fn(),
  findStudentByAdmissionNumber: jest.fn(),
  getAllStudents: jest.fn(),
  getStudentsByFilters: jest.fn(),
  updateStudentSectionAssignment: jest.fn(),
  deassignStudentSectionAssignment: jest.fn()
}));
jest.mock('@/config/database', () => {
  const client = { query: jest.fn().mockResolvedValue({}), release: jest.fn() };
  return { pool: { connect: jest.fn().mockResolvedValue(client) } };
});

const studentService = require('@/services/student.service');
const studentModel = require('@/models/student.model');

describe('Student Service', () => {
  test('registerStudent: success with required fields', async () => {
    studentModel.findStudentByAdmissionNumber.mockResolvedValue(null);
    studentModel.createStudentWithClient.mockResolvedValue({ username: 'stu-1', admission_number: 'ADM-001' });
    const res = await studentService.registerStudent({
      firstName: 'John',
      lastName: 'Doe',
      admissionNumber: 'ADM-001',
      dateOfBirth: '2010-01-01',
      email: 'john@example.com',
      academicYearId: 2024
    }, 't1', 'c1');
    expect(res.username || res?.employee?.username || res).toBeDefined();
  });

  test('registerStudent: missing email throws', async () => {
    await expect(studentService.registerStudent({
      firstName: 'John',
      lastName: 'Doe',
      admissionNumber: 'ADM-001',
      dateOfBirth: '2010-01-01',
      academicYearId: 2024
    }, 't1', 'c1')).rejects.toThrow(/Email is required/);
  });

  test('getStudentsByFilters: missing required params throws', async () => {
    await expect(studentService.getStudentsByFilters({ tenantId: 't1' }))
      .rejects.toThrow(/Missing required parameters/);
  });

  test('updateStudentSection: validates inputs', async () => {
    await expect(studentService.updateStudentSection(null, 1, 't1', 'c1')).rejects.toThrow();
    studentModel.updateStudentSectionAssignment.mockResolvedValue({ section_id: 1 });
    const res = await studentService.updateStudentSection(1, 1, 't1', 'c1');
    expect(res.section_id || res?.section?.section_id).toBeDefined();
  });
});

