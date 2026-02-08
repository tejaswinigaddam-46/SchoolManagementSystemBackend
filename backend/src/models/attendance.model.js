const { pool } = require('../config/database');
const UserModel = require('./user.model');

/**
 * Get attendance records for a specific event
 * @param {string} eventId 
 * @returns {Promise<Array>}
 */
const getAttendanceByEventId = async (eventId) => {
    const query = `
        SELECT 
            a.event_attendance_id,
            a.audience_id as student_id,
            a.attendance_status,
            a.actual_present_hours,
            a.total_scheduled_hours,
            a.academic_year_id,
            u.first_name,
            u.last_name,
            u.role
        FROM event_attendance a
        LEFT JOIN users u ON a.audience_id = u.user_id
        WHERE a.event_id::text = $1
    `;
    
    const result = await pool.query(query, [String(eventId)]);
    return result.rows;
};

/**
 * Upsert attendance record (Insert or Update)
 * @param {Object} client - Database client for transaction
 * @param {Object} data - { eventId, studentId, status, actualPresentHours, totalScheduledHours, attendanceDate, academicYearId, yearName }
 */
const upsertAttendance = async (client, { eventId, studentId, status, actualPresentHours, totalScheduledHours, attendanceDate, academicYearId, yearName }) => {
    const query = `
        insert into event_attendance (
            event_id, audience_id, attendance_status, 
            actual_present_hours, total_scheduled_hours, 
            attendance_date, academic_year_id,
            created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        ON CONFLICT (event_id, audience_id, attendance_date) 
        DO UPDATE SET 
            attendance_status = EXCLUDED.attendance_status,
            actual_present_hours = EXCLUDED.actual_present_hours,
            total_scheduled_hours = EXCLUDED.total_scheduled_hours,
            academic_year_id = EXCLUDED.academic_year_id,
            updated_at = NOW()
    `;

    await client.query(query, [
        eventId,
        studentId,
        status,
        actualPresentHours || 0,
        totalScheduledHours || 0,
        attendanceDate,
        academicYearId || null
    ]);

    // Sync to user_attendance for Students
    try {
        // 1. Get User Info
        const userQuery = `SELECT username, role FROM users WHERE user_id = $1`;
        const userRes = await client.query(userQuery, [studentId]);
        
        if (userRes.rows.length > 0) {
            const { username, role } = userRes.rows[0];

            // Only proceed for Students (or as requested "For role of student")
            if (role === 'Student') {
                // 2. Get Campus ID from Event
                const eventQuery = `SELECT campus_id FROM calendar_events WHERE event_id = $1`;
                const eventRes = await client.query(eventQuery, [eventId]);
                const campusId = eventRes.rows[0]?.campus_id;

                if (campusId) {
                    // 3. Calculate Aggregates
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

                    // 4. Determine Status
                    // Status is Present if duration/total_duration >= 0.5 else Absent
                    let userStatus = 'Absent';
                    if (totalDurationVal > 0 && (durationVal / totalDurationVal) >= 0.5) {
                        userStatus = 'Present';
                    }

                    // 5. Upsert user_attendance
                    // Ensure yearName is available
                    let resolvedYearName = yearName;

                    // STRICT REQUIREMENT: For students, ALWAYS fetch year_name from academic_years using academic_year_id
                    // to ensure data consistency, ignoring any passed yearName if possible.
                    if (role === 'Student' && academicYearId) {
                         const yrRes = await client.query('SELECT year_name FROM academic_years WHERE academic_year_id = $1', [academicYearId]);
                         if (yrRes.rows.length > 0) {
                             resolvedYearName = yrRes.rows[0].year_name;
                         }
                    } else if (!resolvedYearName && academicYearId) {
                         // Fallback for non-students or if academicYearId was missing
                         const yrRes = await client.query('SELECT year_name FROM academic_years WHERE academic_year_id = $1', [academicYearId]);
                         resolvedYearName = yrRes.rows?.[0]?.year_name;
                    }

                    await UserModel.upsertSingleUserAttendance(client, {
                        campusId,
                        yearName: resolvedYearName, // Use resolved yearName
                        username,
                        role,
                        attendanceDate,
                        status: userStatus,
                        duration: `${durationVal} hours`,
                        totalDuration: `${totalDurationVal} hours`
                    });
                }
            }
        }
    } catch (error) {
        // Log error but allow transaction to proceed? 
        // Or throw to rollback? 
        // Since this is a required sync, we should probably throw.
        // But let's add a context to the error
        console.error('Error syncing user_attendance:', error);
        throw error; 
    }
};

/**
 * Delete attendance records for specific students in an event and sync user_attendance
 * @param {Object} client - Database client for transaction
 * @param {string} eventId 
 * @param {Array<number|string>} studentIds 
 */
const deleteAttendance = async (client, eventId, studentIds) => {
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
        WHERE event_id = $1 AND audience_id = ANY($2::bigint[])
        RETURNING audience_id
    `;
    const deleteRes = await client.query(query, [eventId, studentIds]);
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
    getAttendanceByEventId,
    upsertAttendance,
    deleteAttendance,
    syncStudentAttendanceInRange
};
