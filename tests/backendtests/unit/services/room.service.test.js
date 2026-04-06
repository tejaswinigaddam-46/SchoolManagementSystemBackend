const RoomService = require('@/services/room.service');
const RoomModel = require('@/models/room.model');

jest.mock('@/models/room.model');

describe('Room Service', () => {
  const campusId = '550e8400-e29b-41d4-a716-446655440000';

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllRooms', () => {
    test('success', async () => {
      const mockRooms = [{ room_id: 1 }];
      RoomModel.getAllRooms.mockResolvedValue(mockRooms);
      const res = await RoomService.getAllRooms(campusId);
      expect(res).toEqual(mockRooms);
    });

    test('failure', async () => {
      RoomModel.getAllRooms.mockRejectedValue(new Error('DB Error'));
      const res = await RoomService.getAllRooms(campusId);
      expect(res.success).toBe(false);
      expect(res.message).toBe('Failed to retrieve rooms');
    });
  });

  describe('getRoomById', () => {
    test('success', async () => {
      const mockRoom = { success: true, data: { room_id: 1 } };
      RoomModel.getRoomById.mockResolvedValue(mockRoom);
      const res = await RoomService.getRoomById(1, campusId);
      expect(res).toEqual(mockRoom);
    });
  });

  describe('createRoom', () => {
    const roomData = { building_id: 1, room_number: '101', floor_number: 1, room_type: 'Classroom' };

    test('success', async () => {
      RoomModel.verifyBuildingInCampus.mockResolvedValue(true);
      RoomModel.checkRoomExists.mockResolvedValue(false);
      RoomModel.createRoom.mockResolvedValue({ success: true });
      const res = await RoomService.createRoom(roomData, campusId);
      expect(res.success).toBe(true);
    });

    test('building not found', async () => {
      RoomModel.verifyBuildingInCampus.mockResolvedValue(false);
      const res = await RoomService.createRoom(roomData, campusId);
      expect(res.success).toBe(false);
      expect(res.message).toBe('Building not found in the specified campus');
    });

    test('room exists', async () => {
      RoomModel.verifyBuildingInCampus.mockResolvedValue(true);
      RoomModel.checkRoomExists.mockResolvedValue(true);
      const res = await RoomService.createRoom(roomData, campusId);
      expect(res.success).toBe(false);
      expect(res.message).toBe('Room with RoomModel number already exists in the building');
    });
  });

  describe('updateRoom', () => {
    const updateData = { room_number: '102' };

    test('success', async () => {
      RoomModel.getRoomById.mockResolvedValue({ success: true, data: { room_number: '101', building_id: 1 } });
      RoomModel.checkRoomExists.mockResolvedValue(false);
      RoomModel.updateRoom.mockResolvedValue({ success: true });
      const res = await RoomService.updateRoom(1, updateData, campusId);
      expect(res.success).toBe(true);
    });

    test('not found', async () => {
      RoomModel.getRoomById.mockResolvedValue({ success: false });
      const res = await RoomService.updateRoom(1, updateData, campusId);
      expect(res.success).toBe(false);
      expect(res.message).toBe('Room not found');
    });
  });

  describe('deleteRoom', () => {
    test('success', async () => {
      RoomModel.getRoomById.mockResolvedValue({ success: true });
      RoomModel.deleteRoom.mockResolvedValue({ success: true });
      const res = await RoomService.deleteRoom(1, campusId);
      expect(res.success).toBe(true);
    });

    test('not found', async () => {
      RoomModel.getRoomById.mockResolvedValue({ success: false });
      const res = await RoomService.deleteRoom(1, campusId);
      expect(res.success).toBe(false);
      expect(res.message).toBe('Room not found');
    });
  });

  describe('getRoomStats', () => {
    test('success', async () => {
      const mockStats = { total: 10 };
      RoomModel.getRoomStats.mockResolvedValue(mockStats);
      const res = await RoomService.getRoomStats(campusId);
      expect(res).toEqual(mockStats);
    });
  });
});
