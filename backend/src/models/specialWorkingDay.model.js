const { pool } = require('../config/database');

const specialWorkingDayModel = {
  create: async (campusId, data) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const createdRecords = [];
      if (data.academic_year_ids && data.academic_year_ids.length > 0) {
        const query = `
          INSERT INTO special_working_days (campus_id, work_date, description, academic_year_id)
          VALUES ($1, $2, $3, $4)
          RETURNING *
        `;
        for (const ayId of data.academic_year_ids) {
          const result = await client.query(query, [campusId, data.work_date, data.description, ayId]);
          createdRecords.push(result.rows[0]);
        }
      }

      await client.query('COMMIT');
      return { 
        id: createdRecords[0]?.id,
        work_date: data.work_date, 
        description: data.description, 
        academic_year_ids: data.academic_year_ids 
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  getAll: async (campusId, filters = {}) => {
    // We need to group by work_date and description to make it look like one entry to the frontend
    let query = `
      SELECT 
        s.work_date,
        s.description,
        s.campus_id,
        json_agg(s.academic_year_id) as academic_year_ids,
        json_agg(ay.year_name) as academic_year_names,
        json_agg(s.id) as ids -- Keep track of IDs if needed for deletion/update
      FROM special_working_days s
      LEFT JOIN academic_years ay ON s.academic_year_id = ay.academic_year_id
      WHERE s.campus_id = $1
    `;
    const values = [campusId];
    let paramIndex = 2;

    if (filters.startDate && filters.endDate) {
      query += ` AND s.work_date BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
      values.push(filters.startDate, filters.endDate);
      paramIndex += 2;
    }

    if (filters.studentUsername) {
      query += ` AND EXISTS (
        SELECT 1
        FROM student_enrollment se
        WHERE se.username = $${paramIndex}
          AND se.campus_id = $1
          AND se.academic_year_id = s.academic_year_id
      )`;
      values.push(filters.studentUsername);
      paramIndex += 1;
    }

    query += ` GROUP BY s.work_date, s.description, s.campus_id ORDER BY s.work_date DESC`;
    const result = await pool.query(query, values);
    
    // Transform to match expected frontend structure
    return result.rows.map(row => ({
      ...row,
      id: row.ids[0], // Use the first ID as a reference, though update/delete needs care
      academic_year_names: [...new Set(row.academic_year_names)].join(', ') // Deduplicate and join names
    }));
  },

  update: async (id, campusId, data) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const findQuery = `SELECT work_date, description FROM special_working_days WHERE id = $1 AND campus_id = $2`;
      const findResult = await client.query(findQuery, [id, campusId]);
      if (findResult.rows.length === 0) {
        throw new Error('Special working day not found');
      }
      const { work_date: oldDate, description: oldDesc } = findResult.rows[0];
      const deleteQuery = `
        DELETE FROM special_working_days 
        WHERE campus_id = $1 AND work_date = $2 AND description = $3
      `;
      await client.query(deleteQuery, [campusId, oldDate, oldDesc]);
      if (data.academic_year_ids && data.academic_year_ids.length > 0) {
        const insertQuery = `
          INSERT INTO special_working_days (campus_id, work_date, description, academic_year_id)
          VALUES ($1, $2, $3, $4)
        `;
        for (const ayId of data.academic_year_ids) {
          await client.query(insertQuery, [campusId, data.work_date, data.description, ayId]);
        }
      }

      await client.query('COMMIT');
      return { 
        id,
        work_date: data.work_date, 
        description: data.description, 
        academic_year_ids: data.academic_year_ids 
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  delete: async (id, campusId) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const findQuery = `SELECT work_date, description FROM special_working_days WHERE id = $1 AND campus_id = $2`;
      const findResult = await client.query(findQuery, [id, campusId]);
      if (findResult.rows.length === 0) {
        throw new Error('Special working day not found');
      }
      const { work_date, description } = findResult.rows[0];
      const deleteQuery = `
        DELETE FROM special_working_days 
        WHERE campus_id = $1 AND work_date = $2 AND description = $3
        RETURNING *
      `;
      const result = await client.query(deleteQuery, [campusId, work_date, description]);
      
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
};

module.exports = specialWorkingDayModel;
