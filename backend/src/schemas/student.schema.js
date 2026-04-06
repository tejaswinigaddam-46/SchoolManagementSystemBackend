const Joi = require('joi');

const userContext = Joi.object({
  tenantId: Joi.string().trim().min(1).invalid('undefined').required(),
  campusId: Joi.string().trim().uuid().invalid('undefined').required()
}).unknown(true);

const params = {
  username: Joi.string().trim().min(3).max(50).pattern(/^[a-zA-Z0-9_.-]+$/).required(),
  parentUsername: Joi.string().trim().min(3).max(50).pattern(/^[a-zA-Z0-9_.-]+$/).required(),
  admissionNumber: Joi.string().trim().min(1).required(),
  studentId: Joi.number().integer().min(1).required(),
  classId: Joi.number().integer().min(1).required(),
  sectionId: Joi.number().integer().min(1).required(),
  class: Joi.string().trim().min(1).required(),
  section: Joi.string().trim().min(1).required()
};

const listQuery = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  search: Joi.string().trim().allow('').optional(),
  academic_year: Joi.alternatives().try(Joi.string().trim(), Joi.number().integer()).optional(),
  curriculum: Joi.string().trim().allow('').optional(),
  medium: Joi.string().trim().allow('').optional(),
  status: Joi.string().trim().allow('').optional(),
  class_id: Joi.number().integer().optional(),
  academic_year_id: Joi.number().integer().optional(),
  section_id: Joi.number().integer().optional(),
  campus_id: Joi.string().trim().uuid().optional()
});

const registerBody = Joi.object({
  firstName: Joi.string().trim().min(1).max(100).required(),
  middleName: Joi.string().trim().max(100).allow('', null).optional(),
  lastName: Joi.string().trim().min(1).max(100).required(),
  admissionNumber: Joi.string().trim().min(1).max(20).pattern(/^[A-Za-z0-9\-_]+$/).required(),
  dateOfBirth: Joi.date().iso().required(),
  academicYearId: Joi.number().integer().min(1).optional(),
  academic_year_id: Joi.number().integer().min(1).optional(),
  class: Joi.string().trim().min(1).max(20).optional(),
  email: Joi.string().trim().email().required(),
  phoneNumber: Joi.string().trim().pattern(/^[\+]?[1-9][\d]{0,15}$/).allow('', null).optional(),
  gender: Joi.string().trim().valid('Male','Female','Other').allow('', null).optional(),
  bloodGroup: Joi.string().trim().valid('A+','A-','B+','B-','AB+','AB-','O+','O-').allow('', null).optional(),
  religion: Joi.string().trim().max(50).allow('', null).optional(),
  caste: Joi.string().trim().max(50).allow('', null).optional(),
  category: Joi.string().trim().valid('General','OBC','SC','ST','EWS').allow('', null).optional(),
  previousSchool: Joi.string().trim().max(200).allow('', null).optional(),
  transferCertificateNumber: Joi.string().trim().max(50).allow('', null).optional(),
  admissionType: Joi.string().trim().valid('New','Transfer','Re-admission').allow('', null).optional(),
  currentAddress: Joi.string().trim().max(500).allow('', null).optional(),
  permanentAddress: Joi.string().trim().max(500).allow('', null).optional(),
  city: Joi.string().trim().max(100).allow('', null).optional(),
  state: Joi.string().trim().max(100).allow('', null).optional(),
  pincode: Joi.string().trim().pattern(/^\d{6}$/).allow('', null).optional(),
  country: Joi.string().trim().max(100).allow('', null).optional()
}).or('academicYearId', 'academic_year_id').required().unknown(true);

const updateBody = Joi.object({
  firstName: Joi.string().trim().min(1).max(100).optional(),
  middleName: Joi.string().trim().max(100).allow('', null).optional(),
  lastName: Joi.string().trim().min(1).max(100).optional(),
  dateOfBirth: Joi.date().iso().optional(),
  gender: Joi.string().trim().valid('Male','Female','Other').allow('', null).optional(),
  bloodGroup: Joi.string().trim().valid('A+','A-','B+','B-','AB+','AB-','O+','O-').allow('', null).optional(),
  email: Joi.string().trim().email().allow('', null).optional(),
  phoneNumber: Joi.string().trim().allow('', null).optional(),
  currentAddress: Joi.string().trim().max(500).allow('', null).optional(),
  permanentAddress: Joi.string().trim().max(500).allow('', null).optional(),
  city: Joi.string().trim().max(100).allow('', null).optional(),
  state: Joi.string().trim().max(100).allow('', null).optional(),
  pincode: Joi.string().trim().allow('', null).optional(),
  country: Joi.string().trim().max(100).allow('', null).optional()
}).min(1).unknown(true);

const enrollmentBody = Joi.object({
  academicYear: Joi.string().trim().optional(),
  class: Joi.string().trim().min(1).max(20).optional(),
  section: Joi.string().trim().min(1).max(20).optional(),
  rollNumber: Joi.string().trim().min(1).max(20).optional(),
  status: Joi.string().trim().optional()
}).min(1).unknown(true);

const parentRelationshipBody = Joi.object({
  relationshipType: Joi.string().trim().min(1).required()
});

const assignToSectionBody = Joi.object({
  student_ids: Joi.array().items(Joi.number().integer().min(1)).min(1).required(),
  section_id: Joi.number().integer().min(1).required(),
  academic_year_id: Joi.number().integer().min(1).required(),
  class_id: Joi.number().integer().min(1).required()
}).required().unknown(true);

const updateSectionBody = Joi.object({
  section_id: Joi.number().integer().min(1).required()
}).required().unknown(true);

const byFiltersQuery = Joi.object({
  academic_year_id: Joi.number().integer().min(1).required(),
  class_id: Joi.number().integer().min(1).required(),
  assignment_status: Joi.string().valid('assigned', 'unassigned').required(),
  include_parents: Joi.boolean().truthy('true').falsy('false').optional(),
  campus_id: Joi.string().trim().uuid().invalid('undefined').optional()
}).unknown(true);

const statisticsQuery = Joi.object({
  academicYear: Joi.string().trim().optional()
});

const byClassSectionParams = Joi.object({
  class: params.class,
  section: params.section
});

const bySectionParams = Joi.object({
  classId: params.classId,
  sectionId: params.sectionId
});

module.exports = {
  getAllStudents: {
    user: userContext,
    query: listQuery
  },
  registerStudent: {
    user: userContext,
    body: registerBody
  },
  updateStudent: {
    user: userContext,
    params: Joi.object({ username: params.username }),
    body: updateBody
  },
  updateStudentEnrollment: {
    user: userContext,
    params: Joi.object({ studentId: params.studentId }),
    body: enrollmentBody
  },
  deleteStudent: {
    user: userContext,
    params: Joi.object({ username: params.username })
  },
  getStudentByAdmissionNumber: {
    user: userContext,
    params: Joi.object({ admissionNumber: params.admissionNumber })
  },
  getStudentByUsername: {
    user: userContext,
    params: Joi.object({ username: params.username })
  },
  getStudentsByClassSection: {
    user: userContext,
    params: byClassSectionParams,
    query: Joi.object({ academicYear: Joi.string().trim().pattern(/^\d{4}-\d{4}$/).required() })
  },
  getStudentStatistics: {
    user: userContext,
    query: statisticsQuery
  },
  getStudentById: {
    user: userContext,
    params: Joi.object({ studentId: params.studentId })
  },
  getStudentParents: {
    user: userContext,
    params: Joi.object({ username: params.username })
  },
  getParentStudents: {
    user: userContext,
    params: Joi.object({ parentUsername: params.parentUsername })
  },
  addParentToStudent: {
    user: userContext,
    params: Joi.object({ username: params.username }),
    body: Joi.object({
      parentUsername: params.parentUsername,
      relationshipType: parentRelationshipBody.extract('relationshipType')
    })
  },
  removeParentFromStudent: {
    user: userContext,
    params: Joi.object({
      username: params.username,
      parentUsername: params.parentUsername
    })
  },
  updateParentRelationship: {
    user: userContext,
    params: Joi.object({
      username: params.username,
      parentUsername: params.parentUsername
    }),
    body: parentRelationshipBody
  },
  getStudentFilterOptions: {
    user: userContext
  },
  getCompleteStudentForEdit: {
    user: userContext,
    params: Joi.object({ username: params.username })
  },
  getStudentsByFilters: {
    user: userContext,
    query: byFiltersQuery
  },
  assignStudentsToSection: {
    user: userContext,
    body: assignToSectionBody
  },
  updateStudentSection: {
    user: userContext,
    params: Joi.object({ studentId: params.studentId }),
    body: updateSectionBody
  },
  deassignStudentSection: {
    user: userContext,
    params: Joi.object({ studentId: params.studentId })
  },
  getStudentsBySection: {
    user: userContext,
    params: bySectionParams,
    query: Joi.object({ academicYearId: Joi.number().integer().min(1).optional() })
  }
};
