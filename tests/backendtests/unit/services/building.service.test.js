const buildingService = require('@/services/building.service');
const buildingModel = require('@/models/building.model');

jest.mock('@/models/building.model');

describe('Building Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  test('getAllBuildings returns data', async () => {
    const rows = [{ building_id: 1, building_name: 'Main Block' }];
    buildingModel.getAllBuildings.mockResolvedValue(rows);
    const res = await buildingService.getAllBuildings('campus-1');
    expect(res).toEqual(rows);
    expect(buildingModel.getAllBuildings).toHaveBeenCalledWith('campus-1');
  });

  test('getAllBuildings propagates error', async () => {
    buildingModel.getAllBuildings.mockRejectedValue(new Error('db'));
    await expect(buildingService.getAllBuildings('campus-1')).rejects.toThrow('db');
  });

  test('createBuilding rejects duplicate name in campus', async () => {
    buildingModel.buildingNameExists.mockResolvedValue(true);
    await expect(buildingService.createBuilding({ campus_id: 'campus-1', building_name: 'Main', number_of_floors: 2 }))
      .rejects.toThrow('A building with this name already exists in the campus');
  });

  test('createBuilding succeeds and trims name and parses floors', async () => {
    buildingModel.buildingNameExists.mockResolvedValue(false);
    const created = { building_id: 1, campus_id: 'campus-1', building_name: 'Main', number_of_floors: 3 };
    buildingModel.createBuilding.mockResolvedValue(created);

    const res = await buildingService.createBuilding({ campus_id: 'campus-1', building_name: '  Main  ', number_of_floors: '3' });
    expect(res).toEqual({ buildingData: created, message: 'Building created successfully' });
    expect(buildingModel.createBuilding).toHaveBeenCalledWith({
      campus_id: 'campus-1',
      building_name: 'Main',
      number_of_floors: 3
    });
  });

  test('updateBuilding throws when building not found', async () => {
    buildingModel.getBuildingById.mockResolvedValue(null);
    await expect(buildingService.updateBuilding(1, { building_name: 'New', number_of_floors: 2 }, 'campus-1'))
      .rejects.toThrow('Building not found');
  });

  test('updateBuilding rejects duplicate name in campus', async () => {
    buildingModel.getBuildingById.mockResolvedValue({ building_id: 1 });
    buildingModel.buildingNameExists.mockResolvedValue(true);
    await expect(buildingService.updateBuilding(1, { building_name: 'Dup', number_of_floors: 2 }, 'campus-1'))
      .rejects.toThrow('A building with this name already exists in the campus');
  });

  test('updateBuilding succeeds and trims name and parses floors', async () => {
    buildingModel.getBuildingById.mockResolvedValue({ building_id: 1 });
    buildingModel.buildingNameExists.mockResolvedValue(false);
    const updated = { building_id: 1, building_name: 'Updated', number_of_floors: 5 };
    buildingModel.updateBuilding.mockResolvedValue(updated);

    const res = await buildingService.updateBuilding(1, { building_name: '  Updated  ', number_of_floors: '5' }, 'campus-1');
    expect(res).toEqual({ buildingData: updated, message: 'Building updated successfully' });
    expect(buildingModel.updateBuilding).toHaveBeenCalledWith(
      1,
      { building_name: 'Updated', number_of_floors: 5 },
      'campus-1'
    );
  });

  test('deleteBuilding throws when building not found', async () => {
    buildingModel.getBuildingById.mockResolvedValue(null);
    await expect(buildingService.deleteBuilding(1, 'campus-1')).rejects.toThrow('Building not found');
  });

  test('deleteBuilding throws when delete fails', async () => {
    buildingModel.getBuildingById.mockResolvedValue({ building_id: 1 });
    buildingModel.deleteBuilding.mockResolvedValue(null);
    await expect(buildingService.deleteBuilding(1, 'campus-1')).rejects.toThrow('Building not found or delete failed');
  });

  test('deleteBuilding succeeds', async () => {
    const existing = { building_id: 1 };
    const deleted = { building_id: 1 };
    buildingModel.getBuildingById.mockResolvedValue(existing);
    buildingModel.deleteBuilding.mockResolvedValue(deleted);
    const res = await buildingService.deleteBuilding(1, 'campus-1');
    expect(res).toEqual({ buildingData: deleted, message: 'Building deleted successfully' });
    expect(buildingModel.deleteBuilding).toHaveBeenCalledWith(1, 'campus-1');
  });

  test('getBuildingById returns building', async () => {
    const row = { building_id: 1 };
    buildingModel.getBuildingById.mockResolvedValue(row);
    const res = await buildingService.getBuildingById(1, 'campus-1');
    expect(res).toEqual(row);
    expect(buildingModel.getBuildingById).toHaveBeenCalledWith(1, 'campus-1');
  });
});
