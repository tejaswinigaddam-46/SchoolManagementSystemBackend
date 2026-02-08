const specialWorkingDayService = require('../services/specialWorkingDay.service');
const { successResponse, errorResponse } = require('../utils/response');

const specialWorkingDayController = {
  create: async (req, res) => {
    try {
      const result = await specialWorkingDayService.create(req.user.campusId, req.body);
      successResponse(res, 'Special working day created successfully', result, 201);
    } catch (error) {
      errorResponse(res, error.message);
    }
  },
  getAll: async (req, res) => {
    try {
      const filters = { startDate: req.query.startDate, endDate: req.query.endDate };
      if (req.user && req.user.role === 'Student') {
        filters.studentUsername = req.user.username;
      }
      if (req.user && req.user.role === 'Parent' && req.query.studentUsername) {
        filters.studentUsername = req.query.studentUsername;
      }
      const result = await specialWorkingDayService.getAll(req.user.campusId, filters);
      successResponse(res, 'Special working days retrieved successfully', result);
    } catch (error) {
      errorResponse(res, error.message);
    }
  },
  update: async (req, res) => {
    try {
      const result = await specialWorkingDayService.update(req.params.id, req.user.campusId, req.body);
      if (!result) return errorResponse(res, 'Special working day not found', 404);
      successResponse(res, result, 'Special working day updated successfully');
    } catch (error) {
      errorResponse(res, error.message);
    }
  },
  delete: async (req, res) => {
    try {
      const result = await specialWorkingDayService.delete(req.params.id, req.user.campusId);
      if (!result) return errorResponse(res, 'Special working day not found', 404);
      successResponse(res, 'Special working day deleted successfully', null);
    } catch (error) {
      errorResponse(res, error.message);
    }
  }
};

module.exports = specialWorkingDayController;
