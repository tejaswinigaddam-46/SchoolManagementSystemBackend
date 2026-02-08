const leaveService = require('../services/leave.service');
const { successResponse, errorResponse, createdResponse } = require('../utils/response');

const createLeave = async (req, res) => {
  try {
    const { tenantId, campusId, username } = req.user;
    const payload = req.body || {};
    const created = await leaveService.createLeaveRequest(tenantId, campusId, username, payload);
    return createdResponse(res, created, 'Leave request created with status pending');
  } catch (err) {
    return errorResponse(res, err.message || 'Failed to create leave request', 400);
  }
};

const getMyLeaves = async (req, res) => {
  try {
    const { tenantId, campusId, username } = req.user;
    const rows = await leaveService.getMyLeaveRequests(tenantId, campusId, username);
    return successResponse(res, 'My leave requests retrieved', rows);
  } catch (err) {
    return errorResponse(res, err.message || 'Failed to load leave requests', 500);
  }
};

const getPendingApprovals = async (req, res) => {
  try {
    const { tenantId, campusId, username, role } = req.user;
    const rows = await leaveService.getPendingApprovals(tenantId, campusId, username, role);
    return successResponse(res, 'Pending approvals retrieved', rows);
  } catch (err) {
    return errorResponse(res, err.message || 'Failed to load pending approvals', 500);
  }
};

const getCompletedApprovals = async (req, res) => {
  try {
    const { tenantId, campusId, username, role } = req.user;
    const rows = await leaveService.getCompletedApprovals(tenantId, campusId, username, role);
    return successResponse(res, 'Completed approvals retrieved', rows);
  } catch (err) {
    return errorResponse(res, err.message || 'Failed to load completed approvals', 500);
  }
};

const updateStatus = async (req, res) => {
  try {
    const { tenantId, campusId, username, roles } = req.user;
    const { id } = req.params;
    const { status, status_reason } = req.body;

    const request = await require('../models/leave.model').getLeaveRequestById(id);
    if (!request) {
      return errorResponse(res, 'Leave request not found', 404);
    }

    const userRoles = Array.isArray(roles) ? roles : [roles];
    const privileged = ['Admin', 'Manager', 'Zonaladmin', 'Superadmin'].some(r => userRoles.includes(r));
    const assigned = await require('../models/leave.model').isUserAssignedApproverForRequest(id, username);
    if (!privileged && !assigned) {
      return errorResponse(res, 'Access denied. You are not authorized to update this request.', 403);
    }

    const updated = await leaveService.updateLeaveStatus(tenantId, campusId, id, status, status_reason, username);
    if (!updated) {
      return errorResponse(res, 'Leave request update failed', 500);
    }
    return successResponse(res, 'Leave status updated', updated);
  } catch (err) {
    return errorResponse(res, err.message || 'Failed to update leave status', 400);
  }
};

const deleteLeave = async (req, res) => {
  try {
    const { tenantId, campusId } = req.user;
    const { id } = req.params;
    const ok = await leaveService.deleteLeaveRequest(tenantId, campusId, id);
    if (!ok) {
      return errorResponse(res, 'Leave request not found', 404);
    }
    return successResponse(res, 'Leave request deleted', { id });
  } catch (err) {
    return errorResponse(res, err.message || 'Failed to delete leave request', 500);
  }
};

const cancelLeave = async (req, res) => {
  try {
    const { tenantId, campusId, username } = req.user;
    const { id } = req.params;
    const { status_reason } = req.body;
    const updatedRows = await leaveService.cancelLeaveByRequester(tenantId, campusId, id, username, status_reason || null);
    return successResponse(res, 'Leave request(s) cancelled', { updated_count: updatedRows.length, rows: updatedRows });
  } catch (err) {
    return errorResponse(res, err.message || 'Failed to cancel leave request', 400);
  }
};

module.exports = {
  createLeave,
  getMyLeaves,
  getPendingApprovals,
  getCompletedApprovals,
  updateStatus,
  deleteLeave,
  cancelLeave
};
