const { pool } = require('../config/database');
const UserModel = require('./user.model');

const getAcademicYearNameById = async (client, academicYearId) => {
    if (!academicYearId) return null;
    const res = await client.query(
        'SELECT year_name FROM academic_years WHERE academic_year_id = $1',
        [academicYearId]
    );
    return res.rows?.[0]?.year_name || null;
};

const getUsersByIds = async (client, userIds) => {
    if (!Array.isArray(userIds) || userIds.length === 0) return [];
    const res = await client.query(
        'SELECT user_id, username, role FROM users WHERE user_id = ANY($1::bigint[])',
        [userIds]
    );
    return res.rows || [];
};

const getDailyAggregatesForUsers = async (client, attendanceDate, userIds) => {
    if (!Array.isArray(userIds) || userIds.length === 0) return [];
    const res = await client.query(
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
        [attendanceDate, userIds]
    );
    return res.rows || [];
};

/**
 * Get attendance records for a specific event
 * @param {string} eventId 
 * @returns {Promise<Array>}
 */
const getAttendanceByEventId = async (eventId, eventInstanceId = null) => {
    let query = `
        SELECT 
            a.event_attendance_id,
            a.audience_id as student_id,
            a.attendance_status,
            a.actual_present_hours,
            a.total_scheduled_hours,
            a.academic_year_id,
            a.event_instance_id,
            u.first_name,
            u.last_name,
            u.role
        FROM event_attendance a
        LEFT JOIN users u ON a.audience_id = u.user_id
        WHERE a.event_id::text = $1
    `;
    const params = [String(eventId)];

    if (eventInstanceId) {
        query += ` AND a.event_instance_id = $2`;
        params.push(String(eventInstanceId));
    }

    const result = await pool.query(query, params);
    return result.rows;
};

/**
 * Get attendance records for a specific event instance
 * @param {string} eventInstanceId 
 * @returns {Promise<Array>}
 */
const getAttendanceByEventInstanceId = async (eventInstanceId) => {
    const query = `
        SELECT 
            a.event_attendance_id,
            a.audience_id as student_id,
            a.attendance_status,
            a.actual_present_hours,
            a.total_scheduled_hours,
            a.academic_year_id,
            a.event_instance_id,
            a.event_id,
            u.first_name,
            u.last_name,
            u.role
        FROM event_attendance a
        LEFT JOIN users u ON a.audience_id = u.user_id
        WHERE a.event_instance_id = $1
    `;
    const result = await pool.query(query, [String(eventInstanceId)]);
    return result.rows;
};

/**
 * Upsert attendance record (Insert or Update)
 * @param {Object} client - Database client for transaction
 * @param {Object} data - { eventId, eventInstanceId, studentId, status, actualPresentHours, totalScheduledHours, attendanceDate, academicYearId }
 */
const upsertAttendance = async (client, { eventId, eventInstanceId, studentId, status, actualPresentHours, totalScheduledHours, attendanceDate, academicYearId }) => {
    const query = `
        insert into event_attendance (
            event_id, event_instance_id, audience_id, attendance_status, 
            actual_present_hours, total_scheduled_hours, 
            attendance_date, academic_year_id,
            created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        ON CONFLICT (event_id, audience_id, attendance_date) 
        DO UPDATE SET 
            attendance_status = EXCLUDED.attendance_status,
            actual_present_hours = EXCLUDED.actual_present_hours,
            total_scheduled_hours = EXCLUDED.total_scheduled_hours,
            academic_year_id = EXCLUDED.academic_year_id,
            event_instance_id = EXCLUDED.event_instance_id,
            updated_at = NOW()
    `;

    await client.query(query, [
        eventId,
        eventInstanceId || null,
        studentId,
        status,
        actualPresentHours || 0,
        totalScheduledHours || 0,
        attendanceDate,
        academicYearId || null
    ]);
};

const upsertAttendanceBatch = async (client, { eventId, eventInstanceId, attendanceDate, academicYearId, records }) => {
    if (!Array.isArray(records) || records.length === 0) return 0;
    for (const record of records) {
        await upsertAttendance(client, {
            eventId,
            eventInstanceId,
            studentId: record.studentId,
            status: record.status,
            actualPresentHours: record.actual_present_hours,
            totalScheduledHours: record.total_scheduled_hours,
            attendanceDate,
            academicYearId
        });
    }
    return records.length;
};

/**
 * Delete attendance records for specific students in an event and sync user_attendance
 * @param {Object} client - Database client for transaction
 * @param {string} eventId 
 * @param {Array<number|string>} studentIds 
 */
const deleteAttendance = async (client, eventId, eventInstanceId, studentIds) => {
    // 1. Get Event Details (Campus, Date) needed for sync BEFORE deleting
    // We need to know the date to update user_attendance.
    const eventQuery = `SELECT campus_id, start_date, academic_year_id FROM calendar_events WHERE event_id = $1`;
    const eventRes = await client.query(eventQuery, [eventId]);
    const event = eventRes.rows[0];
    
    // If event doesn't exist, we can't do much (or it's already gone)
    if (!event) return;

    const { campus_id: campusId, start_date: attendanceDate, academic_year_id: academicYearId } = event;

    // Resolve Year Name
    let yearName = null;
    if (academicYearId) {
         try {
             const yr = await client.query(`SELECT year_name FROM academic_years WHERE academic_year_id = $1`, [academicYearId]);
             if (yr.rows.length > 0) yearName = yr.rows[0].year_name;
         } catch (e) {
             console.error('Error fetching year name in deleteAttendance', e);
         }
    }

    // 2. Perform Delete
    const query = `
        DELETE FROM event_attendance 
        WHERE event_id = $1
          AND event_instance_id = $2
          AND audience_id = ANY($3::bigint[])
        RETURNING audience_id
    `;
    const deleteRes = await client.query(query, [eventId, eventInstanceId, studentIds]);
    const deletedStudentIds = deleteRes.rows.map(r => r.audience_id);

    // 3. Sync User Attendance for deleted students
    // We need to recalculate their totals for that day (minus the deleted event)
    for (const studentId of deletedStudentIds) {
        // Get User Info
        const userQuery = `SELECT username, role FROM users WHERE user_id = $1`;
        const userRes = await client.query(userQuery, [studentId]);
        
        if (userRes.rows.length > 0) {
            const { username, role } = userRes.rows[0];

            // Only proceed for Students
            if (role === 'Student') {
                 // Recalculate Aggregates (now that the row is deleted)
                 const aggQuery = `
                    SELECT 
                        COALESCE(SUM(actual_present_hours), 0) as total_actual,
                        COALESCE(SUM(total_scheduled_hours), 0) as total_scheduled
                    FROM event_attendance
                    WHERE audience_id = $1 AND attendance_date = $2
                 `;
                 const aggRes = await client.query(aggQuery, [studentId, attendanceDate]);
                 const { total_actual, total_scheduled } = aggRes.rows[0];
                 
                 const durationVal = parseFloat(total_actual);
                 const totalDurationVal = parseFloat(total_scheduled);
                 
                 // Determine Status
                 let userStatus = 'Absent';
                 if (totalDurationVal > 0 && (durationVal / totalDurationVal) >= 0.5) {
                     userStatus = 'Present';
                 } 
                 // If totalDurationVal is 0, status remains 'Absent' (or 'No Class' conceptually, but schema uses Present/Absent)
                 // Duration will be updated to 0.

                 // Upsert user_attendance
                 if (yearName) {
                    await UserModel.upsertSingleUserAttendance(client, {
                        campusId,
                        yearName,
                        username,
                        role,
                        attendanceDate,
                        status: userStatus,
                        duration: `${durationVal} hours`,
                        totalDuration: `${totalDurationVal} hours`
                    });
                 } else {
                    console.warn(`Skipping user_attendance sync for student ${username} on ${attendanceDate} due to missing yearName`);
                 }
            }
        }
    }
};

/**
 * Bulk sync student attendance from event_attendance to user_attendance for a date range
 * @param {Object} client 
 * @param {string} campusId 
 * @param {string} startDate 
 * @param {string} endDate 
 * @param {string} academicYear 
 */
const syncStudentAttendanceInRange = async (client, campusId, startDate, endDate, academicYear) => {
    // 1. Aggregate event_attendance for all students in the range
    // We join with users to get username and ensure role is Student
    // We join with calendar_events to ensure campus match (though event_attendance should be enough if we trust the inputs)
    // Actually event_attendance has audience_id (user_id).
    
    const query = `
        SELECT 
            ea.audience_id,
            u.username,
            u.role,
            ea.attendance_date,
            SUM(ea.actual_present_hours) as total_actual,
            SUM(ea.total_scheduled_hours) as total_scheduled
        FROM event_attendance ea
        JOIN users u ON ea.audience_id = u.user_id
        JOIN calendar_events ce ON ea.event_id = ce.event_id
        WHERE ce.campus_id = $1
          AND ea.attendance_date BETWEEN $2 AND $3
          AND u.role = 'Student'
        GROUP BY ea.audience_id, u.username, u.role, ea.attendance_date
    `;

    const result = await client.query(query, [campusId, startDate, endDate]);

    // 2. Upsert into user_attendance
    // We need to iterate and upsert.
    // Optimization: We could do a bulk upsert if we construct a large query, but loop is safer for now.
    
    for (const row of result.rows) {
        const { username, role, attendance_date, total_actual, total_scheduled } = row;
        const durationVal = parseFloat(total_actual || 0);
        const totalDurationVal = parseFloat(total_scheduled || 0);

        let userStatus = 'Absent';
        if (totalDurationVal > 0 && (durationVal / totalDurationVal) >= 0.5) {
            userStatus = 'Present';
        }

        await UserModel.upsertSingleUserAttendance(client, {
            campusId,
            yearName: academicYear,
            username,
            role,
            attendanceDate: attendance_date,
            status: userStatus,
            duration: `${durationVal} hours`,
            totalDuration: `${totalDurationVal} hours`,
            loginTime: '00:00:00',
            logoutTime: '00:00:00'
        });
    }
};

module.exports = {
    getAcademicYearNameById,
    getUsersByIds,
    getDailyAggregatesForUsers,
    getAttendanceByEventId,
    getAttendanceByEventInstanceId,
    upsertAttendance,
    upsertAttendanceBatch,
    deleteAttendance,
    syncStudentAttendanceInRange,
    async getUserAttendanceByCampusAndDateRange(campusId, startDate, endDate, client = pool) {
        const query = `
            SELECT username, TO_CHAR(attendance_date, 'YYYY-MM-DD') as attendance_date_str, status, 
                   TO_CHAR(duration, 'HH24:MI') as duration, 
                   TO_CHAR(total_duration, 'HH24:MI') as total_duration, 
                   login_time, logout_time
            FROM user_attendance
            WHERE campus_id = $1 AND attendance_date BETWEEN $2::date AND $3::date
        `;
        const res = await client.query(query, [campusId, startDate, endDate]);
        return res.rows;
    }
};
