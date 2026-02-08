const { ExamService } = require('../services/exam.service');

const createExamController = async (req, res) => {
  try {
    const { tenantId, campusId } = req.user;
    const exam = await ExamService.createExam(req.body, tenantId, campusId);
    res.status(201).json({ success: true, data: exam });
  } catch (error) {
    console.error('Create Exam Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateExamController = async (req, res) => {
  try {
    const { id } = req.params;
    const exam = await ExamService.updateExam(id, req.body);
    res.status(200).json({ success: true, data: exam });
  } catch (error) {
    console.error('Update Exam Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteExamController = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await ExamService.deleteExam(id);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('Delete Exam Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getExamsController = async (req, res) => {
  try {
    const { campusId } = req.user;
    const { academic_year_id, start_date, end_date } = req.query;
    const filters = { academic_year_id, start_date, end_date };
    const exams = await ExamService.getExams(campusId, filters);
    res.status(200).json({ success: true, data: exams });
  } catch (error) {
    console.error('Get Exams Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getExamByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    const exam = await ExamService.getExamById(id);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }
    res.status(200).json({ success: true, data: exam });
  } catch (error) {
    console.error('Get Exam By ID Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createExamController,
  updateExamController,
  deleteExamController,
  getExamsController,
  getExamByIdController
};
