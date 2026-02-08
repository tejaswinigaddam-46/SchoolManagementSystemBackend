const { pool } = require('../config/database');

const EventModel = {
  // Create a new event
  createEvent: async (eventData) => {
    const {
      tenant_id,
      campus_id,
      academic_year_id,
      event_name,
      event_description,
      event_type,
      scheduled_by,
      start_date,
      end_date,
      start_time,
      end_time,
      recurrence_rule,
      audience_target,
      room_id,
      event_status
    } = eventData;

    const query = `
      INSERT INTO calendar_events (
        tenant_id, campus_id, academic_year_id, event_name, event_description,
        event_type, scheduled_by, start_date, end_date, start_time, end_time,
        recurrence_rule, audience_target, room_id, event_status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *;
    `;

    const values = [
      tenant_id, campus_id, academic_year_id, event_name, event_description,
      event_type, scheduled_by, start_date, end_date, start_time, end_time,
      recurrence_rule, 
      typeof audience_target === 'object' ? JSON.stringify(audience_target) : audience_target,
      room_id, event_status
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  },

  // Get event by ID
  getEventById: async (eventId) => {
    const query = `SELECT * FROM calendar_events WHERE event_id = $1`;
    const result = await pool.query(query, [eventId]);
    return result.rows[0];
  },

  // Update event
  updateEvent: async (eventId, eventData) => {
    const fields = [];
    const values = [];
    let idx = 1;

    // Helper to add field
    const addField = (col, val) => {
      if (val !== undefined) {
        fields.push(`${col} = $${idx++}`);
        values.push(val);
      }
    };

    addField('event_name', eventData.event_name);
    addField('event_description', eventData.event_description);
    addField('event_type', eventData.event_type);
    addField('start_date', eventData.start_date);
    addField('end_date', eventData.end_date);
    addField('start_time', eventData.start_time);
    addField('end_time', eventData.end_time);
    addField('recurrence_rule', eventData.recurrence_rule);
    
    // Ensure audience_target is stringified if it's an object/array
    let audienceTarget = eventData.audience_target;
    if (audienceTarget && typeof audienceTarget === 'object') {
        audienceTarget = JSON.stringify(audienceTarget);
    }
    addField('audience_target', audienceTarget);
    
    addField('room_id', eventData.room_id);
    addField('event_status', eventData.event_status);
    addField('academic_year_id', eventData.academic_year_id); // Allow updating academic year if needed

    if (fields.length === 0) return null;

    values.push(eventId);
    const query = `
      UPDATE calendar_events
      SET ${fields.join(', ')}, updated_at = NOW()
      WHERE event_id = $${idx}
      RETURNING *;
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  },

  // Delete event (Cascade handles instances)
  deleteEvent: async (eventId) => {
    const query = `DELETE FROM calendar_events WHERE event_id = $1 RETURNING *`;
    const result = await pool.query(query, [eventId]);
    return result.rows[0];
  },

  // Upsert instance (for single occurrence update/delete/cancel)
  upsertInstance: async (instanceData) => {
    const {
      event_id,
      original_start_date,
      actual_start_date,
      actual_end_date,
      actual_start_time,
      actual_end_time,
      is_cancelled,
      specific_description,
      updated_by,
      room_id
    } = instanceData;

    // Check if instance exists
    const checkQuery = `
      SELECT instance_id FROM calendar_event_instances
      WHERE event_id = $1 AND original_start_date = $2
    `;
    const checkRes = await pool.query(checkQuery, [event_id, original_start_date]);

    if (checkRes.rows.length > 0) {
      // Update
      const updateQuery = `
        UPDATE calendar_event_instances
        SET
          actual_start_date = COALESCE($3, actual_start_date),
          actual_end_date = COALESCE($4, actual_end_date),
          actual_start_time = COALESCE($5, actual_start_time),
          actual_end_time = COALESCE($6, actual_end_time),
          is_cancelled = COALESCE($7, is_cancelled),
          specific_description = COALESCE($8, specific_description),
          updated_by = $9,
          room_id = COALESCE($10, room_id),
          updated_at = NOW()
        WHERE event_id = $1 AND original_start_date = $2
        RETURNING *;
      `;
      const result = await pool.query(updateQuery, [
        event_id, original_start_date, actual_start_date, actual_end_date,
        actual_start_time, actual_end_time, is_cancelled, specific_description, updated_by, room_id
      ]);
      return result.rows[0];
    } else {
      // Insert
      const insertQuery = `
        INSERT INTO calendar_event_instances (
          event_id, original_start_date, actual_start_date, actual_end_date,
          actual_start_time, actual_end_time, is_cancelled, specific_description, updated_by, room_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *;
      `;
      const result = await pool.query(insertQuery, [
        event_id, original_start_date, actual_start_date, actual_end_date,
        actual_start_time, actual_end_time, is_cancelled, specific_description, updated_by, room_id
      ]);
      return result.rows[0];
    }
  },

  // Get instances for an event
  getInstancesByEventId: async (eventId) => {
    const query = `SELECT * FROM calendar_event_instances WHERE event_id = $1`;
    const result = await pool.query(query, [eventId]);
    return result.rows;
  },

  // Get events with instances for a range (optional, for efficient fetching)
  getEventsByCampus: async (campusId, academicYearId) => {
    let query = `
      SELECT e.*, 
             json_agg(i.*) FILTER (WHERE i.instance_id IS NOT NULL) as instances
      FROM calendar_events e
      LEFT JOIN calendar_event_instances i ON e.event_id = i.event_id
      WHERE e.campus_id = $1
    `;
    const params = [campusId];

    if (academicYearId) {
        query += ` AND e.academic_year_id = $${params.length + 1}`;
        params.push(academicYearId);
    }

    query += ` GROUP BY e.event_id`;
    
    const result = await pool.query(query, params);
    return result.rows;
  }
};

module.exports = EventModel;
