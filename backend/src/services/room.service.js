const RoomModel = require('../models/room.model');
const { createResponse } = require('../utils/response');

class RoomService {
  /**
   * Get all rooms for a campus
   */
  static async getAllRooms(campusId) {
    try {
      if (!campusId) {
        return createResponse(false, 'Campus ID is required', null);
      }

      const result = await RoomModel.getAllRooms(campusId);
      return result;
    } catch (error) {
      console.error('Error in RoomService.getAllRooms:', error);
      return createResponse(false, 'Failed to retrieve rooms', null);
    }
  }

  /**
   * Get room by ID
   */
  static async getRoomById(roomId, campusId) {
    try {
      if (!roomId || !campusId) {
        return createResponse(false, 'Room ID and Campus ID are required', null);
      }

      const result = await RoomModel.getRoomById(roomId, campusId);
      return result;
    } catch (error) {
      console.error('Error in RoomService.getRoomById:', error);
      return createResponse(false, 'Failed to retrieve room', null);
    }
  }

  /**
   * Get rooms by building
   */
  static async getRoomsByBuilding(buildingId, campusId) {
    try {
      if (!buildingId || !campusId) {
        return createResponse(false, 'Building ID and Campus ID are required', null);
      }

      const result = await RoomModel.getRoomsByBuilding(buildingId, campusId);
      return result;
    } catch (error) {
      console.error('Error in RoomService.getRoomsByBuilding:', error);
      return createResponse(false, 'Failed to retrieve rooms', null);
    }
  }

  /**
   * Get available room types
   */
  static async getRoomTypes() {
    try {
      const result = await RoomModel.getRoomTypes();
      return result;
    } catch (error) {
      console.error('Error in RoomService.getRoomTypes:', error);
      return createResponse(false, 'Failed to retrieve room types', null);
    }
  }

  /**
   * Create new room
   */
  static async createRoom(roomData, campusId) {
    try {
      // Validation
      const validationResult = this.validateRoomData(roomData);
      if (!validationResult.isValid) {
        return createResponse(false, validationResult.message, null);
      }

      if (!campusId) {
        return createResponse(false, 'Campus ID is required', null);
      }

      // Add campus_id to room data
      const roomWithCampus = {
        ...roomData,
        campus_id: campusId
      };

      const result = await RoomModel.createRoom(roomWithCampus);
      return result;
    } catch (error) {
      console.error('Error in RoomService.createRoom:', error);
      return createResponse(false, 'Failed to create room', null);
    }
  }

  /**
   * Update room
   */
  static async updateRoom(roomId, updateData, campusId) {
    try {
      if (!roomId || !campusId) {
        return createResponse(false, 'Room ID and Campus ID are required', null);
      }

      // Validation for update data
      const validationResult = this.validateRoomUpdateData(updateData);
      if (!validationResult.isValid) {
        return createResponse(false, validationResult.message, null);
      }

      const result = await RoomModel.updateRoom(roomId, campusId, updateData);
      return result;
    } catch (error) {
      console.error('Error in RoomService.updateRoom:', error);
      return createResponse(false, 'Failed to update room', null);
    }
  }

  /**
   * Delete room
   */
  static async deleteRoom(roomId, campusId) {
    try {
      if (!roomId || !campusId) {
        return createResponse(false, 'Room ID and Campus ID are required', null);
      }

      const result = await RoomModel.deleteRoom(roomId, campusId);
      return result;
    } catch (error) {
      console.error('Error in RoomService.deleteRoom:', error);
      return createResponse(false, 'Failed to delete room', null);
    }
  }

  /**
   * Get room statistics
   */
  static async getRoomStats(campusId) {
    try {
      if (!campusId) {
        return createResponse(false, 'Campus ID is required', null);
      }

      const result = await RoomModel.getRoomStats(campusId);
      return result;
    } catch (error) {
      console.error('Error in RoomService.getRoomStats:', error);
      return createResponse(false, 'Failed to retrieve room statistics', null);
    }
  }

  /**
   * Validate room data for creation
   */
  static validateRoomData(roomData) {
    const { building_id, room_number, floor_number, room_type } = roomData;

    if (!building_id) {
      return { isValid: false, message: 'Building ID is required' };
    }

    if (!room_number || room_number.trim().length === 0) {
      return { isValid: false, message: 'Room number is required' };
    }

    if (room_number.trim().length > 20) {
      return { isValid: false, message: 'Room number must be 20 characters or less' };
    }

    if (floor_number === undefined || floor_number === null) {
      return { isValid: false, message: 'Floor number is required' };
    }

    if (floor_number < 0 || floor_number > 200) {
      return { isValid: false, message: 'Floor number must be between 0 and 200' };
    }

    if (!room_type || room_type.trim().length === 0) {
      return { isValid: false, message: 'Room type is required' };
    }

    // Validate capacity if provided
    if (roomData.capacity !== undefined && roomData.capacity !== null) {
      const capacity = parseInt(roomData.capacity);
      if (isNaN(capacity) || capacity < 1 || capacity > 1000) {
        return { isValid: false, message: 'Capacity must be between 1 and 1000' };
      }
    }

    return { isValid: true, message: 'Valid' };
  }

  /**
   * Validate room data for updates
   */
  static validateRoomUpdateData(updateData) {
    // For updates, fields are optional but must be valid if provided
    if (updateData.room_number !== undefined) {
      if (!updateData.room_number || updateData.room_number.trim().length === 0) {
        return { isValid: false, message: 'Room number cannot be empty' };
      }
      if (updateData.room_number.trim().length > 20) {
        return { isValid: false, message: 'Room number must be 20 characters or less' };
      }
    }

    if (updateData.floor_number !== undefined) {
      const floorNumber = parseInt(updateData.floor_number);
      if (isNaN(floorNumber) || floorNumber < 0 || floorNumber > 200) {
        return { isValid: false, message: 'Floor number must be between 0 and 200' };
      }
    }

    if (updateData.room_type !== undefined) {
      if (!updateData.room_type || updateData.room_type.trim().length === 0) {
        return { isValid: false, message: 'Room type cannot be empty' };
      }
    }

    if (updateData.capacity !== undefined && updateData.capacity !== null) {
      const capacity = parseInt(updateData.capacity);
      if (isNaN(capacity) || capacity < 1 || capacity > 1000) {
        return { isValid: false, message: 'Capacity must be between 1 and 1000' };
      }
    }

    return { isValid: true, message: 'Valid' };
  }
}

module.exports = RoomService;