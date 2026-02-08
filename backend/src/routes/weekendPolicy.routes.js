const express = require('express');
const router = express.Router();
const weekendPolicyController = require('../controllers/weekendPolicy.controller');
const { authenticate, requireRole } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticate);

// Routes
// Get all policies for a campus
router.get('/:campusId', weekendPolicyController.getAllPolicies);

// Upsert policy (Create or Update) - Admin only
router.post('/:campusId', requireRole(['Admin']), weekendPolicyController.upsertPolicy);

// Get single policy
router.get('/:campusId/:id', weekendPolicyController.getPolicy);

// Delete policy - Admin only
router.delete('/:campusId/:id', requireRole(['Admin']), weekendPolicyController.deletePolicy);

module.exports = router;
