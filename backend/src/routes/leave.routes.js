const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leave.controller');
const { authenticate, requirePermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');
const validate = require('../middleware/validation');
const leaveSchema = require('../schemas/leave.schema');

// Create leave request (any authenticated user)
router.post(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.LEAVE_CREATE),
  validate(leaveSchema.createLeave),
  leaveController.createLeave
);

// Get my leave requests
router.get(
  '/my',
  authenticate,
  requirePermission(PERMISSIONS.LEAVE_MY_LIST_READ),
  validate(leaveSchema.getMyLeaves),
  leaveController.getMyLeaves
);

// Pending approvals assigned to current user (any role)
router.get(
  '/pending',
  authenticate,
  requirePermission(PERMISSIONS.LEAVE_PENDING_LIST_READ),
  validate(leaveSchema.getPendingApprovals),
  leaveController.getPendingApprovals
);

// Completed approvals (history) for current user
router.get(
  '/history',
  authenticate,
  requirePermission(PERMISSIONS.LEAVE_HISTORY_LIST_READ),
  validate(leaveSchema.getCompletedApprovals),
  leaveController.getCompletedApprovals
);

// Update leave status: assigned approver or privileged roles handled in controller
router.patch(
  '/:id/status',
  authenticate,
  requirePermission(PERMISSIONS.LEAVE_STATUS_EDIT),
  validate(leaveSchema.updateStatus),
  leaveController.updateStatus
);

router.delete(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.LEAVE_DELETE_ROUTE_DELETE),
  validate(leaveSchema.deleteLeave),
  leaveController.deleteLeave
);

// Cancel leave request rows for requester (group cancel)
router.patch(
  '/:id/cancel',
  authenticate,
  requirePermission(PERMISSIONS.LEAVE_CANCEL_EDIT),
  validate(leaveSchema.cancelLeave),
  leaveController.cancelLeave
);

module.exports = router;
