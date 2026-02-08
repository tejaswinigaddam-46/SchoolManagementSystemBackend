const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  createEventController,
  updateEventController,
  deleteEventController,
  getEventsController
} = require('../controllers/event.controller');

// Apply authentication middleware to all routes
router.use(authenticate);

// Routes
router.post('/', createEventController);
router.get('/', getEventsController);
router.put('/:id', updateEventController);
router.delete('/:id', deleteEventController);

module.exports = router;
