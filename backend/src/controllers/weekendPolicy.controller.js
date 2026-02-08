const weekendPolicyService = require('../services/weekendPolicy.service');
const { successResponse, errorResponse } = require('../utils/response');

const weekendPolicyController = {
  upsertPolicy: async (req, res) => {
    try {
      const { campusId } = req.params;
      const policy = await weekendPolicyService.createOrUpdatePolicy(campusId, req.body);
      successResponse(res, 'Weekend policy saved successfully', policy);
    } catch (error) {
      console.error('Error saving weekend policy:', error);
      errorResponse(res, error.message, 400);
    }
  },

  getAllPolicies: async (req, res) => {
    try {
      const { campusId } = req.params;
      const policies = await weekendPolicyService.getCampusPolicies(campusId);
      successResponse(res, 'Weekend policies fetched successfully', policies);
    } catch (error) {
      console.error('Error fetching weekend policies:', error);
      errorResponse(res, error.message, 500);
    }
  },

  getPolicy: async (req, res) => {
    try {
      const { campusId, id } = req.params;
      const policy = await weekendPolicyService.getPolicyById(id, campusId);
      if (!policy) {
        return errorResponse(res, 'Weekend policy not found', 404);
      }
      successResponse(res, 'Weekend policy fetched successfully', policy);
    } catch (error) {
      console.error('Error fetching weekend policy:', error);
      errorResponse(res, error.message, 500);
    }
  },

  deletePolicy: async (req, res) => {
    try {
      const { campusId, id } = req.params;
      const policy = await weekendPolicyService.deletePolicy(id, campusId);
      if (!policy) {
        return errorResponse(res, 'Weekend policy not found', 404);
      }
      successResponse(res, 'Weekend policy deleted successfully', policy);
    } catch (error) {
      console.error('Error deleting weekend policy:', error);
      errorResponse(res, error.message, 500);
    }
  }
};

module.exports = weekendPolicyController;
