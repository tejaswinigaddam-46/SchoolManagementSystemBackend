const { pool } = require('../config/database');

const weekendPolicyModel = {
  // Create or Update a weekend policy
  upsert: async (campusId, data) => {
    const query = `
      INSERT INTO weekend_policies (
        campus_id, 
        academic_year_id, 
        is_sunday_holiday, 
        is_saturday_holiday, 
        is_saturday_half_day
      ) 
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (campus_id, academic_year_id) 
      DO UPDATE SET 
        is_sunday_holiday = EXCLUDED.is_sunday_holiday,
        is_saturday_holiday = EXCLUDED.is_saturday_holiday,
        is_saturday_half_day = EXCLUDED.is_saturday_half_day
      RETURNING *
    `;
    
    const values = [
      campusId,
      data.academic_year_id,
      data.is_sunday_holiday !== undefined ? data.is_sunday_holiday : true,
      data.is_saturday_holiday !== undefined ? data.is_saturday_holiday : true,
      data.is_saturday_half_day !== undefined ? data.is_saturday_half_day : false
    ];

    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Get all policies for a campus
  getAllByCampus: async (campusId) => {
    const query = `
      SELECT wp.*, ay.year_name as academic_year_name
      FROM weekend_policies wp
      JOIN academic_years ay ON wp.academic_year_id = ay.academic_year_id
      WHERE wp.campus_id = $1
      ORDER BY ay.start_date DESC
    `;
    
    try {
      const result = await pool.query(query, [campusId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Get policy by ID
  getById: async (id, campusId) => {
    const query = `
      SELECT * FROM weekend_policies 
      WHERE id = $1 AND campus_id = $2
    `;
    
    try {
      const result = await pool.query(query, [id, campusId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Delete policy
  delete: async (id, campusId) => {
    const query = `
      DELETE FROM weekend_policies 
      WHERE id = $1 AND campus_id = $2
      RETURNING *
    `;
    
    try {
      const result = await pool.query(query, [id, campusId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }
};

module.exports = weekendPolicyModel;
