const ExamResultModel = require('../models/examResult.model');
const ExamModel = require('../models/exam.model');

const ExamResultService = {
  createResult: async (resultData, tenantId, campusId) => {
    // Calculate is_passed
    if (resultData.exam_id && resultData.obtained_score !== undefined) {
      const exam = await ExamModel.getExamById(resultData.exam_id);
      if (exam) {
        // passing_score is available in exam object because it is a stored generated column
        // Ensure we handle types correctly (DECIMAL comes as string from pg usually)
        const passingScore = parseFloat(exam.passing_score);
        const obtainedScore = parseFloat(resultData.obtained_score);
        resultData.is_passed = obtainedScore >= passingScore;
      }
    }

    return await ExamResultModel.createResult({
      ...resultData,
      tenant_id: tenantId,
      campus_id: campusId
    });
  },

  createBulkResults: async (resultsData, tenantId, campusId) => {
    // Pre-process results to calculate is_passed
    // We can optimize by fetching exam details once if all results are for the same exam
    // But assuming mixed, we might need to fetch. 
    // Usually bulk save is for one exam. Let's check if exam_id is same.
    
    if (!resultsData || resultsData.length === 0) return [];

    const examIds = [...new Set(resultsData.map(r => r.exam_id))];
    const examMap = {};

    for (const eid of examIds) {
      if (eid) {
        const exam = await ExamModel.getExamById(eid);
        if (exam) examMap[eid] = exam;
      }
    }

    const processedData = resultsData.map(data => {
      const exam = examMap[data.exam_id];
      let is_passed = data.is_passed;
      
      if (exam && data.obtained_score !== undefined) {
        const passingScore = parseFloat(exam.passing_score);
        const obtainedScore = parseFloat(data.obtained_score);
        is_passed = obtainedScore >= passingScore;
      }

      return {
        ...data,
        is_passed,
        tenant_id: tenantId,
        campus_id: campusId
      };
    });

    return await ExamResultModel.createBulkResults(processedData);
  },

  getResultById: async (resultId) => {
    return await ExamResultModel.getResultById(resultId);
  },

  getResultsByExamId: async (examId) => {
    return await ExamResultModel.getResultsByExamId(examId);
  },

  getResultsByStudentId: async (studentUsername) => {
    return await ExamResultModel.getResultsByStudentId(studentUsername);
  },

  updateResult: async (resultId, resultData) => {
    // If obtained_score is being updated, we might need to recalculate is_passed
    // We need the exam_id to fetch passing_score. 
    // We can first fetch the existing result to get exam_id if not provided, 
    // but typically update doesn't change exam_id.
    
    if (resultData.obtained_score !== undefined) {
      // We need to know the exam's passing score.
      // First, get the current result to find exam_id
      const currentResult = await ExamResultModel.getResultById(resultId);
      if (!currentResult) {
        throw new Error('Exam result not found');
      }
      
      const examId = currentResult.exam_id;
      const exam = await ExamModel.getExamById(examId);
      
      if (exam) {
        const passingScore = parseFloat(exam.passing_score);
        const obtainedScore = parseFloat(resultData.obtained_score);
        resultData.is_passed = obtainedScore >= passingScore;
      }
    }

    return await ExamResultModel.updateResult(resultId, resultData);
  },

  deleteResult: async (resultId) => {
    return await ExamResultModel.deleteResult(resultId);
  }
};

module.exports = { ExamResultService };
