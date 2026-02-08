const holidayModel = require('../models/holiday.model');
const holidayService = require('../services/holiday.service');
const { successResponse, errorResponse } = require('../utils/response');

const holidayController = {
  // Check if a specific date is a holiday
  checkDate: async (req, res) => {
    try {
      const { campusId } = req.params;
      const { date, academicYearId } = req.query;

      if (!date || !academicYearId) {
        return errorResponse(res, 'Date and Academic Year ID are required', 400);
      }

      const result = await holidayService.checkDateStatus(campusId, date, Number(academicYearId));
      successResponse(res, 'Date status checked successfully', result);
    } catch (error) {
      console.error('Error checking date status:', error);
      errorResponse(res, error.message, 500);
    }
  },

  // Get all holidays
  getAllHolidays: async (req, res) => {
    try {
      const { campusId } = req.params;
      const filters = { ...req.query };
      
      // If user is a student, pass their username for filtering
      if (req.user && req.user.role === 'Student') {
          filters.studentUsername = req.user.username;
      }

      const holidays = await holidayModel.getAll(campusId, filters);
      successResponse(res, 'Holidays fetched successfully', holidays);
    } catch (error) {
      console.error('Error fetching holidays:', error);
      errorResponse(res, error.message, 500);
    }
  },

  // Calculate holidays summary for a range
  getCalculatedHolidays: async (req, res) => {
    try {
      const { campusId } = req.params;
      const { startDate, endDate, academicYearId } = req.query;
      if (!startDate || !endDate) {
        return errorResponse(res, 'startDate and endDate are required', 400);
      }
      const numericAcademicYearId = academicYearId ? Number(academicYearId) : null;
      const holidayModel = require('../models/holiday.model');
      const specialWorkingDayModel = require('../models/specialWorkingDay.model');
      const weekendPolicyModel = require('../models/weekendPolicy.model');

      const holidays = await holidayModel.getAll(campusId, { startDate, endDate });
      const specialDays = await specialWorkingDayModel.getAll(campusId, { startDate, endDate });
      const policies = await weekendPolicyModel.getAllByCampus(campusId);
      const policy = Array.isArray(policies)
        ? policies.find(p => numericAcademicYearId ? p.academic_year_id === numericAcademicYearId : false) || null
        : null;

      const start = new Date(startDate);
      const end = new Date(endDate);
      const map = new Map();

      const addRange = (s, e, weight) => {
        let d = new Date(s);
        const endD = new Date(e);
        while (d <= endD) {
          const key = d.toISOString().split('T')[0];
          map.set(key, (map.get(key) || 0) + weight);
          d.setDate(d.getDate() + 1);
        }
      };

      // Holidays (events)
      for (const h of holidays) {
        const applies =
          !numericAcademicYearId ||
          !h.academic_year_ids ||
          (Array.isArray(h.academic_year_ids) && h.academic_year_ids.length === 0) ||
          (Array.isArray(h.academic_year_ids) && h.academic_year_ids.includes(numericAcademicYearId));
        if (!applies) continue;
        const s = new Date(String(h.start_date).split('T')[0]);
        const e = new Date(String(h.end_date || h.start_date).split('T')[0]);
        const weight = h.duration_category === 'half_day' ? 0.5 : 1;
        addRange(s, e, weight);
      }

      // Weekend policies
      const sundayHoliday = policy ? Boolean(policy.is_sunday_holiday) : false;
      const saturdayHalfDay = policy ? Boolean(policy.is_saturday_half_day) : false;
      let d = new Date(start);
      while (d <= end) {
        const day = d.getDay(); // 0 Sunday, 6 Saturday
        const key = d.toISOString().split('T')[0];
        if (sundayHoliday && day === 0) {
          map.set(key, (map.get(key) || 0) + 1);
        }
        if (saturdayHalfDay && day === 6) {
          map.set(key, (map.get(key) || 0) + 0.5);
        }
        d.setDate(d.getDate() + 1);
      }

      // Exclude special working days
      for (const sd of specialDays) {
        const applies =
          !numericAcademicYearId ||
          !sd.academic_year_ids ||
          (Array.isArray(sd.academic_year_ids) && sd.academic_year_ids.length === 0) ||
          (Array.isArray(sd.academic_year_ids) && sd.academic_year_ids.includes(numericAcademicYearId));
        if (!applies) continue;
        const key = String(sd.work_date).split('T')[0];
        const val = map.get(key) || 0;
        const newVal = Math.max(0, val - 1);
        map.set(key, newVal);
      }

      const items = Array.from(map.entries())
        .filter(([_, v]) => v > 0)
        .map(([date, weight]) => ({ date, weight }))
        .sort((a, b) => (a.date < b.date ? -1 : 1));
      const total = items.reduce((sum, it) => sum + it.weight, 0);

      successResponse(res, 'Calculated holidays', { total, items });
    } catch (error) {
      console.error('Error calculating holidays:', error);
      errorResponse(res, error.message || 'Failed to calculate holidays', 500);
    }
  },

  // Create holiday
  createHoliday: async (req, res) => {
    try {
      const { campusId } = req.params;
      const holiday = await holidayModel.create(campusId, req.body);
      successResponse(res, 'Holiday created successfully', holiday, 201);
    } catch (error) {
      console.error('Error creating holiday:', error);
      errorResponse(res, error.message, 500);
    }
  },

  // Update holiday
  updateHoliday: async (req, res) => {
    try {
      const { campusId, id } = req.params;
      const holiday = await holidayModel.update(id, campusId, req.body);
      successResponse(res, 'Holiday updated successfully', holiday);
    } catch (error) {
      console.error('Error updating holiday:', error);
      errorResponse(res, error.message, 500);
    }
  },

  // Delete holiday
  deleteHoliday: async (req, res) => {
    try {
      const { campusId, id } = req.params;
      const holiday = await holidayModel.delete(id, campusId);
      if (!holiday) {
        return errorResponse(res, 'Holiday not found', 404);
      }
      successResponse(res, 'Holiday deleted successfully', holiday);
    } catch (error) {
      console.error('Error deleting holiday:', error);
      errorResponse(res, error.message, 500);
    }
  }
};

module.exports = holidayController;
