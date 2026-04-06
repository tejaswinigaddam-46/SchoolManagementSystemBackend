const schema = require('@/schemas/building.schema');

describe('Building Schema', () => {
  const campusId = '550e8400-e29b-41d4-a716-446655440000';

  describe('user', () => {
    test('accepts valid campusId uuid', () => {
      const { error } = schema.getAllBuildings.user.validate({ campusId });
      expect(error).toBeUndefined();
    });

    test('rejects missing campusId', () => {
      const { error } = schema.getAllBuildings.user.validate({});
      expect(error).toBeDefined();
    });

    test('rejects campusId equal to "undefined"', () => {
      const { error } = schema.getAllBuildings.user.validate({ campusId: 'undefined' });
      expect(error).toBeDefined();
    });
  });

  describe('params', () => {
    test('accepts valid id', () => {
      const { error } = schema.getBuildingById.params.validate({ id: 1 });
      expect(error).toBeUndefined();
    });

    test('rejects id less than 1', () => {
      const { error } = schema.getBuildingById.params.validate({ id: 0 });
      expect(error).toBeDefined();
    });

    test('rejects non-integer id', () => {
      const { error } = schema.getBuildingById.params.validate({ id: 'abc' });
      expect(error).toBeDefined();
    });
  });

  describe('body', () => {
    test('accepts valid create payload', () => {
      const { error } = schema.createBuilding.body.validate({
        building_name: 'Main Block',
        number_of_floors: 3
      });
      expect(error).toBeUndefined();
    });

    test('rejects missing building_name', () => {
      const { error } = schema.createBuilding.body.validate({
        number_of_floors: 3
      });
      expect(error).toBeDefined();
    });

    test('rejects building_name longer than 100 chars', () => {
      const { error } = schema.createBuilding.body.validate({
        building_name: 'a'.repeat(101),
        number_of_floors: 3
      });
      expect(error).toBeDefined();
    });

    test('rejects floors below 1', () => {
      const { error } = schema.createBuilding.body.validate({
        building_name: 'Main Block',
        number_of_floors: 0
      });
      expect(error).toBeDefined();
    });

    test('rejects floors above 200', () => {
      const { error } = schema.createBuilding.body.validate({
        building_name: 'Main Block',
        number_of_floors: 201
      });
      expect(error).toBeDefined();
    });

    test('rejects floors not integer', () => {
      const { error } = schema.createBuilding.body.validate({
        building_name: 'Main Block',
        number_of_floors: 2.5
      });
      expect(error).toBeDefined();
    });
  });
});
