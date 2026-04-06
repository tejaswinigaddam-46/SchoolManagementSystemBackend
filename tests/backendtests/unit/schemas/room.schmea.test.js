const roomSchema = require('@/schemas/room.schema');

describe('Room Schema', () => {
  const campusId = '550e8400-e29b-41d4-a716-446655440000';

  describe('getAllRooms', () => {
    test('user valid', () => {
      const { error } = roomSchema.getAllRooms.user.validate({ campusId });
      expect(error).toBeUndefined();
    });
  });

  describe('getRoomById', () => {
    test('user and params valid', () => {
      const userRes = roomSchema.getRoomById.user.validate({ campusId });
      const paramsRes = roomSchema.getRoomById.params.validate({ id: 1 });
      expect(userRes.error).toBeUndefined();
      expect(paramsRes.error).toBeUndefined();
    });
  });

  describe('createRoom', () => {
    test('body valid', () => {
      const body = {
        building_id: 1,
        room_number: '101',
        floor_number: 1,
        room_type: 'Classroom',
        capacity: 30
      };
      const { error } = roomSchema.createRoom.body.validate(body);
      expect(error).toBeUndefined();
    });

    test('invalid building_id', () => {
      const body = { building_id: 0, room_number: '101' };
      const { error } = roomSchema.createRoom.body.validate(body);
      expect(error).toBeDefined();
    });
  });

  describe('updateRoom', () => {
    test('body valid', () => {
      const body = { room_number: '102' };
      const { error } = roomSchema.updateRoom.body.validate(body);
      expect(error).toBeUndefined();
    });
  });

  describe('deleteRoom', () => {
    test('params valid', () => {
      const { error } = roomSchema.deleteRoom.params.validate({ id: 1 });
      expect(error).toBeUndefined();
    });
  });
});
