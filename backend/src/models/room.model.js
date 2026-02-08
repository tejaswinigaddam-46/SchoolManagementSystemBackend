const { pool } = require('../config/database');
const { createResponse } = require('../utils/response');

class RoomModel {
  /**
   * Get all rooms for a specific campus
   */
  static async getAllRooms(campusId) {
    try {
      const query = `
        SELECT 
          r.room_id,
          r.building_id,
          r.campus_id,
          r.room_number,
          r.floor_number,
          r.room_type,
          r.capacity,
          r.Status AS status,
          r.available_capacity,
          b.building_name,
          booking.curriculum_code AS booking_curriculum_code,
          booking.class_name AS booking_class_name,
          booking.section_name AS booking_section_name
        FROM campus_rooms r
        LEFT JOIN buildings b ON r.building_id = b.building_id
        LEFT JOIN LATERAL (
          SELECT curr.curriculum_code, c.class_name, cs.section_name
          FROM class_sections cs
          LEFT JOIN academic_years ay ON cs.academic_year_id = ay.academic_year_id
          LEFT JOIN curricula curr ON ay.curriculum_id = curr.curriculum_id
          LEFT JOIN classes c ON cs.class_id = c.class_id
          WHERE cs.room_id = r.room_id AND cs.campus_id = r.campus_id
          ORDER BY ay.start_date DESC NULLS LAST, cs.section_id DESC
          LIMIT 1
        ) AS booking ON TRUE
        WHERE r.campus_id = $1
        ORDER BY b.building_name, r.floor_number, r.room_number
      `;
      
      const result = await pool.query(query, [campusId]);
      return createResponse(true, 'Rooms retrieved successfully', result.rows);
    } catch (error) {
      console.error('Error in getAllRooms:', error);
      throw error;
    }
  }

  /**
   * Get room by ID
   */
  static async getRoomById(roomId, campusId) {
    try {
      const query = `
        SELECT 
          r.room_id,
          r.building_id,
          r.campus_id,
          r.room_number,
          r.floor_number,
          r.room_type,
          r.capacity,
          r.Status AS status,
          r.available_capacity,
          b.building_name,
          booking.curriculum_code AS booking_curriculum_code,
          booking.class_name AS booking_class_name,
          booking.section_name AS booking_section_name
        FROM campus_rooms r
        LEFT JOIN buildings b ON r.building_id = b.building_id
        LEFT JOIN LATERAL (
          SELECT curr.curriculum_code, c.class_name, cs.section_name
          FROM class_sections cs
          LEFT JOIN academic_years ay ON cs.academic_year_id = ay.academic_year_id
          LEFT JOIN curricula curr ON ay.curriculum_id = curr.curriculum_id
          LEFT JOIN classes c ON cs.class_id = c.class_id
          WHERE cs.room_id = r.room_id AND cs.campus_id = r.campus_id
          ORDER BY ay.start_date DESC NULLS LAST, cs.section_id DESC
          LIMIT 1
        ) AS booking ON TRUE
        WHERE r.room_id = $1 AND r.campus_id = $2
      `;
      
      const result = await pool.query(query, [roomId, campusId]);
      
      if (result.rows.length === 0) {
        return createResponse(false, 'Room not found', null);
      }
      
      return createResponse(true, 'Room retrieved successfully', result.rows[0]);
    } catch (error) {
      console.error('Error in getRoomById:', error);
      throw error;
    }
  }

  /**
   * Get rooms by building ID
   */
  static async getRoomsByBuilding(buildingId, campusId) {
    try {
      const query = `
        SELECT 
          r.room_id,
          r.building_id,
          r.campus_id,
          r.room_number,
          r.floor_number,
          r.room_type,
          r.capacity,
          r.Status AS status,
          r.available_capacity,
          b.building_name,
          booking.curriculum_code AS booking_curriculum_code,
          booking.class_name AS booking_class_name,
          booking.section_name AS booking_section_name
        FROM campus_rooms r
        LEFT JOIN buildings b ON r.building_id = b.building_id
        LEFT JOIN LATERAL (
          SELECT curr.curriculum_code, c.class_name, cs.section_name
          FROM class_sections cs
          LEFT JOIN academic_years ay ON cs.academic_year_id = ay.academic_year_id
          LEFT JOIN curricula curr ON ay.curriculum_id = curr.curriculum_id
          LEFT JOIN classes c ON cs.class_id = c.class_id
          WHERE cs.room_id = r.room_id AND cs.campus_id = r.campus_id
          ORDER BY ay.start_date DESC NULLS LAST, cs.section_id DESC
          LIMIT 1
        ) AS booking ON TRUE
        WHERE r.building_id = $1 AND r.campus_id = $2
        ORDER BY r.floor_number, r.room_number
      `;
      
      const result = await pool.query(query, [buildingId, campusId]);
      return createResponse(true, 'Rooms retrieved successfully', result.rows);
    } catch (error) {
      console.error('Error in getRoomsByBuilding:', error);
      throw error;
    }
  }

  /**
   * Get available room types from enum
   */
  static async getRoomTypes() {
    try {
      const query = `
        SELECT unnest(enum_range(NULL::room_type_enum)) as room_type
        ORDER BY room_type
      `;
      
      const result = await pool.query(query);
      const roomTypes = result.rows.map(row => row.room_type);
      return createResponse(true, 'Room types retrieved successfully', roomTypes);
    } catch (error) {
      console.error('Error in getRoomTypes:', error);
      throw error;
    }
  }

  /**
   * Check if room number already exists in building
   */
  static async checkRoomExists(buildingId, roomNumber, excludeRoomId = null) {
    try {
      let query = `
        SELECT room_id, room_number 
        FROM campus_rooms 
        WHERE building_id = $1 AND room_number = $2
      `;
      const params = [buildingId, roomNumber];
      
      if (excludeRoomId) {
        query += ` AND room_id != $3`;
        params.push(excludeRoomId);
      }
      
      const result = await pool.query(query, params);
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error in checkRoomExists:', error);
      throw error;
    }
  }

  /**
   * Verify building belongs to campus
   */
  static async verifyBuildingInCampus(buildingId, campusId) {
    try {
      const query = `
        SELECT building_id 
        FROM buildings 
        WHERE building_id = $1 AND campus_id = $2
      `;
      
      const result = await pool.query(query, [buildingId, campusId]);
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error in verifyBuildingInCampus:', error);
      throw error;
    }
  }

  /**
   * Create new room
   */
  static async createRoom(roomData) {
    try {
      // First verify building belongs to campus
      const buildingExists = await this.verifyBuildingInCampus(roomData.building_id, roomData.campus_id);
      if (!buildingExists) {
        return createResponse(false, 'Building not found in the specified campus', null);
      }

      // Check if room number already exists in this building
      const roomExists = await this.checkRoomExists(roomData.building_id, roomData.room_number);
      if (roomExists) {
        return createResponse(false, 'Room with this number already exists in the building', null);
      }

      const query = `
        INSERT INTO campus_rooms (building_id, campus_id, room_number, floor_number, room_type, capacity)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING room_id, building_id, campus_id, room_number, floor_number, room_type, capacity
      `;
      
      const values = [
        roomData.building_id,
        roomData.campus_id,
        roomData.room_number,
        roomData.floor_number,
        roomData.room_type,
        roomData.capacity
      ];
      
      const result = await pool.query(query, values);
      
      // Get the created room with building info
      const createdRoom = await this.getRoomById(result.rows[0].room_id, roomData.campus_id);
      
      return createResponse(true, 'Room created successfully', createdRoom.data);
    } catch (error) {
      console.error('Error in createRoom:', error);
      if (error.code === '23505') {
        // Unique constraint violation
        return createResponse(false, 'Room with this number already exists in the building', null);
      }
      throw error;
    }
  }

  /**
   * Update room
   */
  static async updateRoom(roomId, campusId, updateData) {
    try {
      // Check if room exists and belongs to campus
      const existingRoom = await this.getRoomById(roomId, campusId);
      if (!existingRoom.success) {
        return createResponse(false, 'Room not found', null);
      }

      // If room number is being updated, check for duplicates
      if (updateData.room_number && updateData.room_number !== existingRoom.data.room_number) {
        const roomExists = await this.checkRoomExists(
          existingRoom.data.building_id, 
          updateData.room_number, 
          roomId
        );
        if (roomExists) {
          return createResponse(false, 'Room with this number already exists in the building', null);
        }
      }

      const query = `
        UPDATE campus_rooms 
        SET 
          room_number = COALESCE($1, room_number),
          floor_number = COALESCE($2, floor_number),
          room_type = COALESCE($3, room_type),
          capacity = COALESCE($4, capacity)
        WHERE room_id = $5 AND campus_id = $6
        RETURNING room_id, building_id, campus_id, room_number, floor_number, room_type, capacity
      `;
      
      const values = [
        updateData.room_number,
        updateData.floor_number,
        updateData.room_type,
        updateData.capacity,
        roomId,
        campusId
      ];
      
      const result = await pool.query(query, values);
      
      if (result.rows.length === 0) {
        return createResponse(false, 'Room not found or update failed', null);
      }
      
      // Get the updated room with building info
      const updatedRoom = await this.getRoomById(roomId, campusId);
      
      return createResponse(true, 'Room updated successfully', updatedRoom.data);
    } catch (error) {
      console.error('Error in updateRoom:', error);
      if (error.code === '23505') {
        // Unique constraint violation
        return createResponse(false, 'Room with this number already exists in the building', null);
      }
      throw error;
    }
  }

  /**
   * Delete room
   */
  static async deleteRoom(roomId, campusId) {
    try {
      // Check if room exists and belongs to campus
      const existingRoom = await this.getRoomById(roomId, campusId);
      if (!existingRoom.success) {
        return createResponse(false, 'Room not found', null);
      }

      const query = `
        DELETE FROM campus_rooms 
        WHERE room_id = $1 AND campus_id = $2
        RETURNING room_id, room_number
      `;
      
      const result = await pool.query(query, [roomId, campusId]);
      
      if (result.rows.length === 0) {
        return createResponse(false, 'Room not found or deletion failed', null);
      }
      
      return createResponse(true, 'Room deleted successfully', result.rows[0]);
    } catch (error) {
      console.error('Error in deleteRoom:', error);
      // Check for foreign key constraints
      if (error.code === '23503') {
        return createResponse(false, 'Cannot delete room as it is being used in other records', null);
      }
      throw error;
    }
  }

  /**
   * Get room statistics for a campus
   */
  static async getRoomStats(campusId) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_rooms,
          COUNT(DISTINCT building_id) as total_buildings,
          COUNT(DISTINCT room_type) as total_room_types,
          COALESCE(SUM(capacity), 0) as total_capacity,
          COUNT(DISTINCT floor_number) as total_floors
        FROM campus_rooms 
        WHERE campus_id = $1
      `;
      
      const result = await pool.query(query, [campusId]);
      return createResponse(true, 'Room statistics retrieved successfully', result.rows[0]);
    } catch (error) {
      console.error('Error in getRoomStats:', error);
      throw error;
    }
  }

  static async setRoomBookingStatus(roomId, campusId, status, availableCapacity) {
    try {
      const query = `
        UPDATE campus_rooms
        SET Status = $1,
            available_capacity = $2
        WHERE room_id = $3 AND campus_id = $4
        RETURNING room_id
      `;
      const values = [status, availableCapacity, roomId, campusId];
      const result = await pool.query(query, values);
      return createResponse(result.rows.length > 0, result.rows.length > 0 ? 'Room booking updated' : 'Room not found', result.rows[0] || null);
    } catch (error) {
      console.error('Error in setRoomBookingStatus:', error);
      throw error;
    }
  }
}

module.exports = RoomModel;
