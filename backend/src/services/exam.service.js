const ExamModel = require('../models/exam.model');
const EventModel = require('../models/event.model');
const { pool } = require('../config/database');

const toDateOnlyString = (value) => {
    if (!value) return null;
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
        if (trimmed.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
        return null;
    }
    if (value instanceof Date) {
        if (isNaN(value.getTime())) return null;
        const y = value.getFullYear();
        const m = String(value.getMonth() + 1).padStart(2, '0');
        const d = String(value.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }
    return toDateOnlyString(String(value));
};

const ExamService = {
  createExam: async (examData, tenantId, campusId, client) => {
    const dbClient = client || await pool.connect();
    try {
        if (!client) await dbClient.query('BEGIN');
        
        const event = await EventModel.getEventById(examData.event_id);
        let eventInstanceId = examData.event_instance_id;
        const examDate = toDateOnlyString(examData.exam_date);
        
        if (event && !eventInstanceId) {
            const checkInstanceQuery = `
                SELECT instance_id FROM calendar_event_instances 
                WHERE event_id = $1 AND original_start_date = $2
            `;
            const checkResult = await dbClient.query(checkInstanceQuery, [event.event_id, examDate]);
            
            if (checkResult.rows.length === 0) {
                const instance = {
                    original_start_date: examDate,
                    actual_start_date: examDate,
                    actual_end_date: toDateOnlyString(event.end_date),
                    actual_start_time: event.start_time,
                    actual_end_time: event.end_time,
                    is_cancelled: false,
                    specific_description: null,
                    room_id: event.room_id
                };
                const newInstances = await EventModel.insertEventInstances(event.event_id, [instance], dbClient);
                if (newInstances.length > 0) {
                    eventInstanceId = newInstances[0].instance_id;
                }
            } else {
                eventInstanceId = checkResult.rows[0].instance_id;
            }
        }
        
        const exam = await ExamModel.createExam({
          ...examData,
          event_instance_id: eventInstanceId,
          tenant_id: tenantId,
          campus_id: campusId
        }, dbClient);
        
        if (!client) await dbClient.query('COMMIT');
        return exam;
    } catch (error) {
        if (!client) await dbClient.query('ROLLBACK');
        throw error;
    } finally {
        if (!client) dbClient.release();
    }
  },

  getExamById: async (examId) => {
    return await ExamModel.getExamById(examId);
  },

  getExamByEventId: async (eventId) => {
    return await ExamModel.getExamByEventId(eventId);
  },

  getExamsByEventId: async (eventId) => {
    return await ExamModel.getExamsByEventId(eventId);
  },

  getExams: async (campusId, filters = {}) => {
    return await ExamModel.getExamsByCampus(campusId, filters);
  },

  updateExam: async (examId, examData, tenantId, campusId) => {
    const dbClient = await pool.connect();
    try {
        await dbClient.query('BEGIN');
        
        let eventInstanceId = examData.event_instance_id;
        
        if (examData.event_id && examData.exam_date && !eventInstanceId) {
            const event = await EventModel.getEventById(examData.event_id);
            if (event) {
                const examDate = toDateOnlyString(examData.exam_date);
                const checkInstanceQuery = `
                    SELECT instance_id FROM calendar_event_instances 
                    WHERE event_id = $1 AND original_start_date = $2
                `;
                const checkResult = await dbClient.query(checkInstanceQuery, [event.event_id, examDate]);
                
                if (checkResult.rows.length === 0) {
                    const instance = {
                        original_start_date: examDate,
                        actual_start_date: examDate,
                        actual_end_date: toDateOnlyString(event.end_date),
                        actual_start_time: event.start_time,
                        actual_end_time: event.end_time,
                        is_cancelled: false,
                        specific_description: null,
                        room_id: event.room_id
                    };
                    const newInstances = await EventModel.insertEventInstances(event.event_id, [instance], dbClient);
                    if (newInstances.length > 0) {
                        eventInstanceId = newInstances[0].instance_id;
                    }
                } else {
                    eventInstanceId = checkResult.rows[0].instance_id;
                }
            }
        }
        
        const updatedExam = await ExamModel.updateExam(examId, {
            ...examData,
            event_instance_id: eventInstanceId
        }, dbClient);
        
        await dbClient.query('COMMIT');
        return updatedExam;
    } catch (error) {
        await dbClient.query('ROLLBACK');
        throw error;
    } finally {
        dbClient.release();
    }
  },

  deleteExam: async (examId) => {
    return await ExamModel.deleteExam(examId);
  },

  deleteExamsByEventId: async (eventId) => {
    return await ExamModel.deleteExamsByEventId(eventId);
  }
};

module.exports = { ExamService };
