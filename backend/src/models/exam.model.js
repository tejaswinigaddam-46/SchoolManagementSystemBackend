const { pool } = require('../config/database');

const ExamModel = {
  createExam: async (examData) => {
    const {
      tenant_id,
      campus_id,
      event_id,
      subject_name,
      exam_date,
      total_score
    } = examData;

    const query = `
      INSERT INTO exams (
        tenant_id, campus_id, event_id, subject_name, exam_date, total_score
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;

    const values = [
      tenant_id,
      campus_id,
      event_id,
      subject_name,
      exam_date,
      total_score !== undefined ? total_score : 100.00
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  },

  getExamById: async (examId) => {
    const query = `SELECT * FROM exams WHERE exam_id = $1`;
    const result = await pool.query(query, [examId]);
    return result.rows[0];
  },

  getExamsByCampus: async (campusId, filters = {}) => {
    let query = `
      SELECT e.*, ce.audience_target, ce.academic_year_id, ce.event_name
      FROM exams e
      JOIN calendar_events ce ON e.event_id = ce.event_id
      WHERE e.campus_id = $1
    `;
    
    const values = [campusId];
    let idx = 2;

    if (filters.academic_year_id) {
      query += ` AND ce.academic_year_id = $${idx++}`;
      values.push(filters.academic_year_id);
    }

    if (filters.start_date) {
      query += ` AND e.exam_date >= $${idx++}`;
      values.push(filters.start_date);
    }

    if (filters.end_date) {
      query += ` AND e.exam_date <= $${idx++}`;
      values.push(filters.end_date);
    }

    query += ` ORDER BY e.exam_date DESC`;

    const result = await pool.query(query, values);
    return result.rows;
  },

  updateExam: async (examId, examData) => {
    const fields = [];
    const values = [];
    let idx = 1;

    const addField = (col, val) => {
      if (val !== undefined) {
        fields.push(`${col} = $${idx++}`);
        values.push(val);
      }
    };

    addField('event_id', examData.event_id);
    addField('subject_name', examData.subject_name);
    addField('exam_date', examData.exam_date);
    addField('total_score', examData.total_score);
    // passing_score is generated, cannot be updated directly

    if (fields.length === 0) return null;

    values.push(examId);
    const query = `
      UPDATE exams
      SET ${fields.join(', ')}
      WHERE exam_id = $${idx}
      RETURNING *;
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  },

  deleteExam: async (examId) => {
    const query = `DELETE FROM exams WHERE exam_id = $1 RETURNING *`;
    const result = await pool.query(query, [examId]);
    return result.rows[0];
  }
};

module.exports = ExamModel;
