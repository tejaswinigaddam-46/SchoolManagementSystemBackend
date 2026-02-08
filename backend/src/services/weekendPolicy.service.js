const weekendPolicyModel = require('../models/weekendPolicy.model');

const weekendPolicyService = {
  createOrUpdatePolicy: async (campusId, data) => {
    if (!campusId) {
      throw new Error('Campus ID is required');
    }
    if (!data.academic_year_id) {
      throw new Error('Academic Year ID is required');
    }

    // Validate logic: cannot be both holiday and half-day for saturday
    if (data.is_saturday_holiday && data.is_saturday_half_day) {
        throw new Error('Saturday cannot be both a full holiday and a half day');
    }

    return await weekendPolicyModel.upsert(campusId, data);
  },

  getCampusPolicies: async (campusId) => {
    if (!campusId) {
      throw new Error('Campus ID is required');
    }
    return await weekendPolicyModel.getAllByCampus(campusId);
  },

  getPolicyById: async (id, campusId) => {
    if (!id || !campusId) {
      throw new Error('Policy ID and Campus ID are required');
    }
    return await weekendPolicyModel.getById(id, campusId);
  },

  deletePolicy: async (id, campusId) => {
    if (!id || !campusId) {
      throw new Error('Policy ID and Campus ID are required');
    }
    return await weekendPolicyModel.delete(id, campusId);
  }
};

module.exports = weekendPolicyService;
