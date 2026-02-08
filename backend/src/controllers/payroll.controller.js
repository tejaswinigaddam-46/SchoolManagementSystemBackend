const payrollService = require('../services/payroll.service');
const logger = require('../utils/logger');

async function getPayrollReport(req, res) {
    try {
        const tenantId = req.user?.tenant_id || req.user?.tenantId || req.tenantId;
        const campusId = req.user?.campus_id || req.user?.campusId || req.campusId;
        const { roles, academicYear, fromDate, toDate } = req.body;
        
        logger.info('PayrollController Request', {
            campusId,
            roles,
            academicYear,
            fromDate,
            toDate
        });

        if (!fromDate || !toDate) {
            return res.status(400).json({ error: 'fromDate and toDate are required' });
        }

        const result = await payrollService.getPayrollReport(
            campusId,
            roles || [],
            academicYear || null,
            fromDate,
            toDate,
            tenantId
        );

        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        logger.error('Error in getPayrollReport:', error);
        return res.status(500).json({ error: 'Failed to get payroll report', details: error.message });
    }
}

module.exports = {
    getPayrollReport
};
