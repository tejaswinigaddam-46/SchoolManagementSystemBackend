const { pool } = require('../config/database');

const normalizeDuration = (duration) => {
  if (!duration) return 'full_day';
  const lower = String(duration).toLowerCase().trim();
  if (lower === 'half day' || lower === 'half_day') return 'half_day';
  if (lower === 'full day' || lower === 'full_day') return 'full_day';
  return duration;
};

const holidayModel = {
  // Create a new holiday
  create: async (campusId, data) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Insert into holiday_events
      const eventQuery = `
        INSERT INTO holiday_events (
          campus_id, holiday_name, duration_category, 
          start_date, end_date, holiday_type, is_paid
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      
      const eventValues = [
        campusId,
        data.holiday_name,
        normalizeDuration(data.duration_category), // Normalize enum value
        data.start_date,
        data.end_date,
        data.holiday_type || 'General',
        data.is_paid !== undefined ? data.is_paid : true
      ];

      const eventResult = await client.query(eventQuery, eventValues);
      const event = eventResult.rows[0];

      // 2. Insert into holiday_curriculum_map
      if (data.academic_year_ids && data.academic_year_ids.length > 0) {
        const mapQuery = `
          INSERT INTO holiday_curriculum_map (holiday_id, campus_id, academic_year_id)
          VALUES ($1, $2, $3)
        `;
        
        for (const ayId of data.academic_year_ids) {
          await client.query(mapQuery, [event.id, campusId, ayId]);
        }
      }

      await client.query('COMMIT');
      return { ...event, academic_year_ids: data.academic_year_ids };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // Get holidays for a campus
  getAll: async (campusId, filters = {}) => {
    let query = `
      SELECT h.*, 
             COALESCE(json_agg(m.academic_year_id) FILTER (WHERE m.academic_year_id IS NOT NULL), '[]') as academic_year_ids,
             COALESCE(json_agg(ay.year_name) FILTER (WHERE ay.academic_year_id IS NOT NULL), '[]') as academic_year_names
      FROM holiday_events h
      LEFT JOIN holiday_curriculum_map m ON h.id = m.holiday_id
      LEFT JOIN academic_years ay ON m.academic_year_id = ay.academic_year_id
      WHERE h.campus_id = $1
    `;
    const values = [campusId];
    let paramIndex = 2;
    
    // Add date range filter if needed
    if (filters.startDate && filters.endDate) {
       query += ` AND (h.start_date <= $${paramIndex+1} AND h.end_date >= $${paramIndex})`;
       values.push(filters.startDate, filters.endDate);
       paramIndex += 2;
    }

    // Filter by student username to show only relevant holidays
    if (filters.studentUsername) {
        query += ` AND (
            NOT EXISTS (SELECT 1 FROM holiday_curriculum_map WHERE holiday_id = h.id)
            OR
            EXISTS (
                SELECT 1 
                FROM holiday_curriculum_map hcm
                JOIN student_enrollment se ON se.academic_year_id = hcm.academic_year_id
                WHERE hcm.holiday_id = h.id 
                AND se.username = $${paramIndex}
                AND se.campus_id = $1
            )
        )`;
        values.push(filters.studentUsername);
        paramIndex++;
    }

    query += ` GROUP BY h.id ORDER BY h.start_date DESC`;

    const result = await pool.query(query, values);
    return result.rows.map(row => ({
      ...row,
      academic_year_names: [...new Set(row.academic_year_names)].join(', ')
    }));
  },
  
  // Update holiday
  update: async (id, campusId, data) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Update holiday_events
      const updateQuery = `
        UPDATE holiday_events 
        SET holiday_name = $1, duration_category = $2, 
            start_date = $3, end_date = $4, holiday_type = $5, is_paid = $6
        WHERE id = $7 AND campus_id = $8
        RETURNING *
      `;
      
      const updateValues = [
        data.holiday_name,
        normalizeDuration(data.duration_category),
        data.start_date,
        data.end_date,
        data.holiday_type,
        data.is_paid,
        id,
        campusId
      ];
      
      const result = await client.query(updateQuery, updateValues);
      if (result.rows.length === 0) {
        throw new Error('Holiday not found');
      }
      
      // 2. Update mappings (delete all and re-insert)
      if (data.academic_year_ids) {
        await client.query('DELETE FROM holiday_curriculum_map WHERE holiday_id = $1', [id]);
        
        const mapQuery = `
          INSERT INTO holiday_curriculum_map (holiday_id, campus_id, academic_year_id)
          VALUES ($1, $2, $3)
        `;
        
        for (const ayId of data.academic_year_ids) {
          await client.query(mapQuery, [id, campusId, ayId]);
        }
      }

      await client.query('COMMIT');
      return { ...result.rows[0], academic_year_ids: data.academic_year_ids };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // Delete holiday
  delete: async (id, campusId) => {
    const query = 'DELETE FROM holiday_events WHERE id = $1 AND campus_id = $2 RETURNING *';
    const result = await pool.query(query, [id, campusId]);
    return result.rows[0];
  }
};

module.exports = holidayModel;
