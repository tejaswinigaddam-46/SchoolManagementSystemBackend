const holidayService = require('@/services/holiday.service');
const holidayModel = require('@/models/holiday.model');
const weekendPolicyModel = require('@/models/weekendPolicy.model');
const specialWorkingDayModel = require('@/models/specialWorkingDay.model');

jest.mock('@/models/holiday.model');
jest.mock('@/models/weekendPolicy.model');
jest.mock('@/models/specialWorkingDay.model');
jest.mock('@/utils/logger');

describe('Holiday Service', () => {
  const campusId = 'campus-uuid';
  const dateStr = '2026-01-01'; // Thursday
  const academicYearId = 1;

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkDateStatus', () => {
    test('returns holiday when event is found', async () => {
      weekendPolicyModel.getByCampusAndAcademicYear.mockResolvedValue(null);
      holidayModel.checkHolidayEvent.mockResolvedValue([{ id: 1, holiday_name: 'New Year' }]);
      specialWorkingDayModel.checkSpecialWorkingDay.mockResolvedValue([]);

      const result = await holidayService.checkDateStatus(campusId, dateStr, academicYearId);

      expect(result.isHoliday).toBe(true);
      expect(result.details.isHolidayEvent).toBe(true);
      expect(result.details.holidayName).toBe('New Year');
    });

    test('returns holiday when it is a weekend holiday', async () => {
      const sundayDate = '2026-03-29'; // Sunday
      weekendPolicyModel.getByCampusAndAcademicYear.mockResolvedValue({ is_sunday_holiday: true });
      holidayModel.checkHolidayEvent.mockResolvedValue([]);
      specialWorkingDayModel.checkSpecialWorkingDay.mockResolvedValue([]);

      const result = await holidayService.checkDateStatus(campusId, sundayDate, academicYearId);

      expect(result.isHoliday).toBe(true);
      expect(result.details.isWeekendHoliday).toBe(true);
    });

    test('returns false when it is a special working day', async () => {
      const sundayDate = '2026-03-29'; // Sunday
      weekendPolicyModel.getByCampusAndAcademicYear.mockResolvedValue({ is_sunday_holiday: true });
      holidayModel.checkHolidayEvent.mockResolvedValue([]);
      specialWorkingDayModel.checkSpecialWorkingDay.mockResolvedValue([{ description: 'Make-up day' }]);

      const result = await holidayService.checkDateStatus(campusId, sundayDate, academicYearId);

      expect(result.isHoliday).toBe(false);
      expect(result.details.isSpecialWorkingDay).toBe(true);
    });

    test('returns false when no holiday event or weekend policy matches', async () => {
      weekendPolicyModel.getByCampusAndAcademicYear.mockResolvedValue(null);
      holidayModel.checkHolidayEvent.mockResolvedValue([]);
      specialWorkingDayModel.checkSpecialWorkingDay.mockResolvedValue([]);

      const result = await holidayService.checkDateStatus(campusId, dateStr, academicYearId);

      expect(result.isHoliday).toBe(false);
    });
  });
});
