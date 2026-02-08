const subjectModel = require('../models/subject.model');
const logger = require('../utils/logger');

const subjectService = {
  // Get all subjects for a campus
  getAllSubjects: async (campusId, filters = {}) => {
    try {
      logger.info(`Fetching subjects for campus: ${campusId}`);
      const subjects = await subjectModel.getAllSubjects(campusId, filters);
      
      return {
        subjects,
        total: subjects.length
      };
    } catch (error) {
      logger.error('Error in getAllSubjects service:', error);
      throw error;
    }
  },

  // Get subject by ID
  getSubjectById: async (campusId, subjectId) => {
    try {
      logger.info(`Fetching subject: ${subjectId} for campus: ${campusId}`);
      const subject = await subjectModel.getSubjectById(campusId, subjectId);
      
      if (!subject) {
        throw new Error('Subject not found');
      }
      
      return subject;
    } catch (error) {
      logger.error('Error in getSubjectById service:', error);
      throw error;
    }
  },

  // Create new subject
  createSubject: async (campusId, subjectData) => {
    try {
      logger.info(`Creating subject for campus: ${campusId}`, subjectData);
      
      // Validate required fields
      if (!subjectData.subject_name || !subjectData.subject_name.trim()) {
        throw new Error('Subject name is required');
      }
      
      if (!subjectData.category || !subjectData.category.trim()) {
        throw new Error('Subject category is required');
      }
      
      if (!subjectData.curriculum_id) {
        throw new Error('Curriculum is required');
      }

      // Validate category enum
      const validCategories = ['Academic', 'Co-curricular', 'Sport'];
      if (!validCategories.includes(subjectData.category)) {
        throw new Error('Invalid subject category. Must be Academic, Co-curricular, or Sport');
      }

      // Check if subject with same name already exists for campus and curriculum
      const exists = await subjectModel.checkSubjectExists(
        campusId, 
        subjectData.curriculum_id,
        subjectData.subject_name
      );
      
      if (exists) {
        throw new Error('Subject with this name already exists for this campus and curriculum');
      }

      // Create subject data with campus_id
      const createData = {
        ...subjectData,
        campus_id: campusId
      };

      const createdSubject = await subjectModel.createSubject(createData);
      logger.info(`Subject created successfully: ${createdSubject.subject_id}`);
      
      return createdSubject;
    } catch (error) {
      logger.error('Error in createSubject service:', error);
      throw error;
    }
  },

  // Update existing subject
  updateSubject: async (campusId, subjectId, subjectData) => {
    try {
      logger.info(`Updating subject: ${subjectId} for campus: ${campusId}`, subjectData);
      
      // Check if subject exists for the campus
      const existingSubject = await subjectModel.getSubjectById(campusId, subjectId);
      if (!existingSubject) {
        throw new Error('Subject not found');
      }

      // Validate updated data if provided
      if (subjectData.subject_name !== undefined && (!subjectData.subject_name || !subjectData.subject_name.trim())) {
        throw new Error('Subject name cannot be empty');
      }
      
      if (subjectData.category !== undefined) {
        const validCategories = ['Academic', 'Co-curricular', 'Sport'];
        if (!validCategories.includes(subjectData.category)) {
          throw new Error('Invalid subject category. Must be Academic, Co-curricular, or Sport');
        }
      }

      // Check for duplicates if subject name or curriculum is being updated
      if (subjectData.subject_name || subjectData.curriculum_id) {
        const nameToCheck = subjectData.subject_name || existingSubject.subject_name;
        const curriculumToCheck = subjectData.curriculum_id || existingSubject.curriculum_id;
        
        const exists = await subjectModel.checkSubjectExists(
          campusId, 
          curriculumToCheck,
          nameToCheck,
          subjectId
        );
        
        if (exists) {
          throw new Error('Subject with this name already exists for this campus and curriculum');
        }
      }

      const updatedSubject = await subjectModel.updateSubject(subjectId, subjectData);
      
      if (!updatedSubject) {
        throw new Error('Failed to update subject');
      }
      
      logger.info(`Subject updated successfully: ${subjectId}`);
      return updatedSubject;
    } catch (error) {
      logger.error('Error in updateSubject service:', error);
      throw error;
    }
  },

  // Delete subject
  deleteSubject: async (campusId, subjectId) => {
    try {
      logger.info(`Deleting subject: ${subjectId} for campus: ${campusId}`);
      
      // Check if subject exists for the campus
      const existingSubject = await subjectModel.getSubjectById(campusId, subjectId);
      if (!existingSubject) {
        throw new Error('Subject not found');
      }

      // Check if subject is being used in any enrollments/classes
      const inUse = await subjectModel.checkSubjectInUse(subjectId);
      if (inUse) {
        throw new Error('Cannot delete subject as it is being used in enrollments or classes');
      }

      const deletedSubject = await subjectModel.deleteSubject(subjectId);
      
      if (!deletedSubject) {
        throw new Error('Failed to delete subject');
      }
      
      logger.info(`Subject deleted successfully: ${subjectId}`);
      return { message: 'Subject deleted successfully' };
    } catch (error) {
      logger.error('Error in deleteSubject service:', error);
      throw error;
    }
  }
};

module.exports = subjectService;