const { pool } = require('../config/database');
const logger = require('../utils/logger');
const consolidatedAttendanceService = require('./consolidatedAttendance.service');

async function getPayrollReport(campusId, roles, yearName, startDate, endDate, tenantId) {
    try {
        // Reuse consolidated attendance logic to get daily breakdown
        const attendanceRecords = await consolidatedAttendanceService.getConsolidatedAttendance(
            campusId, roles, yearName, startDate, endDate, tenantId
        );

        // Group by user
        const userMap = new Map();

        for (const record of attendanceRecords) {
            if (!userMap.has(record.username)) {
                        userMap.set(record.username, {
                            username: record.username,
                            first_name: record.first_name,
                            last_name: record.last_name,
                            role: record.role,
                            present_days: 0,
                            absent_days: 0,
                            leave_days: 0,
                            holidays: 0,
                            total_days: 0,
                            salary: 0,
                            leaves_pending: record.leaves_pending || 0,
                            leaves_approved: record.leaves_approved || 0
                        });
                    }

            const stats = userMap.get(record.username);
            stats.total_days++;

            const isHoliday = record.is_holiday;
            // Status in DB: 'Present', 'Absent', 'Leave', etc.
            // If record.status is 'No Attendance', we check if it's a holiday
            const status = (record.status || 'No Attendance').toLowerCase();
            
            if (status === 'present') {
                stats.present_days++;
            } else if (status === 'half day') {
                stats.present_days += 0.5;
            } else if (status === 'absent') {
                stats.absent_days++;
            } else if (status.includes('leave')) {
                stats.leave_days++;
            } else {
                // No Attendance / Unknown
                if (isHoliday) {
                    stats.holidays++;
                } else {
                    // Treat as Absent if it's a working day with no attendance
                    stats.absent_days++;
                }
            }
        }

        // Fetch salaries for all users in the map
        const usernames = Array.from(userMap.keys());
        if (usernames.length > 0) {
            const salaryQuery = `
                SELECT username, salary 
                FROM employment_details 
                WHERE username = ANY($1)
            `;
            const salaryRes = await pool.query(salaryQuery, [usernames]);
            salaryRes.rows.forEach(row => {
                if (userMap.has(row.username)) {
                    userMap.get(row.username).salary = parseFloat(row.salary || 0);
                }
            });
        }

        // Calculate Pay
        const results = Array.from(userMap.values()).map(u => {
            // Daily pay = Salary / 30 (Standard approximation)
            const daily_pay = u.salary > 0 ? u.salary / 30 : 0; 
            
            // Payroll days = Present + Holidays
            // Note: Leaves are excluded from "Payroll days" per user request "Payroll days (present + holidays)"
            // But usually Paid Leaves should be included. 
            // If the user meant "Payable Days", then Paid Leaves should be there.
            // I'll stick to the user's explicit grouping "Payroll days (present + holidays)".
            // If "Leaves" are separate, maybe they are deducted?
            // But I'll calculate Total Pay based on Payroll Days.
            
            const payroll_days = u.present_days + u.holidays; 
            const total_pay = payroll_days * daily_pay;
            
            return {
                ...u,
                payroll_days,
                daily_pay: parseFloat(daily_pay.toFixed(2)),
                total_pay: parseFloat(total_pay.toFixed(2))
            };
        });

        return results;

    } catch (error) {
        logger.error('Service.getPayrollReport error', { error: error.message, stack: error.stack });
        throw error;
    }
}

module.exports = {
    getPayrollReport
};
