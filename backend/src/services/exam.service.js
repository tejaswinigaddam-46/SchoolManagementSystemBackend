const ExamModel = require('../models/exam.model');

const ExamService = {
  createExam: async (examData, tenantId, campusId, client) => {
    return await ExamModel.createExam({
      ...examData,
      tenant_id: tenantId,
      campus_id: campusId
    }, client);
  },

  getExamById: async (examId) => {
    return await ExamModel.getExamById(examId);
  },

  getExamByEventId: async (eventId) => {
    return await ExamModel.getExamByEventId(eventId);
  },

  getExamsByEventId: async (eventId) => {
    return await ExamModel.getExamsByEventId(eventId);
  },

  getExams: async (campusId, filters = {}) => {
    return await ExamModel.getExamsByCampus(campusId, filters);
  },

  updateExam: async (examId, examData) => {
    return await ExamModel.updateExam(examId, examData);
  },

  deleteExam: async (examId) => {
    return await ExamModel.deleteExam(examId);
  },

  deleteExamsByEventId: async (eventId) => {
    return await ExamModel.deleteExamsByEventId(eventId);
  }
};

module.exports = { ExamService };
