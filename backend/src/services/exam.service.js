const ExamModel = require('../models/exam.model');

const ExamService = {
  createExam: async (examData, tenantId, campusId) => {
    return await ExamModel.createExam({
      ...examData,
      tenant_id: tenantId,
      campus_id: campusId
    });
  },

  getExamById: async (examId) => {
    return await ExamModel.getExamById(examId);
  },

  getExams: async (campusId, filters = {}) => {
    return await ExamModel.getExamsByCampus(campusId, filters);
  },

  updateExam: async (examId, examData) => {
    return await ExamModel.updateExam(examId, examData);
  },

  deleteExam: async (examId) => {
    return await ExamModel.deleteExam(examId);
  }
};

module.exports = { ExamService };
