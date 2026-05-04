const Joi = require('joi');

const userContextBase = Joi.object({
  tenantId: Joi.string().trim().min(1).invalid('undefined').required(),
  campusId: Joi.string().uuid().required()
}).unknown(true);

const userContextWithUserId = userContextBase.keys({
  userId: Joi.number().integer().min(1).required()
});

const getAttendanceQuery = Joi.alternatives().try(
  Joi.object({
    eventId: Joi.string().trim().min(1).required(),
    eventInstanceId: Joi.string().uuid().optional()
  }),
  Joi.object({
    classId: Joi.number().integer().min(1).required(),
    sectionId: Joi.number().integer().min(1).required(),
    date: Joi.date().iso().required(),
    academicYearId: Joi.number().integer().min(1).required()
  })
);

const saveAttendanceBody = Joi.object({
  classId: Joi.number().integer().min(1).optional(),
  sectionId: Joi.number().integer().min(1).optional(),
  date: Joi.date().iso().optional(),
  academicYearId: Joi.number().integer().min(1).optional(),
  attendanceData: Joi.array()
    .items(
      Joi.object({
        studentId: Joi.number().integer().min(1).required(),
        status: Joi.string().valid('Present', 'Absent').required(),
        actual_present_hours: Joi.number().min(0).optional(),
        total_scheduled_hours: Joi.number().min(0).optional()
      })
    )
    .min(1)
    .required(),
  eventId: Joi.string().trim().min(1).required(),
  eventInstanceId: Joi.string().uuid().required()
});

module.exports = {
  getAttendance: {
    user: userContextBase,
    query: getAttendanceQuery
  },
  saveAttendance: {
    user: userContextWithUserId,
    body: saveAttendanceBody
  }
};
