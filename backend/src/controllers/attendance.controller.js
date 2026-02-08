const attendanceService = require('../services/attendance.service');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

// ==================== ATTENDANCE CONTROLLER METHODS ====================

/**
 * Get attendance records for a class section
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAttendance = async (req, res) => {
    try {
        const { tenantId, campusId } = req.user;
        const { classId, sectionId, date, academicYearId, eventId } = req.query;

        logger.info('Getting attendance records', {
            tenantId,
            campusId,
            classId,
            sectionId,
            date,
            academicYearId,
            eventId
        });

        if (eventId) {
            const result = await attendanceService.getAttendanceByEventId(
                tenantId,
                campusId,
                eventId
            );
            return successResponse(res, 'Attendance records retrieved successfully', result);
        }

        if (!classId || !sectionId || !date || !academicYearId) {
            return errorResponse(res, 'Missing required parameters', 400);
        }

        const result = await attendanceService.getAttendance(
            tenantId,
            campusId,
            parseInt(classId),
            parseInt(sectionId),
            date,
            parseInt(academicYearId)
        );

        logger.info('Attendance records retrieved successfully', {
            tenantId,
            count: result.length
        });

        return successResponse(res, 'Attendance records retrieved successfully', result);

    } catch (error) {
        logger.error('Error getting attendance records:', error);
        return errorResponse(res, error.message, 500);
    }
};

/**
 * Save attendance records (bulk create/update)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const saveAttendance = async (req, res) => {
    try {
        const { tenantId, campusId, userId } = req.user;
        const { 
            classId, 
            sectionId, 
            date, 
            academicYearId, 
            attendanceData, // Array of { studentId, status, remarks }
            eventId // Optional: link to calendar event
        } = req.body;

        logger.info('Saving attendance records', {
            tenantId,
            campusId,
            userId,
            classId,
            sectionId,
            date,
            studentCount: attendanceData?.length
        });

        if (!attendanceData || !Array.isArray(attendanceData)) {
            logger.warn('Missing parameters for saveAttendance', { date, academicYearId, attendanceDataIsArray: Array.isArray(attendanceData) });
            return errorResponse(res, 'Missing or invalid required parameters', 400);
        }

        const result = await attendanceService.saveAttendance({
            tenantId,
            campusId,
            takenBy: userId,
            classId: classId ? parseInt(classId) : null,
            sectionId: sectionId ? parseInt(sectionId) : null,
            date,
            academicYearId: academicYearId ? parseInt(academicYearId) : null,
            attendanceData,
            eventId: eventId ? String(eventId) : null
        });

        logger.info('Attendance records saved successfully', {
            tenantId,
            savedCount: result.savedCount
        });

        return successResponse(res, 'Attendance saved successfully', result);

    } catch (error) {
        logger.error('Error saving attendance records:', error);
        return errorResponse(res, error.message, 500);
    }
};

module.exports = {
    getAttendance,
    saveAttendance
};
