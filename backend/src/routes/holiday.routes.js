const express = require('express');
const router = express.Router();
const holidayController = require('../controllers/holiday.controller');
const { authenticate, requireRole } = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(authenticate);

// Get all holidays
router.get('/:campusId', holidayController.getAllHolidays);
// Check if a specific date is a holiday
router.get('/:campusId/check-date', holidayController.checkDate);
// Get calculated holidays summary
router.get('/:campusId/calculated', holidayController.getCalculatedHolidays);

// Create holiday (Admin only)
router.post('/:campusId', requireRole(['Admin']), holidayController.createHoliday);

// Update holiday (Admin only)
router.put('/:campusId/:id', requireRole(['Admin']), holidayController.updateHoliday);

// Delete holiday (Admin only)
router.delete('/:campusId/:id', requireRole(['Admin']), holidayController.deleteHoliday);

module.exports = router;
