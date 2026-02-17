const express = require('express');
const router = express.Router();
const { authenticate, requirePermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');
const {
  createEventController,
  updateEventController,
  deleteEventController,
  getEventsController
} = require('../controllers/event.controller');

// Apply authentication middleware to all routes
router.use(authenticate);

// Routes
router.post(
  '/',
  requirePermission(PERMISSIONS.EVENT_CREATE),
  createEventController
);
router.get(
  '/',
  requirePermission(PERMISSIONS.EVENT_LIST_READ),
  getEventsController
);
router.put(
  '/:id',
  requirePermission(PERMISSIONS.EVENT_EDIT),
  updateEventController
);
router.delete(
  '/:id',
  requirePermission(PERMISSIONS.EVENT_DELETE),
  deleteEventController
);

module.exports = router;
