const EventModel = require('../models/event.model');
const { ExamService } = require('./exam.service');
const { getAcademicYearById } = require('./academic.service');

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

// Helper to generate dates from RRULE (Simple Weekly/Daily support only)
const getDatesFromRRule = (rrule, startDate, endDate) => {
    const dates = [];
    if (!rrule || !startDate || !endDate) return dates;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Parse RRULE
    // Supported: FREQ=WEEKLY;BYDAY=MO,TU,...
    
    const freqMatch = rrule.match(/FREQ=([^;]+)/);
    const freq = freqMatch ? freqMatch[1] : null;
    
    if (freq === 'DAILY') {
         const current = new Date(start);
         while (current <= end) {
             dates.push(new Date(current));
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
            dates.push(new Date(current));
        }
        current.setDate(current.getDate() + 1);
    }
    
    return dates;
};

const EventService = {
  createEvent: async (eventData, tenantId, campusId, userId) => {
    // Generate recurrence_rule if not provided but frequency is
    if (!eventData.recurrence_rule && eventData.repeat && eventData.frequency) {
        eventData.recurrence_rule = createWeeklyRRuleFromFrequency(eventData.repeat, eventData.frequency, eventData.until);
    }

    // Fix time format
    if (eventData.start_time) {
        // If it's an ISO string, we can extract the date part too
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

    const newEvent = await EventModel.createEvent(data);

    // If event type is Test, create an exam record
    if (eventData.event_type === 'Test' || eventData.eventType === 'Test') {
        try {
            await ExamService.createExam({
                tenant_id: tenantId,
                campus_id: campusId,
                event_id: newEvent.event_id,
                subject_name: eventData.subject_name || eventData.event_name,
                exam_date: newEvent.start_date, // Use the event date
                total_score: eventData.total_score
            }, tenantId, campusId);
        } catch (error) {
            console.error('Failed to create exam for Test event:', error);
            // Optionally rollback or just log? 
            // For now, we log, as the event is already created. 
            // Ideally should be a transaction but that requires refactoring createEvent to accept a client.
        }
    }

    return newEvent;
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
        return await EventModel.updateEvent(eventId, eventData);
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
