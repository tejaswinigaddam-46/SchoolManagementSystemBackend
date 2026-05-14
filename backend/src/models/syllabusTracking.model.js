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

  async getTopicIdsBySubtopicIds(subtopicIds, client = pool) {
    if (!Array.isArray(subtopicIds) || subtopicIds.length === 0) return [];
    const query = `
      SELECT DISTINCT topic_id
      FROM syllabus_subtopics
      WHERE subtopic_id = ANY($1::int[])
    `;
    const result = await client.query(query, [subtopicIds]);
    return result.rows.map(r => r.topic_id);
  },

  async getChapterIdsByTopicIds(topicIds, client = pool) {
    if (!Array.isArray(topicIds) || topicIds.length === 0) return [];
    const query = `
      SELECT DISTINCT chapter_id
      FROM syllabus_topics
      WHERE topic_id = ANY($1::int[])
    `;
    const result = await client.query(query, [topicIds]);
    return result.rows.map(r => r.chapter_id);
  },

  async getTopicIdBySubtopicId(subtopic_id, client = pool) {
    const query = `SELECT topic_id FROM syllabus_subtopics WHERE subtopic_id = $1`;
    const result = await client.query(query, [subtopic_id]);
    return result.rows[0];
  },

  async getChapterIdByTopicId(topic_id, client = pool) {
    const query = `SELECT chapter_id FROM syllabus_topics WHERE topic_id = $1`;
    const result = await client.query(query, [topic_id]);
    return result.rows[0];
  },

  async countTopicsByChapterId(chapter_id, client = pool) {
    const query = `SELECT COUNT(1)::int AS cnt FROM syllabus_topics WHERE chapter_id = $1`;
    const result = await client.query(query, [chapter_id]);
    return result.rows[0]?.cnt ?? 0;
  },

  async countSubtopicsByTopicId(topic_id, client = pool) {
    const query = `SELECT COUNT(1)::int AS cnt FROM syllabus_subtopics WHERE topic_id = $1`;
    const result = await client.query(query, [topic_id]);
    return result.rows[0]?.cnt ?? 0;
  },

  async getPlanHoursForChapter(section_subject_id, chapter_id, client = pool) {
    const query = `
      SELECT planned_hours
      FROM section_syllabus_plan
      WHERE section_subject_id = $1
        AND chapter_id = $2
        AND topic_id IS NULL
        AND subtopic_id IS NULL
      LIMIT 1
    `;
    const result = await client.query(query, [section_subject_id, chapter_id]);
    return result.rows[0];
  },

  async getPlanHoursForTopic(section_subject_id, topic_id, client = pool) {
    const query = `
      SELECT planned_hours
      FROM section_syllabus_plan
      WHERE section_subject_id = $1
        AND topic_id = $2
        AND subtopic_id IS NULL
      LIMIT 1
    `;
    const result = await client.query(query, [section_subject_id, topic_id]);
    return result.rows[0];
  },

  async getPlanHoursForSubtopic(section_subject_id, subtopic_id, client = pool) {
    const query = `
      SELECT planned_hours
      FROM section_syllabus_plan
      WHERE section_subject_id = $1
        AND subtopic_id = $2
      LIMIT 1
    `;
    const result = await client.query(query, [section_subject_id, subtopic_id]);
    return result.rows[0];
  },

  async sumPlannedHoursForChapterTopics(section_subject_id, chapter_id, client = pool) {
    const query = `
      SELECT COALESCE(SUM(p.planned_hours), 0) AS sum_hours
      FROM syllabus_topics t
      JOIN section_syllabus_plan p
        ON p.section_subject_id = $1
       AND p.topic_id = t.topic_id
       AND p.subtopic_id IS NULL
      WHERE t.chapter_id = $2
    `;
    const result = await client.query(query, [section_subject_id, chapter_id]);
    return Number(result.rows[0]?.sum_hours ?? 0);
  },

  async sumPlannedHoursForTopicSubtopics(section_subject_id, topic_id, client = pool) {
    const query = `
      SELECT COALESCE(SUM(p.planned_hours), 0) AS sum_hours
      FROM syllabus_subtopics st
      JOIN section_syllabus_plan p
        ON p.section_subject_id = $1
       AND p.subtopic_id = st.subtopic_id
      WHERE st.topic_id = $2
    `;
    const result = await client.query(query, [section_subject_id, topic_id]);
    return Number(result.rows[0]?.sum_hours ?? 0);
  },

  async getChapterDefaultHours(chapter_id, client = pool) {
    const query = `SELECT default_hours FROM syllabus_chapters WHERE chapter_id = $1`;
    const result = await client.query(query, [chapter_id]);
    return result.rows[0];
  },

  async getTopicDefaultHours(topic_id, client = pool) {
    const query = `SELECT default_hours FROM syllabus_topics WHERE topic_id = $1`;
    const result = await client.query(query, [topic_id]);
    return result.rows[0];
  },

  async getSubtopicDefaultHours(subtopic_id, client = pool) {
    const query = `SELECT default_hours FROM syllabus_subtopics WHERE subtopic_id = $1`;
    const result = await client.query(query, [subtopic_id]);
    return result.rows[0];
  },

  async sumActualHoursForChapterFromTopics(section_subject_id, chapter_id, client = pool) {
    const query = `
      SELECT COALESCE(SUM(COALESCE(sp.actual_hours, 0)), 0) AS sum_hours
      FROM syllabus_topics t
      JOIN section_syllabus_plan p
        ON p.section_subject_id = $1
       AND p.topic_id = t.topic_id
       AND p.subtopic_id IS NULL
      LEFT JOIN syllabus_progress sp ON sp.plan_id = p.plan_id
      WHERE t.chapter_id = $2
    `;
    const result = await client.query(query, [section_subject_id, chapter_id]);
    return Number(result.rows[0]?.sum_hours ?? 0);
  },

  async sumActualHoursForTopicFromSubtopics(section_subject_id, topic_id, client = pool) {
    const query = `
      SELECT COALESCE(SUM(COALESCE(sp.actual_hours, 0)), 0) AS sum_hours
      FROM syllabus_subtopics st
      JOIN section_syllabus_plan p
        ON p.section_subject_id = $1
       AND p.subtopic_id = st.subtopic_id
      LEFT JOIN syllabus_progress sp ON sp.plan_id = p.plan_id
      WHERE st.topic_id = $2
    `;
    const result = await client.query(query, [section_subject_id, topic_id]);
    return Number(result.rows[0]?.sum_hours ?? 0);
  },

  async sumPlannedHoursForChapterSubtopics(section_subject_id, chapter_id, client = pool) {
    const query = `
      SELECT COALESCE(SUM(p.planned_hours), 0) AS sum_hours
      FROM syllabus_topics t
      JOIN syllabus_subtopics st ON st.topic_id = t.topic_id
      JOIN section_syllabus_plan p
        ON p.section_subject_id = $1
       AND p.subtopic_id = st.subtopic_id
      WHERE t.chapter_id = $2
    `;
    const result = await client.query(query, [section_subject_id, chapter_id]);
    return Number(result.rows[0]?.sum_hours ?? 0);
  },

  async sumActualHoursForChapterFromSubtopics(section_subject_id, chapter_id, client = pool) {
    const query = `
      SELECT COALESCE(SUM(COALESCE(sp.actual_hours, 0)), 0) AS sum_hours
      FROM syllabus_topics t
      JOIN syllabus_subtopics st ON st.topic_id = t.topic_id
      JOIN section_syllabus_plan p
        ON p.section_subject_id = $1
       AND p.subtopic_id = st.subtopic_id
      LEFT JOIN syllabus_progress sp ON sp.plan_id = p.plan_id
      WHERE t.chapter_id = $2
    `;
    const result = await client.query(query, [section_subject_id, chapter_id]);
    return Number(result.rows[0]?.sum_hours ?? 0);
  },

  async getChapterPlanId(section_subject_id, chapter_id, client = pool) {
    const query = `
      SELECT plan_id
      FROM section_syllabus_plan
      WHERE section_subject_id = $1
        AND chapter_id = $2
        AND topic_id IS NULL
        AND subtopic_id IS NULL
      LIMIT 1
    `;
    const result = await client.query(query, [section_subject_id, chapter_id]);
    return result.rows[0];
  },

  async getTopicPlanId(section_subject_id, topic_id, client = pool) {
    const query = `
      SELECT plan_id
      FROM section_syllabus_plan
      WHERE section_subject_id = $1
        AND topic_id = $2
        AND subtopic_id IS NULL
      LIMIT 1
    `;
    const result = await client.query(query, [section_subject_id, topic_id]);
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

  async createPlan(data, client = pool) {
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
    const result = await client.query(query, values);
    return result.rows[0];
  },

  async getPlanById(planId, client = pool) {
    const result = await client.query(`SELECT * FROM section_syllabus_plan WHERE plan_id = $1`, [planId]);
    return result.rows[0];
  },

  async updatePlan(planId, data, client = pool) {
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
    const result = await client.query(query, values);
    return result.rows[0];
  },

  async deletePlan(planId, client = pool) {
    const result = await client.query(`DELETE FROM section_syllabus_plan WHERE plan_id = $1 RETURNING *`, [planId]);
    return result.rows[0];
  },

  async getTopicHoursAggregations(section_subject_id, topicIds, client = pool) {
    if (!Array.isArray(topicIds) || topicIds.length === 0) return [];
    const query = `
      SELECT t.topic_id,
             tp.planned_hours AS topic_planned_hours,
             COALESCE(SUM(sp.planned_hours), 0) AS subtopics_planned_hours,
             COUNT(sp.plan_id) AS subtopic_count
      FROM syllabus_topics t
      LEFT JOIN section_syllabus_plan tp
        ON tp.section_subject_id = $1
       AND tp.topic_id = t.topic_id
       AND tp.subtopic_id IS NULL
      LEFT JOIN syllabus_subtopics st ON st.topic_id = t.topic_id
      LEFT JOIN section_syllabus_plan sp
        ON sp.section_subject_id = $1
       AND sp.subtopic_id = st.subtopic_id
      WHERE t.topic_id = ANY($2::int[])
      GROUP BY t.topic_id, tp.planned_hours
    `;
    const result = await client.query(query, [section_subject_id, topicIds]);
    return result.rows;
  },

  async getChapterHoursAggregations(section_subject_id, chapterIds, client = pool) {
    if (!Array.isArray(chapterIds) || chapterIds.length === 0) return [];
    const query = `
      SELECT c.chapter_id,
             cp.planned_hours AS chapter_planned_hours,
             COALESCE(SUM(tp.planned_hours), 0) AS topics_planned_hours,
             COUNT(tp.plan_id) AS topic_count
      FROM syllabus_chapters c
      LEFT JOIN section_syllabus_plan cp
        ON cp.section_subject_id = $1
       AND cp.chapter_id = c.chapter_id
       AND cp.topic_id IS NULL
       AND cp.subtopic_id IS NULL
      LEFT JOIN syllabus_topics t ON t.chapter_id = c.chapter_id
      LEFT JOIN section_syllabus_plan tp
        ON tp.section_subject_id = $1
       AND tp.topic_id = t.topic_id
       AND tp.subtopic_id IS NULL
      WHERE c.chapter_id = ANY($2::int[])
      GROUP BY c.chapter_id, cp.planned_hours
    `;
    const result = await client.query(query, [section_subject_id, chapterIds]);
    return result.rows;
  },

  async listPlanProgressBySectionSubjectId(section_subject_id, filters = {}, client = pool) {
    const where = ['p.section_subject_id = $1'];
    const values = [section_subject_id];
    let idx = 2;

    if (filters.chapter_id !== undefined) {
      where.push(`p.chapter_id = $${idx}`);
      values.push(filters.chapter_id);
      idx += 1;
    }
    if (filters.topic_id !== undefined) {
      where.push(`p.topic_id = $${idx}`);
      values.push(filters.topic_id);
      idx += 1;
    }
    if (filters.subtopic_id !== undefined) {
      where.push(`p.subtopic_id = $${idx}`);
      values.push(filters.subtopic_id);
      idx += 1;
    }
    if (filters.teacher_user_id !== undefined) {
      where.push(`sp.teacher_user_id = $${idx}`);
      values.push(filters.teacher_user_id);
      idx += 1;
    }
    if (filters.status !== undefined) {
      where.push(`sp.status = $${idx}`);
      values.push(filters.status);
      idx += 1;
    }

    const query = `
      SELECT
        p.plan_id,
        p.section_subject_id,
        p.chapter_id,
        p.topic_id,
        p.subtopic_id,
        p.planned_hours,
        p.planned_start_date,
        p.planned_end_date,
        sp.progress_id,
        sp.teacher_user_id,
        sp.status,
        sp.completion_percentage,
        sp.actual_hours,
        sp.started_at,
        sp.completed_at,
        sp.notes,
        sp.updated_at
      FROM section_syllabus_plan p
      LEFT JOIN syllabus_progress sp ON sp.plan_id = p.plan_id
      WHERE ${where.join(' AND ')}
      ORDER BY p.planned_start_date NULLS LAST, p.planned_end_date NULLS LAST, p.plan_id DESC
    `;
    const result = await client.query(query, values);
    return result.rows;
  },

  async getPlansByIds(planIds, client = pool) {
    if (!Array.isArray(planIds) || planIds.length === 0) return [];
    const query = `
      SELECT plan_id, section_subject_id, chapter_id, topic_id, subtopic_id, planned_hours, planned_start_date, planned_end_date
      FROM section_syllabus_plan
      WHERE plan_id = ANY($1::int[])
    `;
    const result = await client.query(query, [planIds]);
    return result.rows;
  },

  async getParentPlanIdsForPlanIds(planIds, client = pool) {
    if (!Array.isArray(planIds) || planIds.length === 0) return [];
    const query = `
      WITH selected AS (
        SELECT plan_id, section_subject_id, chapter_id, topic_id, subtopic_id
        FROM section_syllabus_plan
        WHERE plan_id = ANY($1::int[])
      ),
      subtopic_parents AS (
        SELECT
          s.plan_id AS child_plan_id,
          tp.plan_id AS topic_plan_id,
          cp.plan_id AS chapter_plan_id
        FROM selected s
        JOIN syllabus_subtopics st ON st.subtopic_id = s.subtopic_id
        JOIN syllabus_topics t ON t.topic_id = st.topic_id
        LEFT JOIN section_syllabus_plan tp
          ON tp.section_subject_id = s.section_subject_id
         AND tp.topic_id = t.topic_id
         AND tp.subtopic_id IS NULL
        LEFT JOIN section_syllabus_plan cp
          ON cp.section_subject_id = s.section_subject_id
         AND cp.chapter_id = t.chapter_id
         AND cp.topic_id IS NULL
         AND cp.subtopic_id IS NULL
        WHERE s.subtopic_id IS NOT NULL
      ),
      topic_parents AS (
        SELECT
          s.plan_id AS child_plan_id,
          cp.plan_id AS chapter_plan_id
        FROM selected s
        JOIN syllabus_topics t ON t.topic_id = s.topic_id
        LEFT JOIN section_syllabus_plan cp
          ON cp.section_subject_id = s.section_subject_id
         AND cp.chapter_id = t.chapter_id
         AND cp.topic_id IS NULL
         AND cp.subtopic_id IS NULL
        WHERE s.topic_id IS NOT NULL
          AND s.subtopic_id IS NULL
      )
      SELECT DISTINCT plan_id
      FROM (
        SELECT topic_plan_id AS plan_id FROM subtopic_parents WHERE topic_plan_id IS NOT NULL
        UNION ALL
        SELECT chapter_plan_id AS plan_id FROM subtopic_parents WHERE chapter_plan_id IS NOT NULL
        UNION ALL
        SELECT chapter_plan_id AS plan_id FROM topic_parents WHERE chapter_plan_id IS NOT NULL
      ) x
    `;
    const result = await client.query(query, [planIds]);
    return result.rows.map(r => r.plan_id);
  },

  async getParentPlanLinksForPlanIds(planIds, client = pool) {
    if (!Array.isArray(planIds) || planIds.length === 0) return [];
    const query = `
      WITH selected AS (
        SELECT plan_id, section_subject_id, chapter_id, topic_id, subtopic_id
        FROM section_syllabus_plan
        WHERE plan_id = ANY($1::int[])
      ),
      subtopic_links AS (
        SELECT
          s.plan_id AS child_plan_id,
          tp.plan_id AS parent_plan_id
        FROM selected s
        JOIN syllabus_subtopics st ON st.subtopic_id = s.subtopic_id
        JOIN syllabus_topics t ON t.topic_id = st.topic_id
        JOIN section_syllabus_plan tp
          ON tp.section_subject_id = s.section_subject_id
         AND tp.topic_id = t.topic_id
         AND tp.subtopic_id IS NULL
        WHERE s.subtopic_id IS NOT NULL
        UNION ALL
        SELECT
          s.plan_id AS child_plan_id,
          cp.plan_id AS parent_plan_id
        FROM selected s
        JOIN syllabus_subtopics st ON st.subtopic_id = s.subtopic_id
        JOIN syllabus_topics t ON t.topic_id = st.topic_id
        JOIN section_syllabus_plan cp
          ON cp.section_subject_id = s.section_subject_id
         AND cp.chapter_id = t.chapter_id
         AND cp.topic_id IS NULL
         AND cp.subtopic_id IS NULL
        WHERE s.subtopic_id IS NOT NULL
      ),
      topic_links AS (
        SELECT
          s.plan_id AS child_plan_id,
          cp.plan_id AS parent_plan_id
        FROM selected s
        JOIN syllabus_topics t ON t.topic_id = s.topic_id
        JOIN section_syllabus_plan cp
          ON cp.section_subject_id = s.section_subject_id
         AND cp.chapter_id = t.chapter_id
         AND cp.topic_id IS NULL
         AND cp.subtopic_id IS NULL
        WHERE s.topic_id IS NOT NULL
          AND s.subtopic_id IS NULL
      )
      SELECT DISTINCT child_plan_id, parent_plan_id
      FROM (
        SELECT * FROM subtopic_links
        UNION ALL
        SELECT * FROM topic_links
      ) x
    `;
    const result = await client.query(query, [planIds]);
    return result.rows;
  },

  async getProgressByPlanId(plan_id, client = pool) {
    const query = `SELECT * FROM syllabus_progress WHERE plan_id = $1 LIMIT 1`;
    const result = await client.query(query, [plan_id]);
    return result.rows[0];
  },

  async getProgressByPlanIds(planIds, client = pool) {
    if (!Array.isArray(planIds) || planIds.length === 0) return [];
    const query = `
      SELECT *
      FROM syllabus_progress
      WHERE plan_id = ANY($1::int[])
    `;
    const result = await client.query(query, [planIds]);
    return result.rows;
  },

  async upsertProgressUserFieldsByPlanIds(items, client = pool) {
    if (!Array.isArray(items) || items.length === 0) return { touched: 0 };

    const values = [];
    const rowsSql = [];
    let idx = 1;

    for (const it of items) {
      rowsSql.push(`($${idx++}::int, $${idx++}::numeric, $${idx++}::bool, $${idx++}::timestamptz, $${idx++}::bool, $${idx++}::timestamptz, $${idx++}::bool, $${idx++}::text, $${idx++}::bool, $${idx++}::bigint)`);
      values.push(
        it.plan_id,
        it.actual_hours ?? null,
        !!it.has_actual_hours,
        it.started_at ?? null,
        !!it.has_started_at,
        it.completed_at ?? null,
        !!it.has_completed_at,
        it.notes ?? null,
        !!it.has_notes,
        it.teacher_user_id ?? null
      );
    }

    const query = `
      WITH input(plan_id, actual_hours, has_actual_hours, started_at, has_started_at, completed_at, has_completed_at, notes, has_notes, teacher_user_id) AS (
        VALUES ${rowsSql.join(', ')}
      ),
      updated AS (
        UPDATE syllabus_progress sp
        SET
          actual_hours = CASE WHEN i.has_actual_hours THEN COALESCE(i.actual_hours, 0) ELSE sp.actual_hours END,
          started_at = CASE WHEN i.has_started_at THEN i.started_at ELSE sp.started_at END,
          completed_at = CASE WHEN i.has_completed_at THEN i.completed_at ELSE sp.completed_at END,
          notes = CASE WHEN i.has_notes THEN i.notes ELSE sp.notes END,
          updated_at = NOW()
        FROM input i
        WHERE sp.plan_id = i.plan_id
        RETURNING sp.plan_id
      )
      INSERT INTO syllabus_progress (plan_id, teacher_user_id, status, completion_percentage, actual_hours, started_at, completed_at, notes, updated_at)
      SELECT
        i.plan_id,
        i.teacher_user_id,
        'pending'::syllabus_status,
        0,
        CASE WHEN i.has_actual_hours THEN COALESCE(i.actual_hours, 0) ELSE 0 END,
        CASE WHEN i.has_started_at THEN i.started_at ELSE NULL END,
        CASE WHEN i.has_completed_at THEN i.completed_at ELSE NULL END,
        CASE WHEN i.has_notes THEN i.notes ELSE NULL END,
        NOW()
      FROM input i
      LEFT JOIN syllabus_progress sp ON sp.plan_id = i.plan_id
      WHERE sp.plan_id IS NULL
      RETURNING plan_id
    `;

    const result = await client.query(query, values);
    return { touched: result.rowCount };
  },

  async ensureProgressRowsExistForPlanIds(planIds, client = pool) {
    if (!Array.isArray(planIds) || planIds.length === 0) return { inserted: 0 };
    const query = `
      INSERT INTO syllabus_progress (plan_id, teacher_user_id, status, completion_percentage, actual_hours, updated_at)
      SELECT p.plan_id, NULL, 'pending'::syllabus_status, 0, 0, NOW()
      FROM section_syllabus_plan p
      LEFT JOIN syllabus_progress sp ON sp.plan_id = p.plan_id
      WHERE p.plan_id = ANY($1::int[])
        AND sp.plan_id IS NULL
      RETURNING plan_id
    `;
    const result = await client.query(query, [planIds]);
    return { inserted: result.rowCount };
  },

  async recomputeProgressForPlanIds(planIds, client = pool) {
    if (!Array.isArray(planIds) || planIds.length === 0) return { updated: 0 };

    const updateSubtopics = `
      WITH target AS (
        SELECT p.plan_id, p.planned_hours
        FROM section_syllabus_plan p
        WHERE p.plan_id = ANY($1::int[])
          AND p.subtopic_id IS NOT NULL
      ),
      calc AS (
        SELECT
          t.plan_id,
          COALESCE(t.planned_hours, 0) AS planned_total,
          COALESCE(sp.actual_hours, 0) AS actual_total
        FROM target t
        JOIN syllabus_progress sp ON sp.plan_id = t.plan_id
      )
      UPDATE syllabus_progress sp
      SET
        completion_percentage = CASE
          WHEN c.planned_total > 0 THEN LEAST(100, ROUND((c.actual_total / c.planned_total) * 100::numeric, 2))
          ELSE 0
        END,
        status = CASE
          WHEN c.planned_total > 0 AND (c.actual_total / c.planned_total) >= 1 THEN 'completed'::syllabus_status
          ELSE 'pending'::syllabus_status
        END,
        updated_at = NOW()
      FROM calc c
      WHERE sp.plan_id = c.plan_id
      RETURNING sp.plan_id
    `;

    const updateTopics = `
      WITH target AS (
        SELECT p.plan_id, p.section_subject_id, p.topic_id, p.planned_hours
        FROM section_syllabus_plan p
        WHERE p.plan_id = ANY($1::int[])
          AND p.topic_id IS NOT NULL
          AND p.subtopic_id IS NULL
      ),
      agg AS (
        SELECT
          t.plan_id,
          EXISTS(
            SELECT 1
            FROM section_syllabus_plan c
            WHERE c.section_subject_id = t.section_subject_id
              AND c.subtopic_id IS NOT NULL
              AND c.topic_id = t.topic_id
          ) AS has_subs,
          COALESCE((
            SELECT SUM(c.planned_hours)
            FROM section_syllabus_plan c
            WHERE c.section_subject_id = t.section_subject_id
              AND c.subtopic_id IS NOT NULL
              AND c.topic_id = t.topic_id
          ), 0) AS planned_subs,
          COALESCE((
            SELECT SUM(COALESCE(sp2.actual_hours, 0))
            FROM section_syllabus_plan c
            LEFT JOIN syllabus_progress sp2 ON sp2.plan_id = c.plan_id
            WHERE c.section_subject_id = t.section_subject_id
              AND c.subtopic_id IS NOT NULL
              AND c.topic_id = t.topic_id
          ), 0) AS actual_subs,
          COALESCE(t.planned_hours, 0) AS planned_self
        FROM target t
      ),
      calc AS (
        SELECT
          a.plan_id,
          CASE WHEN a.has_subs THEN a.planned_subs ELSE a.planned_self END AS planned_total,
          CASE WHEN a.has_subs THEN a.actual_subs ELSE COALESCE(sp.actual_hours, 0) END AS actual_total,
          a.has_subs
        FROM agg a
        JOIN syllabus_progress sp ON sp.plan_id = a.plan_id
      )
      UPDATE syllabus_progress sp
      SET
        actual_hours = CASE WHEN c.has_subs THEN c.actual_total ELSE sp.actual_hours END,
        completion_percentage = CASE
          WHEN c.planned_total > 0 THEN LEAST(100, ROUND((c.actual_total / c.planned_total) * 100::numeric, 2))
          ELSE 0
        END,
        status = CASE
          WHEN c.planned_total > 0 AND (c.actual_total / c.planned_total) >= 1 THEN 'completed'::syllabus_status
          ELSE 'pending'::syllabus_status
        END,
        updated_at = NOW()
      FROM calc c
      WHERE sp.plan_id = c.plan_id
      RETURNING sp.plan_id
    `;

    const updateChapters = `
      WITH target AS (
        SELECT p.plan_id, p.section_subject_id, p.chapter_id, p.planned_hours
        FROM section_syllabus_plan p
        WHERE p.plan_id = ANY($1::int[])
          AND p.chapter_id IS NOT NULL
          AND p.topic_id IS NULL
          AND p.subtopic_id IS NULL
      ),
      agg AS (
        SELECT
          t.plan_id,
          EXISTS(
            SELECT 1
            FROM syllabus_topics st
            JOIN section_syllabus_plan tp
              ON tp.section_subject_id = t.section_subject_id
             AND tp.topic_id = st.topic_id
             AND tp.subtopic_id IS NULL
            WHERE st.chapter_id = t.chapter_id
          ) AS has_topics,
          COALESCE((
            SELECT SUM(tp.planned_hours)
            FROM syllabus_topics st
            JOIN section_syllabus_plan tp
              ON tp.section_subject_id = t.section_subject_id
             AND tp.topic_id = st.topic_id
             AND tp.subtopic_id IS NULL
            WHERE st.chapter_id = t.chapter_id
          ), 0) AS planned_topics,
          COALESCE((
            SELECT SUM(COALESCE(sp2.actual_hours, 0))
            FROM syllabus_topics st
            JOIN section_syllabus_plan tp
              ON tp.section_subject_id = t.section_subject_id
             AND tp.topic_id = st.topic_id
             AND tp.subtopic_id IS NULL
            LEFT JOIN syllabus_progress sp2 ON sp2.plan_id = tp.plan_id
            WHERE st.chapter_id = t.chapter_id
          ), 0) AS actual_topics,
          COALESCE(t.planned_hours, 0) AS planned_self
        FROM target t
      ),
      calc AS (
        SELECT
          a.plan_id,
          CASE WHEN a.has_topics THEN a.planned_topics ELSE a.planned_self END AS planned_total,
          CASE WHEN a.has_topics THEN a.actual_topics ELSE COALESCE(sp.actual_hours, 0) END AS actual_total,
          a.has_topics
        FROM agg a
        JOIN syllabus_progress sp ON sp.plan_id = a.plan_id
      )
      UPDATE syllabus_progress sp
      SET
        actual_hours = CASE WHEN c.has_topics THEN c.actual_total ELSE sp.actual_hours END,
        completion_percentage = CASE
          WHEN c.planned_total > 0 THEN LEAST(100, ROUND((c.actual_total / c.planned_total) * 100::numeric, 2))
          ELSE 0
        END,
        status = CASE
          WHEN c.planned_total > 0 AND (c.actual_total / c.planned_total) >= 1 THEN 'completed'::syllabus_status
          ELSE 'pending'::syllabus_status
        END,
        updated_at = NOW()
      FROM calc c
      WHERE sp.plan_id = c.plan_id
      RETURNING sp.plan_id
    `;

    const r1 = await client.query(updateSubtopics, [planIds]);
    const r2 = await client.query(updateTopics, [planIds]);
    const r3 = await client.query(updateChapters, [planIds]);
    return { updated: (r1.rowCount || 0) + (r2.rowCount || 0) + (r3.rowCount || 0) };
  },

  async createProgress(data, client = pool) {
    const query = `
      INSERT INTO syllabus_progress
        (plan_id, teacher_user_id, status, completion_percentage, actual_hours, started_at, completed_at, notes, updated_at)
      VALUES
        ($1, $2, $3::syllabus_status, $4, $5, $6, $7, $8, NOW())
      RETURNING *
    `;
    const values = [
      data.plan_id,
      data.teacher_user_id ?? null,
      data.status ?? 'pending',
      data.completion_percentage ?? 0,
      data.actual_hours ?? 0,
      data.started_at ?? null,
      data.completed_at ?? null,
      data.notes ?? null
    ];
    const result = await client.query(query, values);
    return result.rows[0];
  },

  async getProgressById(progressId, client = pool) {
    const result = await client.query(`SELECT * FROM syllabus_progress WHERE progress_id = $1`, [progressId]);
    return result.rows[0];
  },

  async updateProgress(progressId, data, client = pool) {
    const { setClause, values, idParamIndex } = buildUpdate(
      data,
      [
        'actual_hours',
        'started_at',
        'completed_at',
        'notes',
        'status',
        'completion_percentage',
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
    const result = await client.query(query, values);
    return result.rows[0];
  },

  async deleteProgress(progressId, client = pool) {
    const result = await client.query(`DELETE FROM syllabus_progress WHERE progress_id = $1 RETURNING *`, [progressId]);
    return result.rows[0];
  }
};

module.exports = SyllabusTrackingModel;
