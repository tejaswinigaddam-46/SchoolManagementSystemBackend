const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  createExamResultController,
  bulkCreateExamResultsController,
  updateExamResultController,
  deleteExamResultController,
  getExamResultsByExamIdController,
  getExamResultsByStudentIdController,
  getExamResultByIdController
} = require('../controllers/examResult.controller');

// Apply authentication middleware to all routes
router.use(authenticate);

// Routes
router.post('/', createExamResultController);
router.post('/bulk', bulkCreateExamResultsController);
router.get('/:id', getExamResultByIdController);
router.put('/:id', updateExamResultController);
router.delete('/:id', deleteExamResultController);

// Specific lookups
router.get('/exam/:examId', getExamResultsByExamIdController);
router.get('/student/:studentId', getExamResultsByStudentIdController);

module.exports = router;
