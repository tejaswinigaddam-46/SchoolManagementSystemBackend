const subjectService = require('@/services/subject.service');
const subjectModel = require('@/models/subject.model');

jest.mock('@/models/subject.model');
jest.mock('@/utils/logger');

describe('Subject Service', () => {
  const campusId = 'campus-uuid';

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createSubject', () => {
    const subjectData = {
      subject_name: 'Mathematics',
      category: 'Academic',
      curriculum_id: 1
    };

    test('successfully creates a subject', async () => {
      subjectModel.checkSubjectExists.mockResolvedValue(false);
      subjectModel.createSubject.mockResolvedValue({ subject_id: 1, ...subjectData });

      const result = await subjectService.createSubject(campusId, subjectData);

      expect(result.subject_id).toBe(1);
      expect(subjectModel.createSubject).toHaveBeenCalled();
    });

    test('throws error if subject exists', async () => {
      subjectModel.checkSubjectExists.mockResolvedValue(true);

      await expect(subjectService.createSubject(campusId, subjectData))
        .rejects.toThrow(/already exists/);
    });
  });

  describe('getAllSubjects', () => {
    test('returns subjects list', async () => {
      const mockSubjects = [{ subject_id: 1 }];
      subjectModel.getAllSubjects.mockResolvedValue(mockSubjects);

      const result = await subjectService.getAllSubjects(campusId);
      expect(result.subjects).toEqual(mockSubjects);
      expect(result.total).toBe(1);
    });
  });

  describe('getSubjectById', () => {
    test('returns subject if found', async () => {
      const mockSubject = { subject_id: 1 };
      subjectModel.getSubjectById.mockResolvedValue(mockSubject);

      const result = await subjectService.getSubjectById(campusId, 1);
      expect(result).toEqual(mockSubject);
    });

    test('throws error if not found', async () => {
      subjectModel.getSubjectById.mockResolvedValue(null);
      await expect(subjectService.getSubjectById(campusId, 1))
        .rejects.toThrow('Subject not found');
    });
  });

  describe('updateSubject', () => {
    test('successfully updates a subject', async () => {
      const existing = { subject_id: 1, subject_name: 'Old', curriculum_id: 1 };
      const updates = { subject_name: 'New' };
      subjectModel.getSubjectById.mockResolvedValue(existing);
      subjectModel.checkSubjectExists.mockResolvedValue(false);
      subjectModel.updateSubject.mockResolvedValue({ ...existing, ...updates });

      const result = await subjectService.updateSubject(campusId, 1, updates);
      expect(result.subject_name).toBe('New');
    });
  });

  describe('deleteSubject', () => {
    test('successfully deletes a subject', async () => {
      subjectModel.getSubjectById.mockResolvedValue({ subject_id: 1 });
      subjectModel.checkSubjectInUse.mockResolvedValue(false);
      subjectModel.deleteSubject.mockResolvedValue({ subject_id: 1 });

      const result = await subjectService.deleteSubject(campusId, 1);
      expect(result.message).toBe('Subject deleted successfully');
    });

    test('throws error if subject in use', async () => {
      subjectModel.getSubjectById.mockResolvedValue({ subject_id: 1 });
      subjectModel.checkSubjectInUse.mockResolvedValue(true);

      await expect(subjectService.deleteSubject(campusId, 1))
        .rejects.toThrow(/being used/);
    });
  });
});
