const { pool } = require('../config/database');

const buildInsertExamQuery = (columns) => {
  const placeholders = columns.map((_, idx) => `$${idx + 1}`).join(', ');
  return `
      INSERT INTO exams (${columns.join(', ')})
      VALUES (${placeholders})
      RETURNING *;
    `;
};

const ExamModel = {
  createExam: async (examData, client = pool) => {
    const {
      tenant_id,
      campus_id,
      event_id,
      event_instance_id,
      subject_name,
      exam_date,
      total_score,
      curriculum_book
    } = examData;

    const db = client || pool;
    const data = {
      tenant_id,
      campus_id,
      event_id,
      event_instance_id: event_instance_id || null,
      subject_name,
      exam_date,
      total_score: total_score !== undefined ? total_score : 100.0,
      curriculum_book
    };

    // Support both old/new DB schemas gracefully:
    // 1) with event_instance_id + curriculum_book
    // 2) without event_instance_id
    // 3) without both columns
    const columnAttempts = [
      ['tenant_id', 'campus_id', 'event_id', 'event_instance_id', 'subject_name', 'exam_date', 'total_score', 'curriculum_book'],
      ['tenant_id', 'campus_id', 'event_id', 'subject_name', 'exam_date', 'total_score', 'curriculum_book'],
      ['tenant_id', 'campus_id', 'event_id', 'subject_name', 'exam_date', 'total_score']
    ];

    let lastError;
    for (const columns of columnAttempts) {
      try {
        const query = buildInsertExamQuery(columns);
        const values = columns.map((c) => data[c]);
        const result = await db.query(query, values);
        return result.rows[0];
      } catch (error) {
        lastError = error;
        // Try next shape only for undefined column errors.
        if (error?.code !== '42703') {
          throw error;
        }
      }
    }

    throw lastError;
  },

  getExamById: async (examId) => {
    const query = `SELECT * FROM exams WHERE exam_id = $1`;
    const result = await pool.query(query, [examId]);
    return result.rows[0];
  },

  getExamByEventId: async (eventId) => {
    const query = `SELECT * FROM exams WHERE event_id = $1 LIMIT 1`;
    const result = await pool.query(query, [eventId]);
    return result.rows[0];
  },

  getExamsByEventId: async (eventId) => {
    const query = `SELECT * FROM exams WHERE event_id = $1 ORDER BY exam_date ASC`;
    const result = await pool.query(query, [eventId]);
    return result.rows;
  },

  deleteExamsByEventId: async (eventId) => {
    const query = `DELETE FROM exams WHERE event_id = $1 RETURNING *`;
    const result = await pool.query(query, [eventId]);
    return result.rows;
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

  updateExam: async (examId, examData, client = pool) => {
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
    addField('event_instance_id', examData.event_instance_id);
    addField('subject_name', examData.subject_name);
    addField('curriculum_book', examData.curriculum_book);
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

    const db = client || pool;
    const result = await db.query(query, values);
    return result.rows[0];
  },

  deleteExam: async (examId) => {
    const query = `DELETE FROM exams WHERE exam_id = $1 RETURNING *`;
    const result = await pool.query(query, [examId]);
    return result.rows[0];
  }
};

module.exports = ExamModel;
