const { ExamResultService } = require('@/services/examResult.service');
const ExamResultModel = require('@/models/examResult.model');
const ExamModel = require('@/models/exam.model');

jest.mock('@/models/examResult.model');
jest.mock('@/models/exam.model');

describe('ExamResult Service', () => {
  const examUuid = '123e4567-e89b-12d3-a456-426614174000';
  const resultUuid = '223e4567-e89b-12d3-a456-426614174000';

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createResult', () => {
    test('creates result with calculated is_passed', async () => {
      const resultData = { exam_id: examUuid, obtained_score: 80 };
      ExamModel.getExamById.mockResolvedValue({ passing_score: '50.00' });
      ExamResultModel.createResult.mockResolvedValue({ result_id: resultUuid, is_passed: true });

      const result = await ExamResultService.createResult(resultData, 't1', 'c1');

      expect(ExamModel.getExamById).toHaveBeenCalledWith(examUuid);
      expect(ExamResultModel.createResult).toHaveBeenCalledWith({
        ...resultData,
        is_passed: true,
        tenant_id: 't1',
        campus_id: 'c1'
      });
      expect(result.is_passed).toBe(true);
    });

    test('creates result failed is_passed', async () => {
      const resultData = { exam_id: examUuid, obtained_score: 40 };
      ExamModel.getExamById.mockResolvedValue({ passing_score: '50.00' });
      ExamResultModel.createResult.mockResolvedValue({ result_id: resultUuid, is_passed: false });

      await ExamResultService.createResult(resultData, 't1', 'c1');

      expect(ExamResultModel.createResult).toHaveBeenCalledWith(
        expect.objectContaining({ is_passed: false })
      );
    });
  });

  describe('createBulkResults', () => {
    test('processes and creates bulk results', async () => {
      const resultsData = [
        { exam_id: examUuid, obtained_score: 80 },
        { exam_id: examUuid, obtained_score: 40 }
      ];
      ExamModel.getExamById.mockResolvedValue({ passing_score: '50.00' });
      ExamResultModel.createBulkResults.mockResolvedValue([{ result_id: resultUuid }, { result_id: resultUuid }]);

      const result = await ExamResultService.createBulkResults(resultsData, 't1', 'c1');

      expect(ExamModel.getExamById).toHaveBeenCalledTimes(1);
      expect(ExamResultModel.createBulkResults).toHaveBeenCalledWith([
        expect.objectContaining({ is_passed: true, tenant_id: 't1', campus_id: 'c1' }),
        expect.objectContaining({ is_passed: false, tenant_id: 't1', campus_id: 'c1' })
      ]);
      expect(result).toHaveLength(2);
    });
  });

  describe('getResultById', () => {
    test('returns result', async () => {
      ExamResultModel.getResultById.mockResolvedValue({ result_id: resultUuid });
      const result = await ExamResultService.getResultById(resultUuid);
      expect(result).toEqual({ result_id: resultUuid });
    });
  });

  describe('updateResult', () => {
    test('updates result and recalculates is_passed', async () => {
      ExamResultModel.getResultById.mockResolvedValue({ exam_id: examUuid });
      ExamModel.getExamById.mockResolvedValue({ passing_score: '50.00' });
      ExamResultModel.updateResult.mockResolvedValue({ result_id: resultUuid, is_passed: true });

      const result = await ExamResultService.updateResult(resultUuid, { obtained_score: 90 });

      expect(ExamResultModel.getResultById).toHaveBeenCalledWith(resultUuid);
      expect(ExamModel.getExamById).toHaveBeenCalledWith(examUuid);
      expect(ExamResultModel.updateResult).toHaveBeenCalledWith(resultUuid, {
        obtained_score: 90,
        is_passed: true
      });
      expect(result.is_passed).toBe(true);
    });

    test('throws error if result not found', async () => {
      ExamResultModel.getResultById.mockResolvedValue(null);
      await expect(ExamResultService.updateResult(resultUuid, { obtained_score: 90 }))
        .rejects.toThrow('Exam result not found');
    });
  });

  describe('deleteResult', () => {
    test('deletes result', async () => {
      ExamResultModel.deleteResult.mockResolvedValue({ result_id: resultUuid });
      const result = await ExamResultService.deleteResult(resultUuid);
      expect(result).toEqual({ result_id: resultUuid });
    });
  });
});
