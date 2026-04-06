const specialWorkingDayService = require('@/services/specialWorkingDay.service');
const specialWorkingDayModel = require('@/models/specialWorkingDay.model');

jest.mock('@/models/specialWorkingDay.model');
jest.mock('@/utils/logger');

describe('SpecialWorkingDay Service', () => {
  const campusId = 'campus-uuid';
  const academicYearIds = [1, 2];
  const workDate = '2026-03-29';
  const description = 'Make-up day';

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    test('successfully creates a special working day', async () => {
      const mockResult = { id: 1, work_date: workDate, description, academic_year_ids: academicYearIds };
      specialWorkingDayModel.create.mockResolvedValue(mockResult);

      const result = await specialWorkingDayService.create(campusId, { work_date: workDate, description, academic_year_ids: academicYearIds });

      expect(result).toEqual(mockResult);
      expect(specialWorkingDayModel.create).toHaveBeenCalledWith(campusId, { work_date: workDate, description, academic_year_ids: academicYearIds });
    });
  });

  describe('getAll', () => {
    test('returns special working days list', async () => {
      const mockList = [{ id: 1, work_date: workDate }];
      specialWorkingDayModel.getAll.mockResolvedValue(mockList);

      const result = await specialWorkingDayService.getAll(campusId, { startDate: '2026-01-01' });
      expect(result).toEqual(mockList);
    });
  });

  describe('update', () => {
    test('successfully updates a special working day', async () => {
      const mockResult = { id: 1, work_date: workDate, description, academic_year_ids: academicYearIds };
      specialWorkingDayModel.update.mockResolvedValue(mockResult);

      const result = await specialWorkingDayService.update(1, campusId, { work_date: workDate, description, academic_year_ids: academicYearIds });
      expect(result).toEqual(mockResult);
    });
  });

  describe('delete', () => {
    test('successfully deletes a special working day', async () => {
      specialWorkingDayModel.delete.mockResolvedValue({ id: 1 });

      const result = await specialWorkingDayService.delete(1, campusId);
      expect(result.id).toBe(1);
    });
  });
});
