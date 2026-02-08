const employeeBulkUpdateService = require('../services/employeeBulkUpdate.service');
const logger = require('../utils/logger');
const fs = require('fs');

const bulkUpdateEmployees = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const filePath = req.file.path;
        const tenantId = req.user.tenant_id;
        const campusId = req.user.campus_id;

        const result = await employeeBulkUpdateService.updateEmployees(filePath, tenantId, campusId);

        // Clean up uploaded file
        fs.unlink(filePath, (err) => {
            if (err) logger.error('Error deleting uploaded file', { error: err.message });
        });

        // Send response
        if (result.summary.failed > 0) {
             res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
             res.setHeader('Content-Disposition', 'attachment; filename=update_results.xlsx');
             res.setHeader('X-Total-Count', result.summary.total);
             res.setHeader('X-Success-Count', result.summary.success);
             res.setHeader('X-Failed-Count', result.summary.failed);
             return res.send(result.fileBuffer);
        }

        return res.status(200).json({
            success: true,
            message: `Successfully updated ${result.summary.success} employees`,
            summary: result.summary
        });

    } catch (error) {
        logger.error('Error in bulk update employees', { error: error.message });
        if (req.file) {
            fs.unlink(req.file.path, () => {});
        }
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal server error during bulk update'
        });
    }
};

module.exports = {
    bulkUpdateEmployees
};
