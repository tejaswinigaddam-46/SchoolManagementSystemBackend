const { pool } = require('../config/database');

const holidayService = {
  /**
   * Check if a specific date is a holiday for a given academic year
   * @param {string|number} campusId 
   * @param {string} dateStr - YYYY-MM-DD
   * @param {string|number} academicYearId 
   * @returns {Promise<{isHoliday: boolean, details: {isWeekendHoliday: boolean, isHolidayEvent: boolean, isSpecialWorkingDay: boolean}}>}
   */
  checkDateStatus: async (campusId, dateStr, academicYearId) => {
    if (!campusId || !dateStr || !academicYearId) {
      throw new Error('Campus ID, Date, and Academic Year ID are required');
    }

    const date = new Date(dateStr);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday

    // 1. Check Weekend Policy
    // Default to false if no policy found (or could default to Sunday=true)
    let isWeekendHoliday = false;
    
    const policyQuery = `
        SELECT * FROM weekend_policies 
        WHERE campus_id = $1 AND academic_year_id = $2
    `;
    const policyRes = await pool.query(policyQuery, [campusId, academicYearId]);
    const policy = policyRes.rows[0];
    
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
    const holidayQuery = `
        SELECT h.id, h.holiday_name 
        FROM holiday_events h
        WHERE h.campus_id = $1 
        AND h.start_date <= $2 AND h.end_date >= $2
        AND (
            NOT EXISTS (SELECT 1 FROM holiday_curriculum_map m WHERE m.holiday_id = h.id)
            OR
            EXISTS (SELECT 1 FROM holiday_curriculum_map m WHERE m.holiday_id = h.id AND m.academic_year_id = $3)
        )
    `;
    const holidayRes = await pool.query(holidayQuery, [campusId, dateStr, academicYearId]);
    const isHolidayEvent = holidayRes.rows.length > 0;

    // 3. Check Special Working Days
    // IsspecialWorkingDay: true if record exists for this date and AY
    const specialQuery = `
        SELECT description FROM special_working_days 
        WHERE campus_id = $1 AND work_date = $2 AND academic_year_id = $3
    `;
    const specialRes = await pool.query(specialQuery, [campusId, dateStr, academicYearId]);
    const isSpecialWorkingDay = specialRes.rows.length > 0;

    // Final Logic
    // IsHoliday is true if IsspecialWorkingDay is false and (IsHolidayevent or IsweekendHoliday anyone is true)
    const isHoliday = !isSpecialWorkingDay && (isHolidayEvent || isWeekendHoliday);

    return {
        isHoliday,
        details: {
            isWeekendHoliday,
            isHolidayEvent,
            isSpecialWorkingDay,
            holidayName: isHolidayEvent ? holidayRes.rows[0].holiday_name : null,
            specialDayDescription: isSpecialWorkingDay ? specialRes.rows[0].description : null
        }
    };
  }
};

module.exports = holidayService;
