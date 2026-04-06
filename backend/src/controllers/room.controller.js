const RoomService = require('../services/room.service');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

class RoomController {
  /**
   * Get all rooms for the current campus
   * GET /api/rooms
   */
  static async getAllRooms(req, res) {
    try {
      const { campusId } = req.user;

      const result = await RoomService.getAllRooms(campusId);
      
      if (result.success) {
        logger.info('Successfully retrieved rooms', { 
          campusId,
          count: result.data.length 
        });
        return successResponse(res, result.message, result.data);
      } else {
        return errorResponse(res, result.message, 400);
      }
    } catch (error) {
      logger.error('Error in RoomController.getAllRooms:', error);
      return errorResponse(res, 'Internal server error', 500);
    }
  }

  /**
   * Get room by ID
   * GET /api/rooms/:id
   */
  static async getRoomById(req, res) {
    try {
      const { id } = req.params;
      const { campusId } = req.user;

      const result = await RoomService.getRoomById(id, campusId);
      
      if (result.success) {
        logger.info('Room found by ID', { 
          campusId,
          roomId: id,
          roomNumber: result.data.room_number 
        });
        return successResponse(res, result.message, result.data);
      } else {
        return errorResponse(res, result.message, 404);
      }
    } catch (error) {
      logger.error('Error in RoomController.getRoomById:', error);
      return errorResponse(res, 'Internal server error', 500);
    }
  }

  /**
   * Get rooms by building ID
   * GET /api/rooms/building/:buildingId
   */
  static async getRoomsByBuilding(req, res) {
    try {
      const { buildingId } = req.params;
      const { campusId } = req.user;

      const result = await RoomService.getRoomsByBuilding(buildingId, campusId);
      
      if (result.success) {
        logger.info('Rooms retrieved by building', { 
          campusId,
          buildingId,
          count: result.data.length 
        });
        return successResponse(res, result.message, result.data);
      } else {
        return errorResponse(res, result.message, 400);
      }
    } catch (error) {
      logger.error('Error in RoomController.getRoomsByBuilding:', error);
      return errorResponse(res, 'Internal server error', 500);
    }
  }

  /**
   * Get available room types
   * GET /api/rooms/types
   */
  static async getRoomTypes(req, res) {
    try {
      logger.info('Getting room types');

      const result = await RoomService.getRoomTypes();
      
      if (result.success) {
        logger.info('Room types retrieved successfully', { count: result.data.length });
        return successResponse(res, result.message, result.data);
      } else {
        return errorResponse(res, result.message, 400);
      }
    } catch (error) {
      logger.error('Error in RoomController.getRoomTypes:', error);
      return errorResponse(res, 'Internal server error', 500);
    }
  }

  /**
   * Create new room
   * Access: Requires room create permission
   * POST /api/rooms
   */
  static async createRoom(req, res) {
    try {
      const { campusId  } = req.user;
      const roomData = req.body;  

      const result = await RoomService.createRoom(roomData, campusId);
      
      if (result.success) {
        logger.info('Room created successfully', { 
          campusId,
          roomId: result.data.room_id,
          roomNumber: result.data.room_number 
        });
        return successResponse(res, result.message, { room: result.data }, 201);
      } else {
        return errorResponse(res, result.message, 400);
      }
    } catch (error) {
      logger.error('Error in RoomController.createRoom:', error);
      return errorResponse(res, 'Internal server error', 500);
    }
  }

  /**
   * Update room
   * Access: Requires room edit permission
   * PUT /api/rooms/:id
   */
  static async updateRoom(req, res) {
    try {
      const { id } = req.params;
      const { campusId } = req.user;

      const updateData = req.body;
      
      logger.info('Updating room', { 
        campusId,
        roomId: id,
        updateFields: Object.keys(updateData) 
      });

      const result = await RoomService.updateRoom(id, updateData, campusId);
      
      if (result.success) {
        logger.info('Room updated successfully', { 
          campusId,
          roomId: id,
          roomNumber: result.data.room_number 
        });
        return successResponse(res, result.message, { room: result.data });
      } else {
        return errorResponse(res, result.message, 400);
      }
    } catch (error) {
      logger.error('Error in RoomController.updateRoom:', error);
      return errorResponse(res, 'Internal server error', 500);
    }
  }

  /**
   * Delete room
   * Access: Requires room delete permission
   * DELETE /api/rooms/:id
   */
  static async deleteRoom(req, res) {
    try {
      const { id } = req.params;
      const {  campusId } = req.user;
      const result = await RoomService.deleteRoom(id, campusId);
      
      if (result.success) {
        logger.info('Room deleted successfully', {  campusId, roomId: id });
        return successResponse(res, result.message, result.data);
      } else {
        return errorResponse(res, result.message, 400);
      }
    } catch (error) {
      logger.error('Error in RoomController.deleteRoom:', error);
      return errorResponse(res, 'Internal server error', 500);
    }
  }

  /**
   * Get room statistics
   * GET /api/rooms/stats
   */
  static async getRoomStats(req, res) {
    try {
      const { campusId } = req.user;

      const result = await RoomService.getRoomStats(campusId);
      
      if (result.success) {
        logger.info('Room statistics retrieved', { campusId, statistics: result.data });
        return successResponse(res, result.message, result.data);
      } else {
        return errorResponse(res, result.message, 400);
      }
    } catch (error) {
      logger.error('Error in RoomController.getRoomStats:', error);
      return errorResponse(res, 'Internal server error', 500);
    }
  }
}

module.exports = RoomController;
