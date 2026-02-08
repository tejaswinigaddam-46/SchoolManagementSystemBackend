const employeeExportService = require('../services/employeeExport.service');
const logger = require('../utils/logger');

/**
 * Export selected employees to Excel
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const exportEmployees = async (req, res) => {
    try {
        const { usernames } = req.body;
        
        if (!usernames || !Array.isArray(usernames) || usernames.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'No employees selected for export' 
            });
        }

        const context = {
            tenant_id: req.user.tenantId,
            campus_id: req.user.campusId,
            role: req.user.role
        };

        const buffer = await employeeExportService.exportEmployees(usernames, context);

        res.setHeader('Content-Disposition', 'attachment; filename="Employees_Export.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);

    } catch (error) {
        logger.error('CONTROLLER: Error exporting employees', { error: error.message });
        res.status(500).json({ 
            success: false, 
            message: 'Failed to export employees' 
        });
    }
};

module.exports = {
    exportEmployees
};
