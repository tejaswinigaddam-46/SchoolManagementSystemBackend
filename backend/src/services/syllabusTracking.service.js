const SyllabusTrackingModel = require('../models/syllabusTracking.model');
const { pool } = require('../config/database');

const mapPgError = (error) => {
  if (!error || !error.code) return error;
  if (error.code === '23505') {
    const err = new Error('Duplicate record');
    err.code = 'DUPLICATE';
    return err;
  }
  if (error.code === '23503') {
    const err = new Error('Invalid reference');
    err.code = 'FK';
    return err;
  }
  if (error.code === '23514') {
    const err = new Error('Invalid values');
    err.code = 'CHECK';
    return err;
  }
  return error;
};

const ensureFound = (row, message) => {
  if (!row) {
    const err = new Error(message);
    err.code = 'NOT_FOUND';
    throw err;
  }
  return row;
};

const computeCompletionFromActualPlanned = (actual, planned) => {
  const plannedNum = Number(planned ?? 0);
  const actualNum = Number(actual ?? 0);
  if (!plannedNum || plannedNum <= 0) return { completion_percentage: 0, status: 'pending' };
  const raw = (actualNum / plannedNum) * 100;
  const capped = Math.max(0, Math.min(100, raw));
  const rounded = Math.round(capped * 100) / 100;
  if (rounded >= 100) return { completion_percentage: 100, status: 'completed' };
  return { completion_percentage: rounded, status: 'pending' };
};

const failRule = (message) => {
  const err = new Error(message);
  err.code = 'BUSINESS_RULE';
  throw err;
};

const toDate = (v) => {
  if (!v) return null;
  if (v instanceof Date) return v;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

const dateRangeHours = (startDate, endDate) => {
  const s = toDate(startDate);
  const e = toDate(endDate);
  if (!s || !e) return null;
  const sUTC = Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate());
  const eUTC = Date.UTC(e.getUTCFullYear(), e.getUTCMonth(), e.getUTCDate());
  const diffDays = Math.floor((eUTC - sUTC) / (24 * 60 * 60 * 1000));
  return (diffDays + 1) * 24;
};

const validateNodeDatesAndHours = (node, label) => {
  const start = toDate(node.planned_start_date);
  const end = toDate(node.planned_end_date);
  const plannedHours = node.planned_hours === null || node.planned_hours === undefined ? null : Number(node.planned_hours);

  if (start && end) {
    const sUTC = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
    const eUTC = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
    if (sUTC > eUTC) {
      failRule(`${label}: planned_start_date must be <= planned_end_date`);
    }
    if (plannedHours !== null && !Number.isNaN(plannedHours)) {
      const totalHours = dateRangeHours(start, end);
      if (totalHours !== null && plannedHours > totalHours) {
        failRule(`${label}: planned_hours (${plannedHours}) exceeds available hours in date range (${totalHours}). Increase end date or reduce planned hours`);
      }
    }
  }
};

const validatePlanTreeBusinessRules = (tree = []) => {
  const eps = 0.0001;

  for (const ch of tree || []) {
    if (!ch || !ch.chapter_id) continue;
    validateNodeDatesAndHours(ch, `chapter_id=${ch.chapter_id}`);

    const topics = Array.isArray(ch.topics) ? ch.topics : [];
    if (topics.length > 0) {
      if (ch.planned_hours === null || ch.planned_hours === undefined) {
        failRule(`chapter_id=${ch.chapter_id}: planned_hours is required when topics are provided`);
      }
      const chapterHours = Number(ch.planned_hours);
      if (Number.isNaN(chapterHours)) {
        failRule(`chapter_id=${ch.chapter_id}: planned_hours must be a number`);
      }

      let sumTopics = 0;
      for (const t of topics) {
        if (!t || !t.topic_id) continue;
        validateNodeDatesAndHours(t, `topic_id=${t.topic_id}`);

        if (t.planned_hours === null || t.planned_hours === undefined) {
          failRule(`topic_id=${t.topic_id}: planned_hours is required when chapter has planned_hours aggregation`);
        }
        const th = Number(t.planned_hours);
        if (Number.isNaN(th)) {
          failRule(`topic_id=${t.topic_id}: planned_hours must be a number`);
        }
        sumTopics += th;

        const subtopics = Array.isArray(t.subtopics) ? t.subtopics : [];
        if (subtopics.length > 0) {
          let sumSubtopics = 0;
          for (const s of subtopics) {
            if (!s || !s.subtopic_id) continue;
            validateNodeDatesAndHours(s, `subtopic_id=${s.subtopic_id}`);

            if (s.planned_hours === null || s.planned_hours === undefined) {
              failRule(`subtopic_id=${s.subtopic_id}: planned_hours is required when topic has planned_hours aggregation`);
            }
            const sh = Number(s.planned_hours);
            if (Number.isNaN(sh)) {
              failRule(`subtopic_id=${s.subtopic_id}: planned_hours must be a number`);
            }
            sumSubtopics += sh;
          }

          if (Math.abs(sumSubtopics - th) > eps) {
            failRule(`topic_id=${t.topic_id}: sum of subtopics planned_hours (${sumSubtopics}) must equal topic planned_hours (${th})`);
          }
        }
      }

      if (Math.abs(sumTopics - chapterHours) > eps) {
        failRule(`chapter_id=${ch.chapter_id}: sum of topics planned_hours (${sumTopics}) must equal chapter planned_hours (${chapterHours})`);
      }
    }
  }
};

const validateAggregationsForSectionSubject = async (section_subject_id, affected, client) => {
  const eps = 0.0001;
  const chapterIds = Array.from(new Set(affected.chapterIds || []));
  const topicIds = Array.from(new Set(affected.topicIds || []));

  if (topicIds.length > 0) {
    const rows = await SyllabusTrackingModel.getTopicHoursAggregations(section_subject_id, topicIds, client);
    for (const r of rows) {
      const subtopicCount = Number(r.subtopic_count || 0);
      if (subtopicCount > 0) {
        if (r.topic_planned_hours === null || r.topic_planned_hours === undefined) {
          failRule(`topic_id=${r.topic_id}: planned_hours is required when subtopics are planned`);
        }
        const topicHours = Number(r.topic_planned_hours);
        const subSum = Number(r.subtopics_planned_hours);
        if (Math.abs(subSum - topicHours) > eps) {
          failRule(`topic_id=${r.topic_id}: sum of subtopics planned_hours (${subSum}) must equal topic planned_hours (${topicHours})`);
        }
      }
    }
  }

  if (chapterIds.length > 0) {
    const rows = await SyllabusTrackingModel.getChapterHoursAggregations(section_subject_id, chapterIds, client);
    for (const r of rows) {
      const topicCount = Number(r.topic_count || 0);
      if (topicCount > 0) {
        if (r.chapter_planned_hours === null || r.chapter_planned_hours === undefined) {
          failRule(`chapter_id=${r.chapter_id}: planned_hours is required when topics are planned`);
        }
        const chapterHours = Number(r.chapter_planned_hours);
        const topicSum = Number(r.topics_planned_hours);
        if (Math.abs(topicSum - chapterHours) > eps) {
          failRule(`chapter_id=${r.chapter_id}: sum of topics planned_hours (${topicSum}) must equal chapter planned_hours (${chapterHours})`);
        }
      }
    }
  }
};

const determineProgressLevel = (data) => {
  const hasChapter = data.chapter_id !== undefined && data.chapter_id !== null;
  const hasTopic = data.topic_id !== undefined && data.topic_id !== null;
  const hasSubtopic = data.subtopic_id !== undefined && data.subtopic_id !== null;
  const count = (hasChapter ? 1 : 0) + (hasTopic ? 1 : 0) + (hasSubtopic ? 1 : 0);
  if (count !== 1) {
    failRule('Exactly one of chapter_id, topic_id, subtopic_id must be provided');
  }
  if (hasSubtopic) return { level: 'subtopic', id: parseInt(data.subtopic_id) };
  if (hasTopic) return { level: 'topic', id: parseInt(data.topic_id) };
  return { level: 'chapter', id: parseInt(data.chapter_id) };
};

const round2 = (n) => Math.round(n * 100) / 100;

const computePlannedTotal = async (section_subject_id, level, id, client) => {
  if (level === 'chapter') {
    const topicsCount = await SyllabusTrackingModel.countTopicsByChapterId(id, client);
    if (topicsCount > 0) {
      const sumTopics = await SyllabusTrackingModel.sumPlannedHoursForChapterTopics(section_subject_id, id, client);
      if (sumTopics > 0) return sumTopics;
      const sumSubtopics = await SyllabusTrackingModel.sumPlannedHoursForChapterSubtopics(section_subject_id, id, client);
      if (sumSubtopics > 0) return sumSubtopics;
    }
    const plan = await SyllabusTrackingModel.getPlanHoursForChapter(section_subject_id, id, client);
    if (plan && plan.planned_hours !== null && plan.planned_hours !== undefined) return Number(plan.planned_hours);
    const def = await SyllabusTrackingModel.getChapterDefaultHours(id, client);
    return def && def.default_hours !== null && def.default_hours !== undefined ? Number(def.default_hours) : 0;
  }

  if (level === 'topic') {
    const subCount = await SyllabusTrackingModel.countSubtopicsByTopicId(id, client);
    if (subCount > 0) {
      const sumSubtopics = await SyllabusTrackingModel.sumPlannedHoursForTopicSubtopics(section_subject_id, id, client);
      if (sumSubtopics > 0) return sumSubtopics;
    }
    const plan = await SyllabusTrackingModel.getPlanHoursForTopic(section_subject_id, id, client);
    if (plan && plan.planned_hours !== null && plan.planned_hours !== undefined) return Number(plan.planned_hours);
    const def = await SyllabusTrackingModel.getTopicDefaultHours(id, client);
    return def && def.default_hours !== null && def.default_hours !== undefined ? Number(def.default_hours) : 0;
  }

  const plan = await SyllabusTrackingModel.getPlanHoursForSubtopic(section_subject_id, id, client);
  if (plan && plan.planned_hours !== null && plan.planned_hours !== undefined) return Number(plan.planned_hours);
  const def = await SyllabusTrackingModel.getSubtopicDefaultHours(id, client);
  return def && def.default_hours !== null && def.default_hours !== undefined ? Number(def.default_hours) : 0;
};

const computeActualTotal = async (section_subject_id, level, id, currentActualHours, client) => {
  if (level === 'chapter') {
    const topicsCount = await SyllabusTrackingModel.countTopicsByChapterId(id, client);
    if (topicsCount > 0) {
      const sumTopicsActual = await SyllabusTrackingModel.sumActualHoursForChapterFromTopics(section_subject_id, id, client);
      if (sumTopicsActual > 0) return sumTopicsActual;
      const sumSubtopicsActual = await SyllabusTrackingModel.sumActualHoursForChapterFromSubtopics(section_subject_id, id, client);
      return sumSubtopicsActual;
    }
    return Number(currentActualHours ?? 0);
  }

  if (level === 'topic') {
    const subCount = await SyllabusTrackingModel.countSubtopicsByTopicId(id, client);
    if (subCount > 0) {
      const sumSubtopicsActual = await SyllabusTrackingModel.sumActualHoursForTopicFromSubtopics(section_subject_id, id, client);
      return sumSubtopicsActual;
    }
    return Number(currentActualHours ?? 0);
  }

  return Number(currentActualHours ?? 0);
};

const computeCompletion = (actual, planned) => {
  const plannedNum = Number(planned ?? 0);
  const actualNum = Number(actual ?? 0);
  if (!plannedNum || plannedNum <= 0) return { completion_percentage: 0, status: 'pending' };
  const raw = (actualNum / plannedNum) * 100;
  const capped = Math.max(0, Math.min(100, raw));
  const rounded = round2(capped);
  const isCompleted = rounded >= 100;
  return { completion_percentage: isCompleted ? 100 : rounded, status: isCompleted ? 'completed' : 'pending' };
};

const ensureProgressRowForLevel = async (section_subject_id, level, id, teacher_user_id, client) => {
  const existing = await SyllabusTrackingModel.findProgressByKey(section_subject_id, level, id, client);
  if (existing) return existing;
  const base = {
    section_subject_id,
    chapter_id: level === 'chapter' ? id : null,
    topic_id: level === 'topic' ? id : null,
    subtopic_id: level === 'subtopic' ? id : null,
    teacher_user_id: teacher_user_id ?? null,
    actual_hours: 0,
    started_at: null,
    completed_at: null,
    notes: null
  };
  const planned_total = await computePlannedTotal(section_subject_id, level, id, client);
  const completion = computeCompletion(0, planned_total);
  return await SyllabusTrackingModel.createProgress(
    {
      ...base,
      planned_hours: planned_total,
      completion_percentage: completion.completion_percentage,
      status: completion.status
    },
    client
  );
};

const recomputeAndPersistProgress = async (progressRow, client) => {
  const section_subject_id = progressRow.section_subject_id;
  let level = null;
  let id = null;
  if (progressRow.subtopic_id) {
    level = 'subtopic';
    id = progressRow.subtopic_id;
  } else if (progressRow.topic_id) {
    level = 'topic';
    id = progressRow.topic_id;
  } else if (progressRow.chapter_id) {
    level = 'chapter';
    id = progressRow.chapter_id;
  } else {
    failRule(`progress_id=${progressRow.progress_id}: invalid level`);
  }

  const planned_total = await computePlannedTotal(section_subject_id, level, id, client);
  const actual_total = await computeActualTotal(section_subject_id, level, id, progressRow.actual_hours, client);
  const completion = computeCompletion(actual_total, planned_total);

  const updated = await SyllabusTrackingModel.updateProgress(
    progressRow.progress_id,
    {
      planned_hours: planned_total,
      actual_hours: actual_total,
      completion_percentage: completion.completion_percentage,
      status: completion.status,
      updated_at: new Date().toISOString()
    },
    client
  );
  return updated;
};

const flattenPlanTree = (tree = []) => {
  const rows = [];
  for (const ch of tree || []) {
    if (!ch || !ch.chapter_id) continue;

    rows.push({
      level: 'chapter',
      chapter_id: ch.chapter_id,
      planned_hours: ch.planned_hours,
      planned_start_date: ch.planned_start_date,
      planned_end_date: ch.planned_end_date
    });

    for (const t of ch.topics || []) {
      if (!t || !t.topic_id) continue;
      rows.push({
        level: 'topic',
        topic_id: t.topic_id,
        planned_hours: t.planned_hours,
        planned_start_date: t.planned_start_date,
        planned_end_date: t.planned_end_date
      });

      for (const s of t.subtopics || []) {
        if (!s || !s.subtopic_id) continue;
        rows.push({
          level: 'subtopic',
          subtopic_id: s.subtopic_id,
          planned_hours: s.planned_hours,
          planned_start_date: s.planned_start_date,
          planned_end_date: s.planned_end_date
        });
      }
    }
  }
  return rows;
};

const SyllabusTrackingService = {
  async resolveSectionSubjectIdByContext(context) {
    const curriculum = await SyllabusTrackingModel.getCurriculumIdByAcademicYearId(context.academic_year_id);
    if (!curriculum) {
      const err = new Error('Invalid academic_year_id: no curriculum found');
      err.code = 'NOT_FOUND';
      throw err;
    }

    const subject = await SyllabusTrackingModel.getSubjectIdByNameAndCurriculum(context.subject_name, curriculum.curriculum_id);
    if (!subject) {
      const err = new Error('Subject name not found for this curriculum');
      err.code = 'NOT_FOUND';
      throw err;
    }

    const sectionSubject = await SyllabusTrackingModel.getSectionSubjectIdBySectionAndSubjectAndAcademicYear(
      context.section_id,
      subject.subject_id,
      context.academic_year_id
    );
    if (!sectionSubject) {
      const err = new Error(`${context.subject_name} subject is not assgined to the selected sections`);
      err.code = 'NOT_FOUND';
      throw err;
    }

    return {
      section_subject_id: sectionSubject.section_subject_id,
      subject_id: subject.subject_id,
      curriculum_id: curriculum.curriculum_id
    };
  },

  async recomputeProgressByPlanId(plan_id, client = pool) {
    const plan = await SyllabusTrackingModel.getPlanById(plan_id, client);
    ensureFound(plan, `Plan not found: plan_id=${plan_id}`);

    const existing = await SyllabusTrackingModel.getProgressByPlanId(plan_id, client);
    const progressRow = existing
      ? existing
      : await SyllabusTrackingModel.createProgress({ plan_id, teacher_user_id: null, actual_hours: 0 }, client);

    const isChapter = !!plan.chapter_id && !plan.topic_id && !plan.subtopic_id;
    const isTopic = !!plan.topic_id && !plan.subtopic_id;
    const isSubtopic = !!plan.subtopic_id;

    let plannedTotal = Number(plan.planned_hours ?? 0);
    let actualTotal = Number(progressRow.actual_hours ?? 0);
    let overwriteActual = false;

    if (isChapter) {
      const topicCount = await SyllabusTrackingModel.countTopicsByChapterId(plan.chapter_id, client);
      if (topicCount > 0) {
        const plannedTopics = await SyllabusTrackingModel.sumPlannedHoursForChapterTopics(plan.section_subject_id, plan.chapter_id, client);
        const actualTopics = await SyllabusTrackingModel.sumActualHoursForChapterFromTopics(plan.section_subject_id, plan.chapter_id, client);
        if (plannedTopics > 0) plannedTotal = plannedTopics;
        actualTotal = actualTopics;
        overwriteActual = true;
      }
    } else if (isTopic) {
      const subCount = await SyllabusTrackingModel.countSubtopicsByTopicId(plan.topic_id, client);
      if (subCount > 0) {
        const plannedSubs = await SyllabusTrackingModel.sumPlannedHoursForTopicSubtopics(plan.section_subject_id, plan.topic_id, client);
        const actualSubs = await SyllabusTrackingModel.sumActualHoursForTopicFromSubtopics(plan.section_subject_id, plan.topic_id, client);
        if (plannedSubs > 0) plannedTotal = plannedSubs;
        actualTotal = actualSubs;
        overwriteActual = true;
      }
    } else if (!isSubtopic) {
      failRule(`plan_id=${plan_id}: invalid plan level`);
    }

    const completion = computeCompletionFromActualPlanned(actualTotal, plannedTotal);
    const updatePayload = {
      completion_percentage: completion.completion_percentage,
      status: completion.status,
      updated_at: new Date().toISOString()
    };
    if (overwriteActual) updatePayload.actual_hours = actualTotal;

    return await SyllabusTrackingModel.updateProgress(progressRow.progress_id, updatePayload, client);
  },

  async recomputeParentProgressByPlan(plan, client = pool) {
    const updated = [];
    if (plan.subtopic_id) {
      const topicRes = await SyllabusTrackingModel.getTopicIdBySubtopicId(plan.subtopic_id, client);
      if (topicRes?.topic_id) {
        const topicPlan = await SyllabusTrackingModel.getTopicPlanId(plan.section_subject_id, topicRes.topic_id, client);
        if (topicPlan?.plan_id) updated.push(await this.recomputeProgressByPlanId(topicPlan.plan_id, client));

        const chapterRes = await SyllabusTrackingModel.getChapterIdByTopicId(topicRes.topic_id, client);
        if (chapterRes?.chapter_id) {
          const chapterPlan = await SyllabusTrackingModel.getChapterPlanId(plan.section_subject_id, chapterRes.chapter_id, client);
          if (chapterPlan?.plan_id) updated.push(await this.recomputeProgressByPlanId(chapterPlan.plan_id, client));
        }
      }
    } else if (plan.topic_id) {
      const chapterRes = await SyllabusTrackingModel.getChapterIdByTopicId(plan.topic_id, client);
      if (chapterRes?.chapter_id) {
        const chapterPlan = await SyllabusTrackingModel.getChapterPlanId(plan.section_subject_id, chapterRes.chapter_id, client);
        if (chapterPlan?.plan_id) updated.push(await this.recomputeProgressByPlanId(chapterPlan.plan_id, client));
      }
    }
    return updated;
  },

  async bulkUpdateProgress(updates, context = {}) {
    const items = Array.isArray(updates) ? updates : (updates?.updates || []);
    if (!Array.isArray(items) || items.length === 0) failRule('updates must be a non-empty array');

    const planIds = items
      .map(i => i.plan_id ?? i.planId)
      .filter(v => v !== undefined && v !== null)
      .map(v => parseInt(v));
    if (planIds.length !== items.length) failRule('plan_id is required for each item');

    const sectionSubjectIdFromContext = (context.academic_year_id && context.section_id && context.subject_name)
      ? (await this.resolveSectionSubjectIdByContext({
        academic_year_id: context.academic_year_id,
        section_id: context.section_id,
        subject_name: context.subject_name
      })).section_subject_id
      : (context.section_subject_id ? parseInt(context.section_subject_id) : null);

    const upsertItems = items.map(i => {
      const plan_id = parseInt(i.plan_id ?? i.planId);
      const fields = i.fields_to_update ?? i.fieldsToUpdate ?? {};
      return {
        plan_id,
        actual_hours: Object.prototype.hasOwnProperty.call(fields, 'actual_hours') ? fields.actual_hours : undefined,
        has_actual_hours: Object.prototype.hasOwnProperty.call(fields, 'actual_hours'),
        started_at: Object.prototype.hasOwnProperty.call(fields, 'started_at') ? fields.started_at : undefined,
        has_started_at: Object.prototype.hasOwnProperty.call(fields, 'started_at'),
        completed_at: Object.prototype.hasOwnProperty.call(fields, 'completed_at') ? fields.completed_at : undefined,
        has_completed_at: Object.prototype.hasOwnProperty.call(fields, 'completed_at'),
        notes: Object.prototype.hasOwnProperty.call(fields, 'notes') ? fields.notes : undefined,
        has_notes: Object.prototype.hasOwnProperty.call(fields, 'notes'),
        teacher_user_id: i.teacher_user_id ?? context.teacher_user_id ?? null
      };
    });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const plans = await SyllabusTrackingModel.getPlansByIds(planIds, client);
      if (plans.length !== planIds.length) {
        const found = new Set(plans.map(p => p.plan_id));
        const missing = planIds.filter(id => !found.has(id));
        failRule(`Plan not found: plan_id=${missing[0]}`);
      }
      if (sectionSubjectIdFromContext) {
        for (const p of plans) {
          if (p.section_subject_id !== sectionSubjectIdFromContext) {
            failRule(`plan_id=${p.plan_id}: does not belong to the selected section/subject`);
          }
        }
      }

      await SyllabusTrackingModel.upsertProgressUserFieldsByPlanIds(upsertItems, client);

      const parentPlanIds = await SyllabusTrackingModel.getParentPlanIdsForPlanIds(planIds, client);
      const impactedPlanIds = Array.from(new Set([...planIds, ...parentPlanIds]));

      await SyllabusTrackingModel.ensureProgressRowsExistForPlanIds(impactedPlanIds, client);
      await SyllabusTrackingModel.recomputeProgressForPlanIds(impactedPlanIds, client);

      const progressRows = await SyllabusTrackingModel.getProgressByPlanIds(impactedPlanIds, client);
      const progressByPlanId = new Map(progressRows.map(r => [r.plan_id, r]));
      const links = await SyllabusTrackingModel.getParentPlanLinksForPlanIds(planIds, client);
      const parentsByChild = new Map();
      for (const l of links) {
        if (!parentsByChild.has(l.child_plan_id)) parentsByChild.set(l.child_plan_id, []);
        parentsByChild.get(l.child_plan_id).push(l.parent_plan_id);
      }

      await client.query('COMMIT');

      const results = planIds.map(pid => ({
        plan_id: pid,
        progress: progressByPlanId.get(pid) || null,
        updated_parents: (parentsByChild.get(pid) || []).map(ppid => progressByPlanId.get(ppid)).filter(Boolean)
      }));

      return { updated_count: results.length, results };
    } catch (e) {
      await client.query('ROLLBACK');
      throw mapPgError(e);
    } finally {
      client.release();
    }
  },

  async listPlans(filters) {
    if (filters && filters.academic_year_id && filters.section_id && filters.subject_name) {
      const resolved = await this.resolveSectionSubjectIdByContext({
        academic_year_id: filters.academic_year_id,
        section_id: filters.section_id,
        subject_name: filters.subject_name
      });
      return await SyllabusTrackingModel.listPlans({ section_subject_id: resolved.section_subject_id });
    }
    return await SyllabusTrackingModel.listPlans(filters);
  },
  async createPlan(data) {
    try {
      if (data && data.section_subject_id) {
        validateNodeDatesAndHours(data, 'plan');
        return await SyllabusTrackingModel.createPlan(data);
      }

      const resolved = await this.resolveSectionSubjectIdByContext({
        academic_year_id: data.academic_year_id,
        section_id: data.section_id,
        subject_name: data.subject_name
      });

      const flat = flattenPlanTree(data.plan_tree || data.chapters || []);
      validatePlanTreeBusinessRules(data.plan_tree || data.chapters || []);
      const rows = flat.map(r => ({
        section_subject_id: resolved.section_subject_id,
        chapter_id: r.chapter_id ?? null,
        topic_id: r.topic_id ?? null,
        subtopic_id: r.subtopic_id ?? null,
        planned_hours: r.planned_hours ?? null,
        planned_start_date: r.planned_start_date ?? null,
        planned_end_date: r.planned_end_date ?? null,
        created_by: data.created_by ?? null
      }));

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const inserted = await SyllabusTrackingModel.bulkInsertPlans(rows, client);
        const topicIds = [];
        const chapterIds = [];
        const subtopicIds = [];
        for (const r of inserted) {
          if (r.chapter_id) chapterIds.push(r.chapter_id);
          if (r.topic_id) topicIds.push(r.topic_id);
          if (r.subtopic_id) subtopicIds.push(r.subtopic_id);
        }
        const derivedTopicIds = await SyllabusTrackingModel.getTopicIdsBySubtopicIds(subtopicIds, client);
        const allTopicIds = Array.from(new Set([...topicIds, ...derivedTopicIds]));
        const derivedChapterIds = await SyllabusTrackingModel.getChapterIdsByTopicIds(allTopicIds, client);
        const allChapterIds = Array.from(new Set([...chapterIds, ...derivedChapterIds]));
        await validateAggregationsForSectionSubject(resolved.section_subject_id, { topicIds: allTopicIds, chapterIds: allChapterIds }, client);
        await client.query('COMMIT');
        return { inserted_count: inserted.length, plans: inserted, section_subject_id: resolved.section_subject_id };
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    } catch (e) {
      throw mapPgError(e);
    }
  },
  async getPlanById(planId) {
    const row = await SyllabusTrackingModel.getPlanById(planId);
    return ensureFound(row, 'Plan not found');
  },
  async updatePlan(planId, data) {
    try {
      if (
        Object.prototype.hasOwnProperty.call(data, 'planned_start_date')
        || Object.prototype.hasOwnProperty.call(data, 'planned_end_date')
        || Object.prototype.hasOwnProperty.call(data, 'planned_hours')
      ) {
        const existing = await SyllabusTrackingModel.getPlanById(planId);
        ensureFound(existing, 'Plan not found');
        const merged = { ...existing, ...data };
        validateNodeDatesAndHours(merged, `plan_id=${planId}`);
      }
      const row = await SyllabusTrackingModel.updatePlan(planId, data);
      return ensureFound(row, 'Plan not found');
    } catch (e) {
      throw mapPgError(e);
    }
  },

  async bulkUpdatePlanFields(updates) {
    const items = Array.isArray(updates) ? updates : [];
    if (items.length === 0) {
      failRule('No plan updates provided');
    }
    console.log('bulkUpdatePlanFields items:', items.length);

    const allowedKeys = new Set(['planned_hours', 'planned_start_date', 'planned_end_date']);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const updated = [];
      const affectedBySectionSubject = new Map();

      for (const item of items) {
        const planId = item.plan_id ?? item.planId;
        const fields = item.fields_to_update ?? item.fieldsToUpdate ?? {};
        if (!planId) {
          failRule('Each item must include plan_id');
        }
        const payload = {};
        for (const [k, v] of Object.entries(fields)) {
          if (!allowedKeys.has(k)) {
            failRule(`plan_id=${planId}: invalid field '${k}'. Only planned_hours, planned_start_date, planned_end_date are allowed`);
          }
          payload[k] = v;
        }
        if (Object.keys(payload).length === 0) {
          failRule(`plan_id=${planId}: fields_to_update is empty`);
        }

        const existing = await SyllabusTrackingModel.getPlanById(parseInt(planId), client);
        ensureFound(existing, `Plan not found: plan_id=${planId}`);

        const merged = { ...existing, ...payload };
        validateNodeDatesAndHours(merged, `plan_id=${planId}`);

        const row = await SyllabusTrackingModel.updatePlan(parseInt(planId), payload, client);
        ensureFound(row, `Plan not found: plan_id=${planId}`);
        updated.push(row);

        const key = String(row.section_subject_id);
        if (!affectedBySectionSubject.has(key)) {
          affectedBySectionSubject.set(key, { topicIds: [], chapterIds: [], subtopicIds: [] });
        }
        const a = affectedBySectionSubject.get(key);
        if (row.topic_id) a.topicIds.push(row.topic_id);
        if (row.chapter_id) a.chapterIds.push(row.chapter_id);
        if (row.subtopic_id) a.subtopicIds.push(row.subtopic_id);
      }

      for (const [sectionSubjectId, a] of affectedBySectionSubject.entries()) {
        const derivedTopicIds = await SyllabusTrackingModel.getTopicIdsBySubtopicIds(a.subtopicIds, client);
        const allTopicIds = Array.from(new Set([...(a.topicIds || []), ...derivedTopicIds]));
        const derivedChapterIds = await SyllabusTrackingModel.getChapterIdsByTopicIds(allTopicIds, client);
        const allChapterIds = Array.from(new Set([...(a.chapterIds || []), ...derivedChapterIds]));
        await validateAggregationsForSectionSubject(parseInt(sectionSubjectId), { topicIds: allTopicIds, chapterIds: allChapterIds }, client);
      }

      await client.query('COMMIT');
      return { updated_count: updated.length, plans: updated };
    } catch (e) {
      await client.query('ROLLBACK');
      throw mapPgError(e);
    } finally {
      client.release();
    }
  },
  async replacePlansByContext(data) {
    const resolved = await this.resolveSectionSubjectIdByContext({
      academic_year_id: data.academic_year_id,
      section_id: data.section_id,
      subject_name: data.subject_name
    });

    const flat = flattenPlanTree(data.plan_tree || data.chapters || []);
    validatePlanTreeBusinessRules(data.plan_tree || data.chapters || []);
    const rows = flat.map(r => ({
      section_subject_id: resolved.section_subject_id,
      chapter_id: r.chapter_id ?? null,
      topic_id: r.topic_id ?? null,
      subtopic_id: r.subtopic_id ?? null,
      planned_hours: r.planned_hours ?? null,
      planned_start_date: r.planned_start_date ?? null,
      planned_end_date: r.planned_end_date ?? null,
      created_by: data.created_by ?? null
    }));

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await SyllabusTrackingModel.deletePlansBySectionSubjectId(resolved.section_subject_id, client);
      const inserted = await SyllabusTrackingModel.bulkInsertPlans(rows, client);
      const topicIds = [];
      const chapterIds = [];
      const subtopicIds = [];
      for (const r of inserted) {
        if (r.chapter_id) chapterIds.push(r.chapter_id);
        if (r.topic_id) topicIds.push(r.topic_id);
        if (r.subtopic_id) subtopicIds.push(r.subtopic_id);
      }
      const derivedTopicIds = await SyllabusTrackingModel.getTopicIdsBySubtopicIds(subtopicIds, client);
      const allTopicIds = Array.from(new Set([...topicIds, ...derivedTopicIds]));
      const derivedChapterIds = await SyllabusTrackingModel.getChapterIdsByTopicIds(allTopicIds, client);
      const allChapterIds = Array.from(new Set([...chapterIds, ...derivedChapterIds]));
      await validateAggregationsForSectionSubject(resolved.section_subject_id, { topicIds: allTopicIds, chapterIds: allChapterIds }, client);
      await client.query('COMMIT');
      return { replaced_count: inserted.length, plans: inserted, section_subject_id: resolved.section_subject_id };
    } catch (e) {
      await client.query('ROLLBACK');
      throw mapPgError(e);
    } finally {
      client.release();
    }
  },
  async deletePlan(planId) {
    const row = await SyllabusTrackingModel.deletePlan(planId);
    return ensureFound(row, 'Plan not found');
  },

  async listProgress(filters) {
    const normalized = { ...(filters || {}) };

    if (normalized.academic_year_id && normalized.section_id && normalized.subject_name) {
      const resolved = await this.resolveSectionSubjectIdByContext({
        academic_year_id: normalized.academic_year_id,
        section_id: normalized.section_id,
        subject_name: normalized.subject_name
      });
      const result = await SyllabusTrackingModel.listPlanProgressBySectionSubjectId(
        resolved.section_subject_id,
        {
          chapter_id: normalized.chapter_id,
          topic_id: normalized.topic_id,
          subtopic_id: normalized.subtopic_id,
          teacher_user_id: normalized.teacher_user_id,
          status: normalized.status
        }
      );

      return result.map(r => ({
        ...r,
        actual_hours: r.actual_hours ?? 0,
        completion_percentage: r.completion_percentage ?? 0,
        status: r.status ?? 'pending'
      }));
    }

    if (normalized.section_subject_id) {
      const result = await SyllabusTrackingModel.listPlanProgressBySectionSubjectId(
        normalized.section_subject_id,
        {
          chapter_id: normalized.chapter_id,
          topic_id: normalized.topic_id,
          subtopic_id: normalized.subtopic_id,
          teacher_user_id: normalized.teacher_user_id,
          status: normalized.status
        }
      );
      return result.map(r => ({
        ...r,
        actual_hours: r.actual_hours ?? 0,
        completion_percentage: r.completion_percentage ?? 0,
        status: r.status ?? 'pending'
      }));
    }

    failRule('academic_year_id, section_id, subject_name (or section_subject_id) are required');
  },
  async createProgress(data) {
    const context = Array.isArray(data) ? {} : (data || {});
    const rawItems = Array.isArray(data)
      ? data
      : (Array.isArray(data?.progress) ? data.progress : (Array.isArray(data?.progresses) ? data.progresses : null));

    const items = rawItems || [context];
    const updates = items.map(it => {
      const fields_to_update = {};
      if (Object.prototype.hasOwnProperty.call(it, 'actual_hours')) fields_to_update.actual_hours = it.actual_hours;
      if (Object.prototype.hasOwnProperty.call(it, 'started_at')) fields_to_update.started_at = it.started_at;
      if (Object.prototype.hasOwnProperty.call(it, 'completed_at')) fields_to_update.completed_at = it.completed_at;
      if (Object.prototype.hasOwnProperty.call(it, 'notes')) fields_to_update.notes = it.notes;
      return {
        plan_id: it.plan_id ?? it.planId,
        teacher_user_id: it.teacher_user_id,
        fields_to_update
      };
    });

    const result = await this.bulkUpdateProgress(updates, context);
    return { saved_count: result.updated_count, results: result.results };
  },
  async getProgressById(progressId) {
    const row = await SyllabusTrackingModel.getProgressById(progressId);
    return ensureFound(row, 'Progress not found');
  },
  async updateProgress(progressId, data) {
    try {
      const existing = await SyllabusTrackingModel.getProgressById(progressId);
      ensureFound(existing, 'Progress not found');

      const fields_to_update = {};
      if (Object.prototype.hasOwnProperty.call(data, 'actual_hours')) fields_to_update.actual_hours = data.actual_hours;
      if (Object.prototype.hasOwnProperty.call(data, 'started_at')) fields_to_update.started_at = data.started_at;
      if (Object.prototype.hasOwnProperty.call(data, 'completed_at')) fields_to_update.completed_at = data.completed_at;
      if (Object.prototype.hasOwnProperty.call(data, 'notes')) fields_to_update.notes = data.notes;

      const result = await this.bulkUpdateProgress(
        [{ plan_id: existing.plan_id, fields_to_update }],
        { teacher_user_id: existing.teacher_user_id ?? null }
      );
      return result.results[0];
    } catch (e) {
      throw mapPgError(e);
    }
  },
  async deleteProgress(progressId) {
    const row = await SyllabusTrackingModel.deleteProgress(progressId);
    return ensureFound(row, 'Progress not found');
  }
};

module.exports = SyllabusTrackingService;
