const schema = require('@/schemas/exam.schema');

describe('Exam Schema', () => {
  const uuid = '550e8400-e29b-41d4-a716-446655440000';
  const examUuid = '123e4567-e89b-12d3-a456-426614174000';

  describe('createExam', () => {
    test('user context valid', () => {
      const { error } = schema.createExam.user.validate({ tenantId: 't1', campusId: uuid });
      expect(error).toBeUndefined();
    });

    test('user context invalid missing tenantId', () => {
      const { error } = schema.createExam.user.validate({ campusId: uuid });
      expect(error).toBeDefined();
    });

    test('body valid', () => {
      const { error } = schema.createExam.body.validate({
        event_id: examUuid,
        subject_name: 'Math',
        exam_date: '2024-05-01',
        total_score: 100
      });
      expect(error).toBeUndefined();
    });

    test('body invalid missing event_id', () => {
      const { error } = schema.createExam.body.validate({
        subject_name: 'Math',
        exam_date: '2024-05-01'
      });
      expect(error).toBeDefined();
    });
  });

  describe('getExams', () => {
    test('user context valid', () => {
      const { error } = schema.getExams.user.validate({ campusId: uuid });
      expect(error).toBeUndefined();
    });

    test('query valid with filters', () => {
      const { error } = schema.getExams.query.validate({
        academic_year_id: 1,
        start_date: '2024-01-01',
        end_date: '2024-12-31'
      });
      expect(error).toBeUndefined();
    });
  });

  describe('getExamById', () => {
    test('params valid', () => {
      const { error } = schema.getExamById.params.validate({ id: examUuid });
      expect(error).toBeUndefined();
    });

    test('params invalid id', () => {
      const { error } = schema.getExamById.params.validate({ id: 'not-a-uuid' });
      expect(error).toBeDefined();
    });
  });

  describe('updateExam', () => {
    test('params valid', () => {
      const { error } = schema.updateExam.params.validate({ id: examUuid });
      expect(error).toBeUndefined();
    });

    test('body valid', () => {
      const { error } = schema.updateExam.body.validate({ subject_name: 'Science' });
      expect(error).toBeUndefined();
    });

    test('body empty should fail (min 1)', () => {
      const { error } = schema.updateExam.body.validate({});
      expect(error).toBeDefined();
    });
  });

  describe('deleteExam', () => {
    test('params valid', () => {
      const { error } = schema.deleteExam.params.validate({ id: examUuid });
      expect(error).toBeUndefined();
    });
  });
});
