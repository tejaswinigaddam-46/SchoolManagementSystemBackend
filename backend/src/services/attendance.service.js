const { pool } = require('../config/database');
const logger = require('../utils/logger');
const attendanceModel = require('../models/attendance.model');
const eventModel = require('../models/event.model');
const UserModel = require('../models/user.model');

// ==================== ATTENDANCE SERVICE METHODS ====================

/**
 * Get attendance records for a specific event
 */
const getAttendanceByEventId = async (tenantId, campusId, eventId) => {
    try {
        const rows = await attendanceModel.getAttendanceByEventId(eventId);

        return rows.map(row => ({
            attendanceId: row.attendance_id,
            studentId: row.student_id,
            status: row.attendance_status,
            actualPresentHours: row.actual_present_hours,
            totalScheduledHours: row.total_scheduled_hours,
            academicYearId: row.academic_year_id,
            firstName: row.first_name,
            lastName: row.last_name,
            role: row.role
        }));

    } catch (error) {
        logger.error('SERVICE: Error getting attendance by event:', error);
        throw error;
    }
};

/**
 * Save attendance records (Upsert - Insert or Update)
 * Adapted for Event-Based Schema
 */
const saveAttendance = async (data) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        const { 
            attendanceData, eventId, date: inputDate, academicYearId 
        } = data;

        logger.info('SERVICE.saveAttendance: Start', {
            eventId,
            inputDate,
            academicYearId,
            incomingCount: Array.isArray(attendanceData) ? attendanceData.length : 0
        });

        if (!eventId) {
            logger.warn('SERVICE.saveAttendance: Missing eventId');
            throw new Error('Event ID is required to save attendance');
        }

        if (!attendanceData || !Array.isArray(attendanceData)) {
            logger.warn('SERVICE.saveAttendance: Invalid attendanceData');
            throw new Error('Invalid attendance payload');
        }

        // 1) Get Event (to understand type and for later date/year mapping)
        const event = await eventModel.getEventById(eventId);
        if (!event) {
            logger.warn('SERVICE.saveAttendance: Event not found', { eventId });
            throw new Error('Event not found');
        }
        const eventType = event?.event_type;
        // Priority: Use the date passed from the frontend (inputDate), otherwise fallback to event start date
        const attendanceDate = inputDate || event?.start_date;
        const finalAcademicYearId = academicYearId || event?.academic_year_id;
        
        logger.info('SERVICE.saveAttendance: Event loaded', { eventType, attendanceDate, campusId: event.campus_id, academicYearId: finalAcademicYearId });

        if (!attendanceDate) {
             throw new Error('Attendance date cannot be determined (no input date and no event start date)');
        }

        // Resolve academic year name for user_attendance sync
        let yearName = null;
        if (finalAcademicYearId) {
            try {
                const yr = await client.query(`SELECT year_name FROM academic_years WHERE academic_year_id = $1`, [finalAcademicYearId]);
                yearName = yr.rows?.[0]?.year_name || null;
            } catch (e) {
                logger.warn('SERVICE.saveAttendance: Could not resolve academic year name', { academicYearId: finalAcademicYearId, error: e.message });
            }
        }

        // Normalize and upsert attendance for all records
        const upsertList = [];
        const impactedIdsSet = new Set();
        for (const record of attendanceData) {
            const { studentId, status, actual_present_hours, total_scheduled_hours } = record || {};
            if (studentId == null) continue;
            impactedIdsSet.add(String(studentId));
            const normalized = status === 'Present' ? 'Present' : 'Absent';
            upsertList.push({
                studentId,
                status: normalized,
                actual_present_hours,
                total_scheduled_hours
            });
        }

        logger.info('SERVICE.saveAttendance: Prepared CRUD batches', {
            upserts: upsertList.length,
            deletes: 0,
            impacted: impactedIdsSet.size
        });

        // Upsert all
        let savedCount = 0;
        for (const record of upsertList) {
            await attendanceModel.upsertAttendance(client, {
                eventId,
                studentId: record.studentId,
                status: record.status,
                actualPresentHours: record.actual_present_hours,
                totalScheduledHours: record.total_scheduled_hours,
                attendanceDate,
                academicYearId: finalAcademicYearId,
                yearName
            });
            savedCount++;
        }
        logger.info('SERVICE.saveAttendance: Upsert complete', { savedCount });

        // 4) Compute per-user daily attendance values (based only on this event submission)
        //    and upsert them via UserModel.saveUserAttendance (no raw SQL writes here)
        // Resolve campus and academic year name
        const campusId = event.campus_id;
        
        // yearName is already resolved above

        if (!attendanceDate) {
            // Hard error: cannot proceed; trigger rollback for all previous steps
            throw new Error('Unable to resolve attendance date from event; aborting saveAttendance');
        }

        // Build a status map from payload for impacted users
        const statusById = new Map();
        for (const r of attendanceData) {
            if (impactedIdsSet.has(String(r.studentId))) {
                const normalized = r.status === 'Present' ? 'Present' : 'Absent';
                statusById.set(String(r.studentId), normalized);
            }
        }

        // Fetch username & role for impacted user IDs in one query
        const ids = Array.from(impactedIdsSet); // keep as strings; SQL casts to bigint
        const usersRes = ids.length > 0 
            ? await client.query(`SELECT user_id, username, role FROM users WHERE user_id = ANY($1::bigint[])`, [ids])
            : { rows: [] };
        const usersMap = new Map(usersRes.rows.map(u => [String(u.user_id), { username: u.username, role: u.role }]));

        // Aggregate totals for the day across all events for each impacted user
        let aggMap = new Map();
        if (ids.length > 0) {
            const aggRes = await client.query(
                `WITH day_events AS (
                    SELECT event_id,
                           (start_date + start_time) AS start_ts,
                           (end_date + end_time) AS end_ts
                    FROM calendar_events
                    WHERE start_date = $1
                ),
                agg AS (
                    SELECT a.audience_id AS user_id,
                           SUM(EXTRACT(EPOCH FROM (e.end_ts - e.start_ts)) / 60.0) AS total_sched_minutes,
                           SUM(a.actual_present_hours * 60.0) AS total_actual_minutes
                    FROM event_attendance a
                    JOIN day_events e ON e.event_id = a.event_id
                    WHERE a.audience_id = ANY($2::bigint[])
                    GROUP BY a.audience_id
                )
                SELECT user_id, total_sched_minutes, total_actual_minutes FROM agg`,
                [attendanceDate, ids]
            );
            aggMap = new Map(aggRes.rows.map(r => [String(r.user_id), {
                total_sched_minutes: Number(r.total_sched_minutes) || 0,
                total_actual_minutes: Number(r.total_actual_minutes) || 0
            }]));
        }

        // Build user_attendance upserts based on daily ratio
        const records = [];
        for (const id of impactedIdsSet) {
            const info = usersMap.get(id);
            if (!info || !info.username) continue;
            const agg = aggMap.get(id);

            if (!agg || agg.total_sched_minutes <= 0) {
                // No events for the user on this date -> write as no attendance (skip record)
                logger.info('SERVICE.saveAttendance: No attendance for user on date; skipping user_attendance row', {
                    userId: id,
                    attendanceDate: String(attendanceDate)
                });
                continue;
            }

            const ratioRaw = agg.total_actual_minutes / agg.total_sched_minutes;
            const ratio = Math.max(0, Math.min(1, Number.isFinite(ratioRaw) ? parseFloat(ratioRaw.toFixed(2)) : 0));
            const statusFinal = ratio === 1 ? 'Present' : 'Absent';

            // Store actual user duration as interval (keep schema valid)
            const actualInterval = `${Math.round(agg.total_actual_minutes)} minutes`;
            const totalInterval = `${Math.round(agg.total_sched_minutes)} minutes`;

            records.push({
                username: info.username,
                role: info.role,
                status: statusFinal,
                duration: actualInterval,
                total_duration: totalInterval
            });
        }

        if (records.length > 0) {
            logger.info('SERVICE.saveAttendance: Step 4 invoking UserModel.saveUserAttendance', {
                records: records.length,
                attendanceDate: String(attendanceDate),
                yearName,
                campusId
            });
            await UserModel.saveUserAttendance(attendanceDate, yearName, campusId, records, client);
        } else {
            logger.info('SERVICE.saveAttendance: Step 4 no records to upsert into user_attendance');
        }

        await client.query('COMMIT');
        logger.info('SERVICE.saveAttendance: Success', { eventId, savedCount, deletedCount: 0 });
        return { savedCount, deletedCount: 0 };

    } catch (error) {
        await client.query('ROLLBACK');
        logger.error('SERVICE: Error saving attendance:', error);
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Legacy Get Attendance (Stub/Deprecated)
 * This schema does not support class-based daily attendance directly.
 */
const getAttendance = async (tenantId, campusId, classId, sectionId, date, academicYearId) => {
    try {
        // 1. Resolve Year Name from ID if provided
        let yearName = null;
        if (academicYearId) {
            const yrRes = await pool.query('SELECT year_name FROM academic_years WHERE academic_year_id = $1', [academicYearId]);
            yearName = yrRes.rows?.[0]?.year_name;
        }

        // 2. Fetch Users with Attendance
        // We want 'Student' role.
        const users = await UserModel.getActiveUsersOfRolesWithAttendance(
            campusId, 
            ['Student'], 
            tenantId, 
            date, 
            yearName, 
            classId, 
            sectionId
        );

        // 3. Map to simple format
        return users.map(u => ({
            student_id: u.user_id,
            studentId: u.user_id, // for compatibility
            student_username: u.username,
            name: `${u.first_name} ${u.last_name}`,
            status: u.attendance_status || 'NA', // 'Present', 'Absent', or 'NA'
            remarks: u.attendance_status ? 'Daily Attendance' : 'No Record'
        }));
    } catch (error) {
        logger.error('Error in getAttendance (daily fallback):', error);
        throw error;
    }
};

module.exports = {
    getAttendance,
    saveAttendance,
    getAttendanceByEventId
};
