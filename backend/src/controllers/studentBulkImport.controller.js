const studentBulkImportService = require('../services/studentBulkImport.service');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');
const fs = require('fs');

/**
 * Download the student import template
 */
const downloadTemplate = async (req, res) => {
    try {
        const buffer = await studentBulkImportService.generateTemplate();
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=Student_Import_Template.xlsx');
        
        res.send(buffer);
    } catch (error) {
        logger.error('Error generating student import template', { error: error.message });
        return errorResponse(res, 'Failed to generate template', 500);
    }
};

/**
 * Upload and process student bulk import
 */
const uploadStudents = async (req, res) => {
    try {
        if (!req.file) {
            return errorResponse(res, 'No file uploaded', 400);
        }

        const filePath = req.file.path;
        const tenantId = req.user?.tenantId || req.tenantId;
        const campusId = req.body.campusId || req.user?.campusId || req.campusId || null;

        logger.info('Starting student bulk import', { filename: req.file.originalname, tenantId, campusId });

        const result = await studentBulkImportService.importStudents(filePath, tenantId, campusId);

        // Clean up the uploaded file
        fs.unlink(filePath, (err) => {
            if (err) logger.error('Error deleting temp file', { path: filePath, error: err.message });
        });

        // Return the result file
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=Student_Import_Result.xlsx');
        
        // Add summary to headers if possible, or just log it
        res.setHeader('X-Import-Success', result.summary.success);
        res.setHeader('X-Import-Failed', result.summary.failed);

        return res.send(result.resultFile);

    } catch (error) {
        // Clean up file if error occurs
        if (req.file && req.file.path) {
             fs.unlink(req.file.path, (err) => {});
        }
        
        logger.error('Error processing student bulk import', { error: error.message });
        return errorResponse(res, error.message || 'Failed to process bulk import', 500);
    }
};

module.exports = {
    downloadTemplate,
    uploadStudents
};
