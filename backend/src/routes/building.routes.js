const express = require('express');
const router = express.Router();
const buildingController = require('../controllers/building.controller');

const { authenticate, requireRole } = require('../middleware/auth');
const buildingValidator = require('../validators/building.validator');

// ==================== BUILDING ROUTES ====================

/**
 * @route   GET /api/buildings
 * @desc    Get all buildings for current campus
 * @access  Authenticated users (Everyone can view)
 */
router.get('/', authenticate,buildingController.getAllBuildings);

/**
 * @route   GET /api/buildings/:id
 * @desc    Get building by ID
 * @access  Authenticated users (Everyone can view)
 */
router.get('/:id', authenticate, buildingController.getBuildingById);

/**
 * @route   POST /api/buildings
 * @desc    Create a new building
 * @access  Admin only
 */
router.post('/', 
    authenticate, requireRole(['Admin']),
    buildingValidator.validateCreateBuilding, 
    buildingController.createBuilding
);

/**
 * @route   PUT /api/buildings/:id
 * @desc    Update building by ID
 * @access  Admin only
 */
router.put('/:id', 
    authenticate, requireRole(['Admin']),
    buildingValidator.validateUpdateBuilding, 
    buildingController.updateBuilding
);

/**
 * @route   DELETE /api/buildings/:id
 * @desc    Delete building by ID
 * @access  Admin only
 */
router.delete('/:id', authenticate, requireRole(['Admin']), buildingController.deleteBuilding);

module.exports = router;