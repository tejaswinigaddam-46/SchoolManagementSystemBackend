const consolidatedAttendanceService = require('@/services/consolidatedAttendance.service');
const AttendanceModel = require('@/models/attendance.model');
const HolidayModel = require('@/models/holiday.model');
const WeekendPolicyModel = require('@/models/weekendPolicy.model');
const SpecialWorkingDayModel = require('@/models/specialWorkingDay.model');
const UserModel = require('@/models/user.model');
const SectionSubjectModel = require('@/models/sectionSubject.model');
const LeaveModel = require('@/models/leave.model');
const { pool } = require('@/config/database');

jest.mock('@/models/attendance.model');
jest.mock('@/models/holiday.model');
jest.mock('@/models/weekendPolicy.model');
jest.mock('@/models/specialWorkingDay.model');
jest.mock('@/models/user.model');
jest.mock('@/models/sectionSubject.model');
jest.mock('@/models/leave.model');
jest.mock('@/config/database');

describe('Consolidated Attendance Service', () => {
    let mockClient;

    beforeEach(() => {
        mockClient = {
            query: jest.fn(),
            release: jest.fn(),
        };
        pool.connect.mockResolvedValue(mockClient);
        
        // Setup default mock returns
        UserModel.getActiveUsersWithAcademicFilters.mockResolvedValue([
            { user_id: 1, username: 'stu1', role: 'Student', student_ay_id: 1, first_name: 'John', last_name: 'Doe' },
            { user_id: 2, username: 'tch1', role: 'Teacher', first_name: 'Jane', last_name: 'Smith' }
        ]);
        
        SectionSubjectModel.getTeacherAcademicYears.mockResolvedValue([
            { teacher_user_id: 2, academic_year_id: 1 }
        ]);
        
        HolidayModel.getAll.mockResolvedValue([]);
        WeekendPolicyModel.getAllByCampus.mockResolvedValue([
            { academic_year_id: 1, is_sunday_holiday: true, is_saturday_half_day: false, is_saturday_holiday: true }
        ]);
        SpecialWorkingDayModel.getAll.mockResolvedValue([]);
        
        AttendanceModel.getUserAttendanceByCampusAndDateRange.mockResolvedValue([
            { username: 'stu1', attendance_date_str: '2023-10-02', status: 'Present', duration: '08:00', total_duration: '08:00' }
        ]);
        
        LeaveModel.getLeaveStatsByUsernamesAndDateRange.mockResolvedValue([
            { username: 'stu1', pending_count: 0, approved_count: 1 }
        ]);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should fetch and format consolidated attendance successfully', async () => {
        const campusId = 'camp-1';
        const roles = ['Student', 'Teacher'];
        const yearName = '2023-2024';
        const startDate = '2023-10-01'; // Sunday
        const endDate = '2023-10-02'; // Monday
        const tenantId = 'tenant-1';

        const result = await consolidatedAttendanceService.getConsolidatedAttendance(
            campusId, roles, yearName, startDate, endDate, tenantId
        );

        expect(pool.connect).toHaveBeenCalled();
        expect(AttendanceModel.syncStudentAttendanceInRange).toHaveBeenCalled();
        expect(UserModel.getActiveUsersWithAcademicFilters).toHaveBeenCalled();
        expect(result).toBeDefined();
        
        // Assert Sunday Holiday for Student
        const sundayStudent = result.find(r => r.username === 'stu1' && r.attendance_date === '2023-10-01');
        expect(sundayStudent.is_holiday).toBe(true);
        expect(sundayStudent.status).toBe('No Attendance');
        
        // Assert Monday Present for Student
        const mondayStudent = result.find(r => r.username === 'stu1' && r.attendance_date === '2023-10-02');
        expect(mondayStudent.is_holiday).toBe(false);
        expect(mondayStudent.status).toBe('Present');
        expect(mondayStudent.leaves_approved).toBe(1);
        
        // Assert Monday No Attendance for Teacher
        const mondayTeacher = result.find(r => r.username === 'tch1' && r.attendance_date === '2023-10-02');
        expect(mondayTeacher.status).toBe('No Attendance');
        expect(mondayTeacher.leaves_approved).toBe(0);
        
        expect(mockClient.release).toHaveBeenCalled();
    });

    it('should throw error and release client if query fails', async () => {
        UserModel.getActiveUsersWithAcademicFilters.mockRejectedValue(new Error('DB Error'));

        await expect(consolidatedAttendanceService.getConsolidatedAttendance(
            'camp-1', ['Student'], null, '2023-10-01', '2023-10-02', 'tenant-1'
        )).rejects.toThrow('DB Error');

        expect(mockClient.release).toHaveBeenCalled();
    });
});
