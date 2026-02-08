const SectionSubjectModel = require('../models/sectionSubject.model');
const logger = require('../utils/logger');

const SectionSubjectService = {
  /**
   * Bulk assign subjects to sections
   * @param {Array<{section_id:number, subject_id:number, teacher_user_id?:number}>} assignments
   */
  async bulkAssign(assignments) {
    try {
      const result = await SectionSubjectModel.bulkUpsert(assignments);
      logger.info('SERVICE: bulkAssign section_subjects', result);
      return result;
    } catch (error) {
      logger.error('SERVICE: Error bulkAssign section_subjects', error);
      throw error;
    }
  }
  ,
  async listBySectionIds(sectionIds) {
    return await SectionSubjectModel.getBySectionIds(sectionIds);
  }
  ,
  async unassign(sectionId, subjectIds) {
    try {
      return await SectionSubjectModel.clearTeacherBySectionAndSubjects(sectionId, subjectIds);
    } catch (error) {
      logger.error('SERVICE: Error unassign section_subjects', error);
      throw error;
    }
  }
};

module.exports = SectionSubjectService;
