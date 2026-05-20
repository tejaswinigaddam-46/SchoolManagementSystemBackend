const { pool } = require('../config/database');
const logger = require('../utils/logger');
const AttendanceModel = require('../models/attendance.model');
const HolidayModel = require('../models/holiday.model');
const WeekendPolicyModel = require('../models/weekendPolicy.model');
const SpecialWorkingDayModel = require('../models/specialWorkingDay.model');
const UserModel = require('../models/user.model');
const SectionSubjectModel = require('../models/sectionSubject.model');
const LeaveModel = require('../models/leave.model');

async function getConsolidatedAttendance(
    campusId,
    roles,
    yearName,
    startDate,
    endDate,
    tenantId,
    classId = null,
    sectionId = null,
    options = {}
) {
    const client = await pool.connect();
    const traceId = options?.traceId;
    const runId = options?.runId || 'post';
    const t0 = Date.now();
    try {
        logger.info('Service.getConsolidatedAttendance called', {
            campusId, roles, yearName, startDate, endDate, tenantId, classId, sectionId
        });

        // #region debug-point A:service-entry
        (() => { const fs = require('fs'); const ps = ['.dbg/consolidated-attendance-timeout.env', '../.dbg/consolidated-attendance-timeout.env']; let u = 'http://127.0.0.1:7777/event', s = 'consolidated-attendance-timeout'; for (const p of ps) { try { const e = fs.readFileSync(p, 'utf8'); u = e.match(/DEBUG_SERVER_URL=(.+)/)?.[1] || u; s = e.match(/DEBUG_SESSION_ID=(.+)/)?.[1] || s; break; } catch {} } fetch(u, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: s, runId, hypothesisId: 'A', location: 'consolidatedAttendance.service.js', msg: '[DEBUG] service start', data: { campusId, startDate, endDate, rolesCount: Array.isArray(roles) ? roles.length : 0, yearNamePresent: Boolean(yearName), classIdPresent: Boolean(classId), sectionIdPresent: Boolean(sectionId), limit: Number.isInteger(options?.limit) ? options.limit : null, offset: Number.isInteger(options?.offset) ? options.offset : null }, ts: Date.now(), traceId }) }).catch(() => {}) })();
        // #endregion

        // 1. Sync Student Attendance if needed
        const tSync0 = Date.now();
        const isStudent = roles && roles.some(r => r.toLowerCase() === 'student');
        const hasYearName = yearName !== null && yearName !== undefined && String(yearName).trim() !== '';
        if (isStudent && hasYearName) {
            await AttendanceModel.syncStudentAttendanceInRange(client, campusId, startDate, endDate, yearName);
        }
        // #region debug-point C:sync-done
        (() => { const fs = require('fs'); const ps = ['.dbg/consolidated-attendance-timeout.env', '../.dbg/consolidated-attendance-timeout.env']; let u = 'http://127.0.0.1:7777/event', s = 'consolidated-attendance-timeout'; for (const p of ps) { try { const e = fs.readFileSync(p, 'utf8'); u = e.match(/DEBUG_SERVER_URL=(.+)/)?.[1] || u; s = e.match(/DEBUG_SESSION_ID=(.+)/)?.[1] || s; break; } catch {} } fetch(u, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: s, runId, hypothesisId: 'C', location: 'consolidatedAttendance.service.js', msg: '[DEBUG] sync step completed', data: { elapsedMs: Date.now() - tSync0, didSync: Boolean(isStudent && hasYearName) }, ts: Date.now(), traceId }) }).catch(() => {}) })();
        // #endregion

        // 2. Fetch Users with Academic Year Context
        const tUsers0 = Date.now();
        const academicFilters = hasYearName ? { yearName, classId, sectionId } : {};
        const users = await UserModel.getActiveUsersWithAcademicFilters(
            tenantId,
            campusId,
            roles,
            academicFilters,
            client
        );

        // If Teachers are involved, fetch their academic years from subjects
        const teacherIds = users.filter(u => u.role === 'Teacher').map(u => u.user_id);
        const teacherAyMap = new Map();
        
        if (teacherIds.length > 0) {
            const tTeacherAy0 = Date.now();
            const rows = await SectionSubjectModel.getTeacherAcademicYears(teacherIds, client);
            rows.forEach(row => {
                if (!teacherAyMap.has(row.teacher_user_id)) {
                    teacherAyMap.set(row.teacher_user_id, new Set());
                }
                teacherAyMap.get(row.teacher_user_id).add(row.academic_year_id);
            });
            // #region debug-point A:teacher-ay-done
            (() => { const fs = require('fs'); const ps = ['.dbg/consolidated-attendance-timeout.env', '../.dbg/consolidated-attendance-timeout.env']; let u = 'http://127.0.0.1:7777/event', s = 'consolidated-attendance-timeout'; for (const p of ps) { try { const e = fs.readFileSync(p, 'utf8'); u = e.match(/DEBUG_SERVER_URL=(.+)/)?.[1] || u; s = e.match(/DEBUG_SESSION_ID=(.+)/)?.[1] || s; break; } catch {} } fetch(u, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: s, runId, hypothesisId: 'A', location: 'consolidatedAttendance.service.js', msg: '[DEBUG] teacher academic years loaded', data: { elapsedMs: Date.now() - tTeacherAy0, teacherCount: teacherIds.length, rows: rows.length }, ts: Date.now(), traceId }) }).catch(() => {}) })();
            // #endregion
        }

        // #region debug-point A:users-done
        (() => { const fs = require('fs'); const ps = ['.dbg/consolidated-attendance-timeout.env', '../.dbg/consolidated-attendance-timeout.env']; let u = 'http://127.0.0.1:7777/event', s = 'consolidated-attendance-timeout'; for (const p of ps) { try { const e = fs.readFileSync(p, 'utf8'); u = e.match(/DEBUG_SERVER_URL=(.+)/)?.[1] || u; s = e.match(/DEBUG_SESSION_ID=(.+)/)?.[1] || s; break; } catch {} } fetch(u, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: s, runId, hypothesisId: 'A', location: 'consolidatedAttendance.service.js', msg: '[DEBUG] users loaded', data: { elapsedMs: Date.now() - tUsers0, users: users.length, teachers: teacherIds.length }, ts: Date.now(), traceId }) }).catch(() => {}) })();
        // #endregion

        // 3. Fetch Holidays, Policies, Special Days
        const tConfig0 = Date.now();
        const holidays = await HolidayModel.getAll(campusId, { startDate, endDate });
        const policies = await WeekendPolicyModel.getAllByCampus(campusId);
        const specialDays = await SpecialWorkingDayModel.getAll(campusId, { startDate, endDate });

        logger.info('Consolidated attendance config loaded', {
            holidaysCount: holidays.length,
            policiesCount: policies.length,
            specialDaysCount: specialDays.length
        });
        // #region debug-point A:config-done
        (() => { const fs = require('fs'); const ps = ['.dbg/consolidated-attendance-timeout.env', '../.dbg/consolidated-attendance-timeout.env']; let u = 'http://127.0.0.1:7777/event', s = 'consolidated-attendance-timeout'; for (const p of ps) { try { const e = fs.readFileSync(p, 'utf8'); u = e.match(/DEBUG_SERVER_URL=(.+)/)?.[1] || u; s = e.match(/DEBUG_SESSION_ID=(.+)/)?.[1] || s; break; } catch {} } fetch(u, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: s, runId, hypothesisId: 'A', location: 'consolidatedAttendance.service.js', msg: '[DEBUG] holidays/policies/special-days loaded', data: { elapsedMs: Date.now() - tConfig0, holidays: holidays.length, policies: policies.length, specialDays: specialDays.length }, ts: Date.now(), traceId }) }).catch(() => {}) })();
        // #endregion

        // 4. Fetch Existing Attendance
        const tAttendance0 = Date.now();
        const usernames = users.map(u => u.username);
        const attRows = await AttendanceModel.getUserAttendanceByCampusAndDateRange(
            campusId,
            startDate,
            endDate,
            usernames,
            client
        );
        // #region debug-point A:attendance-done
        (() => { const fs = require('fs'); const ps = ['.dbg/consolidated-attendance-timeout.env', '../.dbg/consolidated-attendance-timeout.env']; let u = 'http://127.0.0.1:7777/event', s = 'consolidated-attendance-timeout'; for (const p of ps) { try { const e = fs.readFileSync(p, 'utf8'); u = e.match(/DEBUG_SERVER_URL=(.+)/)?.[1] || u; s = e.match(/DEBUG_SESSION_ID=(.+)/)?.[1] || s; break; } catch {} } fetch(u, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: s, runId, hypothesisId: 'A', location: 'consolidatedAttendance.service.js', msg: '[DEBUG] user_attendance loaded', data: { elapsedMs: Date.now() - tAttendance0, usernames: usernames.length, rows: attRows.length }, ts: Date.now(), traceId }) }).catch(() => {}) })();
        // #endregion

        const attByUser = new Map();
        for (const r of attRows) {
            if (!attByUser.has(r.username)) attByUser.set(r.username, new Map());
            attByUser.get(r.username).set(r.attendance_date_str, r);
        }

        // 4.5 Fetch Leave Counts
        const leaveStatsMap = new Map();
        
        if (usernames.length > 0) {
            try {
                const tLeaves0 = Date.now();
                const rows = await LeaveModel.getLeaveStatsByUsernamesAndDateRange(usernames, startDate, endDate, client);
                rows.forEach(r => {
                    leaveStatsMap.set(r.username, {
                        pending: parseInt(r.pending_count || 0),
                        approved: parseInt(r.approved_count || 0)
                    });
                });
                // #region debug-point A:leaves-done
                (() => { const fs = require('fs'); const ps = ['.dbg/consolidated-attendance-timeout.env', '../.dbg/consolidated-attendance-timeout.env']; let u = 'http://127.0.0.1:7777/event', s = 'consolidated-attendance-timeout'; for (const p of ps) { try { const e = fs.readFileSync(p, 'utf8'); u = e.match(/DEBUG_SERVER_URL=(.+)/)?.[1] || u; s = e.match(/DEBUG_SESSION_ID=(.+)/)?.[1] || s; break; } catch {} } fetch(u, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: s, runId, hypothesisId: 'A', location: 'consolidatedAttendance.service.js', msg: '[DEBUG] leave stats loaded', data: { elapsedMs: Date.now() - tLeaves0, rows: rows.length }, ts: Date.now(), traceId }) }).catch(() => {}) })();
                // #endregion
            } catch (err) {
                logger.error('Error fetching leave stats', { error: err.message });
                // Continue without stats rather than failing everything
            }
        }

        // 5. Build Result
        const tBuild0 = Date.now();
        const start = new Date(startDate);
        const end = new Date(endDate);
        const toDateStr = (dt) => dt.toISOString().slice(0, 10);

        const days = [];
        for (let dt = new Date(start); dt <= end; dt.setUTCDate(dt.getUTCDate() + 1)) {
            days.push({ dateStr: toDateStr(dt), dayOfWeek: dt.getUTCDay() });
        }

        const policyByAyId = new Map();
        for (const p of policies) policyByAyId.set(p.academic_year_id, p);

        const anySatHalfDay = policies.some(p => p.is_saturday_half_day);
        const anySatHoliday = policies.some(p => p.is_saturday_holiday);
        const anySunHoliday = policies.some(p => p.is_sunday_holiday);
        const satAnyWorkingFull = policies.some(p => !p.is_saturday_holiday && !p.is_saturday_half_day);
        const satAllHoliday = policies.length > 0 ? policies.every(p => p.is_saturday_holiday) : false;
        const sunAllHoliday = policies.length > 0 ? policies.every(p => p.is_sunday_holiday) : false;

        const specialByDate = new Map();
        for (const sd of specialDays) {
            const dateStr = toDateStr(new Date(sd.work_date));
            if (!specialByDate.has(dateStr)) specialByDate.set(dateStr, []);
            specialByDate.get(dateStr).push(sd);
        }

        const holidayByDate = new Map();
        for (const h of holidays) {
            const s = new Date(h.start_date);
            const e = new Date(h.end_date || h.start_date);
            const rangeStart = s < start ? new Date(start) : new Date(s);
            const rangeEnd = e > end ? new Date(end) : new Date(e);
            for (let dt = new Date(rangeStart); dt <= rangeEnd; dt.setUTCDate(dt.getUTCDate() + 1)) {
                const dateStr = toDateStr(dt);
                if (!holidayByDate.has(dateStr)) holidayByDate.set(dateStr, []);
                holidayByDate.get(dateStr).push(h);
            }
        }

        const hasAyIntersection = (recordAyIds, ayIdSet) => {
            if (!recordAyIds || recordAyIds.length === 0) return true;
            if (!ayIdSet || ayIdSet.size === 0) return false;
            for (const id of recordAyIds) {
                if (ayIdSet.has(id)) return true;
            }
            return false;
        };

        const getDayStatus = (dateStr, dayOfWeek, userAyIds, role) => {
            const isStudentOrTeacher = role === 'Student' || role === 'Teacher';

            const specialList = specialByDate.get(dateStr) || [];
            for (const sd of specialList) {
                if (!sd.academic_year_ids || sd.academic_year_ids.length === 0) return { isHoliday: false, isHalfDay: false };
                if (!isStudentOrTeacher) return { isHoliday: false, isHalfDay: false };
                if (hasAyIntersection(sd.academic_year_ids, userAyIds)) return { isHoliday: false, isHalfDay: false };
            }

            const holidayList = holidayByDate.get(dateStr) || [];
            for (const h of holidayList) {
                if (!h.academic_year_ids || h.academic_year_ids.length === 0) return { isHoliday: true, isHalfDay: false };
                if (!isStudentOrTeacher) return { isHoliday: true, isHalfDay: false };
                if (hasAyIntersection(h.academic_year_ids, userAyIds)) return { isHoliday: true, isHalfDay: false };
            }

            if (dayOfWeek !== 0 && dayOfWeek !== 6) return { isHoliday: false, isHalfDay: false };

            if (isStudentOrTeacher) {
                if (!userAyIds || userAyIds.size === 0) {
                    if (dayOfWeek === 6) {
                        if (anySatHalfDay) return { isHoliday: false, isHalfDay: true };
                        return { isHoliday: anySatHoliday, isHalfDay: false };
                    }
                    return { isHoliday: anySunHoliday, isHalfDay: false };
                }

                let isWorkingFull = false;
                let isWorkingHalf = false;

                for (const ayId of userAyIds) {
                    const p = policyByAyId.get(ayId);
                    if (!p) {
                        isWorkingFull = true;
                        break;
                    }

                    if (dayOfWeek === 0) {
                        if (!p.is_sunday_holiday) {
                            isWorkingFull = true;
                            break;
                        }
                        continue;
                    }

                    if (p.is_saturday_half_day) {
                        isWorkingHalf = true;
                        continue;
                    }

                    if (!p.is_saturday_holiday) {
                        isWorkingFull = true;
                        break;
                    }
                }

                if (isWorkingFull) return { isHoliday: false, isHalfDay: false };
                if (isWorkingHalf) return { isHoliday: false, isHalfDay: true };
                return { isHoliday: true, isHalfDay: false };
            }

            if (dayOfWeek === 6) {
                if (satAnyWorkingFull) return { isHoliday: false, isHalfDay: false };
                if (anySatHalfDay) return { isHoliday: false, isHalfDay: true };
                return { isHoliday: satAllHoliday, isHalfDay: false };
            }

            return { isHoliday: sunAllHoliday, isHalfDay: false };
        };

        const userContexts = users.map(user => {
            const ayIds = new Set();
            if (user.role === 'Student') {
                if (user.student_ay_id) ayIds.add(user.student_ay_id);
            } else if (user.role === 'Teacher') {
                const tIds = teacherAyMap.get(user.user_id);
                if (tIds) tIds.forEach(id => ayIds.add(id));
            }
            return { user, ayIds };
        });

        const buildRow = (dateStr, dayOfWeek, ctx) => {
            const { user, ayIds } = ctx;
            const att = attByUser.get(user.username)?.get(dateStr);

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

            const { isHoliday, isHalfDay } = getDayStatus(dateStr, dayOfWeek, ayIds, user.role);
            const leaveStats = leaveStatsMap.get(user.username) || { pending: 0, approved: 0 };

            return {
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
                expected_hours: isHalfDay ? '04:00' : '08:00',
                leaves_pending: leaveStats.pending,
                leaves_approved: leaveStats.approved
            };
        };

        const limitRaw = options?.limit;
        const offsetRaw = options?.offset;
        const limit = Number.isInteger(limitRaw) ? limitRaw : null;
        const offset = Number.isInteger(offsetRaw) ? offsetRaw : 0;

        if (limit && limit > 0) {
            const usersCount = userContexts.length;
            const total = days.length * usersCount;
            const startIndex = Math.max(0, offset);
            const endIndex = Math.min(total, startIndex + limit);
            const rows = [];

            for (let i = startIndex; i < endIndex; i++) {
                const dayIdx = Math.floor(i / usersCount);
                const userIdx = i % usersCount;
                const day = days[dayIdx];
                const ctx = userContexts[userIdx];
                rows.push(buildRow(day.dateStr, day.dayOfWeek, ctx));
            }

            // #region debug-point B:build-done-paged
            (() => { const fs = require('fs'); const ps = ['.dbg/consolidated-attendance-timeout.env', '../.dbg/consolidated-attendance-timeout.env']; let u = 'http://127.0.0.1:7777/event', s = 'consolidated-attendance-timeout'; for (const p of ps) { try { const e = fs.readFileSync(p, 'utf8'); u = e.match(/DEBUG_SERVER_URL=(.+)/)?.[1] || u; s = e.match(/DEBUG_SESSION_ID=(.+)/)?.[1] || s; break; } catch {} } fetch(u, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: s, runId, hypothesisId: 'B', location: 'consolidatedAttendance.service.js', msg: '[DEBUG] build completed (paged)', data: { elapsedMs: Date.now() - tBuild0, days: days.length, users: usersCount, rows: rows.length, total, limit, offset: startIndex }, ts: Date.now(), traceId }) }).catch(() => {}) })();
            // #endregion

            // #region debug-point A:service-exit-paged
            (() => { const fs = require('fs'); const ps = ['.dbg/consolidated-attendance-timeout.env', '../.dbg/consolidated-attendance-timeout.env']; let u = 'http://127.0.0.1:7777/event', s = 'consolidated-attendance-timeout'; for (const p of ps) { try { const e = fs.readFileSync(p, 'utf8'); u = e.match(/DEBUG_SERVER_URL=(.+)/)?.[1] || u; s = e.match(/DEBUG_SESSION_ID=(.+)/)?.[1] || s; break; } catch {} } fetch(u, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: s, runId, hypothesisId: 'A', location: 'consolidatedAttendance.service.js', msg: '[DEBUG] service end (paged)', data: { totalElapsedMs: Date.now() - t0 }, ts: Date.now(), traceId }) }).catch(() => {}) })();
            // #endregion

            return { rows, total, limit, offset: startIndex };
        }

        const results = [];
        for (const day of days) {
            for (const ctx of userContexts) {
                results.push(buildRow(day.dateStr, day.dayOfWeek, ctx));
            }
        }

        // #region debug-point B:build-done-unpaged
        (() => { const fs = require('fs'); const ps = ['.dbg/consolidated-attendance-timeout.env', '../.dbg/consolidated-attendance-timeout.env']; let u = 'http://127.0.0.1:7777/event', s = 'consolidated-attendance-timeout'; for (const p of ps) { try { const e = fs.readFileSync(p, 'utf8'); u = e.match(/DEBUG_SERVER_URL=(.+)/)?.[1] || u; s = e.match(/DEBUG_SESSION_ID=(.+)/)?.[1] || s; break; } catch {} } fetch(u, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: s, runId, hypothesisId: 'B', location: 'consolidatedAttendance.service.js', msg: '[DEBUG] build completed (unpaged)', data: { elapsedMs: Date.now() - tBuild0, days: days.length, users: userContexts.length, rows: results.length }, ts: Date.now(), traceId }) }).catch(() => {}) })();
        // #endregion

        // #region debug-point A:service-exit-unpaged
        (() => { const fs = require('fs'); const ps = ['.dbg/consolidated-attendance-timeout.env', '../.dbg/consolidated-attendance-timeout.env']; let u = 'http://127.0.0.1:7777/event', s = 'consolidated-attendance-timeout'; for (const p of ps) { try { const e = fs.readFileSync(p, 'utf8'); u = e.match(/DEBUG_SERVER_URL=(.+)/)?.[1] || u; s = e.match(/DEBUG_SESSION_ID=(.+)/)?.[1] || s; break; } catch {} } fetch(u, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: s, runId, hypothesisId: 'A', location: 'consolidatedAttendance.service.js', msg: '[DEBUG] service end (unpaged)', data: { totalElapsedMs: Date.now() - t0 }, ts: Date.now(), traceId }) }).catch(() => {}) })();
        // #endregion

        return results;
    } catch (error) {
        // #region debug-point D:service-error
        (() => { const fs = require('fs'); const ps = ['.dbg/consolidated-attendance-timeout.env', '../.dbg/consolidated-attendance-timeout.env']; let u = 'http://127.0.0.1:7777/event', s = 'consolidated-attendance-timeout'; for (const p of ps) { try { const e = fs.readFileSync(p, 'utf8'); u = e.match(/DEBUG_SERVER_URL=(.+)/)?.[1] || u; s = e.match(/DEBUG_SESSION_ID=(.+)/)?.[1] || s; break; } catch {} } fetch(u, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: s, runId, hypothesisId: 'D', location: 'consolidatedAttendance.service.js', msg: '[DEBUG] service error', data: { error: error?.message, totalElapsedMs: Date.now() - t0 }, ts: Date.now(), traceId }) }).catch(() => {}) })();
        // #endregion
        logger.error('Service.getConsolidatedAttendance error', { error: error.message, stack: error.stack });
        throw error;
    } finally {
        client.release();
    }
}

module.exports = {
    getConsolidatedAttendance
};
