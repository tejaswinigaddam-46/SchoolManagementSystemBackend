const express = require('express');
const router = express.Router();
const { authenticate, requirePermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');
const validate = require('../middleware/validation');
const eventSchema = require('../schemas/event.schema');
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
  validate(eventSchema.createEvent),
  createEventController
);
router.get(
  '/',
  requirePermission(PERMISSIONS.EVENT_LIST_READ),
  validate(eventSchema.getEvents),
  getEventsController
);
router.put(
  '/:id',
  requirePermission(PERMISSIONS.EVENT_EDIT),
  validate(eventSchema.updateEvent),
  updateEventController
);
router.delete(
  '/:id',
  requirePermission(PERMISSIONS.EVENT_DELETE),
  validate(eventSchema.deleteEvent),
  deleteEventController
);

module.exports = router;
