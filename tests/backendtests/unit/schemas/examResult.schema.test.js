const schema = require('@/schemas/examresult.schema');

describe('ExamResult Schema', () => {
  const uuid = '550e8400-e29b-41d4-a716-446655440000';
  const examUuid = '123e4567-e89b-12d3-a456-426614174000';
  const resultUuid = '223e4567-e89b-12d3-a456-426614174000';

  describe('createExamResult', () => {
    test('user context valid', () => {
      const { error } = schema.createExamResult.user.validate({ tenantId: 't1', campusId: uuid });
      expect(error).toBeUndefined();
    });

    test('body valid', () => {
      const { error } = schema.createExamResult.body.validate({
        exam_id: examUuid,
        student_username: 'stu1',
        attendance_status: 'Present',
        obtained_score: 85
      });
      expect(error).toBeUndefined();
    });

    test('body invalid missing student_username', () => {
      const { error } = schema.createExamResult.body.validate({
        exam_id: examUuid
      });
      expect(error).toBeDefined();
    });
  });

  describe('bulkCreateExamResults', () => {
    test('body valid', () => {
      const { error } = schema.bulkCreateExamResults.body.validate({
        results: [
          { exam_id: examUuid, student_username: 'stu1', obtained_score: 90 },
          { exam_id: examUuid, student_username: 'stu2', attendance_status: 'Absent' }
        ]
      });
      expect(error).toBeUndefined();
    });

    test('body invalid empty results array', () => {
      const { error } = schema.bulkCreateExamResults.body.validate({ results: [] });
      expect(error).toBeDefined();
    });
  });

  describe('getExamResultById', () => {
    test('params valid', () => {
      const { error } = schema.getExamResultById.params.validate({ id: resultUuid });
      expect(error).toBeUndefined();
    });
  });

  describe('updateExamResult', () => {
    test('body valid', () => {
      const { error } = schema.updateExamResult.body.validate({ obtained_score: 95 });
      expect(error).toBeUndefined();
    });

    test('body empty should fail (min 1)', () => {
      const { error } = schema.updateExamResult.body.validate({});
      expect(error).toBeDefined();
    });
  });

  describe('getExamResultsByExamId', () => {
    test('params valid', () => {
      const { error } = schema.getExamResultsByExamId.params.validate({ examId: examUuid });
      expect(error).toBeUndefined();
    });
  });

  describe('getExamResultsByStudentId', () => {
    test('params valid', () => {
      const { error } = schema.getExamResultsByStudentId.params.validate({ studentId: 'stu1' });
      expect(error).toBeUndefined();
    });
  });
});
