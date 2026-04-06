const sectionService = require('@/services/section.service');
const SectionModel = require('@/models/section.model');
const RoomModel = require('@/models/room.model');

jest.mock('@/models/section.model');
jest.mock('@/models/room.model');
jest.mock('@/utils/logger');

describe('Section Service', () => {
  const tenantId = 'tenant-123';
  const campusId = 'campus-uuid';

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createSection', () => {
    const sectionData = {
      section_name: 'Section A',
      class_id: 1,
      academic_year_id: 1
    };

    test('successfully creates a section', async () => {
      SectionModel.validateReferences.mockResolvedValue(true);
      SectionModel.checkSectionExists.mockResolvedValue(false);
      SectionModel.create.mockResolvedValue({ section_id: 1, ...sectionData });

      const result = await sectionService.createSection(sectionData, tenantId, campusId);

      expect(result.section_id).toBe(1);
      expect(SectionModel.create).toHaveBeenCalled();
    });

    test('throws error if section already exists', async () => {
      SectionModel.validateReferences.mockResolvedValue(true);
      SectionModel.checkSectionExists.mockResolvedValue(true);

      await expect(sectionService.createSection(sectionData, tenantId, campusId))
        .rejects.toThrow(/already exists/);
    });
  });

  describe('getAllSections', () => {
    test('returns sections list', async () => {
      const mockResult = { sections: [], pagination: {} };
      SectionModel.getAllSections.mockResolvedValue(mockResult);

      const result = await sectionService.getAllSections(tenantId, campusId);
      expect(result).toEqual(mockResult);
    });
  });

  describe('getSectionById', () => {
    test('returns section if found', async () => {
      const mockSection = { section_id: 1 };
      SectionModel.getById.mockResolvedValue(mockSection);

      const result = await sectionService.getSectionById(1, tenantId, campusId);
      expect(result).toEqual(mockSection);
    });

    test('throws error if not found', async () => {
      SectionModel.getById.mockResolvedValue(null);
      await expect(sectionService.getSectionById(1, tenantId, campusId))
        .rejects.toThrow('Section not found');
    });
  });

  describe('updateSection', () => {
    test('successfully updates a section', async () => {
      const existingSection = { section_id: 1, capacity: 20, academic_year_id: 1, class_id: 1, section_name: 'Old' };
      const updateData = { section_name: 'Updated' };
      SectionModel.getById.mockResolvedValue(existingSection);
      SectionModel.checkSectionExists.mockResolvedValue(false);
      SectionModel.update.mockResolvedValue({ ...existingSection, ...updateData });

      const result = await sectionService.updateSection(1, updateData, tenantId, campusId);
      expect(result.section_name).toBe('Updated');
    });
  });

  describe('deleteSection', () => {
    test('successfully deletes a section', async () => {
      const existingSection = { section_id: 1 };
      SectionModel.getById.mockResolvedValue(existingSection);
      SectionModel.delete.mockResolvedValue({ section_id: 1 });

      const result = await sectionService.deleteSection(1, tenantId, campusId);
      expect(result.section_id).toBe(1);
    });
  });
});
