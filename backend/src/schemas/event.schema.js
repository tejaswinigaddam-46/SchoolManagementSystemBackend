const Joi = require('joi');

const userContext = Joi.object({
  tenantId: Joi.string().trim().min(1).invalid('undefined').required(),
  campusId: Joi.string().trim().uuid().invalid('undefined').required(),
  userId: Joi.number().integer().min(1).required()
}).unknown(true);

const params = {
  id: Joi.string().uuid().required()
};

const timeValue = Joi.alternatives().try(
  Joi.string().trim().pattern(/^\d{2}:\d{2}(:\d{2})?$/),
  Joi.string().trim().isoDate()
);

const dateValue = Joi.alternatives().try(
  Joi.string().trim().pattern(/^\d{4}-\d{2}-\d{2}$/),
  Joi.string().trim().isoDate()
);

const audienceTargetValue = Joi.alternatives().try(
  Joi.array().items(Joi.any()),
  Joi.object().unknown(true)
);

const modeQuery = Joi.object({
  mode: Joi.string().trim().valid('single', 'all', 'following').optional(),
  instanceDate: Joi.when('mode', {
    is: 'single',
    then: Joi.string().trim().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
    otherwise: Joi.string().trim().pattern(/^\d{4}-\d{2}-\d{2}$/).optional()
  })
});

const createEventBody = Joi.object({
  event_name: Joi.string().trim().min(1).max(255).required(),
  event_type: Joi.string().trim().min(1).max(50).required(),
  academic_year_id: Joi.number().integer().min(1).required(),
  start_date: dateValue.required(),
  end_date: dateValue.required(),
  start_time: timeValue.required(),
  end_time: timeValue.required(),
  event_description: Joi.string().allow('', null).optional(),
  description: Joi.string().allow('', null).optional(),
  recurrence_rule: Joi.string().allow('', null).optional(),
  repeat: Joi.string().trim().valid('yes', 'no').optional(),
  frequency: Joi.array().items(Joi.string().trim().min(1)).optional(),
  until: Joi.string().trim().isoDate().optional(),
  audience_target: audienceTargetValue.optional(),
  room_id: Joi.number().integer().min(1).allow(null).optional(),
  event_status: Joi.string().trim().min(1).max(50).optional(),
  is_all_day: Joi.boolean().optional(),
  notify_parents: Joi.boolean().optional(),
  notify_teachers: Joi.boolean().optional(),
  subject_name: Joi.string().trim().min(1).max(255).optional(),
  total_score: Joi.number().min(0).optional()
})
  .unknown(true);

const updateEventBody = Joi.object({
  event_name: Joi.string().trim().min(1).max(255).optional(),
  event_type: Joi.string().trim().min(1).max(50).optional(),
  academic_year_id: Joi.number().integer().min(1).optional(),
  start_date: dateValue.optional(),
  end_date: dateValue.optional(),
  start_time: timeValue.optional(),
  end_time: timeValue.optional(),
  event_description: Joi.string().allow('', null).optional(),
  description: Joi.string().allow('', null).optional(),
  recurrence_rule: Joi.string().allow('', null).optional(),
  repeat: Joi.string().trim().valid('yes', 'no').optional(),
  frequency: Joi.array().items(Joi.string().trim().min(1)).optional(),
  until: Joi.string().trim().isoDate().optional(),
  audience_target: audienceTargetValue.optional(),
  room_id: Joi.number().integer().min(1).allow(null).optional(),
  event_status: Joi.string().trim().min(1).max(50).optional(),
  is_all_day: Joi.boolean().optional(),
  notify_parents: Joi.boolean().optional(),
  notify_teachers: Joi.boolean().optional(),
  is_cancelled: Joi.boolean().optional(),
  subject_name: Joi.string().trim().min(1).max(255).optional(),
  total_score: Joi.number().min(0).optional()
})
  .or(
    'event_name',
    'event_type',
    'academic_year_id',
    'start_date',
    'end_date',
    'start_time',
    'end_time',
    'event_description',
    'description',
    'recurrence_rule',
    'repeat',
    'frequency',
    'until',
    'audience_target',
    'room_id',
    'event_status',
    'is_all_day',
    'notify_parents',
    'notify_teachers',
    'is_cancelled',
    'subject_name',
    'total_score'
  )
  .unknown(true);

module.exports = {
  createEvent: {
    user: userContext,
    body: createEventBody
  },
  getEvents: {
    user: userContext,
    query: Joi.object({
      academic_year_id: Joi.alternatives()
        .try(Joi.number().integer().min(1), Joi.string().trim().valid(''))
        .optional()
    })
  },
  updateEvent: {
    user: userContext,
    params: Joi.object({
      id: params.id
    }),
    query: modeQuery,
    body: updateEventBody
  },
  deleteEvent: {
    user: userContext,
    params: Joi.object({
      id: params.id
    }),
    query: modeQuery
  }
};
