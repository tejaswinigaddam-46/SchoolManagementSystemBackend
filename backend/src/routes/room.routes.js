const express = require('express');
const router = express.Router();
const RoomController = require('../controllers/room.controller');
const { authenticate, requirePermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');
const {
  validateRoomCreation,
  validateRoomUpdate,
  validateRoomId,
  validateBuildingId
} = require('../validators/room.validator');

router.get(
  '/types',
  authenticate,
  requirePermission(PERMISSIONS.ROOM_TYPES_READ),
  RoomController.getRoomTypes
);

router.get(
  '/stats',
  authenticate,
  requirePermission(PERMISSIONS.ROOM_STATS_READ),
  RoomController.getRoomStats
);

router.get(
  '/building/:buildingId',
  authenticate,
  requirePermission(PERMISSIONS.ROOM_BY_BUILDING_READ),
  validateBuildingId,
  RoomController.getRoomsByBuilding
);

router.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.ROOM_LIST_READ),
  RoomController.getAllRooms
);

router.post(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.ROOM_CREATE),
  validateRoomCreation,
  RoomController.createRoom
);

router.get(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.ROOM_ITEM_READ),
  validateRoomId,
  RoomController.getRoomById
);

router.put(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.ROOM_EDIT),
  validateRoomUpdate,
  RoomController.updateRoom
);

router.delete(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.ROOM_DELETE),
  validateRoomId,
  RoomController.deleteRoom
);

module.exports = router;
