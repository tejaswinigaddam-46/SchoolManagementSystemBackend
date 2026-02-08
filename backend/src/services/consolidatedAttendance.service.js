const { pool } = require('../config/database');
const logger = require('../utils/logger');
const AttendanceModel = require('../models/attendance.model');
const HolidayModel = require('../models/holiday.model');
const WeekendPolicyModel = require('../models/weekendPolicy.model');
const SpecialWorkingDayModel = require('../models/specialWorkingDay.model');

async function getConsolidatedAttendance(campusId, roles, yearName, startDate, endDate, tenantId, classId = null, sectionId = null) {
    const client = await pool.connect();
    try {
        logger.info('Service.getConsolidatedAttendance called', {
            campusId, roles, yearName, startDate, endDate, tenantId, classId, sectionId
        });

        // 1. Sync Student Attendance if needed
        const isStudent = roles && roles.some(r => r.toLowerCase() === 'student');
        if (isStudent) {
            await AttendanceModel.syncStudentAttendanceInRange(client, campusId, startDate, endDate, yearName);
        }

        // 2. Fetch Users with Academic Year Context
        let usersQuery = `
            SELECT DISTINCT
                u.user_id, u.username, u.first_name, u.last_name, u.role,
                se.academic_year_id as student_ay_id
            FROM users u
            JOIN user_statuses us ON u.username = us.username
            LEFT JOIN student_enrollment se ON u.username = se.username
            LEFT JOIN classes c ON se.class_name = c.class_name
            LEFT JOIN academic_years ay ON se.academic_year_id = ay.academic_year_id
            WHERE u.tenant_id = $1 AND us.campus_id = $2 AND us.status = 'active'
            AND u.role = ANY($3)
        `;
        
        const queryParams = [tenantId, campusId, roles];
        let pIdx = 4;
        
        if (yearName) {
             usersQuery += ` AND (u.role != 'Student' OR ay.year_name = $${pIdx})`;
             queryParams.push(yearName);
             pIdx++;
        }
        
        if (classId) {
            usersQuery += ` AND (u.role != 'Student' OR c.class_id = $${pIdx})`;
            queryParams.push(classId);
            pIdx++;
        }

        if (sectionId) {
            usersQuery += ` AND (u.role != 'Student' OR se.section_id = $${pIdx})`;
            queryParams.push(sectionId);
            pIdx++;
        }
        
        const usersRes = await client.query(usersQuery, queryParams);
        let users = usersRes.rows;

        // If Teachers are involved, fetch their academic years from subjects
        const teacherIds = users.filter(u => u.role === 'Teacher').map(u => u.user_id);
        const teacherAyMap = new Map();
        
        if (teacherIds.length > 0) {
            const teacherAyQuery = `
                SELECT DISTINCT ss.teacher_user_id, cs.academic_year_id
                FROM section_subjects ss
                JOIN class_sections cs ON ss.section_id = cs.section_id
                WHERE ss.teacher_user_id = ANY($1)
            `;
            const tRes = await client.query(teacherAyQuery, [teacherIds]);
            tRes.rows.forEach(row => {
                if (!teacherAyMap.has(row.teacher_user_id)) {
                    teacherAyMap.set(row.teacher_user_id, new Set());
                }
                teacherAyMap.get(row.teacher_user_id).add(row.academic_year_id);
            });
        }

        // 3. Fetch Holidays, Policies, Special Days
        const holidays = await HolidayModel.getAll(campusId, { startDate, endDate });
        const policies = await WeekendPolicyModel.getAllByCampus(campusId);
        const specialDays = await SpecialWorkingDayModel.getAll(campusId, { startDate, endDate });

        // LOGGING FOR DEBUGGING
        logger.info('DEBUG: Fetched Global Config', {
            holidaysCount: holidays.length,
            policiesCount: policies.length,
            specialDaysCount: specialDays.length,
            holidays,
            policies,
            specialDays
        });

        // 4. Fetch Existing Attendance
        const attRes = await client.query(`
            SELECT username, TO_CHAR(attendance_date, 'YYYY-MM-DD') as attendance_date_str, status, 
            TO_CHAR(duration, 'HH24:MI') as duration, 
            TO_CHAR(total_duration, 'HH24:MI') as total_duration, 
            login_time, logout_time
            FROM user_attendance
            WHERE campus_id = $1 AND attendance_date BETWEEN $2::date AND $3::date
        `, [campusId, startDate, endDate]);
        
        const attMap = new Map();
        attRes.rows.forEach(r => {
            const d = r.attendance_date_str;
            attMap.set(`${r.username}_${d}`, r);
        });

        logger.info('DEBUG: Attendance Map Stats', {
            totalRecords: attRes.rowCount,
            sampleKey: attMap.size > 0 ? Array.from(attMap.keys())[0] : 'None',
            queryRange: { startDate, endDate }
        });
        
        logger.info('DEBUG: Attendance Map Keys Sample', { 
            count: attMap.size, 
            keys: Array.from(attMap.keys()).slice(0, 10) 
        });

        // 4.5 Fetch Leave Counts
        const usernames = users.map(u => u.username);
        const leaveStatsMap = new Map();
        
        if (usernames.length > 0) {
            const leaveQuery = `
                SELECT username,
                       COUNT(*) FILTER (WHERE overall_status = 'pending') as pending_count,
                       COUNT(*) FILTER (WHERE overall_status = 'approved' AND leave_date BETWEEN $2::date AND $3::date) as approved_count
                FROM leave_requests
                WHERE username = ANY($1)
                GROUP BY username
            `;
            try {
                const leaveRes = await client.query(leaveQuery, [usernames, startDate, endDate]);
                leaveRes.rows.forEach(r => {
                    leaveStatsMap.set(r.username, {
                        pending: parseInt(r.pending_count || 0),
                        approved: parseInt(r.approved_count || 0)
                    });
                });
            } catch (err) {
                logger.error('Error fetching leave stats', { error: err.message });
                // Continue without stats rather than failing everything
            }
        }

        // 5. Build Result
        const results = [];
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        const getDayStatus = (dateStr, ayIds, role) => {
             const d = new Date(dateStr);
             const dayOfWeek = d.getDay();
             
             let applicableAyIds = [];
             if (role === 'Student' || role === 'Teacher') {
                 applicableAyIds = Array.from(ayIds || []);
             } else {
                 applicableAyIds = policies.map(p => p.academic_year_id);
             }

             // Check Special Working Day (Overrides Holiday)
             const isSWD = specialDays.some(sd => {
                 const sdDate = new Date(sd.work_date).toISOString().split('T')[0];
                 if (sdDate !== dateStr) return false;
                 if (!sd.academic_year_ids || sd.academic_year_ids.length === 0) return true;
                 if (role !== 'Student' && role !== 'Teacher') return true;
                 return sd.academic_year_ids.some(id => applicableAyIds.includes(id));
             });
             
             if (isSWD) return { isHoliday: false, isHalfDay: false }; // Assuming SWD is full day unless specified otherwise (model check needed if SWD has half day flag?)

             // Check Holidays (Events)
             const isEvent = holidays.some(h => {
                 const s = new Date(h.start_date).toISOString().split('T')[0];
                 const e = new Date(h.end_date || h.start_date).toISOString().split('T')[0];
                 if (dateStr < s || dateStr > e) return false;
                 if (!h.academic_year_ids || h.academic_year_ids.length === 0) return true;
                 if (role !== 'Student' && role !== 'Teacher') return true;
                 return h.academic_year_ids.some(id => applicableAyIds.includes(id));
             });
             
             if (isEvent) return { isHoliday: true, isHalfDay: false };

             // Check Weekend Policy
             let isHoliday = false;
             let isHalfDay = false;

             if (role === 'Student' || role === 'Teacher') {
                 if (applicableAyIds.length === 0) {
                     // No AY context -> Check any policy matching the day
                     const matchingPolicies = policies.filter(p => {
                         if (dayOfWeek === 0 && p.is_sunday_holiday) return true;
                         if (dayOfWeek === 6 && p.is_saturday_holiday && !p.is_saturday_half_day) return true;
                         return false;
                     });
                     // If ALL policies say it's a holiday, it's a holiday? Or if ANY?
                     // Original logic: "checkWeekendAny" -> returns true if ANY policy says it's a holiday.
                     // But wait, if one policy says Saturday is holiday, and another says it's half day... 
                     // Safe bet: if any policy says holiday, treat as holiday? 
                     // Or prioritize working?
                     // Let's assume strict: if any policy applicable says holiday, it is.
                     
                     // Revised Logic for "Half Day overrides Holiday":
                     // If it is Saturday:
                     // If ANY policy says Half Day -> It is Half Day (Not Holiday)
                     // Else If ANY policy says Holiday -> It is Holiday
                     
                     if (dayOfWeek === 6) {
                         const anyHalfDay = policies.some(p => p.is_saturday_half_day);
                         if (anyHalfDay) {
                             isHoliday = false;
                             isHalfDay = true;
                         } else {
                             const anyHoliday = policies.some(p => p.is_saturday_holiday);
                             isHoliday = anyHoliday;
                         }
                     } else if (dayOfWeek === 0) {
                         // Sunday
                         const anyHoliday = policies.some(p => p.is_sunday_holiday);
                         isHoliday = anyHoliday;
                     }

                 } else {
                     // We have specific AY IDs. Check if working in ANY of them.
                     const statuses = applicableAyIds.map(ayId => {
                         const p = policies.find(x => x.academic_year_id === ayId);
                         if (!p) return { isHoliday: false, isHalfDay: false }; // Default working
                         if (dayOfWeek === 0) {
                             return { isHoliday: p.is_sunday_holiday, isHalfDay: false };
                         }
                         if (dayOfWeek === 6) {
                             if (p.is_saturday_half_day) return { isHoliday: false, isHalfDay: true };
                             if (p.is_saturday_holiday) return { isHoliday: true, isHalfDay: false };
                             return { isHoliday: false, isHalfDay: false };
                         }
                         return { isHoliday: false, isHalfDay: false };
                     });

                     // If user is working in ANY of the contexts, they are working.
                     // Priority: Working (Half) > Working (Full) > Holiday?
                     // Or: Working (Full) > Working (Half) > Holiday
                     
                     const isWorkingFull = statuses.some(s => !s.isHoliday && !s.isHalfDay);
                     const isWorkingHalf = statuses.some(s => !s.isHoliday && s.isHalfDay);
                     
                     if (isWorkingFull) {
                         isHoliday = false;
                         isHalfDay = false;
                     } else if (isWorkingHalf) {
                         isHoliday = false;
                         isHalfDay = true;
                     } else {
                         isHoliday = true; // All contexts say holiday
                     }
                 }
             } else {
                 // Other roles (Admin, etc) - Check against ALL policies
                 // Logic: If they are required to work by ANY policy, they work.
                 // Similar to above.
                 
                 if (dayOfWeek === 6) {
                     const anyHalfDay = policies.some(p => p.is_saturday_half_day);
                     const anyWorking = policies.some(p => !p.is_saturday_holiday && !p.is_saturday_half_day);
                     
                     if (anyWorking) {
                         isHoliday = false;
                         isHalfDay = false;
                     } else if (anyHalfDay) {
                         isHoliday = false;
                         isHalfDay = true;
                     } else {
                         // Check if all are holidays? 
                         // Or if any is holiday?
                         // If I am Admin, and School A is open, I work.
                         // So if ANY policy says working, I work.
                         // Only if ALL policies say Holiday, I don't work.
                         
                         const allHoliday = policies.every(p => p.is_saturday_holiday);
                         isHoliday = allHoliday;
                     }
                 } else if (dayOfWeek === 0) {
                     const allHoliday = policies.every(p => p.is_sunday_holiday);
                     isHoliday = allHoliday;
                 }
             }
             
             return { isHoliday, isHalfDay };
        };
        
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            
            for (const user of users) {
                const key = `${user.username}_${dateStr}`;
                const att = attMap.get(key);
                
                let ayIds = new Set();
                if (user.role === 'Student') {
                    if (user.student_ay_id) ayIds.add(user.student_ay_id);
                } else if (user.role === 'Teacher') {
                    const tIds = teacherAyMap.get(user.user_id);
                    if (tIds) tIds.forEach(id => ayIds.add(id));
                }
                
                let status = 'No Attendance';
                let duration = '00:00';
                let total_duration = '00:00';
                let login_time = null;
                let logout_time = null;
                
                if (att) {
                    status = att.status || 'No Attendance';
                    duration = att.duration ? String(att.duration).substring(0, 5) : '00:00';
                    total_duration = att.total_duration ? String(att.total_duration).substring(0, 5) : '00:00';
                    login_time = att.login_time;
                    logout_time = att.logout_time;
                }
                
                if (user.role === 'Teacher') {
                    // LOGGING TEACHER CONTEXT
                    logger.info(`DEBUG: Teacher Context ${user.username}`, {
                        campusId,
                        teacherName: `${user.first_name} ${user.last_name}`,
                        associatedAyIds: Array.from(ayIds)
                    });
                }
                
                const { isHoliday, isHalfDay } = getDayStatus(dateStr, ayIds, user.role);
                const leaveStats = leaveStatsMap.get(user.username) || { pending: 0, approved: 0 };
                
                // Optional: Inject default duration for half-day if requested by user "default of 4 hours"
                // Assuming this means "display 4 hours expectation" or "if present, expect 4 hours"?
                // If I change duration here, it fakes attendance. I shouldn't fake attendance.
                // I will just return is_half_day and let frontend decide or just rely on is_holiday=false.
                // However, user said "mark it as working day with default of 4 hours".
                // I'll add a field `expected_hours`.
                
                results.push({
                    attendance_date: dateStr,
                    user_id: user.user_id,
                    username: user.username,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    role: user.role,
                    status,
                    duration,
                    total_duration,
                    login_time,
                    logout_time,
                    is_holiday: isHoliday,
                    is_half_day: isHalfDay,
                    expected_hours: isHalfDay ? '04:00' : '08:00', // Simple default
                    leaves_pending: leaveStats.pending,
                    leaves_approved: leaveStats.approved
                });
            }
        }
        
        return results;
    } catch (error) {
        logger.error('Service.getConsolidatedAttendance error', { error: error.message, stack: error.stack });
        throw error;
    } finally {
        client.release();
    }
}

module.exports = {
    getConsolidatedAttendance
};
