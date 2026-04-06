const studentSchema = require('@/schemas/student.schema');

describe('Student Schema', () => {
  test('registerStudent: valid body passes with academicYearId', () => {
    const user = { tenantId: 't1', campusId: '550e8400-e29b-41d4-a716-446655440000' };
    const body = {
      firstName: 'John',
      lastName: 'Doe',
      admissionNumber: 'ADM-001',
      dateOfBirth: '2010-01-01',
      email: 'john@example.com',
      academicYearId: 2024
    };
    const { error: ue } = studentSchema.registerStudent.user.validate(user);
    const { error } = studentSchema.registerStudent.body.validate(body);
    expect(ue).toBeUndefined();
    expect(error).toBeUndefined();
  });

  test('registerStudent: requires one of academicYearId or academic_year_id', () => {
    const body = {
      firstName: 'John',
      lastName: 'Doe',
      admissionNumber: 'ADM-001',
      dateOfBirth: '2010-01-01',
      email: 'john@example.com'
    };
    const { error } = studentSchema.registerStudent.body.validate(body);
    expect(error).toBeDefined();
  });

  test('getStudentsByClassSection: academicYear pattern enforced', () => {
    const params = { class: '10', section: 'A' };
    const query = { academicYear: '2024-2025' };
    const { error: pe } = studentSchema.getStudentsByClassSection.params.validate(params);
    const { error: qe } = studentSchema.getStudentsByClassSection.query.validate(query);
    expect(pe).toBeUndefined();
    expect(qe).toBeUndefined();
    const badQuery = { academicYear: '2024' };
    const { error: bqe } = studentSchema.getStudentsByClassSection.query.validate(badQuery);
    expect(bqe).toBeDefined();
  });

  test('updateStudent: dateOfBirth optional ISO', () => {
    const body = { dateOfBirth: '2011-05-05' };
    const { error } = studentSchema.updateStudent.body.validate(body);
    expect(error).toBeUndefined();
  });

  test('getStudentsByFilters: allows campus_id in query', () => {
    const query = {
      academic_year_id: 2024,
      class_id: 10,
      assignment_status: 'unassigned',
      campus_id: '550e8400-e29b-41d4-a716-446655440000'
    };
    const { error } = studentSchema.getStudentsByFilters.query.validate(query);
    expect(error).toBeUndefined();
  });

  test('getStudentsByFilters: rejects invalid campus_id', () => {
    const query = {
      academic_year_id: 2024,
      class_id: 10,
      assignment_status: 'unassigned',
      campus_id: 'not-a-uuid'
    };
    const { error } = studentSchema.getStudentsByFilters.query.validate(query);
    expect(error).toBeDefined();
  });
});
