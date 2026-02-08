const studentExportService = require('../services/studentExport.service');
const logger = require('../utils/logger');

const exportStudents = async (req, res) => {
    try {
        const { usernames } = req.body;
        
        if (!usernames || !Array.isArray(usernames) || usernames.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'No students selected for export' 
            });
        }

        const context = {
            tenant_id: req.user.tenantId,
            campus_id: req.user.campusId,
            role: req.user.role
        };

        const buffer = await studentExportService.exportStudents(usernames, context);

        res.setHeader('Content-Disposition', 'attachment; filename="Students_Export.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);

    } catch (error) {
        logger.error('CONTROLLER: Error exporting students', { error: error.message });
        res.status(500).json({ 
            success: false, 
            message: 'Failed to export students' 
        });
    }
};

module.exports = {
    exportStudents
};
