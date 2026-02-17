const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leave.controller');
const { authenticate, requirePermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');

// Create leave request (any authenticated user)
router.post(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.LEAVE_CREATE),
  leaveController.createLeave
);

// Get my leave requests
router.get(
  '/my',
  authenticate,
  requirePermission(PERMISSIONS.LEAVE_MY_LIST_READ),
  leaveController.getMyLeaves
);

// Pending approvals assigned to current user (any role)
router.get(
  '/pending',
  authenticate,
  requirePermission(PERMISSIONS.LEAVE_PENDING_LIST_READ),
  leaveController.getPendingApprovals
);

// Completed approvals (history) for current user
router.get(
  '/history',
  authenticate,
  requirePermission(PERMISSIONS.LEAVE_HISTORY_LIST_READ),
  leaveController.getCompletedApprovals
);

// Update leave status: assigned approver or privileged roles handled in controller
router.patch(
  '/:id/status',
  authenticate,
  requirePermission(PERMISSIONS.LEAVE_STATUS_EDIT),
  leaveController.updateStatus
);

router.delete(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.LEAVE_DELETE_ROUTE_DELETE),
  leaveController.deleteLeave
);

// Cancel leave request rows for requester (group cancel)
router.patch(
  '/:id/cancel',
  authenticate,
  requirePermission(PERMISSIONS.LEAVE_CANCEL_EDIT),
  leaveController.cancelLeave
);

module.exports = router;
