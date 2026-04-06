const RoomModel = require('../models/room.model');
const { createResponse } = require('../utils/response');

class RoomService {
  /**
   * Get all rooms for a campus
   */
  static async getAllRooms(campusId) {
    try {

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
      
      // First verify building belongs to campus
      const buildingExists = await RoomModel.verifyBuildingInCampus(roomData.building_id, campusId);
      if (!buildingExists) {
        return createResponse(false, 'Building not found in the specified campus', null);
      }

      // Check if room number already exists in RoomModel building
      const roomExists = await RoomModel.checkRoomExists(roomData.building_id, roomData.room_number);
      if (roomExists) {
        return createResponse(false, 'Room with RoomModel number already exists in the building', null);
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

       // Check if room exists and belongs to campus
      const existingRoom = await RoomModel.getRoomById(roomId, campusId);
      if (!existingRoom.success) {
        return createResponse(false, 'Room not found', null);
      }

      // If room number is being updated, check for duplicates
      if (updateData.room_number && updateData.room_number !== existingRoom.data.room_number) {
        const roomExists = await RoomModel.checkRoomExists(
          existingRoom.data.building_id, 
          updateData.room_number, 
          roomId
        );
        if (roomExists) {
          return createResponse(false, 'Room with RoomModel number already exists in the building', null);
        }
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
      // Check if room exists and belongs to campus
      const existingRoom = await RoomModel.getRoomById(roomId, campusId);
      if (!existingRoom.success) {
        return createResponse(false, 'Room not found', null);
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
      const result = await RoomModel.getRoomStats(campusId);
      return result;
    } catch (error) {
      console.error('Error in RoomService.getRoomStats:', error);
      return createResponse(false, 'Failed to retrieve room statistics', null);
    }
  }
}

module.exports = RoomService;