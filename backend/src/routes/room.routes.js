const express = require('express');
const router = express.Router();
const RoomController = require('../controllers/room.controller');
const { authenticate, requireRole } = require('../middleware/auth');
const { validateTenant } = require('../middleware/tenant');
const {
  validateRoomCreation,
  validateRoomUpdate,
  validateRoomId,
  validateBuildingId
} = require('../validators/room.validator');

// ==================== ROOM ROUTES ====================

/**
 * GET /api/rooms/types
 * Get available room types from enum
 * Accessible to all authenticated users
 */
router.get('/types', authenticate, RoomController.getRoomTypes);

/**
 * GET /api/rooms/stats
 * Get room statistics for current campus
 * Accessible to all authenticated users
 */
router.get('/stats', authenticate, RoomController.getRoomStats);

/**
 * GET /api/rooms/building/:buildingId
 * Get rooms by building ID
 * Accessible to all authenticated users
 */
router.get('/building/:buildingId', authenticate, validateBuildingId, RoomController.getRoomsByBuilding);

/**
 * GET /api/rooms
 * Get all rooms for current campus
 * Accessible to all authenticated users
 */
router.get('/', authenticate, RoomController.getAllRooms);

/**
 * POST /api/rooms
 * Create new room (Admin only)
 */
router.post('/', authenticate, requireRole(['Admin']), validateRoomCreation, RoomController.createRoom);

/**
 * GET /api/rooms/:id
 * Get room by ID
 * Accessible to all authenticated users
 */
router.get('/:id', authenticate, validateRoomId, RoomController.getRoomById);

/**
 * PUT /api/rooms/:id
 * Update room (Admin only)
 */
router.put('/:id', authenticate, requireRole(['Admin']), validateRoomUpdate, RoomController.updateRoom);

/**
 * DELETE /api/rooms/:id
 * Delete room (Admin only)
 */
router.delete('/:id', authenticate, requireRole(['Admin']), validateRoomId, RoomController.deleteRoom);

module.exports = router;