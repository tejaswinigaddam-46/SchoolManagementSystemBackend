const attendanceService = require('@/services/attendance.service');
const attendanceModel = require('@/models/attendance.model');
const eventModel = require('@/models/event.model');
const UserModel = require('@/models/user.model');
const { pool } = require('@/config/database');

jest.mock('@/models/attendance.model');
jest.mock('@/models/event.model');
jest.mock('@/models/user.model');
jest.mock('@/config/database', () => ({
  pool: {
    connect: jest.fn(),
    query: jest.fn()
  }
}));

describe('Attendance Service', () => {
  const makeClient = () => {
    const query = jest.fn();
    const release = jest.fn();
    return { query, release };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAttendanceByEventId', () => {
    test('maps rows to response format', async () => {
      const mockattendanceObject = [{
          event_attendance_id: 1,
          student_id: 10,
          attendance_status: 'Present',
          actual_present_hours: 1,
          total_scheduled_hours: 2,
          academic_year_id: 5,
          event_instance_id: 'test-instance-id',
          first_name: 'A',
          last_name: 'B',
          role: 'Student'
      }];
      attendanceModel.getAttendanceByEventId.mockResolvedValue(mockattendanceObject);

      const res = await attendanceService.getAttendanceByEventId('t1', 'c1', 'evt-1', 'test-instance-id');
      expect(attendanceModel.getAttendanceByEventId).toHaveBeenCalledWith('evt-1', 'test-instance-id');
      expect(res).toEqual([
        {
          attendanceId: 1,
          studentId: 10,
          status: 'Present',
          actualPresentHours: 1,
          totalScheduledHours: 2,
          academicYearId: 5,
          eventInstanceId: 'test-instance-id',
          firstName: 'A',
          lastName: 'B',
          role: 'Student'
        }
      ]);
    });
  });

  describe('saveAttendance', () => {
    test('saves attendance and upserts user attendance records', async () => {
      const client = makeClient();
      pool.connect.mockResolvedValue(client);

      eventModel.getEventById.mockResolvedValue({
        campus_id: '550e8400-e29b-41d4-a716-446655440000',
        start_date: '2026-01-01',
        event_type: 'Class',
        academic_year_id: 3
      });

      attendanceModel.getAcademicYearNameById.mockResolvedValue('2025-2026');
      attendanceModel.upsertAttendanceBatch.mockResolvedValue(2);
      attendanceModel.getUsersByIds.mockResolvedValue([
        { user_id: 1, username: 's1', role: 'Student' },
        { user_id: 2, username: 's2', role: 'Student' }
      ]);
      attendanceModel.getDailyAggregatesForUsers.mockResolvedValue([
        { user_id: 1, total_sched_minutes: 60, total_actual_minutes: 60 },
        { user_id: 2, total_sched_minutes: 60, total_actual_minutes: 30 }
      ]);

      const payload = {
        attendanceData: [
          { studentId: 1, status: 'Present', actual_present_hours: 1, total_scheduled_hours: 1 },
          { studentId: 2, status: 'Absent', actual_present_hours: 0.5, total_scheduled_hours: 1 }
        ],
        eventId: 'evt-1',
        eventInstanceId: 'test-instance-id',
        date: '2026-01-01',
        academicYearId: 3
      };

      const res = await attendanceService.saveAttendance(payload);

      expect(client.query).toHaveBeenCalledWith('BEGIN');
      expect(eventModel.getEventById).toHaveBeenCalledWith('evt-1');
      expect(attendanceModel.getAcademicYearNameById).toHaveBeenCalledWith(client, 3);
      expect(attendanceModel.upsertAttendanceBatch).toHaveBeenCalledWith(
        client,
        expect.objectContaining({
          eventId: 'evt-1',
          eventInstanceId: 'test-instance-id',
          attendanceDate: '2026-01-01',
          academicYearId: 3,
          records: expect.any(Array)
        })
      );
      expect(attendanceModel.getUsersByIds).toHaveBeenCalledWith(client, ['1', '2']);
      expect(attendanceModel.getDailyAggregatesForUsers).toHaveBeenCalledWith(client, '2026-01-01', ['1', '2']);
      expect(UserModel.saveUserAttendance).toHaveBeenCalledWith(
        '2026-01-01',
        '2025-2026',
        '550e8400-e29b-41d4-a716-446655440000',
        [
          { username: 's1', role: 'Student', status: 'Present', duration: '60 minutes', total_duration: '60 minutes' },
          { username: 's2', role: 'Student', status: 'Absent', duration: '30 minutes', total_duration: '60 minutes' }
        ],
        client
      );
      expect(client.query).toHaveBeenCalledWith('COMMIT');
      expect(client.release).toHaveBeenCalled();
      expect(res).toEqual({ savedCount: 2, deletedCount: 0 });
    });

    test('skips user attendance upsert when no aggregates exist', async () => {
      const client = makeClient();
      pool.connect.mockResolvedValue(client);

      eventModel.getEventById.mockResolvedValue({
        campus_id: '550e8400-e29b-41d4-a716-446655440000',
        start_date: '2026-01-01',
        event_type: 'Class',
        academic_year_id: 3
      });

      attendanceModel.getAcademicYearNameById.mockResolvedValue('2025-2026');
      attendanceModel.upsertAttendanceBatch.mockResolvedValue(1);
      attendanceModel.getUsersByIds.mockResolvedValue([{ user_id: 1, username: 's1', role: 'Student' }]);
      attendanceModel.getDailyAggregatesForUsers.mockResolvedValue([{ user_id: 1, total_sched_minutes: 0, total_actual_minutes: 0 }]);

      const res = await attendanceService.saveAttendance({
        attendanceData: [{ studentId: 1, status: 'Present', actual_present_hours: 1, total_scheduled_hours: 1 }],
        eventId: 'evt-1',
        date: '2026-01-01',
        academicYearId: 3
      });

      expect(UserModel.saveUserAttendance).not.toHaveBeenCalled();
      expect(client.query).toHaveBeenCalledWith('COMMIT');
      expect(res).toEqual({ savedCount: 1, deletedCount: 0 });
    });

    test('rolls back and rethrows when event not found', async () => {
      const client = makeClient();
      pool.connect.mockResolvedValue(client);

      eventModel.getEventById.mockResolvedValue(null);

      await expect(
        attendanceService.saveAttendance({
          attendanceData: [{ studentId: 1, status: 'Present' }],
          eventId: 'evt-404',
          date: '2026-01-01',
          academicYearId: 3
        })
      ).rejects.toThrow('Event not found');

      expect(client.query).toHaveBeenCalledWith('BEGIN');
      expect(client.query).toHaveBeenCalledWith('ROLLBACK');
      expect(client.release).toHaveBeenCalled();
    });

    test('rolls back and rethrows when attendance date cannot be resolved', async () => {
      const client = makeClient();
      pool.connect.mockResolvedValue(client);

      eventModel.getEventById.mockResolvedValue({
        campus_id: '550e8400-e29b-41d4-a716-446655440000',
        start_date: null,
        event_type: 'Class',
        academic_year_id: 3
      });

      await expect(
        attendanceService.saveAttendance({
          attendanceData: [{ studentId: 1, status: 'Present' }],
          eventId: 'evt-1',
          date: null,
          academicYearId: 3
        })
      ).rejects.toThrow('Attendance date cannot be determined');

      expect(client.query).toHaveBeenCalledWith('ROLLBACK');
      expect(client.release).toHaveBeenCalled();
    });
  });
});
