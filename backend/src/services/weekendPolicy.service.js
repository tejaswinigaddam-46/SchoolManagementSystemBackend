const weekendPolicyModel = require('../models/weekendPolicy.model');

const weekendPolicyService = {
  createOrUpdatePolicy: async (campusId, data) => {

    // Validate logic: cannot be both holiday and half-day for saturday
    if (data.is_saturday_holiday && data.is_saturday_half_day) {
        throw new Error('Saturday cannot be both a full holiday and a half day');
    }

    return await weekendPolicyModel.upsert(campusId, data);
  },

  getCampusPolicies: async (campusId) => {
    return await weekendPolicyModel.getAllByCampus(campusId);
  },

  getPolicyById: async (id, campusId) => {
    return await weekendPolicyModel.getById(id, campusId);
  },

  deletePolicy: async (id, campusId) => {
    return await weekendPolicyModel.delete(id, campusId);
  }
};

module.exports = weekendPolicyService;
