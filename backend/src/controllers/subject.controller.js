const subjectService = require('../services/subject.service');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

const subjectController = {
  // Get all subjects for a campus
  getAllSubjects: async (req, res) => {
    try {
      const { campusId } = req.params;
      const filters = {
        category: req.query.category,
        search: req.query.search
      };

      // Remove undefined filters
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined || filters[key] === '') {
          delete filters[key];
        }
      });

      const result = await subjectService.getAllSubjects(campusId, filters);
      
      return successResponse(res, 'Subjects fetched successfully', {
        subjects: result.subjects,
        total: result.total
      });
    } catch (error) {
      logger.error('Error in getAllSubjects controller:', error);
      return errorResponse(res, error.message || 'Failed to fetch subjects', 500);
    }
  },

  // Get subject by ID
  getSubjectById: async (req, res) => {
    try {
      const { campusId, subjectId } = req.params;
      
      const subject = await subjectService.getSubjectById(campusId, subjectId);
      
      return successResponse(res, 'Subject fetched successfully', { subject });
    } catch (error) {
      logger.error('Error in getSubjectById controller:', error);
      const statusCode = error.message === 'Subject not found' ? 404 : 500;
      return errorResponse(res, error.message || 'Failed to fetch subject', statusCode);
    }
  },

  // Create new subject
  createSubject: async (req, res) => {
    try {
      const { campusId } = req.params;
      const subjectData = req.body;

      // Validate required fields
      if (!subjectData.subject_name) {
        return errorResponse(res, 'Subject name is required', 400);
      }

      if (!subjectData.category) {
        return errorResponse(res, 'Subject category is required', 400);
      }

      if (!subjectData.curriculum_id) {
        return errorResponse(res, 'Curriculum is required', 400);
      }

      const createdSubject = await subjectService.createSubject(campusId, subjectData);
      
      return successResponse(res, 'Subject created successfully', { subject: createdSubject }, 201);
    } catch (error) {
      logger.error('Error in createSubject controller:', error);
      const statusCode = error.message.includes('already exists') ? 409 : 400;
      return errorResponse(res, error.message || 'Failed to create subject', statusCode);
    }
  },

  // Update existing subject
  updateSubject: async (req, res) => {
    try {
      const { campusId, subjectId } = req.params;
      const subjectData = req.body;

      // Remove empty fields
      Object.keys(subjectData).forEach(key => {
        if (subjectData[key] === undefined || subjectData[key] === '') {
          delete subjectData[key];
        }
      });

      if (Object.keys(subjectData).length === 0) {
        return errorResponse(res, 'No valid fields provided for update', 400);
      }

      const updatedSubject = await subjectService.updateSubject(campusId, subjectId, subjectData);
      
      return successResponse(res, 'Subject updated successfully', { subject: updatedSubject });
    } catch (error) {
      logger.error('Error in updateSubject controller:', error);
      let statusCode = 500;
      
      if (error.message === 'Subject not found') {
        statusCode = 404;
      } else if (error.message.includes('already exists')) {
        statusCode = 409;
      } else if (error.message.includes('cannot be empty') || error.message.includes('Invalid')) {
        statusCode = 400;
      }
      
      return errorResponse(res, error.message || 'Failed to update subject', statusCode);
    }
  },

  // Delete subject
  deleteSubject: async (req, res) => {
    try {
      const { campusId, subjectId } = req.params;
      
      const result = await subjectService.deleteSubject(campusId, subjectId);
      
      return successResponse(res, result.message || 'Subject deleted successfully');
    } catch (error) {
      logger.error('Error in deleteSubject controller:', error);
      let statusCode = 500;
      
      if (error.message === 'Subject not found') {
        statusCode = 404;
      } else if (error.message.includes('being used')) {
        statusCode = 409;
      }
      
      return errorResponse(res, error.message || 'Failed to delete subject', statusCode);
    }
  }
};

module.exports = subjectController;