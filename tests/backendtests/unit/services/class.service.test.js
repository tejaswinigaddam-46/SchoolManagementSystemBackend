const classService = require('@/services/class.service');
const classModel = require('@/models/class.model');

jest.mock('@/models/class.model');

describe('Class Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  test('createClass throws when class name is not unique', async () => {
    classModel.isClassNameUnique.mockResolvedValue(false);

    await expect(
      classService.createClass({ className: 'A', classLevel: 1 }, 'tenant-1', 'campus-1')
    ).rejects.toThrow('A class with this name already exists in this campus');

    expect(classModel.createClass).not.toHaveBeenCalled();
  });

  test('createClass succeeds', async () => {
    classModel.isClassNameUnique.mockResolvedValue(true);
    const created = { class_id: 1, campus_id: 'campus-1', class_level: 1, class_name: 'A' };
    classModel.createClass.mockResolvedValue(created);

    const payload = { className: 'A', classLevel: 1 };
    const res = await classService.createClass(payload, 'tenant-1', 'campus-1');

    expect(res).toEqual(created);
    expect(classModel.isClassNameUnique).toHaveBeenCalledWith('A', 'campus-1');
    expect(classModel.createClass).toHaveBeenCalledWith(payload, 'tenant-1', 'campus-1');
  });

  test('getAllClasses returns result', async () => {
    const result = { classes: [{ class_id: 1 }], pagination: { total_count: 1 } };
    classModel.getAllClasses.mockResolvedValue(result);

    const res = await classService.getAllClasses('tenant-1', 'campus-1', { page: 1, limit: 10 });

    expect(res).toEqual(result);
    expect(classModel.getAllClasses).toHaveBeenCalledWith('tenant-1', 'campus-1', { page: 1, limit: 10 });
  });

  test('getClassById returns null when not found', async () => {
    classModel.findClassById.mockResolvedValue(null);

    const res = await classService.getClassById(123, 'tenant-1');

    expect(res).toBeNull();
    expect(classModel.findClassById).toHaveBeenCalledWith(123, 'tenant-1');
  });

  test('getClassById returns class when found', async () => {
    const row = { class_id: 123, class_name: 'A' };
    classModel.findClassById.mockResolvedValue(row);

    const res = await classService.getClassById(123, 'tenant-1');

    expect(res).toEqual(row);
    expect(classModel.findClassById).toHaveBeenCalledWith(123, 'tenant-1');
  });

  test('updateClass throws when class not found', async () => {
    classModel.findClassById.mockResolvedValue(null);

    await expect(classService.updateClass(1, { className: 'B' }, 'tenant-1')).rejects.toThrow('Class not found');
  });

  test('updateClass throws when updated name is not unique', async () => {
    classModel.findClassById.mockResolvedValue({ class_id: 1, class_name: 'A', campus_id: 'campus-1' });
    classModel.isClassNameUnique.mockResolvedValue(false);

    await expect(classService.updateClass(1, { className: 'B' }, 'tenant-1')).rejects.toThrow(
      'A class with this name already exists in this campus'
    );

    expect(classModel.updateClass).not.toHaveBeenCalled();
    expect(classModel.isClassNameUnique).toHaveBeenCalledWith('B', 'campus-1', 1);
  });

  test('updateClass throws when model returns null', async () => {
    classModel.findClassById.mockResolvedValue({ class_id: 1, class_name: 'A', campus_id: 'campus-1' });
    classModel.updateClass.mockResolvedValue(null);

    await expect(classService.updateClass(1, { classLevel: 2 }, 'tenant-1')).rejects.toThrow('Class not found or update failed');
  });

  test('updateClass succeeds', async () => {
    classModel.findClassById.mockResolvedValue({ class_id: 1, class_name: 'A', campus_id: 'campus-1' });
    classModel.isClassNameUnique.mockResolvedValue(true);
    const updated = { class_id: 1, class_level: 2, class_name: 'B' };
    classModel.updateClass.mockResolvedValue(updated);

    const res = await classService.updateClass(1, { className: 'B', classLevel: 2 }, 'tenant-1');

    expect(res).toEqual(updated);
    expect(classModel.isClassNameUnique).toHaveBeenCalledWith('B', 'campus-1', 1);
    expect(classModel.updateClass).toHaveBeenCalledWith(1, { className: 'B', classLevel: 2 }, 'tenant-1');
  });

  test('deleteClass throws when class not found', async () => {
    classModel.findClassById.mockResolvedValue(null);

    await expect(classService.deleteClass(1, 'tenant-1')).rejects.toThrow('Class not found');
  });

  test('deleteClass succeeds', async () => {
    classModel.findClassById.mockResolvedValue({ class_id: 1, class_name: 'A' });
    classModel.deleteClass.mockResolvedValue(true);

    const res = await classService.deleteClass(1, 'tenant-1');

    expect(res).toBe(true);
    expect(classModel.deleteClass).toHaveBeenCalledWith(1, 'tenant-1');
  });
});
