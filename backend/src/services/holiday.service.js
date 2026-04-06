const holidayModel = require('../models/holiday.model');
const weekendPolicyModel = require('../models/weekendPolicy.model');
const specialWorkingDayModel = require('../models/specialWorkingDay.model');

const holidayService = {
  /**
   * Check if a specific date is a holiday for a given academic year
   * @param {string|number} campusId 
   * @param {string} dateStr - YYYY-MM-DD
   * @param {string|number} academicYearId 
   * @returns {Promise<{isHoliday: boolean, details: {isWeekendHoliday: boolean, isHolidayEvent: boolean, isSpecialWorkingDay: boolean}}>}
   */
  checkDateStatus: async (campusId, dateStr, academicYearId) => {
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday

    // 1. Check Weekend Policy
    // Default to false if no policy found (or could default to Sunday=true)
    let isWeekendHoliday = false;
    
    const policy = await weekendPolicyModel.getByCampusAndAcademicYear(campusId, academicYearId);
    
    if (policy) {
        if (dayOfWeek === 0 && policy.is_sunday_holiday) isWeekendHoliday = true;
        if (dayOfWeek === 6 && policy.is_saturday_holiday) isWeekendHoliday = true;
    } else {
        // Fallback: If no policy exists for this academic year, standard weekends?
        // Let's assume false to force policy creation, or standard Sunday.
        // User instruction: "check from weekend_policies". Implicitly if not in there, false.
        isWeekendHoliday = false;
    }

    // 2. Check Holiday Events
    // IsHolidayevent: true if event covers date AND (Global OR Specific to this AY)
    const holidayRes = await holidayModel.checkHolidayEvent(campusId, dateStr, academicYearId);
    const isHolidayEvent = holidayRes.length > 0;

    // 3. Check Special Working Days
    // IsspecialWorkingDay: true if record exists for this date and AY
    const specialRes = await specialWorkingDayModel.checkSpecialWorkingDay(campusId, dateStr, academicYearId);
    const isSpecialWorkingDay = specialRes.length > 0;

    // Final Logic
    // IsHoliday is true if IsspecialWorkingDay is false and (IsHolidayevent or IsweekendHoliday anyone is true)
    const isHoliday = !isSpecialWorkingDay && (isHolidayEvent || isWeekendHoliday);

    return {
        isHoliday,
        details: {
            isWeekendHoliday,
            isHolidayEvent,
            isSpecialWorkingDay,
            holidayName: isHolidayEvent ? holidayRes[0].holiday_name : null,
            specialDayDescription: isSpecialWorkingDay ? specialRes[0].description : null
        }
    };
  }
};

module.exports = holidayService;
