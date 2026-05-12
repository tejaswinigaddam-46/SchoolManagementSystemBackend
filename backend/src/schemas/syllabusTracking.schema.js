const Joi = require('joi');

const userContext = Joi.object({
  tenantId: Joi.string().trim().min(1).invalid('undefined').required(),
  campusId: Joi.string().trim().uuid().invalid('undefined').required()
}).unknown(true);

const ids = {
  planId: Joi.number().integer().min(1).required(),
  progressId: Joi.number().integer().min(1).required()
};

const intId = Joi.number().integer().min(1);
const intIdOrNull = intId.allow(null);
const numberOrNull = Joi.number().allow(null);
const dateOrNull = Joi.date().iso().allow(null);

const planLevelRule = (obj, helpers) => {
  const chapterId = obj.chapter_id ?? null;
  const topicId = obj.topic_id ?? null;
  const subtopicId = obj.subtopic_id ?? null;

  const ok = (
    (chapterId !== null && topicId === null && subtopicId === null)
    || (topicId !== null && subtopicId === null)
    || (subtopicId !== null)
  );

  if (!ok) return helpers.error('any.invalid');
  return obj;
};

const createPlanBody = Joi.object({
  section_subject_id: intId.required(),
  chapter_id: intIdOrNull.optional(),
  topic_id: intIdOrNull.optional(),
  subtopic_id: intIdOrNull.optional(),
  planned_hours: numberOrNull.optional(),
  planned_start_date: dateOrNull.optional(),
  planned_end_date: dateOrNull.optional(),
  created_by: Joi.number().integer().min(1).allow(null).optional()
}).custom(planLevelRule, 'plan level validation').unknown(true);

const planTreeBody = Joi.array().items(
  Joi.object({
    chapter_id: intId.required(),
    planned_hours: numberOrNull.optional(),
    planned_start_date: dateOrNull.optional(),
    planned_end_date: dateOrNull.optional(),
    topics: Joi.array().items(
      Joi.object({
        topic_id: intId.required(),
        planned_hours: numberOrNull.optional(),
        planned_start_date: dateOrNull.optional(),
        planned_end_date: dateOrNull.optional(),
        subtopics: Joi.array().items(
          Joi.object({
            subtopic_id: intId.required(),
            planned_hours: numberOrNull.optional(),
            planned_start_date: dateOrNull.optional(),
            planned_end_date: dateOrNull.optional()
          }).unknown(true)
        ).optional()
      }).unknown(true)
    ).optional()
  }).unknown(true)
).min(1);

const createPlanBulkBody = Joi.object({
  academic_year_id: intId.required(),
  section_id: intId.required(),
  subject_name: Joi.string().trim().min(1).max(255).required(),
  plan_tree: planTreeBody.optional(),
  chapters: planTreeBody.optional(),
  created_by: Joi.number().integer().min(1).allow(null).optional()
}).custom((obj, helpers) => {
  if (!obj.plan_tree && !obj.chapters) {
    return helpers.error('any.required');
  }
  return obj;
}).unknown(true);

const updatePlanBody = Joi.object({
  section_subject_id: intId.optional(),
  chapter_id: intIdOrNull.optional(),
  topic_id: intIdOrNull.optional(),
  subtopic_id: intIdOrNull.optional(),
  planned_hours: numberOrNull.optional(),
  planned_start_date: dateOrNull.optional(),
  planned_end_date: dateOrNull.optional(),
  created_by: Joi.number().integer().min(1).allow(null).optional()
}).min(1).unknown(true);

const createProgressBody = Joi.object({
  section_subject_id: intId.required(),
  subtopic_id: intId.required(),
  teacher_user_id: Joi.number().integer().min(1).allow(null).optional(),
  status: Joi.string().valid('completed', 'pending').optional(),
  completion_percentage: Joi.number().min(0).max(100).optional(),
  planned_hours: numberOrNull.optional(),
  actual_hours: Joi.number().min(0).optional(),
  started_at: dateOrNull.optional(),
  completed_at: dateOrNull.optional(),
  notes: Joi.string().allow(null, '').optional()
}).unknown(true);

const updateProgressBody = Joi.object({
  section_subject_id: intId.optional(),
  subtopic_id: intId.optional(),
  teacher_user_id: Joi.number().integer().min(1).allow(null).optional(),
  status: Joi.string().valid('completed', 'pending').optional(),
  completion_percentage: Joi.number().min(0).max(100).optional(),
  planned_hours: numberOrNull.optional(),
  actual_hours: Joi.number().min(0).optional(),
  started_at: dateOrNull.optional(),
  completed_at: dateOrNull.optional(),
  notes: Joi.string().allow(null, '').optional(),
  updated_at: dateOrNull.optional()
}).min(1).unknown(true);

module.exports = {
  getPlans: {
    user: userContext,
    query: Joi.object({
      section_subject_id: intId.optional(),
      chapter_id: intId.optional(),
      topic_id: intId.optional(),
      subtopic_id: intId.optional(),
      academic_year_id: intId.optional(),
      section_id: intId.optional(),
      subject_name: Joi.string().trim().min(1).max(255).optional()
    })
  },
  createPlan: {
    user: userContext,
    body: Joi.alternatives().try(createPlanBody, createPlanBulkBody)
  },
  replacePlans: {
    user: userContext,
    body: createPlanBulkBody
  },
  getPlanById: {
    user: userContext,
    params: Joi.object({
      planId: ids.planId
    })
  },
  updatePlan: {
    user: userContext,
    params: Joi.object({
      planId: ids.planId
    }),
    body: updatePlanBody
  },
  deletePlan: {
    user: userContext,
    params: Joi.object({
      planId: ids.planId
    })
  },

  getProgress: {
    user: userContext,
    query: Joi.object({
      section_subject_id: intId.optional(),
      subtopic_id: intId.optional(),
      teacher_user_id: intId.optional(),
      status: Joi.string().valid('completed', 'pending').optional()
    })
  },
  createProgress: {
    user: userContext,
    body: createProgressBody
  },
  getProgressById: {
    user: userContext,
    params: Joi.object({
      progressId: ids.progressId
    })
  },
  updateProgress: {
    user: userContext,
    params: Joi.object({
      progressId: ids.progressId
    }),
    body: updateProgressBody
  },
  deleteProgress: {
    user: userContext,
    params: Joi.object({
      progressId: ids.progressId
    })
  }
};
