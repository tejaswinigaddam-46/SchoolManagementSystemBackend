const EventModel = require('../models/event.model');
const { ExamService } = require('./exam.service');
const { getAcademicYearById } = require('./academic.service');
const { pool } = require('../config/database');

// Map frequency array (['Monday', 'Friday']) to RRULE string
const createWeeklyRRuleFromFrequency = (repeat, frequency, untilIso) => {
  if (!repeat || repeat === 'no') return null;
  // If repeat is yes but no frequency, default to daily? Or maybe it's just 'Everyday'
  // The frontend seems to send frequency array.
  
  const dayMap = {
    Sunday: 'SU',
    Monday: 'MO',
    Tuesday: 'TU',
    Wednesday: 'WE',
    Thursday: 'TH',
    Friday: 'FR',
    Saturday: 'SA'
  };

  let days = [];
  if (Array.isArray(frequency)) {
      days = frequency.slice();
  }
  
  if (days.includes('everyday') || days.includes('Everyday')) {
    days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  }

  const byDays = days
    .filter(d => dayMap[d])
    .map(d => dayMap[d]);

  // If repeat is yes but no valid days found, maybe it's Daily?
  // But let's stick to what was there.
  if (byDays.length === 0 && repeat === 'yes') {
      // Fallback or just return null?
      // If the user wants daily, they usually select all days or 'Everyday'.
      return null; 
  }
  
  if (byDays.length === 0) return null;

  let rule = `RRULE:FREQ=WEEKLY;BYDAY=${byDays.join(',')}`;
  if (untilIso) {
    const untilDate = new Date(untilIso);
    if (!isNaN(untilDate)) {
      const y = untilDate.getUTCFullYear();
      const m = String(untilDate.getUTCMonth()+1).padStart(2,'0');
      const d = String(untilDate.getUTCDate()).padStart(2,'0');
      const hh = String(untilDate.getUTCHours()).padStart(2,'0');
      const mm = String(untilDate.getUTCMinutes()).padStart(2,'0');
      const ss = String(untilDate.getUTCSeconds()).padStart(2,'0');
      rule += `;UNTIL=${y}${m}${d}T${hh}${mm}${ss}Z`;
    }
  }
  return rule;
};

// Helper: from an incoming timestamp (often ISO UTC from browser), get local IST date/time strings
const toISTDateTimeParts = (input, fallbackUndefined = false) => {
  const empty = fallbackUndefined ? { date: undefined, time: undefined } : { date: null, time: null };
  if (!input) return empty;
  try {
    const d = new Date(input);
    if (isNaN(d)) return empty;
    // Add +05:30 to the UTC instant
    const istMs = d.getTime() + 330 * 60000; // +05:30 in ms
    const ist = new Date(istMs);
    const pad = (n) => String(n).padStart(2, '0');
    const date = `${ist.getUTCFullYear()}-${pad(ist.getUTCMonth() + 1)}-${pad(ist.getUTCDate())}`;
    const time = `${pad(ist.getUTCHours())}:${pad(ist.getUTCMinutes())}:${pad(ist.getUTCSeconds())}`;
    return { date, time };
  } catch (_) {
    return empty;
  }
};

const setRRuleUntil = (rrule, untilDate) => {
    if (!rrule) return rrule;
    let parts = rrule.split(';');
    parts = parts.filter(p => !p.startsWith('UNTIL='));
    
    // Format untilDate to YYYYMMDDTHHMMSSZ (UTC)
    const d = new Date(untilDate);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth()+1).padStart(2,'0');
    const day = String(d.getUTCDate()).padStart(2,'0');
    const hh = String(d.getUTCHours()).padStart(2,'0');
    const mm = String(d.getUTCMinutes()).padStart(2,'0');
    const ss = String(d.getUTCSeconds()).padStart(2,'0');
    const untilStr = `${y}${m}${day}T${hh}${mm}${ss}Z`;
    
    parts.push(`UNTIL=${untilStr}`);
    return parts.join(';');
};

const extractTimeFromISO = (isoString) => {
  if (!isoString) return null;
  // If it's already in HH:mm:ss format, return it
  if (/^\d{2}:\d{2}(:\d{2})?$/.test(isoString)) return isoString;
  
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString; // Fallback
    
    // Extract HH:mm:ss
    const pad = (n) => String(n).padStart(2, '0');
    // Using UTC methods because ISO string usually comes as UTC from frontend
    // but we might want to store local time depending on requirements.
    // However, the error says "invalid input syntax for type time", so Postgres just wants HH:MM:SS.
    // Let's assume the ISO string represents the correct time point.
    // If the frontend sends 2025-12-01T02:30:00.000Z, it means 2:30 AM UTC.
    // If the DB stores TIME without timezone, we need to be careful.
    // Usually frontend sends local time in ISO format or we need to convert.
    // Based on previous code 'toISTDateTimeParts', it seems we convert to IST.
    
    // Let's use toISTDateTimeParts logic here to be consistent with creating new events if that was used there.
    // But createEvent didn't use toISTDateTimeParts in the code I read.
    // Let's just extract the time part from the Date object.
    // Since toISTDateTimeParts adds 5:30, maybe we should do that?
    // Let's stick to a simple extraction first, assuming the Date object has the correct time.
    // Actually, toISTDateTimeParts is exported but not used in createEvent/updateEvent in the file I read.
    
    // Better approach: Use toISTDateTimeParts if we want IST, or just standard extraction.
    // Given the error is just syntax, let's fix the syntax first.
    // The previous error showed "2025-12-01T02:30:00.000Z".
    
    // Let's reuse the toISTDateTimeParts logic which seems to be the project convention for backend time handling
    const istMs = d.getTime() + 330 * 60000;
    const ist = new Date(istMs);
    const h = pad(ist.getUTCHours());
    const m = pad(ist.getUTCMinutes());
    const s = pad(ist.getUTCSeconds());
    return `${h}:${m}:${s}`;
  } catch (e) {
    return isoString;
  }
};

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

// Helper to generate dates from RRULE (Simple Weekly/Daily support only)
const getDatesFromRRule = (rrule, startDate, endDate) => {
    const dates = [];
    if (!rrule || !startDate || !endDate) return dates;
    
    const startStr = toDateOnlyString(startDate);
    const endStr = toDateOnlyString(endDate);
    if (!startStr || !endStr) return dates;
    const [sy, sm, sd] = startStr.split('-').map(Number);
    const [ey, em, ed] = endStr.split('-').map(Number);
    const start = new Date(sy, sm - 1, sd);
    const end = new Date(ey, em - 1, ed);
    
    // Parse RRULE
    // Supported: FREQ=WEEKLY;BYDAY=MO,TU,...
    
    const freqMatch = rrule.match(/FREQ=([^;]+)/);
    const freq = freqMatch ? freqMatch[1] : null;
    
    if (freq === 'DAILY') {
         const current = new Date(start);
         while (current <= end) {
             const d = toDateOnlyString(current);
             if (d) dates.push(d);
             current.setDate(current.getDate() + 1);
         }
         return dates;
    }
    
    // Assume Weekly if not Daily (or explicit WEEKLY)
    const byDayMatch = rrule.match(/BYDAY=([^;]+)/);
    if (!byDayMatch) return [];
    
    const daysStr = byDayMatch[1];
    const days = daysStr.split(',');
    const dayMap = { 'SU': 0, 'MO': 1, 'TU': 2, 'WE': 3, 'TH': 4, 'FR': 5, 'SA': 6 };
    const targetDays = days.map(d => dayMap[d]).filter(d => d !== undefined);
    
    const current = new Date(start);
    while (current <= end) {
        if (targetDays.includes(current.getDay())) {
            const d = toDateOnlyString(current);
            if (d) dates.push(d);
        }
        current.setDate(current.getDate() + 1);
    }
    
    return dates;
};

const EventService = {
  createEvent: async (eventData, tenantId, campusId, userId) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Generate recurrence_rule if not provided but frequency is
        if (!eventData.recurrence_rule && eventData.repeat && eventData.frequency) {
            eventData.recurrence_rule = createWeeklyRRuleFromFrequency(eventData.repeat, eventData.frequency, eventData.until);
        }

        // Fix time format
        if (eventData.start_time) {
            if (eventData.start_time.includes('T')) {
                 const { date, time } = toISTDateTimeParts(eventData.start_time);
                 if (date && time) {
                     eventData.start_date = date;
                     eventData.start_time = time;
                 }
            } else {
                 eventData.start_time = extractTimeFromISO(eventData.start_time);
            }
        }
        if (eventData.end_time) {
            if (eventData.end_time.includes('T')) {
                 const { date, time } = toISTDateTimeParts(eventData.end_time);
                 if (date && time) {
                     eventData.end_date = date;
                     eventData.end_time = time;
                 }
            } else {
                 eventData.end_time = extractTimeFromISO(eventData.end_time);
            }
        }
        
        // Map description to event_description if missing
        if (eventData.description && !eventData.event_description) {
            eventData.event_description = eventData.description;
        }

        // Add context data
        const data = {
          ...eventData,
          tenant_id: tenantId,
          campus_id: campusId,
          scheduled_by: userId
        };

        const newEvent = await EventModel.createEvent(data, client);

        if (eventData.event_type === 'Test') {
            const subjectName = eventData.subject_name || eventData.event_name;
            const dates = eventData.recurrence_rule
                ? getDatesFromRRule(eventData.recurrence_rule, newEvent.start_date, newEvent.end_date)
                : [];
            const dateStrs = (Array.isArray(dates) && dates.length > 0)
                ? dates
                : [toDateOnlyString(newEvent.start_date) || String(newEvent.start_date)];

            for (const examDate of dateStrs) {
                await ExamService.createExam({
                    tenant_id: tenantId,
                    campus_id: campusId,
                    event_id: newEvent.event_id,
                    subject_name: subjectName,
                    exam_date: examDate,
                    total_score: eventData.total_score
                }, tenantId, campusId, client);
            }
        }
        
        await client.query('COMMIT');
        return newEvent;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
  },

  updateEvent: async (eventId, eventData, mode, instanceDate, tenantId, campusId, userId) => {
    console.log('EventService.updateEvent input:', JSON.stringify(eventData, null, 2));
    // mode: 'single', 'all'
    // instanceDate: 'YYYY-MM-DD' (Original start date of the instance)
    
    // Generate recurrence_rule if needed
    if (!eventData.recurrence_rule && eventData.repeat && eventData.frequency) {
        eventData.recurrence_rule = createWeeklyRRuleFromFrequency(eventData.repeat, eventData.frequency, eventData.until);
    }

    // Fix time format
    if (eventData.start_time) {
        if (eventData.start_time.includes('T')) {
             const { date, time } = toISTDateTimeParts(eventData.start_time);
             if (date && time) {
                 // Always update date from ISO string as it represents the user selection
                 eventData.start_date = date;
                 eventData.start_time = time;
             }
        } else {
             eventData.start_time = extractTimeFromISO(eventData.start_time);
        }
    }
    if (eventData.end_time) {
        if (eventData.end_time.includes('T')) {
             const { date, time } = toISTDateTimeParts(eventData.end_time);
             if (date && time) {
                 // Always update date from ISO string as it represents the user selection
                 eventData.end_date = date;
                 eventData.end_time = time;
             }
        } else {
             eventData.end_time = extractTimeFromISO(eventData.end_time);
        }
    }

    console.log('EventService.updateEvent processed:', JSON.stringify(eventData, null, 2));

    // Map description to event_description if missing
    if (eventData.description && !eventData.event_description) {
        eventData.event_description = eventData.description;
    }

    if (mode === 'single') {
        // Scenario 2: Update single instance
        // We need to insert/update calendar_event_instances
        // eventData contains the NEW details for this instance.
        
        // We need to know what changed. 
        // If it's a cancellation, eventData.is_cancelled should be true.

        if (eventData.event_type !== undefined) {
            await EventModel.updateEvent(eventId, {
                event_type: eventData.event_type
            });
        }
        
        const instanceData = {
            event_id: eventId,
            original_start_date: instanceDate, // This identifies the instance
            actual_start_date: eventData.start_date,
            actual_end_date: eventData.end_date,
            actual_start_time: eventData.start_time,
            actual_end_time: eventData.end_time,
            is_cancelled: eventData.is_cancelled || false,
            specific_description: eventData.event_description, // Optional
            updated_by: userId,
            room_id: eventData.room_id
        };
        
        return await EventModel.upsertInstance(instanceData);

    } else {
        // Scenario 3: Update all recurrence events (or simple update for non-recurring)
        // Just update calendar_events
        const updatedEvent = await EventModel.updateEvent(eventId, eventData);

        const finalEventType = eventData.event_type || updatedEvent.event_type;

        if (finalEventType === 'Test') {
            const subjectName = eventData.subject_name || updatedEvent.event_name;
            const totalScore = eventData.total_score !== undefined ? eventData.total_score : undefined;
            const recurrenceRule = eventData.recurrence_rule || updatedEvent.recurrence_rule;
            const startDate = eventData.start_date || updatedEvent.start_date;
            const endDate = eventData.end_date || updatedEvent.end_date;

            const desiredDates = recurrenceRule
                ? getDatesFromRRule(recurrenceRule, startDate, endDate)
                : [];
            const desired = desiredDates.length > 0 ? desiredDates : [toDateOnlyString(startDate) || String(startDate)];

            const existing = await ExamService.getExamsByEventId(eventId);
            const existingByDate = new Map();
            for (const ex of (existing || [])) {
                const d = ex.exam_date ? toDateOnlyString(ex.exam_date) : null;
                if (d) existingByDate.set(d, ex);
            }

            for (const d of desired) {
                const ex = existingByDate.get(d);
                if (ex) {
                    const update = {};
                    if (eventData.subject_name !== undefined) update.subject_name = subjectName;
                    if (eventData.total_score !== undefined) update.total_score = totalScore;
                    if (Object.keys(update).length > 0) {
                        await ExamService.updateExam(ex.exam_id, update);
                    }
                } else {
                    await ExamService.createExam({
                        tenant_id: tenantId,
                        campus_id: campusId,
                        event_id: eventId,
                        subject_name: subjectName,
                        exam_date: d,
                        total_score: totalScore
                    }, tenantId, campusId);
                }
            }
        } else {
            await ExamService.deleteExamsByEventId(eventId);
        }
        
        return updatedEvent;
    }
  },

  deleteEvent: async (eventId, mode, instanceDate, userId) => {
      // mode: 'single', 'all'
      
      if (mode === 'single') {
          // Cancel single instance
          const instanceData = {
              event_id: eventId,
              original_start_date: instanceDate,
              is_cancelled: true,
              updated_by: userId
          };
          return await EventModel.upsertInstance(instanceData);

      } else {
          // Delete all
          return await EventModel.deleteEvent(eventId);
      }
  },

  getEvents: async (campusId, academicYearId) => {
      return await EventModel.getEventsByCampus(campusId, academicYearId);
  }
};

module.exports = {
    EventService,
    createWeeklyRRuleFromFrequency,
    toISTDateTimeParts
};
