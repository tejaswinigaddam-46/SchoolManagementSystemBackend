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

async function getMyPayrollReport(req, res) {
    try {
        const tenantId = req.user?.tenant_id || req.user?.tenantId || req.tenantId;
        const campusId = req.user?.campus_id || req.user?.campusId || req.campusId;
        const username = req.user?.username;
        const role = req.user?.role;
        const { academicYear, fromDate, toDate } = req.body;

        logger.info('MyPayrollController Request', {
            campusId,
            username,
            role,
            academicYear,
            fromDate,
            toDate
        });

        if (!username || !role) {
            return res.status(400).json({ error: 'User context is required for payroll' });
        }

        if (!fromDate || !toDate) {
            return res.status(400).json({ error: 'fromDate and toDate are required' });
        }

        const result = await payrollService.getMyPayrollReport(
            campusId,
            username,
            role,
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
        logger.error('Error in getMyPayrollReport:', error);
        return res.status(500).json({ error: 'Failed to get my payroll report', details: error.message });
    }
}

module.exports = {
    getPayrollReport,
    getMyPayrollReport
};
