const { pool } = require('../config/database');

const ExamResultModel = {
  createResult: async (resultData) => {
    const {
      tenant_id,
      campus_id,
      exam_id,
      student_username,
      attendance_status,
      obtained_score,
      is_passed
    } = resultData;

    const query = `
      INSERT INTO exam_results (
        tenant_id, campus_id, exam_id, student_username, attendance_status, obtained_score, is_passed
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;

    const values = [
      tenant_id,
      campus_id,
      exam_id,
      student_username,
      attendance_status || 'Present',
      obtained_score !== undefined ? obtained_score : 0.00,
      is_passed !== undefined ? is_passed : true
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  },

  createBulkResults: async (resultsData) => {
    if (!resultsData || resultsData.length === 0) return [];
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const createdResults = [];
      
      for (const data of resultsData) {
        const {
          tenant_id,
          campus_id,
          exam_id,
          student_username,
          attendance_status,
          obtained_score,
          is_passed
        } = data;

        // Check if result already exists for this exam and student
        const checkQuery = `
          SELECT result_id FROM exam_results 
          WHERE exam_id = $1 AND student_username = $2
        `;
        const checkRes = await client.query(checkQuery, [exam_id, student_username]);
        
        let result;
        if (checkRes.rows.length > 0) {
          // Update existing
          const updateQuery = `
            UPDATE exam_results 
            SET attendance_status = $1, obtained_score = $2, is_passed = $3
            WHERE result_id = $4
            RETURNING *
          `;
          const updateValues = [
            attendance_status || 'Present',
            obtained_score !== undefined ? obtained_score : 0.00,
            is_passed !== undefined ? is_passed : true,
            checkRes.rows[0].result_id
          ];
          const updateRes = await client.query(updateQuery, updateValues);
          result = updateRes.rows[0];
        } else {
          // Insert new
          const insertQuery = `
            INSERT INTO exam_results (
              tenant_id, campus_id, exam_id, student_username, attendance_status, obtained_score, is_passed
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
          `;
          const insertValues = [
            tenant_id,
            campus_id,
            exam_id,
            student_username,
            attendance_status || 'Present',
            obtained_score !== undefined ? obtained_score : 0.00,
            is_passed !== undefined ? is_passed : true
          ];
          const insertRes = await client.query(insertQuery, insertValues);
          result = insertRes.rows[0];
        }
        createdResults.push(result);
      }
      
      await client.query('COMMIT');
      return createdResults;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  },

  getResultById: async (resultId) => {
    const query = `SELECT * FROM exam_results WHERE result_id = $1`;
    const result = await pool.query(query, [resultId]);
    return result.rows[0];
  },

  getResultsByExamId: async (examId) => {
    const query = `SELECT * FROM exam_results WHERE exam_id = $1`;
    const result = await pool.query(query, [examId]);
    return result.rows;
  },
  
  getResultsByStudentId: async (studentUsername) => {
    const query = `SELECT * FROM exam_results WHERE student_username = $1`;
    const result = await pool.query(query, [studentUsername]);
    return result.rows;
  },

  updateResult: async (resultId, resultData) => {
    const fields = [];
    const values = [];
    let idx = 1;

    const addField = (col, val) => {
      if (val !== undefined) {
        fields.push(`${col} = $${idx++}`);
        values.push(val);
      }
    };

    addField('attendance_status', resultData.attendance_status);
    addField('obtained_score', resultData.obtained_score);
    addField('is_passed', resultData.is_passed);
    // tenant_id, campus_id, exam_id, student_username usually don't change for a result record

    if (fields.length === 0) return null;

    values.push(resultId);
    const query = `
      UPDATE exam_results
      SET ${fields.join(', ')}
      WHERE result_id = $${idx}
      RETURNING *;
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  },

  deleteResult: async (resultId) => {
    const query = `DELETE FROM exam_results WHERE result_id = $1 RETURNING *`;
    const result = await pool.query(query, [resultId]);
    return result.rows[0];
  }
};

module.exports = ExamResultModel;
