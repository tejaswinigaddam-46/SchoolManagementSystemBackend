const employeeBulkImportService = require('../services/employeeBulkImport.service');
const { errorResponse } = require('../utils/response');
const logger = require('../utils/logger');
const fs = require('fs');

/**
 * Download the employee import template
 */
const downloadTemplate = async (req, res) => {
    try {
        const buffer = await employeeBulkImportService.generateTemplate();
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
        const tenantId = req.user?.tenantId || req.tenantId;
        const campusId = req.body.campusId || req.user?.campusId || req.campusId || null;

        logger.info('Starting employee bulk import', { filename: req.file.originalname, tenantId, campusId });

        const result = await employeeBulkImportService.importEmployees(filePath, tenantId, campusId);

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

module.exports = {
    downloadTemplate,
    uploadEmployees
};

