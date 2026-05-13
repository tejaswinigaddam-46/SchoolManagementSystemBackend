const SyllabusTrackingService = require('../services/syllabusTracking.service');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

const statusFromError = (error) => {
  if (!error) return 500;
  if (error.code === 'NOT_FOUND') return 404;
  if (error.code === 'DUPLICATE') return 409;
  if (error.code === 'FK') return 400;
  if (error.code === 'CHECK') return 400;
  if (error.code === 'NO_FIELDS') return 400;
  if (error.code === 'BUSINESS_RULE') return 400;
  return 500;
};

const syllabusTrackingController = {
  getPlans: async (req, res) => {
    try {
      const filters = {
        section_subject_id: req.query.section_subject_id ? parseInt(req.query.section_subject_id) : undefined,
        chapter_id: req.query.chapter_id ? parseInt(req.query.chapter_id) : undefined,
        topic_id: req.query.topic_id ? parseInt(req.query.topic_id) : undefined,
        subtopic_id: req.query.subtopic_id ? parseInt(req.query.subtopic_id) : undefined,
        academic_year_id: req.query.academic_year_id ? parseInt(req.query.academic_year_id) : undefined,
        section_id: req.query.section_id ? parseInt(req.query.section_id) : undefined,
        subject_name: req.query.subject_name ? String(req.query.subject_name) : undefined
      };
      const plans = await SyllabusTrackingService.listPlans(filters);
      return successResponse(res, 'Plans fetched successfully', { plans });
    } catch (error) {
      logger.error('Error in getPlans controller:', error);
      return errorResponse(res, error.message || 'Failed to fetch plans', statusFromError(error));
    }
  },

  createPlan: async (req, res) => {
    try {
      const payload = { ...req.body };
      if (payload.created_by === undefined || payload.created_by === null) {
        payload.created_by = req.user?.user_id ?? req.user?.userId ?? null;
      }
      const plan = await SyllabusTrackingService.createPlan(payload);
      if (plan && plan.plans && Array.isArray(plan.plans)) {
        return successResponse(res, 'Plans created successfully', { result: plan }, 201);
      }
      return successResponse(res, 'Plan created successfully', { plan }, 201);
    } catch (error) {
      logger.error('Error in createPlan controller:', error);
      return errorResponse(res, error.message || 'Failed to create plan', statusFromError(error));
    }
  },

  replacePlans: async (req, res) => {
    try {
      const payload = { ...req.body };
      if (payload.created_by === undefined || payload.created_by === null) {
        payload.created_by = req.user?.user_id ?? req.user?.userId ?? null;
      }
      const result = await SyllabusTrackingService.replacePlansByContext(payload);
      return successResponse(res, 'Plans replaced successfully', { result });
    } catch (error) {
      logger.error('Error in replacePlans controller:', error);
      return errorResponse(res, error.message || 'Failed to replace plans', statusFromError(error));
    }
  },

  getPlanById: async (req, res) => {
    try {
      const plan = await SyllabusTrackingService.getPlanById(parseInt(req.params.planId));
      return successResponse(res, 'Plan fetched successfully', { plan });
    } catch (error) {
      logger.error('Error in getPlanById controller:', error);
      return errorResponse(res, error.message || 'Failed to fetch plan', statusFromError(error));
    }
  },

  updatePlan: async (req, res) => {
    try {
      const plan = await SyllabusTrackingService.updatePlan(parseInt(req.params.planId), req.body);
      return successResponse(res, 'Plan updated successfully', { plan });
    } catch (error) {
      logger.error('Error in updatePlan controller:', error);
      return errorResponse(res, error.message || 'Failed to update plan', statusFromError(error));
    }
  },

  bulkUpdatePlans: async (req, res) => {
    try {
      const updates = Array.isArray(req.body) ? req.body : (req.body?.updates || []);
      console.log('PUT /api/syllabus-tracking/plans bulk update input:', req.body);
      const result = await SyllabusTrackingService.bulkUpdatePlanFields(updates);
      console.log('PUT /api/syllabus-tracking/plans bulk update result:', result);
      return successResponse(res, 'Plans updated successfully', { result });
    } catch (error) {
      logger.error('Error in bulkUpdatePlans controller:', error);
      return errorResponse(res, error.message || 'Failed to update plans', statusFromError(error));
    }
  },

  deletePlan: async (req, res) => {
    try {
      await SyllabusTrackingService.deletePlan(parseInt(req.params.planId));
      return successResponse(res, 'Plan deleted successfully');
    } catch (error) {
      logger.error('Error in deletePlan controller:', error);
      return errorResponse(res, error.message || 'Failed to delete plan', statusFromError(error));
    }
  },

  getProgress: async (req, res) => {
    try {
      const filters = {
        section_subject_id: req.query.section_subject_id ? parseInt(req.query.section_subject_id) : undefined,
        subtopic_id: req.query.subtopic_id ? parseInt(req.query.subtopic_id) : undefined,
        teacher_user_id: req.query.teacher_user_id ? parseInt(req.query.teacher_user_id) : undefined,
        status: req.query.status ? String(req.query.status) : undefined
      };
      const progress = await SyllabusTrackingService.listProgress(filters);
      return successResponse(res, 'Progress fetched successfully', { progress });
    } catch (error) {
      logger.error('Error in getProgress controller:', error);
      return errorResponse(res, error.message || 'Failed to fetch progress', statusFromError(error));
    }
  },

  createProgress: async (req, res) => {
    try {
      const payload = { ...req.body };
      if (payload.teacher_user_id === undefined || payload.teacher_user_id === null) {
        payload.teacher_user_id = req.user?.user_id ?? req.user?.userId ?? null;
      }
      const progressRow = await SyllabusTrackingService.createProgress(payload);
      return successResponse(res, 'Progress created successfully', { progress: progressRow }, 201);
    } catch (error) {
      logger.error('Error in createProgress controller:', error);
      return errorResponse(res, error.message || 'Failed to create progress', statusFromError(error));
    }
  },

  getProgressById: async (req, res) => {
    try {
      const progressRow = await SyllabusTrackingService.getProgressById(parseInt(req.params.progressId));
      return successResponse(res, 'Progress fetched successfully', { progress: progressRow });
    } catch (error) {
      logger.error('Error in getProgressById controller:', error);
      return errorResponse(res, error.message || 'Failed to fetch progress', statusFromError(error));
    }
  },

  updateProgress: async (req, res) => {
    try {
      const payload = { ...req.body };
      if (!Object.prototype.hasOwnProperty.call(payload, 'updated_at')) {
        payload.updated_at = new Date().toISOString();
      }
      const progressRow = await SyllabusTrackingService.updateProgress(parseInt(req.params.progressId), payload);
      return successResponse(res, 'Progress updated successfully', { progress: progressRow });
    } catch (error) {
      logger.error('Error in updateProgress controller:', error);
      return errorResponse(res, error.message || 'Failed to update progress', statusFromError(error));
    }
  },

  deleteProgress: async (req, res) => {
    try {
      await SyllabusTrackingService.deleteProgress(parseInt(req.params.progressId));
      return successResponse(res, 'Progress deleted successfully');
    } catch (error) {
      logger.error('Error in deleteProgress controller:', error);
      return errorResponse(res, error.message || 'Failed to delete progress', statusFromError(error));
    }
  }
};

module.exports = syllabusTrackingController;
