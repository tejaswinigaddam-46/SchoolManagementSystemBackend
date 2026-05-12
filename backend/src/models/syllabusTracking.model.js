const { pool } = require('../config/database');

const buildWhere = (filters, allowed) => {
  const where = [];
  const values = [];
  let idx = 1;

  for (const key of allowed) {
    if (filters[key] === undefined) continue;
    const val = filters[key];
    if (val === null) {
      where.push(`${key} IS NULL`);
      continue;
    }
    where.push(`${key} = $${idx}`);
    values.push(val);
    idx += 1;
  }

  return {
    clause: where.length ? `WHERE ${where.join(' AND ')}` : '',
    values
  };
};

const buildUpdate = (data, allowed, idField, idValue) => {
  const set = [];
  const values = [];
  let idx = 1;

  for (const key of allowed) {
    if (!Object.prototype.hasOwnProperty.call(data, key)) continue;
    set.push(`${key} = $${idx}`);
    values.push(data[key]);
    idx += 1;
  }

  if (set.length === 0) {
    const err = new Error('No valid fields provided for update');
    err.code = 'NO_FIELDS';
    throw err;
  }

  values.push(idValue);
  return { setClause: set.join(', '), values, idParamIndex: idx, idField };
};

const SyllabusTrackingModel = {
  async getCurriculumIdByAcademicYearId(academic_year_id) {
    const query = `SELECT curriculum_id FROM academic_years WHERE academic_year_id = $1`;
    const result = await pool.query(query, [academic_year_id]);
    return result.rows[0];
  },

  async getSubjectIdByNameAndCurriculum(subject_name, curriculum_id) {
    const query = `SELECT subject_id FROM subjects WHERE subject_name = $1 AND curriculum_id = $2`;
    const result = await pool.query(query, [subject_name, curriculum_id]);
    return result.rows[0];
  },

  async getSectionSubjectIdBySectionAndSubjectAndAcademicYear(section_id, subject_id, academic_year_id) {
    const query = `
      SELECT ss.section_subject_id
      FROM section_subjects ss
      JOIN class_sections cs ON ss.section_id = cs.section_id
      WHERE ss.section_id = $1
        AND ss.subject_id = $2
        AND cs.academic_year_id = $3
      LIMIT 1
    `;
    const result = await pool.query(query, [section_id, subject_id, academic_year_id]);
    return result.rows[0];
  },

  async listPlans(filters = {}) {
    const { clause, values } = buildWhere(filters, ['section_subject_id', 'chapter_id', 'topic_id', 'subtopic_id']);
    const query = `
      SELECT *
      FROM section_syllabus_plan
      ${clause}
      ORDER BY planned_start_date NULLS LAST, planned_end_date NULLS LAST, plan_id DESC
    `;
    const result = await pool.query(query, values);
    return result.rows;
  },

  async deletePlansBySectionSubjectId(section_subject_id, client = pool) {
    const query = `DELETE FROM section_syllabus_plan WHERE section_subject_id = $1`;
    const result = await client.query(query, [section_subject_id]);
    return { deleted: result.rowCount };
  },

  async bulkInsertPlans(rows, client = pool) {
    const query = `
      INSERT INTO section_syllabus_plan
        (section_subject_id, chapter_id, topic_id, subtopic_id, planned_hours, planned_start_date, planned_end_date, created_by)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT DO NOTHING
      RETURNING *
    `;
    const inserted = [];
    for (const r of rows) {
      const values = [
        r.section_subject_id,
        r.chapter_id ?? null,
        r.topic_id ?? null,
        r.subtopic_id ?? null,
        r.planned_hours ?? null,
        r.planned_start_date ?? null,
        r.planned_end_date ?? null,
        r.created_by ?? null
      ];
      const result = await client.query(query, values);
      inserted.push(result.rows[0]);
    }
    return inserted;
  },

  async createPlan(data) {
    const query = `
      INSERT INTO section_syllabus_plan
        (section_subject_id, chapter_id, topic_id, subtopic_id, planned_hours, planned_start_date, planned_end_date, created_by)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT DO NOTHING;
      RETURNING *
    `;
    const values = [
      data.section_subject_id,
      data.chapter_id ?? null,
      data.topic_id ?? null,
      data.subtopic_id ?? null,
      data.planned_hours ?? null,
      data.planned_start_date ?? null,
      data.planned_end_date ?? null,
      data.created_by ?? null
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  async getPlanById(planId) {
    const result = await pool.query(`SELECT * FROM section_syllabus_plan WHERE plan_id = $1`, [planId]);
    return result.rows[0];
  },

  async updatePlan(planId, data) {
    const { setClause, values, idParamIndex } = buildUpdate(
      data,
      [
        'section_subject_id',
        'chapter_id',
        'topic_id',
        'subtopic_id',
        'planned_hours',
        'planned_start_date',
        'planned_end_date',
        'created_by'
      ],
      'plan_id',
      planId
    );
    const query = `
      UPDATE section_syllabus_plan
      SET ${setClause}
      WHERE plan_id = $${idParamIndex}
      RETURNING *
    `;
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  async deletePlan(planId) {
    const result = await pool.query(`DELETE FROM section_syllabus_plan WHERE plan_id = $1 RETURNING *`, [planId]);
    return result.rows[0];
  },

  async listProgress(filters = {}) {
    const { clause, values } = buildWhere(filters, ['section_subject_id', 'subtopic_id', 'teacher_user_id', 'status']);
    const query = `
      SELECT *
      FROM syllabus_progress
      ${clause}
      ORDER BY updated_at DESC, progress_id DESC
    `;
    const result = await pool.query(query, values);
    return result.rows;
  },

  async createProgress(data) {
    const query = `
      INSERT INTO syllabus_progress
        (section_subject_id, subtopic_id, teacher_user_id, status, completion_percentage, planned_hours, actual_hours, started_at, completed_at, notes)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    const values = [
      data.section_subject_id,
      data.subtopic_id,
      data.teacher_user_id ?? null,
      data.status ?? 'pending',
      data.completion_percentage ?? 0,
      data.planned_hours ?? null,
      data.actual_hours ?? 0,
      data.started_at ?? null,
      data.completed_at ?? null,
      data.notes ?? null
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  async getProgressById(progressId) {
    const result = await pool.query(`SELECT * FROM syllabus_progress WHERE progress_id = $1`, [progressId]);
    return result.rows[0];
  },

  async updateProgress(progressId, data) {
    const { setClause, values, idParamIndex } = buildUpdate(
      data,
      [
        'section_subject_id',
        'subtopic_id',
        'teacher_user_id',
        'status',
        'completion_percentage',
        'planned_hours',
        'actual_hours',
        'started_at',
        'completed_at',
        'notes',
        'updated_at'
      ],
      'progress_id',
      progressId
    );
    const query = `
      UPDATE syllabus_progress
      SET ${setClause}
      WHERE progress_id = $${idParamIndex}
      RETURNING *
    `;
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  async deleteProgress(progressId) {
    const result = await pool.query(`DELETE FROM syllabus_progress WHERE progress_id = $1 RETURNING *`, [progressId]);
    return result.rows[0];
  }
};

module.exports = SyllabusTrackingModel;
