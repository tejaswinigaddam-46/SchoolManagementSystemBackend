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
    return await SyllabusTrackingModel.listProgress(filters);
  },
  async createProgress(data) {
    try {
      return await SyllabusTrackingModel.createProgress(data);
    } catch (e) {
      throw mapPgError(e);
    }
  },
  async getProgressById(progressId) {
    const row = await SyllabusTrackingModel.getProgressById(progressId);
    return ensureFound(row, 'Progress not found');
  },
  async updateProgress(progressId, data) {
    try {
      const row = await SyllabusTrackingModel.updateProgress(progressId, data);
      return ensureFound(row, 'Progress not found');
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
