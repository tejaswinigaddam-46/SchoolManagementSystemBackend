const studentBulkOperationService = require('../services/studentBulkOperation.service');
const {  errorResponse } = require('../utils/response');
const logger = require('../utils/logger');
const fs = require('fs');

/**
 * Download the student import template
 */
const downloadTemplate = async (req, res) => {
    try {
        const buffer = await studentBulkOperationService.generateTemplate();
        
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
        req.setTimeout(30 * 60 * 1000);
        res.setTimeout(30 * 60 * 1000);

        if (!req.file) {
            return errorResponse(res, 'No file uploaded', 400);
        }

        const filePath = req.file.path;
        const tenantId = req.user?.tenantId || req.tenantId;
        const campusId = req.body.campusId || req.user?.campusId || req.campusId || null;

        logger.info('Starting student bulk import', { filename: req.file.originalname, tenantId, campusId });

        const result = await studentBulkOperationService.importStudents(filePath, tenantId, campusId);

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

const uploadStudentsAsync = async (req, res) => {
    try {
        if (!req.file) {
            return errorResponse(res, 'No file uploaded', 400);
        }

        const filePath = req.file.path;
        const tenantId = req.user?.tenantId || req.tenantId;
        const campusId = req.body.campusId || req.user?.campusId || req.campusId || null;

        const jobId = await studentBulkOperationService.startImportStudentsJob(filePath, tenantId, campusId);

        return res.status(202).json({
            success: true,
            jobId
        });
    } catch (error) {
        if (req.file && req.file.path) {
            fs.unlink(req.file.path, () => {});
        }
        logger.error('Error starting async student bulk import', { error: error.message });
        return errorResponse(res, error.message || 'Failed to start bulk import', 500);
    }
};

const getImportJobStatus = async (req, res) => {
    try {
        const { jobId } = req.params;
        const job = await studentBulkOperationService.getImportStudentsJob(jobId);
        if (!job) {
            return errorResponse(res, 'Job not found', 404);
        }
        return res.status(200).json({ success: true, job });
    } catch (error) {
        logger.error('Error fetching import job status', { error: error.message });
        return errorResponse(res, 'Failed to fetch job status', 500);
    }
};

const downloadImportJobResult = async (req, res) => {
    try {
        const { jobId } = req.params;
        const buffer = await studentBulkOperationService.getImportStudentsJobResultBuffer(jobId);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=Student_Import_Result.xlsx');
        return res.send(buffer);
    } catch (error) {
        const msg = error.message === 'Result not ready' ? 'Import still processing' : (error.message || 'Failed to download result');
        const code = error.message === 'Job not found' ? 404 : (error.message === 'Result not ready' ? 409 : 500);
        return errorResponse(res, msg, code);
    }
};

const bulkUpdateStudents = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const filePath = req.file.path;
        const tenantId = req.user.tenant_id;
        const campusId = req.user.campus_id; // Or resolve campusId if needed

        const result = await studentBulkOperationService.updateStudents(filePath, tenantId, campusId);

        // Clean up uploaded file
        fs.unlink(filePath, (err) => {
            if (err) logger.error('Error deleting uploaded file', { error: err.message });
        });

        // Send response
        // If there are failures, we might want to send the result file
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
            message: `Successfully updated ${result.summary.success} students`,
            summary: result.summary
        });

    } catch (error) {
        logger.error('Error in bulk update students', { error: error.message });
        if (req.file) {
            fs.unlink(req.file.path, () => {});
        }
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal server error during bulk update'
        });
    }
};


const exportStudents = async (req, res) => {
    try {
        const { usernames } = req.body;

        const context = {
            tenant_id: req.user.tenantId,
            campus_id: req.user.campusId,
            role: req.user.role
        };

        const buffer = await studentBulkOperationService.exportStudents(usernames, context);

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
    downloadTemplate,
    uploadStudents,
    uploadStudentsAsync,
    getImportJobStatus,
    downloadImportJobResult,
    bulkUpdateStudents,
    exportStudents
};
