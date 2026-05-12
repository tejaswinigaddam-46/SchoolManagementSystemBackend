const SyllabusTrackingModel = require('../models/syllabusTracking.model');

const mapPgError = (error) => {
  if (!error || !error.code) return error;
  if (error.code === '23505') {
    const err = new Error('Duplicate record');
    err.code = 'DUPLICATE';
    return err;
  }
  if (error.code === '23503') {
    const err = new Error('Invalid reference');
    err.code = 'FK';
    return err;
  }
  if (error.code === '23514') {
    const err = new Error('Invalid values');
    err.code = 'CHECK';
    return err;
  }
  return error;
};

const ensureFound = (row, message) => {
  if (!row) {
    const err = new Error(message);
    err.code = 'NOT_FOUND';
    throw err;
  }
  return row;
};

const SyllabusTrackingService = {
  async listPlans(filters) {
    return await SyllabusTrackingModel.listPlans(filters);
  },
  async createPlan(data) {
    try {
      return await SyllabusTrackingModel.createPlan(data);
    } catch (e) {
      throw mapPgError(e);
    }
  },
  async getPlanById(planId) {
    const row = await SyllabusTrackingModel.getPlanById(planId);
    return ensureFound(row, 'Plan not found');
  },
  async updatePlan(planId, data) {
    try {
      const row = await SyllabusTrackingModel.updatePlan(planId, data);
      return ensureFound(row, 'Plan not found');
    } catch (e) {
      throw mapPgError(e);
    }
  },
  async deletePlan(planId) {
    const row = await SyllabusTrackingModel.deletePlan(planId);
    return ensureFound(row, 'Plan not found');
  },

  async listProgress(filters) {
    return await SyllabusTrackingModel.listProgress(filters);
  },
  async createProgress(data) {
    try {
      return await SyllabusTrackingModel.createProgress(data);
    } catch (e) {
      throw mapPgError(e);
    }
  },
  async getProgressById(progressId) {
    const row = await SyllabusTrackingModel.getProgressById(progressId);
    return ensureFound(row, 'Progress not found');
  },
  async updateProgress(progressId, data) {
    try {
      const row = await SyllabusTrackingModel.updateProgress(progressId, data);
      return ensureFound(row, 'Progress not found');
    } catch (e) {
      throw mapPgError(e);
    }
  },
  async deleteProgress(progressId) {
    const row = await SyllabusTrackingModel.deleteProgress(progressId);
    return ensureFound(row, 'Progress not found');
  }
};

module.exports = SyllabusTrackingService;
