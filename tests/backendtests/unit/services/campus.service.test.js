const campusService = require('@/services/campus.service');
const campusModel = require('@/models/campus.model');

jest.mock('@/models/campus.model');

describe('Campus Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  test('getAllCampuses returns data', async () => {
    const rows = [{ campus_id: 'c1', campus_name: 'Main' }];
    campusModel.getAllCampuses.mockResolvedValue(rows);
    const res = await campusService.getAllCampuses('tenant-1');
    expect(res).toEqual(rows);
    expect(campusModel.getAllCampuses).toHaveBeenCalledWith('tenant-1');
  });

  test('createCampus throws when model returns falsy', async () => {
    campusModel.createCampus.mockResolvedValue(null);
    await expect(campusService.createCampus({})).rejects.toThrow('Failed to create campus');
  });

  test('createCampus succeeds', async () => {
    const created = { campus_id: 'c1', campus_name: 'Main' };
    campusModel.createCampus.mockResolvedValue(created);
    const payload = { campus_name: 'Main' };
    const res = await campusService.createCampus(payload);
    expect(res).toEqual({ campusData: created, message: 'Campus created successfully' });
    expect(campusModel.createCampus).toHaveBeenCalledWith(payload);
  });

  test('updateCampus throws when campus not found', async () => {
    campusModel.getCampusById.mockResolvedValue(null);
    await expect(campusService.updateCampus('c1', { campus_name: 'X' }, 'tenant-1')).rejects.toThrow('Campus not found');
  });

  test('updateCampus throws when update fails', async () => {
    campusModel.getCampusById.mockResolvedValue({ campus_id: 'c1' });
    campusModel.updateCampus.mockResolvedValue(null);
    await expect(campusService.updateCampus('c1', { campus_name: 'X' }, 'tenant-1')).rejects.toThrow('Failed to update campus');
  });

  test('updateCampus succeeds', async () => {
    campusModel.getCampusById.mockResolvedValue({ campus_id: 'c1' });
    const updated = { campus_id: 'c1', campus_name: 'Updated' };
    campusModel.updateCampus.mockResolvedValue(updated);
    const payload = { campus_name: 'Updated' };
    const res = await campusService.updateCampus('c1', payload, 'tenant-1');
    expect(res).toEqual({ campusData: updated, message: 'Campus updated successfully' });
    expect(campusModel.updateCampus).toHaveBeenCalledWith('c1', payload, 'tenant-1');
  });

  test('deleteCampus throws when campus not found', async () => {
    campusModel.getCampusById.mockResolvedValue(null);
    await expect(campusService.deleteCampus('c1', 'tenant-1')).rejects.toThrow('Campus not found');
  });

  test('deleteCampus throws when delete fails', async () => {
    campusModel.getCampusById.mockResolvedValue({ campus_id: 'c1' });
    campusModel.deleteCampus.mockResolvedValue(null);
    await expect(campusService.deleteCampus('c1', 'tenant-1')).rejects.toThrow('Failed to delete campus');
  });

  test('deleteCampus succeeds', async () => {
    campusModel.getCampusById.mockResolvedValue({ campus_id: 'c1' });
    const deleted = { campus_id: 'c1' };
    campusModel.deleteCampus.mockResolvedValue(deleted);
    const res = await campusService.deleteCampus('c1', 'tenant-1');
    expect(res).toEqual({ campusData: deleted, message: 'Campus deleted successfully' });
    expect(campusModel.deleteCampus).toHaveBeenCalledWith('c1', 'tenant-1');
  });

  test('getCampusById returns campus', async () => {
    const row = { campus_id: 'c1' };
    campusModel.getCampusById.mockResolvedValue(row);
    const res = await campusService.getCampusById('c1', 'tenant-1');
    expect(res).toEqual(row);
    expect(campusModel.getCampusById).toHaveBeenCalledWith('c1', 'tenant-1');
  });
});
