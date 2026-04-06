const SectionSubjectService = require('@/services/sectionSubject.service');
const SectionSubjectModel = require('@/models/sectionSubject.model');

jest.mock('@/models/sectionSubject.model');
jest.mock('@/utils/logger');

describe('SectionSubject Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('bulkAssign', () => {
    test('successfully assigns subjects', async () => {
      const assignments = [{ section_id: 1, subject_id: 1 }];
      SectionSubjectModel.bulkUpsert.mockResolvedValue({ inserted: 1, updated: 0 });

      const result = await SectionSubjectService.bulkAssign(assignments);
      expect(result.inserted).toBe(1);
      expect(SectionSubjectModel.bulkUpsert).toHaveBeenCalledWith(assignments);
    });
  });

  describe('listBySectionIds', () => {
    test('returns assignments', async () => {
      const sectionIds = [1, 2];
      const mockList = [{ section_id: 1, subject_id: 1 }];
      SectionSubjectModel.getBySectionIds.mockResolvedValue(mockList);

      const result = await SectionSubjectService.listBySectionIds(sectionIds);
      expect(result).toEqual(mockList);
    });
  });

  describe('unassign', () => {
    test('successfully unassigns subjects', async () => {
      SectionSubjectModel.clearTeacherBySectionAndSubjects.mockResolvedValue({ cleared: 2 });

      const result = await SectionSubjectService.unassign(1, [1, 2]);
      expect(result.cleared).toBe(2);
    });
  });
});
