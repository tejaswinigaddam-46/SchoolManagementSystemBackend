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
        return await SyllabusTrackingModel.createPlan(data);
      }

      const resolved = await this.resolveSectionSubjectIdByContext({
        academic_year_id: data.academic_year_id,
        section_id: data.section_id,
        subject_name: data.subject_name
      });

      const flat = flattenPlanTree(data.plan_tree || data.chapters || []);
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
      const row = await SyllabusTrackingModel.updatePlan(planId, data);
      return ensureFound(row, 'Plan not found');
    } catch (e) {
      throw mapPgError(e);
    }
  },
  async replacePlansByContext(data) {
    const resolved = await this.resolveSectionSubjectIdByContext({
      academic_year_id: data.academic_year_id,
      section_id: data.section_id,
      subject_name: data.subject_name
    });

    const flat = flattenPlanTree(data.plan_tree || data.chapters || []);
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
