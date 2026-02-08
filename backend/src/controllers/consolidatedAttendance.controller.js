const consolidatedAttendanceService = require('../services/consolidatedAttendance.service');

async function getConsolidatedAttendanceController(req, res) {
    try {
        const tenantId = req.user?.tenant_id || req.user?.tenantId || req.tenantId;
        const campusId = req.user?.campus_id || req.user?.campusId || req.campusId;
        const { roles, academicYear, fromDate, toDate, classId, sectionId } = req.body;
        
        console.log('ConsolidatedAttendanceController Request', {
            campusId,
            roles,
            academicYear,
            fromDate,
            toDate
        });

        if (!fromDate || !toDate) {
            return res.status(400).json({ error: 'fromDate and toDate are required' });
        }

        const result = await consolidatedAttendanceService.getConsolidatedAttendance(
            campusId,
            roles || [],
            academicYear || null,
            fromDate,
            toDate,
            tenantId,
            classId,
            sectionId
        );

        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error in getConsolidatedAttendanceController:', error);
        return res.status(500).json({ error: 'Failed to get consolidated attendance', details: error.message });
    }
}

module.exports = {
    getConsolidatedAttendanceController
};
