const employeeBulkOperationService = require('../services/employeeBulkOperation.service');
const { errorResponse } = require('../utils/response');
const logger = require('../utils/logger');
const fs = require('fs');


/**
 * Download the employee import template
 */
const downloadTemplate = async (req, res) => {
    try {
        const buffer = await employeeBulkOperationService.downloadTemplate();
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=Employee_Import_Template.xlsx');
        res.send(buffer);
    } catch (error) {
        logger.error('Error generating employee import template', { error: error.message });
        return errorResponse(res, 'Failed to generate template', 500);
    }
};

/**
 * Upload and process employee bulk import
 */
const uploadEmployees = async (req, res) => {
    try {
        if (!req.file) {
            return errorResponse(res, 'No file uploaded', 400);
        }

        const filePath = req.file.path;
        const tenantId = req.user.tenantId || req.tenantId;
        const campusId = req.body.campusId || req.user?.campusId || req.campusId || null;

        logger.info('Starting employee bulk import', { filename: req.file.originalname, tenantId, campusId });

        const result = await employeeBulkOperationService.uploadEmployees(filePath, tenantId, campusId);

        fs.unlink(filePath, (err) => {
            if (err) logger.error('Error deleting temp file', { path: filePath, error: err.message });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=Employee_Import_Result.xlsx');
        res.setHeader('X-Import-Success', result.summary.success);
        res.setHeader('X-Import-Failed', result.summary.failed);
        return res.send(result.resultFile);
    } catch (error) {
        if (req.file && req.file.path) {
            fs.unlink(req.file.path, () => {});
        }
        logger.error('Error processing employee bulk import', { error: error.message });
        return errorResponse(res, error.message || 'Failed to process bulk import', 500);
    }
};

const bulkUpdateEmployees = async (req, res) => {
    try {

        const filePath = req.file.path;
        const tenantId = req.user.tenant_id;
        const campusId = req.user.campus_id;

        const result = await employeeBulkOperationService.updateEmployees(filePath, tenantId, campusId);

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

/**
 * Export selected employees to Excel
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const exportEmployees = async (req, res) => {
    try {
        const { usernames } = req.body;
        
        const context = {
            tenant_id: req.user.tenantId,
            campus_id: req.user.campusId,
            role: req.user.role
        };

        const buffer = await employeeBulkOperationService.exportEmployees(usernames, context);

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
    downloadTemplate,
    uploadEmployees,
    bulkUpdateEmployees,
    exportEmployees
};

