const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  createExamController,
  updateExamController,
  deleteExamController,
  getExamsController,
  getExamByIdController
} = require('../controllers/exam.controller');

// Apply authentication middleware to all routes
router.use(authenticate);

// Routes
router.post('/', createExamController);
router.get('/', getExamsController);
router.get('/:id', getExamByIdController);
router.put('/:id', updateExamController);
router.delete('/:id', deleteExamController);

module.exports = router;
