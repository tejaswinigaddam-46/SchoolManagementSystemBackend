const { ExamResultService } = require('../services/examResult.service');

const createExamResultController = async (req, res) => {
  try {
    const { tenantId, campusId } = req.user;
    const result = await ExamResultService.createResult(req.body, tenantId, campusId);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error('Create Exam Result Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const bulkCreateExamResultsController = async (req, res) => {
  try {
    const { tenantId, campusId } = req.user;
    const { results } = req.body; // Expecting { results: [...] }
    
    if (!Array.isArray(results)) {
      return res.status(400).json({ success: false, message: 'Results must be an array' });
    }

    const createdResults = await ExamResultService.createBulkResults(results, tenantId, campusId);
    res.status(201).json({ success: true, data: createdResults });
  } catch (error) {
    console.error('Bulk Create Exam Result Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateExamResultController = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await ExamResultService.updateResult(id, req.body);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('Update Exam Result Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteExamResultController = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await ExamResultService.deleteResult(id);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('Delete Exam Result Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getExamResultsByExamIdController = async (req, res) => {
  try {
    const { examId } = req.params;
    const results = await ExamResultService.getResultsByExamId(examId);
    res.status(200).json({ success: true, data: results });
  } catch (error) {
    console.error('Get Exam Results By Exam ID Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getExamResultsByStudentIdController = async (req, res) => {
  try {
    const { studentId } = req.params; // The route param is :studentId, but it represents username now if changed
    // Ideally we should rename route param to :studentUsername, but for backward compatibility with route definitions:
    const results = await ExamResultService.getResultsByStudentId(studentId);
    res.status(200).json({ success: true, data: results });
  } catch (error) {
    console.error('Get Exam Results By Student ID Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getExamResultByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await ExamResultService.getResultById(id);
    if (!result) {
      return res.status(404).json({ success: false, message: 'Exam result not found' });
    }
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('Get Exam Result By ID Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createExamResultController,
  bulkCreateExamResultsController,
  updateExamResultController,
  deleteExamResultController,
  getExamResultsByExamIdController,
  getExamResultsByStudentIdController,
  getExamResultByIdController
};
