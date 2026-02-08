const { pool } = require('../config/database');
const logger = require('../utils/logger');

const subjectModel = {
  // Get all subjects for a campus
  getAllSubjects: async (campusId, filters = {}) => {
    if (!campusId || campusId.toString().trim() === '' || campusId === 'undefined' || campusId === null) {
      throw new Error('Valid campus ID is required');
    }

    let query = `
      SELECT 
        s.subject_id,
        s.campus_id,
        s.curriculum_id,
        s.subject_name,
        s.subject_code,
        s.category,
        c.curriculum_name,
        c.curriculum_code
      FROM subjects s
      LEFT JOIN curricula c ON s.curriculum_id = c.curriculum_id
      WHERE s.campus_id = $1
    `;
    
    const values = [campusId];
    let paramIndex = 2;

    // Apply filters
    if (filters.category) {
      query += ` AND s.category = $${paramIndex}`;
      values.push(filters.category);
      paramIndex++;
    }

    if (filters.search) {
      query += ` AND (s.subject_name ILIKE $${paramIndex} OR s.subject_code ILIKE $${paramIndex})`;
      values.push(`%${filters.search}%`);
      paramIndex++;
    }

    query += ` ORDER BY s.subject_name ASC`;

    try {
      const result = await pool.query(query, values);
      return result.rows;
    } catch (error) {
      console.error('Error in getAllSubjects model:', error);
      throw error;
    }
  },

  // Get subject by ID
  getSubjectById: async (campusId, subjectId) => {
    if (!campusId || campusId.toString().trim() === '' || campusId === 'undefined' || campusId === null) {
      throw new Error('Valid campus ID is required');
    }

    if (!subjectId || subjectId.toString().trim() === '' || subjectId === 'undefined' || subjectId === null) {
      throw new Error('Valid subject ID is required');
    }

    const query = `
      SELECT 
        s.subject_id,
        s.campus_id,
        s.curriculum_id,
        s.subject_name,
        s.subject_code,
        s.category,
        c.curriculum_name,
        c.curriculum_code
      FROM subjects s
      LEFT JOIN curricula c ON s.curriculum_id = c.curriculum_id
      WHERE s.subject_id = $1 AND s.campus_id = $2
    `;

    try {
      const result = await pool.query(query, [subjectId, campusId]);
      return result.rows[0];
    } catch (error) {
      console.error('Error in getSubjectById model:', error);
      throw error;
    }
  },

  // Create new subject
  createSubject: async (subjectData) => {
    if (!subjectData.campus_id || subjectData.campus_id.toString().trim() === '' || subjectData.campus_id === 'undefined' || subjectData.campus_id === null) {
      throw new Error('Valid campus ID is required');
    }

    const query = `
      INSERT INTO subjects 
      (campus_id, curriculum_id, subject_name, subject_code, category)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const values = [
      subjectData.campus_id,
      subjectData.curriculum_id,
      subjectData.subject_name,
      subjectData.subject_code || null,
      subjectData.category
    ];

    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating subject in model:', error, values);
      throw error;
    }
  },

  // Update existing subject
  updateSubject: async (subjectId, subjectData) => {
    if (!subjectId || subjectId.toString().trim() === '' || subjectId === 'undefined' || subjectId === null) {
      throw new Error('Valid subject ID is required');
    }

    // Build dynamic query based on provided fields
    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    // Define the field mappings
    const fieldMappings = {
      subject_name: 'subject_name',
      subject_code: 'subject_code',
      category: 'category',
      curriculum_id: 'curriculum_id'
    };

    // Build SET clause dynamically
    Object.keys(fieldMappings).forEach(field => {
      if (subjectData.hasOwnProperty(field) && subjectData[field] !== undefined) {
        updateFields.push(`${fieldMappings[field]} = $${paramIndex}`);
        values.push(subjectData[field]);
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      throw new Error('No valid fields provided for update');
    }

    // Add WHERE clause parameter
    values.push(subjectId);
    const subjectIdParam = paramIndex;

    const query = `
      UPDATE subjects 
      SET ${updateFields.join(', ')}
      WHERE subject_id = $${subjectIdParam}
      RETURNING *
    `;

    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating subject in model:', error, { query, values });
      throw error;
    }
  },

  // Delete subject
  deleteSubject: async (subjectId) => {
    if (!subjectId || subjectId.toString().trim() === '' || subjectId === 'undefined' || subjectId === null) {
      throw new Error('Valid subject ID is required');
    }

    const query = `
      DELETE FROM subjects 
      WHERE subject_id = $1
      RETURNING *
    `;

    try {
      const result = await pool.query(query, [subjectId]);
      return result.rows[0];
    } catch (error) {
      console.error('Error deleting subject in model:', error);
      throw error;
    }
  },

  // Check if subject exists by name for campus and curriculum combination
  checkSubjectExists: async (campusId, curriculumId, subjectName, excludeId = null) => {
    if (!campusId || campusId.toString().trim() === '' || campusId === 'undefined' || campusId === null) {
      throw new Error('Valid campus ID is required');
    }

    if (!curriculumId || curriculumId.toString().trim() === '' || curriculumId === 'undefined' || curriculumId === null) {
      throw new Error('Valid curriculum ID is required');
    }

    if (!subjectName || subjectName.toString().trim() === '') {
      throw new Error('Valid subject name is required');
    }

    let query = `
      SELECT subject_id FROM subjects 
      WHERE campus_id = $1 AND curriculum_id = $2 AND LOWER(subject_name) = LOWER($3)
    `;
    
    const values = [campusId, curriculumId, subjectName];
    let paramIndex = 4;

    // Exclude current subject if updating
    if (excludeId) {
      query += ` AND subject_id != $${paramIndex}`;
      values.push(excludeId);
    }

    try {
      const result = await pool.query(query, values);
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error checking subject exists in model:', error);
      throw error;
    }
  },

  // Check if subject is being used in enrollments/classes
  checkSubjectInUse: async (subjectId) => {
    if (!subjectId || subjectId.toString().trim() === '' || subjectId === 'undefined' || subjectId === null) {
      throw new Error('Valid subject ID is required');
    }

    // Check if subject is referenced in other tables
    // This is a placeholder - you would check actual related tables like:
    // - student_subjects
    // - class_subjects  
    // - teacher_subjects
    // - grade_entries
    // etc.
    
    const queries = [
      // Example query - adjust based on your actual schema
      // `SELECT COUNT(*) as count FROM student_subjects WHERE subject_id = $1`,
      // `SELECT COUNT(*) as count FROM class_subjects WHERE subject_id = $1`
    ];

    try {
      // For now, return false as we don't have related tables implemented
      // In a real implementation, you would check all related tables
      return false;
      
      // Uncomment below when you have related tables:
      /*
      for (const query of queries) {
        const result = await pool.query(query, [subjectId]);
        if (result.rows[0].count > 0) {
          return true;
        }
      }
      return false;
      */
    } catch (error) {
      console.error('Error checking subject in use in model:', error);
      throw error;
    }
  }
};

module.exports = subjectModel;