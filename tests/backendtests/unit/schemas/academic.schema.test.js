const schema = require('@/schemas/academic.schema');

describe('Academic Schema', () => {
  const uuid = '550e8400-e29b-41d4-a716-446655440000';

  describe('Curricula', () => {
    test('getAllCurricula params valid', () => {
      const { error } = schema.getAllCurricula.params.validate({ campusId: uuid });
      expect(error).toBeUndefined();
    });

    test('getAllCurricula params invalid uuid', () => {
      const { error } = schema.getAllCurricula.params.validate({ campusId: 'not-uuid' });
      expect(error).toBeDefined();
    });

    test('getAllCurricula params null campusId', () => {
      const { error } = schema.getAllCurricula.params.validate({ campusId: null });
      expect(error).toBeDefined();
    });

    test('createCurriculum body valid', () => {
      const body = { curriculum_code: 'CBSE_2024', curriculum_name: 'CBSE' };
      const { error } = schema.createCurriculum.body.validate(body);
      expect(error).toBeUndefined();
    });

    test('createCurriculum body invalid code pattern', () => {
      const body = { curriculum_code: 'CBSE 2024', curriculum_name: 'CBSE' };
      const { error } = schema.createCurriculum.body.validate(body);
      expect(error).toBeDefined();
    });

    test('getCurriculumById params valid', () => {
      const { error } = schema.getCurriculumById.params.validate({ campusId: uuid, curriculumId: 1 });
      expect(error).toBeUndefined();
    });

    test('getCurriculumById params invalid id', () => {
      const { error } = schema.getCurriculumById.params.validate({ campusId: uuid, curriculumId: 0 });
      expect(error).toBeDefined();
    });

    test('getCurriculumById params null campusId', () => {
      const { error } = schema.getCurriculumById.params.validate({ campusId: null, curriculumId: 1 });
      expect(error).toBeDefined();
    });

    test('getCurriculumById params null curriculumId', () => {
      const { error } = schema.getCurriculumById.params.validate({ campusId: uuid, curriculumId: null });
      expect(error).toBeDefined();
    });

    test('updateCurriculum body valid', () => {
      const body = { curriculum_code: 'STATE-2025', curriculum_name: 'State Board' };
      const { error } = schema.updateCurriculum.body.validate(body);
      expect(error).toBeUndefined();
    });

    test('deleteCurriculum params valid', () => {
      const { error } = schema.deleteCurriculum.params.validate({ campusId: uuid, curriculumId: 2 });
      expect(error).toBeUndefined();
    });

    test('deleteCurriculum params null campusId', () => {
      const { error } = schema.deleteCurriculum.params.validate({ campusId: null, curriculumId: 2 });
      expect(error).toBeDefined();
    });

    test('deleteCurriculum params null curriculumId', () => {
      const { error } = schema.deleteCurriculum.params.validate({ campusId: uuid, curriculumId: null });
      expect(error).toBeDefined();
    });
  });

  describe('Academic Years', () => {
    const validBody = {
      year_name: '2024-2025',
      year_type: 'Current year',
      medium: 'English',
      start_date: '2024-06-01',
      end_date: '2025-04-30',
      fromclass: 'Grade 1',
      toclass: 'Grade 2',
      start_time_of_day: '08:30',
      end_time_of_day: '15:30',
      shift_type: 'Morning',
      curriculum_id: 1
    };

    test('getAcademicYearOptions params valid', () => {
      const { error } = schema.getAcademicYearOptions.params.validate({ campusId: uuid });
      expect(error).toBeUndefined();
    });

    test('getAcademicYearOptions params null campusId', () => {
      const { error } = schema.getAcademicYearOptions.params.validate({ campusId: null });
      expect(error).toBeDefined();
    });

    test('getDistinctYearNames params valid', () => {
      const { error } = schema.getDistinctYearNames.params.validate({ campusId: uuid });
      expect(error).toBeUndefined();
    });

    test('getDistinctYearNames params null campusId', () => {
      const { error } = schema.getDistinctYearNames.params.validate({ campusId: null });
      expect(error).toBeDefined();
    });

    test('getDistinctMedia params valid', () => {
      const { error } = schema.getDistinctMedia.params.validate({ campusId: uuid });
      expect(error).toBeUndefined();
    });

    test('getDistinctMedia params null campusId', () => {
      const { error } = schema.getDistinctMedia.params.validate({ campusId: null });
      expect(error).toBeDefined();
    });

    test('getAcademicYearIdByCombo query valid', () => {
      const { error } = schema.getAcademicYearIdByCombo.query.validate({
        yearName: '2024-2025',
        yearType: 'Current year',
        curriculumId: 1,
        medium: 'English'
      });
      expect(error).toBeUndefined();
    });

    test('getAcademicYearIdByCombo query invalid missing fields', () => {
      const { error } = schema.getAcademicYearIdByCombo.query.validate({
        yearName: '2024-2025',
        curriculumId: 1
      });
      expect(error).toBeDefined();
    });

    test('createAcademicYear body valid', () => {
      const { error } = schema.createAcademicYear.body.validate(validBody);
      expect(error).toBeUndefined();
    });

    test('createAcademicYear invalid year_name pattern', () => {
      const { error } = schema.createAcademicYear.body.validate({ ...validBody, year_name: '2024/2025' });
      expect(error).toBeDefined();
    });

    test('createAcademicYear invalid year_type value', () => {
      const { error } = schema.createAcademicYear.body.validate({ ...validBody, year_type: 'Future' });
      expect(error).toBeDefined();
    });

    test('createAcademicYear missing medium', () => {
      const { error } = schema.createAcademicYear.body.validate({ ...validBody, medium: undefined });
      expect(error).toBeDefined();
    });

    test('createAcademicYear end_date must be after start_date', () => {
      const { error } = schema.createAcademicYear.body.validate({ ...validBody, start_date: '2024-06-01', end_date: '2024-05-01' });
      expect(error).toBeDefined();
    });

    test('createAcademicYear missing class names', () => {
      const { error } = schema.createAcademicYear.body.validate({ ...validBody, fromclass: undefined, toclass: undefined });
      expect(error).toBeDefined();
    });

    test('createAcademicYear invalid curriculum_id', () => {
      const { error } = schema.createAcademicYear.body.validate({ ...validBody, curriculum_id: 0 });
      expect(error).toBeDefined();
    });

    test('getAcademicYearById params valid', () => {
      const { error } = schema.getAcademicYearById.params.validate({ campusId: uuid, academicYearId: 1 });
      expect(error).toBeUndefined();
    });

    test('getAcademicYearById params null campusId', () => {
      const { error } = schema.getAcademicYearById.params.validate({ campusId: null, academicYearId: 1 });
      expect(error).toBeDefined();
    });

    test('getAcademicYearById params null academicYearId', () => {
      const { error } = schema.getAcademicYearById.params.validate({ campusId: uuid, academicYearId: null });
      expect(error).toBeDefined();
    });

    test('updateAcademicYear body valid', () => {
      const { error } = schema.updateAcademicYear.body.validate(validBody);
      expect(error).toBeUndefined();
    });

    test('deleteAcademicYear params valid', () => {
      const { error } = schema.deleteAcademicYear.params.validate({ campusId: uuid, academicYearId: 3 });
      expect(error).toBeUndefined();
    });

    test('deleteAcademicYear params null campusId', () => {
      const { error } = schema.deleteAcademicYear.params.validate({ campusId: null, academicYearId: 3 });
      expect(error).toBeDefined();
    });

    test('deleteAcademicYear params null academicYearId', () => {
      const { error } = schema.deleteAcademicYear.params.validate({ campusId: uuid, academicYearId: null });
      expect(error).toBeDefined();
    });
  });
});
