const { pool } = require('../config/database');
const logger = require('../utils/logger');

const SectionSubjectModel = {
  /**
   * Bulk upsert section-subject mappings
   * @param {Array<{section_id:number, subject_id:number, teacher_user_id?:number}>} assignments
   * @returns {Promise<{inserted:number, updated:number}>}
   */
  async bulkUpsert(assignments) {
    if (!Array.isArray(assignments) || assignments.length === 0) {
      throw new Error('Assignments array is required');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      let inserted = 0;
      let updated = 0;

      const query = `
        INSERT INTO section_subjects (section_id, subject_id, teacher_user_id)
        VALUES ($1, $2, $3)
        ON CONFLICT (section_id, subject_id)
        DO UPDATE SET teacher_user_id = EXCLUDED.teacher_user_id;
      `;

      for (const a of assignments) {
        const sectionId = parseInt(a.section_id);
        const subjectId = parseInt(a.subject_id);
        const teacherUserId = (a.teacher_user_id === undefined || a.teacher_user_id === null)
          ? null
          : (isNaN(parseInt(a.teacher_user_id)) ? null : parseInt(a.teacher_user_id));

        if (!sectionId || !subjectId) {
          throw new Error('Valid section_id and subject_id are required');
        }
        logger.info('Upserting:', { sectionId, subjectId, teacherUserId });
        const res = await client.query(query, [sectionId, subjectId, teacherUserId]);
        inserted += res.rowCount; // DO NOTHING returns 0 rowCount when conflict
      }

      await client.query('COMMIT');
      logger.info('Section-subject assignments inserted', { inserted });
      return { inserted, updated };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error in bulkUpsert section_subjects:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  ,
  /**
   * Get existing assignments by section IDs
   */
  async getBySectionIds(sectionIds) {
    if (!Array.isArray(sectionIds) || sectionIds.length === 0) {
      return [];
    }
    const client = await pool.connect();
    try {
      const query = `SELECT section_id, subject_id, teacher_user_id FROM section_subjects WHERE section_id = ANY($1::int[])`;
      const res = await client.query(query, [sectionIds.map(id => parseInt(id))]);
      return res.rows;
    } catch (error) {
      logger.error('Error fetching section_subjects by section ids', error);
      throw error;
    } finally {
      client.release();
    }
  }
  ,
  /**
   * Clear teacher assignment (set teacher_user_id = NULL) for given subjects in a section
   */
  async clearTeacherBySectionAndSubjects(sectionId, subjectIds) {
    const client = await pool.connect();
    try {
      const sid = parseInt(sectionId);
      const ids = (subjectIds || []).map(id => parseInt(id)).filter(n => !isNaN(n));
      if (!sid || ids.length === 0) return { cleared: 0 };
      const query = `UPDATE section_subjects SET teacher_user_id = NULL WHERE section_id = $1 AND subject_id = ANY($2::int[])`;
      const res = await client.query(query, [sid, ids]);
      return { cleared: res.rowCount };
    } catch (error) {
      logger.error('Error clearing teacher assignments in section_subjects', error);
      throw error;
    } finally {
      client.release();
    }
  }
};

module.exports = SectionSubjectModel;
