const { EventService } = require('../services/event.service');

const createEventController = async (req, res) => {
  try {
    const { tenantId, campusId, userId } = req.user;
    const event = await EventService.createEvent(req.body, tenantId, campusId, userId);
    res.status(201).json({ success: true, data: event });
  } catch (error) {
    console.error('Create Event Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateEventController = async (req, res) => {
  try {
    const { id } = req.params;
    const { mode, instanceDate } = req.query; // mode: single, all. instanceDate: YYYY-MM-DD
    const { tenantId, campusId, userId } = req.user;

    console.log('Update Event Request Body:', JSON.stringify(req.body, null, 2));
    console.log('Update Event Query:', req.query);

    const event = await EventService.updateEvent(id, req.body, mode, instanceDate, tenantId, campusId, userId);
    res.status(200).json({ success: true, data: event });
  } catch (error) {
    console.error('Update Event Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteEventController = async (req, res) => {
  try {
    const { id } = req.params;
    const { mode, instanceDate } = req.query;
    const { userId } = req.user;

    const result = await EventService.deleteEvent(id, mode, instanceDate, userId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('Delete Event Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getEventsController = async (req, res) => {
  try {
    // Assuming getting events for the current user's campus
    // We could add start/end date filters here if passed in query
    const { campusId } = req.user;
    const { academic_year_id } = req.query;
    const events = await EventService.getEvents(campusId, academic_year_id);
    res.status(200).json({ success: true, data: events });
  } catch (error) {
    console.error('Get Events Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createEventController,
  updateEventController,
  deleteEventController,
  getEventsController
};
