const specialWorkingDayModel = require('../models/specialWorkingDay.model');

const specialWorkingDayService = {
  create: async (campusId, data) => {
    return await specialWorkingDayModel.create(campusId, data);
  },
  getAll: async (campusId, filters) => {
    return await specialWorkingDayModel.getAll(campusId, filters);
  },
  update: async (id, campusId, data) => {
    return await specialWorkingDayModel.update(id, campusId, data);
  },
  delete: async (id, campusId) => {
    return await specialWorkingDayModel.delete(id, campusId);
  }
};

module.exports = specialWorkingDayService;
