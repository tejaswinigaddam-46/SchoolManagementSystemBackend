const Joi = require('joi');

const userContext = Joi.object({
  tenant_id: Joi.string().trim().min(1).required(),
  campus_id: Joi.string().trim().uuid().required()
}).unknown(true);

const userContextWithUserName = Joi.object({
  tenant_id: Joi.string().trim().min(1).required(),
   username: Joi.string().trim().min(1).required()
}).unknown(true);

const params = {
  username: Joi.string().trim().min(1).required()
};

const createUserBody = Joi.object({
  role: Joi.string().trim().min(1).required(),
  first_name: Joi.string().trim().min(1).required(),
  middle_name: Joi.string().trim().allow('', null).optional(),
  last_name: Joi.string().trim().min(1).required(),
  phone_number: Joi.string().trim().min(1).required(),
  date_of_birth: Joi.string().isoDate().required()
}).unknown(true);

const updateUserBody = Joi.object({
  first_name: Joi.string().trim().min(1).optional(),
  middle_name: Joi.string().trim().allow('', null).optional(),
  last_name: Joi.string().trim().min(1).optional(),
  phone_number: Joi.string().trim().min(1).optional(),
  role: Joi.string().trim().min(1).optional(),
  password: Joi.string().min(6).optional()
}).min(1).unknown(true);

module.exports = {
  createUserController: {
    user: userContext,
    body: createUserBody
  },
  updateUserController: {
    params: Joi.object({
      id: params.username
    }),
    body: updateUserBody
  },
  updateUserStatus: {
    user: userContext,
    params: Joi.object({
      id: params.username
    }),
    body: Joi.object({
      status: Joi.string().trim().min(1).required()
    })
  },
  getProfile: {
    user: userContextWithUserName
  },
  searchUsersController: {
    user: userContext,
    query: Joi.object({
      search: Joi.string().trim().min(1).required(),
      role: Joi.string().trim().optional()
    })
  },
  searchTeachersController: {
    user: userContext,
    query: Joi.object({
      search: Joi.string().trim().min(1).required(),
      academicYearId: Joi.number().integer().optional(),
      campusId: Joi.string().trim().uuid().optional(),
      classId: Joi.number().integer().optional(),
      curriculumId: Joi.number().integer().optional()
    })
  },
  searchStudentsController: {
    user: userContext,
    query: Joi.object({
      search: Joi.string().trim().min(1).required(),
      academicYearId: Joi.number().integer().optional(),
      campusId: Joi.string().trim().uuid().optional(),
      classId: Joi.number().integer().optional(),
      curriculumId: Joi.number().integer().optional()
    })
  },
  searchStudentsByClassController: {
    user: userContext,
    query: Joi.object({
      search: Joi.string().trim().min(1).required(),
      academicYearId: Joi.number().integer().optional(),
      campusId: Joi.string().trim().uuid().optional(),
      classId: Joi.number().integer().optional(),
      curriculumId: Joi.number().integer().optional()
    })
  },
  getDistinctRolesController: {
    user: userContext
  },
  getUsersForAttendanceController: {
    user: userContext,
    body: Joi.object({
      roles: Joi.array().items(Joi.string().trim().min(1)).min(1).optional(),
      academicYear: Joi.string().trim().optional()
    })
  },
  getActiveUsersOfRolesController: {
    user: userContext,
    body: Joi.object({
      roles: Joi.array().items(Joi.string().trim().min(1)).min(1).required(),
      attendanceDate: Joi.string().isoDate().optional(),
      academicYear: Joi.string().trim().optional(),
      classId: Joi.number().integer().optional(),
      sectionId: Joi.number().integer().optional()
    })
  },
  saveUserAttendanceController: {
    user: userContext,
    body: Joi.object({
      attendanceDate: Joi.string().isoDate().required(),
      academicYear: Joi.string().trim().required(),
      attendanceData: Joi.array().items(Joi.object({
        username: Joi.string().trim().min(1).required(),
        status: Joi.string().trim().min(1).required()
      }).unknown(true)).min(1).required()
    })
  },
  getDailyAttendanceController: {
    user: userContext,
    body: Joi.object({
      fromDate: Joi.string().isoDate().required(),
      toDate: Joi.string().isoDate().required(),
      roles: Joi.array().items(Joi.string().trim().min(1)).optional(),
      academicYear: Joi.string().trim().optional(),
      classId: Joi.number().integer().optional(),
      sectionId: Joi.number().integer().optional()
    })
  }
};
