const Joi = require('joi');

const params = {
  campusId: Joi.string().uuid().required(),
  curriculumId: Joi.number().integer().min(1).required(),
  academicYearId: Joi.number().integer().min(1).required(),
};

const curriculumPayload = {
  curriculum_code: Joi.string().trim().min(1).max(20).regex(/^[A-Za-z0-9_-]+$/).required(),
  curriculum_name: Joi.string().trim().min(1).max(100).required(),
};

const academicYearPayload = {
    year_name: Joi.string().trim().regex(/^\d{4}-\d{4}$/).required(),
    year_type: Joi.string().trim().valid('Current year', 'Previous year', 'Next year').required(),
    medium: Joi.string().trim().min(1).max(20).required(),
    start_date: Joi.date().iso().optional(),
    end_date: Joi.date().iso().greater(Joi.ref('start_date')).optional(),
    fromclass: Joi.string().trim().min(1).max(20).required(),
    toclass: Joi.string().trim().min(1).max(20).required(),
    start_time_of_day: Joi.string().trim().min(1).max(20).optional(),
    end_time_of_day: Joi.string().trim().min(1).max(20).optional(),
    shift_type: Joi.string().trim().min(1).max(20).optional(),
    curriculum_id: Joi.number().integer().min(1).required(),
};


module.exports = {
  // ============== CURRICULA ==============
  getAllCurricula: {
    params: Joi.object({
      campusId: params.campusId,
    }),
  },
  createCurriculum: {
    params: Joi.object({
      campusId: params.campusId,
    }),
    body: Joi.object(curriculumPayload),
  },
  getCurriculumById: {
    params: Joi.object({
      campusId: params.campusId,
      curriculumId: params.curriculumId,
    }),
  },
  updateCurriculum: {
    params: Joi.object({
      campusId: params.campusId,
      curriculumId: params.curriculumId,
    }),
    body: Joi.object(curriculumPayload),
  },
  deleteCurriculum: {
    params: Joi.object({
      campusId: params.campusId,
      curriculumId: params.curriculumId,
    }),
  },

  // ============== ACADEMIC YEARS ==============
  getAcademicYearOptions: {
    params: Joi.object({
      campusId: params.campusId,
    }),
  },
  getDistinctYearNames: {
    params: Joi.object({
      campusId: params.campusId,
    }),
  },
  getDistinctMedia: {
    params: Joi.object({
      campusId: params.campusId,
    }),
  },
  getAcademicYearIdByCombo: {
    params: Joi.object({
        campusId: params.campusId,
    }),
    query: Joi.object({
        yearName: Joi.string().required(),
        yearType: Joi.string().required(),
        curriculumId: Joi.number().integer().min(1).required(),
        medium: Joi.string().required(),
    })
  },
  getAllAcademicYears: {
    params: Joi.object({
      campusId: params.campusId,
    }),
  },
  createAcademicYear: {
    params: Joi.object({
      campusId: params.campusId,
    }),
    body: Joi.object(academicYearPayload),
  },
  getAcademicYearById: {
    params: Joi.object({
      campusId: params.campusId,
      academicYearId: params.academicYearId,
    }),
  },
  updateAcademicYear: {
    params: Joi.object({
      campusId: params.campusId,
      academicYearId: params.academicYearId,
    }),
    body: Joi.object(academicYearPayload),
  },
  deleteAcademicYear: {
    params: Joi.object({
      campusId: params.campusId,
      academicYearId: params.academicYearId,
    }),
  },
};
