const weekendPolicyService = require('@/services/weekendPolicy.service');
const weekendPolicyModel = require('@/models/weekendPolicy.model');

jest.mock('@/models/weekendPolicy.model');
jest.mock('@/utils/logger');

describe('WeekendPolicy Service', () => {
  const campusId = 'campus-uuid';
  const academicYearId = 1;

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createOrUpdatePolicy', () => {
    const policyData = {
      academic_year_id: academicYearId,
      is_sunday_holiday: true,
      is_saturday_holiday: false,
      is_saturday_half_day: true
    };

    test('successfully creates or updates a weekend policy', async () => {
      const mockResult = { id: 1, ...policyData };
      weekendPolicyModel.upsert.mockResolvedValue(mockResult);

      const result = await weekendPolicyService.createOrUpdatePolicy(campusId, policyData);

      expect(result).toEqual(mockResult);
      expect(weekendPolicyModel.upsert).toHaveBeenCalledWith(campusId, policyData);
    });

    test('throws error when Saturday is both holiday and half day', async () => {
      const invalidData = {
        academic_year_id: academicYearId,
        is_saturday_holiday: true,
        is_saturday_half_day: true
      };

      await expect(weekendPolicyService.createOrUpdatePolicy(campusId, invalidData))
        .rejects.toThrow('Saturday cannot be both a full holiday and a half day');
    });
  });

  describe('getCampusPolicies', () => {
    test('returns policies for a campus', async () => {
      const mockList = [{ id: 1, campus_id: campusId }];
      weekendPolicyModel.getAllByCampus.mockResolvedValue(mockList);

      const result = await weekendPolicyService.getCampusPolicies(campusId);
      expect(result).toEqual(mockList);
    });
  });

  describe('getPolicyById', () => {
    test('returns policy if found', async () => {
      const mockPolicy = { id: 1, campus_id: campusId };
      weekendPolicyModel.getById.mockResolvedValue(mockPolicy);

      const result = await weekendPolicyService.getPolicyById(1, campusId);
      expect(result).toEqual(mockPolicy);
    });
  });

  describe('deletePolicy', () => {
    test('successfully deletes a weekend policy', async () => {
      weekendPolicyModel.delete.mockResolvedValue({ id: 1 });

      const result = await weekendPolicyService.deletePolicy(1, campusId);
      expect(result.id).toBe(1);
    });
  });
});
