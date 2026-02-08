const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leave.controller');
const { authenticate, requireRole } = require('../middleware/auth');

// Create leave request (any authenticated user)
router.post('/', authenticate, leaveController.createLeave);

// Get my leave requests
router.get('/my', authenticate, leaveController.getMyLeaves);

// Pending approvals assigned to current user (any role)
router.get('/pending', authenticate, leaveController.getPendingApprovals);

// Completed approvals (history) for current user
router.get('/history', authenticate, leaveController.getCompletedApprovals);

// Update leave status: assigned approver or privileged roles handled in controller
router.patch('/:id/status', authenticate, leaveController.updateStatus);

// Delete leave request (Admin/Manager or owner - simplified to Admin/Manager)
router.delete('/:id', authenticate, requireRole(['Admin','Manager']), leaveController.deleteLeave);

// Cancel leave request rows for requester (group cancel)
router.patch('/:id/cancel', authenticate, leaveController.cancelLeave);

module.exports = router;
