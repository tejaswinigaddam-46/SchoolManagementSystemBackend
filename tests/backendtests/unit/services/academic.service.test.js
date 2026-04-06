const academicService = require('@/services/academic.service');
const academicModel = require('@/models/academic.model');
const classModel = require('@/models/class.model');

jest.mock('@/models/academic.model');
jest.mock('@/models/class.model');
jest.mock('@/services/class.service', () => ({
  getClassesByCampus: jest.fn()
}));

describe('Academic Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  describe('Curricula', () => {
    test('getAllCurricula propagates db error', async () => {
      academicModel.getAllCurricula.mockRejectedValue(new Error('Database Connection Failed'));
      await expect(academicService.getAllCurricula('campus-1')).rejects.toThrow('Database Connection Failed');
    });

    test('getAllCurricula returns data', async () => {
      const rows = [{ curriculum_id: 1, curriculum_name: 'CBSE' }];
      academicModel.getAllCurricula.mockResolvedValue(rows);
      const res = await academicService.getAllCurricula('campus-1');
      expect(res).toEqual(rows);
      expect(academicModel.getAllCurricula).toHaveBeenCalledWith('campus-1');
    });

    test('createCurriculum success', async () => {
      const payload = { campus_id: 'campus-1', curriculum_code: 'CBSE', curriculum_name: 'CBSE' };
      const created = { curriculum_id: 1, ...payload };
      academicModel.createCurriculum.mockResolvedValue(created);
      const res = await academicService.createCurriculum(payload);
      expect(res).toEqual({ curriculumData: created, message: 'Curriculum created successfully' });
      expect(academicModel.createCurriculum).toHaveBeenCalledWith(payload);
    });

    test('createCurriculum unique violation maps message', async () => {
      const err = new Error('duplicate');
      err.code = '23505';
      academicModel.createCurriculum.mockRejectedValue(err);
      await expect(academicService.createCurriculum({})).rejects.toThrow('A curriculum with this code already exists for this campus');
    });

    test('updateCurriculum not found', async () => {
      academicModel.getCurriculumById.mockResolvedValue(null);
      await expect(academicService.updateCurriculum(1, {}, 'campus-1')).rejects.toThrow('Curriculum not found');
    });

    test('updateCurriculum success', async () => {
      const existing = { curriculum_id: 1 };
      const updated = { curriculum_id: 1, curriculum_name: 'Updated' };
      academicModel.getCurriculumById.mockResolvedValue(existing);
      academicModel.updateCurriculum.mockResolvedValue(updated);
      const res = await academicService.updateCurriculum(1, { curriculum_name: 'Updated' }, 'campus-1');
      expect(res).toEqual({ curriculumData: updated, message: 'Curriculum updated successfully' });
      expect(academicModel.updateCurriculum).toHaveBeenCalledWith(1, { curriculum_name: 'Updated' }, 'campus-1');
    });

    test('updateCurriculum unique violation maps message', async () => {
      academicModel.getCurriculumById.mockResolvedValue({ curriculum_id: 1 });
      const err = new Error('duplicate');
      err.code = '23505';
      academicModel.updateCurriculum.mockRejectedValue(err);
      await expect(academicService.updateCurriculum(1, {}, 'campus-1')).rejects.toThrow('A curriculum with this code already exists for this campus');
    });

    test('deleteCurriculum not found', async () => {
      academicModel.getCurriculumById.mockResolvedValue(null);
      await expect(academicService.deleteCurriculum(1, 'campus-1')).rejects.toThrow('Curriculum not found');
    });

    test('deleteCurriculum success', async () => {
      const existing = { curriculum_id: 1 };
      const deleted = { curriculum_id: 1 };
      academicModel.getCurriculumById.mockResolvedValue(existing);
      academicModel.deleteCurriculum.mockResolvedValue(deleted);
      const res = await academicService.deleteCurriculum(1, 'campus-1');
      expect(res).toEqual({ curriculumData: deleted, message: 'Curriculum deleted successfully' });
      expect(academicModel.deleteCurriculum).toHaveBeenCalledWith(1, 'campus-1');
    });

    test('deleteCurriculum foreign key violation maps message', async () => {
      academicModel.getCurriculumById.mockResolvedValue({ curriculum_id: 1 });
      const err = new Error('fk');
      err.code = '23503';
      academicModel.deleteCurriculum.mockRejectedValue(err);
      await expect(academicService.deleteCurriculum(1, 'campus-1')).rejects.toThrow('Cannot delete curriculum as it is being used by academic years');
    });

    test('getCurriculumById returns', async () => {
      const row = { curriculum_id: 1 };
      academicModel.getCurriculumById.mockResolvedValue(row);
      const res = await academicService.getCurriculumById(1, 'campus-1');
      expect(res).toEqual(row);
    });
  });

  describe('Academic Years', () => {
    test('getAllAcademicYears returns data', async () => {
      const rows = [{ academic_year_id: 1 }];
      academicModel.getAllAcademicYears.mockResolvedValue(rows);
      const res = await academicService.getAllAcademicYears('campus-1');
      expect(res).toEqual(rows);
    });

    test('createAcademicYear resolves class names and succeeds', async () => {
      classModel.getClassByName.mockResolvedValueOnce({ class_id: 10 });
      classModel.getClassByName.mockResolvedValueOnce({ class_id: 11 });
      academicModel.getCurriculumById.mockResolvedValue({ curriculum_id: 1 });
      const created = { academic_year_id: 1 };
      academicModel.createAcademicYear.mockResolvedValue(created);
      const payload = {
        campus_id: 'campus-1',
        year_name: '2024-2025',
        year_type: 'Current year',
        medium: 'English',
        fromclass: 'Grade 1',
        toclass: 'Grade 2',
        curriculum_id: 1
      };
      const res = await academicService.createAcademicYear(payload);
      expect(res).toEqual({ academicYearData: created, message: 'Academic year created successfully' });
      expect(payload.from_class_id).toBe(10);
      expect(payload.to_class_id).toBe(11);
    });

    test('createAcademicYear fails when fromclass not found', async () => {
      classModel.getClassByName.mockResolvedValueOnce(null);
      const payload = { campus_id: 'campus-1', fromclass: 'X', toclass: 'Y', curriculum_id: 1 };
      await expect(academicService.createAcademicYear(payload)).rejects.toThrow("From Class 'X' not found");
    });

    test('createAcademicYear fails when toclass not found', async () => {
      classModel.getClassByName.mockResolvedValueOnce({ class_id: 10 });
      classModel.getClassByName.mockResolvedValueOnce(null);
      const payload = { campus_id: 'campus-1', fromclass: 'A', toclass: 'B', curriculum_id: 1 };
      await expect(academicService.createAcademicYear(payload)).rejects.toThrow("To Class 'B' not found");
    });

    test('createAcademicYear unique violation maps message', async () => {
      classModel.getClassByName.mockResolvedValue({ class_id: 10 });
      classModel.getClassByName.mockResolvedValue({ class_id: 11 });
      academicModel.getCurriculumById.mockResolvedValue({ curriculum_id: 1 });
      const err = new Error('duplicate');
      err.code = '23505';
      academicModel.createAcademicYear.mockRejectedValue(err);
      const payload = { campus_id: 'campus-1', year_name: '2024-2025', year_type: 'Current year', medium: 'English', fromclass: 'A', toclass: 'B', curriculum_id: 1 };
      await expect(academicService.createAcademicYear(payload)).rejects.toThrow('An academic year with this combination already exists for this campus');
    });

    test('createAcademicYear foreign key violation maps message', async () => {
      classModel.getClassByName.mockResolvedValue({ class_id: 10 });
      classModel.getClassByName.mockResolvedValue({ class_id: 11 });
      academicModel.getCurriculumById.mockResolvedValue({ curriculum_id: 1 });
      const err = new Error('fk');
      err.code = '23503';
      academicModel.createAcademicYear.mockRejectedValue(err);
      const payload = { campus_id: 'campus-1', year_name: '2024-2025', year_type: 'Current year', medium: 'English', fromclass: 'A', toclass: 'B', curriculum_id: 1 };
      await expect(academicService.createAcademicYear(payload)).rejects.toThrow('Invalid curriculum ID or campus ID');
    });

    test('updateAcademicYear not found', async () => {
      academicModel.getAcademicYearById.mockResolvedValue(null);
      await expect(academicService.updateAcademicYear(1, {}, 'campus-1')).rejects.toThrow('Academic year not found');
    });

    test('updateAcademicYear resolves class names and succeeds', async () => {
      classModel.getClassByName.mockResolvedValueOnce({ class_id: 10 });
      classModel.getClassByName.mockResolvedValueOnce({ class_id: 11 });
      academicModel.getCurriculumById.mockResolvedValue({ curriculum_id: 1 });
      academicModel.getAcademicYearById.mockResolvedValue({ academic_year_id: 1 });
      const updated = { academic_year_id: 1, year_name: '2024-2025' };
      academicModel.updateAcademicYear.mockResolvedValue(updated);
      const payload = { fromclass: 'A', toclass: 'B', curriculum_id: 1 };
      const res = await academicService.updateAcademicYear(1, payload, 'campus-1');
      expect(res).toEqual({ academicYearData: updated, message: 'Academic year updated successfully' });
      expect(payload.from_class_id).toBe(10);
      expect(payload.to_class_id).toBe(11);
    });

    test('updateAcademicYear unique violation maps message', async () => {
      academicModel.getAcademicYearById.mockResolvedValue({ academic_year_id: 1 });
      const err = new Error('duplicate');
      err.code = '23505';
      academicModel.updateAcademicYear.mockRejectedValue(err);
      await expect(academicService.updateAcademicYear(1, {}, 'campus-1')).rejects.toThrow('An academic year with this combination already exists for this campus');
    });

    test('updateAcademicYear foreign key violation maps message', async () => {
      academicModel.getAcademicYearById.mockResolvedValue({ academic_year_id: 1 });
      const err = new Error('fk');
      err.code = '23503';
      academicModel.updateAcademicYear.mockRejectedValue(err);
      await expect(academicService.updateAcademicYear(1, {}, 'campus-1')).rejects.toThrow('Invalid curriculum ID');
    });

    test('deleteAcademicYear not found', async () => {
      academicModel.getAcademicYearById.mockResolvedValue(null);
      await expect(academicService.deleteAcademicYear(1, 'campus-1')).rejects.toThrow('Academic year not found');
    });

    test('deleteAcademicYear success', async () => {
      academicModel.getAcademicYearById.mockResolvedValue({ academic_year_id: 1 });
      academicModel.deleteAcademicYear.mockResolvedValue({ academic_year_id: 1 });
      const res = await academicService.deleteAcademicYear(1, 'campus-1');
      expect(res).toEqual({ academicYearData: { academic_year_id: 1 }, message: 'Academic year deleted successfully' });
    });

    test('deleteAcademicYear foreign key violation maps message', async () => {
      academicModel.getAcademicYearById.mockResolvedValue({ academic_year_id: 1 });
      const err = new Error('fk');
      err.code = '23503';
      academicModel.deleteAcademicYear.mockRejectedValue(err);
      await expect(academicService.deleteAcademicYear(1, 'campus-1')).rejects.toThrow('Cannot delete academic year as it is being referenced by other records');
    });

    test('getAcademicYearById returns data', async () => {
      const row = { academic_year_id: 1 };
      academicModel.getAcademicYearById.mockResolvedValue(row);
      const res = await academicService.getAcademicYearById(1, 'campus-1');
      expect(res).toEqual(row);
    });

    test('getAcademicYearOptions returns data', async () => {
      const rows = [{ academic_year_id: 1 }];
      academicModel.getAcademicYearOptions.mockResolvedValue(rows);
      const res = await academicService.getAcademicYearOptions('campus-1');
      expect(res).toEqual(rows);
    });

    test('getDistinctYearNames returns data', async () => {
      const rows = [{ year_name: '2024-2025' }];
      academicModel.getDistinctYearNames.mockResolvedValue(rows);
      const res = await academicService.getDistinctYearNames('campus-1');
      expect(res).toEqual(rows);
    });

    test('getDistinctMedia returns data', async () => {
      const rows = [{ medium: 'English' }];
      academicModel.getDistinctMedia.mockResolvedValue(rows);
      const res = await academicService.getDistinctMedia('campus-1');
      expect(res).toEqual(rows);
    });

    test('getAcademicYearIdByCombo returns data', async () => {
      const row = { academic_year_id: 42 };
      academicModel.getAcademicYearIdByCombo.mockResolvedValue(row);
      const res = await academicService.getAcademicYearIdByCombo('campus-1', '2024-2025', 'Current year', 1, 'English');
      expect(res).toEqual(row);
      expect(academicModel.getAcademicYearIdByCombo).toHaveBeenCalledWith('campus-1', '2024-2025', 'Current year', 1, 'English');
    });

    test('getFilterOptions returns combined data', async () => {
      const academicRows = [{ academic_year_id: 1, year_name: '2024-2025' }];
      academicModel.getAcademicYearOptions.mockResolvedValue(academicRows);
      const classService = require('@/services/class.service');
      classService.getClassesByCampus.mockResolvedValue([
        { class_id: 10, class_name: 'Grade 1', class_level: 1 },
        { class_id: 11, class_name: 'Grade 2', class_level: 2 }
      ]);
      const res = await academicService.getFilterOptions('campus-1', 'tenant-1');
      expect(res).toEqual({
        academic_years: academicRows,
        classes: [
          { class_id: 10, class_name: 'Grade 1', class_level: 1 },
          { class_id: 11, class_name: 'Grade 2', class_level: 2 }
        ]
      });
    });
  });
});
