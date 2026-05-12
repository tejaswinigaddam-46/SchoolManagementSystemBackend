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
  return {
    setClause: set.join(', '),
    values,
    idParamIndex: idx,
    idField
  };
};

const SyllabusContentModel = {
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

  async isSubjectInCurriculum(subject_id, curriculum_id) {
    const query = `SELECT 1 FROM subjects WHERE subject_id = $1 AND curriculum_id = $2`;
    const result = await pool.query(query, [subject_id, curriculum_id]);
    return result.rows.length > 0;
  },

  async listBooks(filters = {}) {
    const allowed = [
      'curriculum_id',
      'subject_id',
      'academic_year_id',
      'version_no',
      'is_active'
    ];
    const where = [];
    const values = [];
    let idx = 1;

    for (const key of allowed) {
      if (filters[key] === undefined) continue;
      const val = filters[key];
      if (val === null) {
        where.push(`curriculum_books.${key} IS NULL`);
        continue;
      }
      where.push(`curriculum_books.${key} = $${idx}`);
      values.push(val);
      idx += 1;
    }

    if (filters.subject_name !== undefined) {
      where.push(`subjects.subject_name = $${idx}`);
      values.push(filters.subject_name);
      idx += 1;
    }

    const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const query = `
      SELECT curriculum_books.*, subjects.subject_name
      FROM curriculum_books
      LEFT JOIN subjects ON curriculum_books.subject_id = subjects.subject_id
      ${clause}
      ORDER BY curriculum_books.created_at DESC, curriculum_books.curriculum_book_id DESC
    `;
    const result = await pool.query(query, values);
    return result.rows;
  },

  async createBook(data) {
    const query = `
      INSERT INTO curriculum_books
        (curriculum_id, subject_id, academic_year_id, book_name, version_no, is_active)
      VALUES
        ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [
      data.curriculum_id,
      data.subject_id,
      data.academic_year_id ?? null,
      data.book_name,
      data.version_no ?? 1,
      data.is_active ?? true
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  async getBookById(curriculumBookId) {
    const query = `
      SELECT curriculum_books.*, subjects.subject_name
      FROM curriculum_books
      LEFT JOIN subjects ON curriculum_books.subject_id = subjects.subject_id
      WHERE curriculum_books.curriculum_book_id = $1
    `;
    const result = await pool.query(query, [curriculumBookId]);
    return result.rows[0];
  },

  async updateBook(curriculumBookId, data) {
    const { setClause, values, idParamIndex } = buildUpdate(
      data,
      ['curriculum_id', 'subject_id', 'academic_year_id', 'book_name', 'version_no', 'is_active'],
      'curriculum_book_id',
      curriculumBookId
    );

    const query = `
      UPDATE curriculum_books
      SET ${setClause}
      WHERE curriculum_book_id = $${idParamIndex}
      RETURNING *
    `;
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  async deleteBook(curriculumBookId) {
    const query = `DELETE FROM curriculum_books WHERE curriculum_book_id = $1 RETURNING *`;
    const result = await pool.query(query, [curriculumBookId]);
    return result.rows[0];
  },

  async listChapters(filters = {}) {
    const { clause, values } = buildWhere(filters, ['curriculum_book_id']);
    const query = `
      SELECT *
      FROM syllabus_chapters
      ${clause}
      ORDER BY sequence_order ASC, chapter_id ASC
    `;
    const result = await pool.query(query, values);
    return result.rows;
  },

  async createChapter(data) {
    const query = `
      INSERT INTO syllabus_chapters
        (curriculum_book_id, chapter_title, chapter_description, sequence_order, default_hours)
      VALUES
        ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [
      data.curriculum_book_id,
      data.chapter_title,
      data.chapter_description ?? null,
      data.sequence_order ?? 0,
      data.default_hours ?? null
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  async getChapterById(chapterId) {
    const query = `SELECT * FROM syllabus_chapters WHERE chapter_id = $1`;
    const result = await pool.query(query, [chapterId]);
    return result.rows[0];
  },

  async updateChapter(chapterId, data) {
    const { setClause, values, idParamIndex } = buildUpdate(
      data,
      ['curriculum_book_id', 'chapter_title', 'chapter_description', 'sequence_order', 'default_hours'],
      'chapter_id',
      chapterId
    );
    const query = `
      UPDATE syllabus_chapters
      SET ${setClause}
      WHERE chapter_id = $${idParamIndex}
      RETURNING *
    `;
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  async deleteChapter(chapterId) {
    const query = `DELETE FROM syllabus_chapters WHERE chapter_id = $1 RETURNING *`;
    const result = await pool.query(query, [chapterId]);
    return result.rows[0];
  },

  async listTopicsByChapterId(chapterId) {
    return await this.listTopics({ chapter_id: chapterId });
  },

  async listTopics(filters = {}) {
    const { clause, values } = buildWhere(filters, ['chapter_id']);
    const query = `
      SELECT *
      FROM syllabus_topics
      ${clause}
      ORDER BY sequence_order ASC, topic_id ASC
    `;
    const result = await pool.query(query, values);
    return result.rows;
  },

  async createTopic(data) {
    const query = `
      INSERT INTO syllabus_topics
        (chapter_id, topic_title, topic_description, sequence_order, default_hours)
      VALUES
        ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [
      data.chapter_id,
      data.topic_title,
      data.topic_description ?? null,
      data.sequence_order ?? 0,
      data.default_hours ?? null
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  async getTopicById(topicId) {
    const query = `SELECT * FROM syllabus_topics WHERE topic_id = $1`;
    const result = await pool.query(query, [topicId]);
    return result.rows[0];
  },

  async updateTopic(topicId, data) {
    const { setClause, values, idParamIndex } = buildUpdate(
      data,
      ['chapter_id', 'topic_title', 'topic_description', 'sequence_order', 'default_hours'],
      'topic_id',
      topicId
    );
    const query = `
      UPDATE syllabus_topics
      SET ${setClause}
      WHERE topic_id = $${idParamIndex}
      RETURNING *
    `;
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  async deleteTopic(topicId) {
    const query = `DELETE FROM syllabus_topics WHERE topic_id = $1 RETURNING *`;
    const result = await pool.query(query, [topicId]);
    return result.rows[0];
  },

  async listSubtopicsByTopicId(topicId) {
    return await this.listSubtopics({ topic_id: topicId });
  },

  async listSubtopics(filters = {}) {
    const { clause, values } = buildWhere(filters, ['topic_id']);
    const query = `
      SELECT *
      FROM syllabus_subtopics
      ${clause}
      ORDER BY sequence_order ASC, subtopic_id ASC
    `;
    const result = await pool.query(query, values);
    return result.rows;
  },

  async createSubtopic(data) {
    const query = `
      INSERT INTO syllabus_subtopics
        (topic_id, subtopic_title, subtopic_description, sequence_order, default_hours)
      VALUES
        ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [
      data.topic_id,
      data.subtopic_title,
      data.subtopic_description ?? null,
      data.sequence_order ?? 0,
      data.default_hours ?? null
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  async getSubtopicById(subtopicId) {
    const query = `SELECT * FROM syllabus_subtopics WHERE subtopic_id = $1`;
    const result = await pool.query(query, [subtopicId]);
    return result.rows[0];
  },

  async updateSubtopic(subtopicId, data) {
    const { setClause, values, idParamIndex } = buildUpdate(
      data,
      ['topic_id', 'subtopic_title', 'subtopic_description', 'sequence_order', 'default_hours'],
      'subtopic_id',
      subtopicId
    );
    const query = `
      UPDATE syllabus_subtopics
      SET ${setClause}
      WHERE subtopic_id = $${idParamIndex}
      RETURNING *
    `;
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  async deleteSubtopic(subtopicId) {
    const query = `DELETE FROM syllabus_subtopics WHERE subtopic_id = $1 RETURNING *`;
    const result = await pool.query(query, [subtopicId]);
    return result.rows[0];
  }
};

module.exports = SyllabusContentModel;
