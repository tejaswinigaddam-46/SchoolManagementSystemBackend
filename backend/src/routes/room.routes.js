const express = require('express');
const router = express.Router();
const RoomController = require('../controllers/room.controller');
const { authenticate, requirePermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');
const validate = require('../middleware/validation');
const roomSchema = require('../schemas/room.schema');

router.get(
  '/types',
  authenticate,
  requirePermission(PERMISSIONS.ROOM_TYPES_READ),
  validate(roomSchema.getRoomTypes),
  RoomController.getRoomTypes
);

router.get(
  '/stats',
  authenticate,
  requirePermission(PERMISSIONS.ROOM_STATS_READ),
  validate(roomSchema.getRoomStats),
  RoomController.getRoomStats
);

router.get(
  '/building/:buildingId',
  authenticate,
  requirePermission(PERMISSIONS.ROOM_BY_BUILDING_READ),
  validate(roomSchema.getRoomsByBuilding),
  RoomController.getRoomsByBuilding
);

router.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.ROOM_LIST_READ),
  validate(roomSchema.getAllRooms),
  RoomController.getAllRooms
);

router.post(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.ROOM_CREATE),
  validate(roomSchema.createRoom),
  RoomController.createRoom
);

router.get(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.ROOM_ITEM_READ),
  validate(roomSchema.getRoomById),
  RoomController.getRoomById
);

router.put(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.ROOM_EDIT),
  validate(roomSchema.updateRoom),
  RoomController.updateRoom
);

router.delete(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.ROOM_DELETE),
  validate(roomSchema.deleteRoom),
  RoomController.deleteRoom
);

module.exports = router;
