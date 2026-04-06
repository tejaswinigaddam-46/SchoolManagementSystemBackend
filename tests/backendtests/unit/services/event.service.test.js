jest.mock('@/models/event.model', () => ({
  createEvent: jest.fn(),
  updateEvent: jest.fn(),
  deleteEvent: jest.fn(),
  upsertInstance: jest.fn(),
  getEventsByCampus: jest.fn()
}));

jest.mock('@/config/database', () => ({
  pool: {
    connect: jest.fn()
  }
}));

jest.mock('@/services/exam.service', () => ({
  ExamService: {
    createExam: jest.fn(),
    getExamsByEventId: jest.fn(),
    updateExam: jest.fn(),
    deleteExamsByEventId: jest.fn()
  }
}));

jest.mock('@/services/academic.service', () => ({
  getAcademicYearById: jest.fn()
}));

const { pool } = require('@/config/database');
const EventModel = require('@/models/event.model');
const { ExamService } = require('@/services/exam.service');
const { EventService } = require('@/services/event.service');

describe('Event Service', () => {
  const mockClient = {
    query: jest.fn(),
    release: jest.fn()
  };

  beforeEach(() => {
    pool.connect.mockResolvedValue(mockClient);
    mockClient.query.mockImplementation(async (q) => {
      if (q === 'BEGIN' || q === 'COMMIT' || q === 'ROLLBACK') return;
      return { rows: [] };
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('createEvent maps description, generates recurrence rule, and adds context', async () => {
    const created = { event_id: 99, start_date: '2026-01-01' };
    EventModel.createEvent.mockResolvedValue(created);

    const payload = {
      event_name: 'Event A',
      event_type: 'Meeting',
      academic_year_id: 1,
      start_time: '2026-01-01T00:00:00.000Z',
      end_time: '2026-01-01T01:00:00.000Z',
      description: 'Desc',
      repeat: 'yes',
      frequency: ['Monday', 'Friday'],
      room_id: null,
      event_status: 'Scheduled'
    };

    const res = await EventService.createEvent(payload, 'tenant-1', '550e8400-e29b-41d4-a716-446655440000', 10);

    expect(res).toEqual(created);
    expect(EventModel.createEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        tenant_id: 'tenant-1',
        campus_id: '550e8400-e29b-41d4-a716-446655440000',
        scheduled_by: 10,
        event_name: 'Event A',
        event_type: 'Meeting',
        academic_year_id: 1,
        event_description: 'Desc',
        start_date: '2026-01-01',
        end_date: '2026-01-01',
        start_time: '05:30:00',
        end_time: '06:30:00',
        recurrence_rule: 'RRULE:FREQ=WEEKLY;BYDAY=MO,FR'
      }),
      expect.any(Object)
    );
  });

  test('createEvent creates exam when event type is Test', async () => {
    const created = { event_id: 5, start_date: '2026-01-01' };
    EventModel.createEvent.mockResolvedValue(created);
    ExamService.createExam.mockResolvedValue({ exam_id: 1 });

    const payload = {
      event_name: 'Math Test',
      event_type: 'Test',
      academic_year_id: 1,
      start_date: '2026-01-01',
      end_date: '2026-01-01',
      start_time: '09:00:00',
      end_time: '10:00:00',
      subject_name: 'Math',
      total_score: 50
    };

    await EventService.createEvent(payload, 'tenant-1', '550e8400-e29b-41d4-a716-446655440000', 10);

    expect(ExamService.createExam).toHaveBeenCalledWith(
      expect.objectContaining({
        tenant_id: 'tenant-1',
        campus_id: '550e8400-e29b-41d4-a716-446655440000',
        event_id: 5,
        subject_name: 'Math',
        exam_date: '2026-01-01',
        total_score: 50
      }),
      'tenant-1',
      '550e8400-e29b-41d4-a716-446655440000',
      expect.any(Object)
    );
  });

  test('updateEvent single mode upserts instance with mapped fields', async () => {
    const updatedInstance = { instance_id: 1 };
    EventModel.upsertInstance.mockResolvedValue(updatedInstance);

    const payload = {
      start_time: '2026-01-01T00:00:00.000Z',
      end_time: '2026-01-01T01:00:00.000Z',
      description: 'Updated desc',
      room_id: 2
    };

    const res = await EventService.updateEvent(
      '55',
      payload,
      'single',
      '2026-01-01',
      'tenant-1',
      '550e8400-e29b-41d4-a716-446655440000',
      10
    );

    expect(res).toEqual(updatedInstance);
    expect(EventModel.upsertInstance).toHaveBeenCalledWith(
      expect.objectContaining({
        event_id: '55',
        original_start_date: '2026-01-01',
        actual_start_date: '2026-01-01',
        actual_end_date: '2026-01-01',
        actual_start_time: '05:30:00',
        actual_end_time: '06:30:00',
        is_cancelled: false,
        specific_description: 'Updated desc',
        updated_by: 10,
        room_id: 2
      })
    );
  });

  test('updateEvent all mode updates event and generates recurrence rule', async () => {
    const updated = { event_id: 55 };
    EventModel.updateEvent.mockResolvedValue(updated);

    const payload = {
      repeat: 'yes',
      frequency: ['Monday'],
      start_date: '2026-01-01',
      end_date: '2026-01-01',
      start_time: '09:00:00',
      end_time: '10:00:00',
      description: 'Updated',
      room_id: 2
    };

    const res = await EventService.updateEvent(
      55,
      payload,
      'all',
      null,
      'tenant-1',
      '550e8400-e29b-41d4-a716-446655440000',
      10
    );

    expect(res).toEqual(updated);
    expect(EventModel.updateEvent).toHaveBeenCalledWith(
      55,
      expect.objectContaining({
        recurrence_rule: 'RRULE:FREQ=WEEKLY;BYDAY=MO',
        event_description: 'Updated'
      })
    );
  });

  test('deleteEvent single mode cancels instance', async () => {
    const result = { instance_id: 1, is_cancelled: true };
    EventModel.upsertInstance.mockResolvedValue(result);

    const res = await EventService.deleteEvent('55', 'single', '2026-01-01', 10);

    expect(res).toEqual(result);
    expect(EventModel.upsertInstance).toHaveBeenCalledWith({
      event_id: '55',
      original_start_date: '2026-01-01',
      is_cancelled: true,
      updated_by: 10
    });
  });

  test('deleteEvent all mode deletes event', async () => {
    const deleted = { event_id: 55 };
    EventModel.deleteEvent.mockResolvedValue(deleted);

    const res = await EventService.deleteEvent(55, 'all', null, 10);

    expect(res).toEqual(deleted);
    expect(EventModel.deleteEvent).toHaveBeenCalledWith(55);
  });

  test('getEvents returns events by campus', async () => {
    const rows = [{ event_id: 1 }];
    EventModel.getEventsByCampus.mockResolvedValue(rows);

    const res = await EventService.getEvents('campus-1', 2);

    expect(res).toEqual(rows);
    expect(EventModel.getEventsByCampus).toHaveBeenCalledWith('campus-1', 2);
  });
});
