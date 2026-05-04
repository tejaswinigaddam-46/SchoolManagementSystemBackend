const { ExamService } = require('@/services/exam.service');
const ExamModel = require('@/models/exam.model');
const EventModel = require('@/models/event.model');
const { pool } = require('@/config/database');

jest.mock('@/models/exam.model');
jest.mock('@/models/event.model');
jest.mock('@/config/database');

describe('Exam Service', () => {
  const examUuid = '123e4567-e89b-12d3-a456-426614174000';
  const eventUuid = '223e4567-e89b-12d3-a456-426614174000';
  const instanceUuid = '323e4567-e89b-12d3-a456-426614174000';

  const mockClient = {
    query: jest.fn(),
    release: jest.fn()
  };

  beforeEach(() => {
    pool.connect.mockResolvedValue(mockClient);
    mockClient.query.mockImplementation(async (q) => {
      if (q === 'BEGIN' || q === 'COMMIT' || q === 'ROLLBACK') return;
      if (q.includes('SELECT instance_id FROM calendar_event_instances')) {
        return { rows: [{ instance_id: instanceUuid }] };
      }
      return { rows: [] };
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createExam', () => {
    test('creates exam successfully', async () => {
      const examData = { event_id: eventUuid, subject_name: 'Math', exam_date: '2024-05-01' };
      const created = { exam_id: examUuid, ...examData };
      ExamModel.createExam.mockResolvedValue(created);
      EventModel.getEventById.mockResolvedValue({ event_id: eventUuid, start_date: '2024-05-01', end_date: '2024-05-01', start_time: '09:00:00', end_time: '10:00:00', room_id: null });

      const result = await ExamService.createExam(examData, 'tenant-1', 'campus-1');

      expect(result).toEqual(created);
      expect(ExamModel.createExam).toHaveBeenCalledWith({
        ...examData,
        event_instance_id: instanceUuid,
        tenant_id: 'tenant-1',
        campus_id: 'campus-1'
      }, expect.any(Object));
    });

    test('creates exam with client', async () => {
      const mockProvidedClient = { query: jest.fn(), release: jest.fn() };
      mockProvidedClient.query.mockImplementation(async (q) => {
        if (q.includes('SELECT instance_id FROM calendar_event_instances')) {
          return { rows: [{ instance_id: instanceUuid }] };
        }
        return { rows: [] };
      });
      ExamModel.createExam.mockResolvedValue({ exam_id: examUuid });
      EventModel.getEventById.mockResolvedValue({ event_id: eventUuid, start_date: '2024-05-01', end_date: '2024-05-01', start_time: '09:00:00', end_time: '10:00:00', room_id: null });
      
      await ExamService.createExam({ event_id: eventUuid }, 't1', 'c1', mockProvidedClient);
      expect(ExamModel.createExam).toHaveBeenCalledWith(expect.any(Object), mockProvidedClient);
    });
  });

  describe('getExamById', () => {
    test('returns exam', async () => {
      const exam = { exam_id: examUuid };
      ExamModel.getExamById.mockResolvedValue(exam);

      const result = await ExamService.getExamById(examUuid);

      expect(result).toEqual(exam);
      expect(ExamModel.getExamById).toHaveBeenCalledWith(examUuid);
    });
  });

  describe('getExams', () => {
    test('returns exams for campus', async () => {
      const exams = [{ exam_id: examUuid }];
      ExamModel.getExamsByCampus.mockResolvedValue(exams);

      const filters = { academic_year_id: 1 };
      const result = await ExamService.getExams('campus-1', filters);

      expect(result).toEqual(exams);
      expect(ExamModel.getExamsByCampus).toHaveBeenCalledWith('campus-1', filters);
    });
  });

  describe('updateExam', () => {
    test('updates exam successfully', async () => {
      const updateData = { subject_name: 'Science' };
      const updated = { exam_id: examUuid, ...updateData };
      ExamModel.updateExam.mockResolvedValue(updated);

      const result = await ExamService.updateExam(examUuid, updateData, 'tenant-1', 'campus-1');

      expect(result).toEqual(updated);
      expect(ExamModel.updateExam).toHaveBeenCalledWith(examUuid, expect.any(Object), expect.any(Object));
    });
  });

  describe('deleteExam', () => {
    test('deletes exam successfully', async () => {
      ExamModel.deleteExam.mockResolvedValue({ exam_id: examUuid });

      const result = await ExamService.deleteExam(examUuid);

      expect(result).toEqual({ exam_id: examUuid });
      expect(ExamModel.deleteExam).toHaveBeenCalledWith(examUuid);
    });
  });
});
