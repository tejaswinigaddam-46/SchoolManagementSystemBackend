const SyllabusContentModel = require('../models/syllabusContent.model');

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

const SyllabusContentService = {
  async listBooks(filters) {
    const normalized = { ...(filters || {}) };

    if (normalized.academic_year_id && normalized.subject_name) {
      const curriculumResult = await SyllabusContentModel.getCurriculumIdByAcademicYearId(normalized.academic_year_id);
      if (!curriculumResult) {
        const err = new Error('Invalid academic_year_id: no curriculum found');
        err.code = 'NOT_FOUND';
        throw err;
      }

      const subjectResult = await SyllabusContentModel.getSubjectIdByNameAndCurriculum(
        normalized.subject_name,
        curriculumResult.curriculum_id
      );
      if (!subjectResult) {
        const err = new Error('Subject name not found for this curriculum');
        err.code = 'NOT_FOUND';
        throw err;
      }

      normalized.curriculum_id = curriculumResult.curriculum_id;
      normalized.subject_id = subjectResult.subject_id;
      delete normalized.subject_name;
    }

    return await SyllabusContentModel.listBooks(normalized);
  },
  async createBook(data) {
    try {
      const curriculumResult = await SyllabusContentModel.getCurriculumIdByAcademicYearId(data.academic_year_id);
      if (!curriculumResult) {
        const err = new Error('Invalid academic_year_id: no curriculum found');
        err.code = 'NOT_FOUND';
        throw err;
      }
      data.curriculum_id = curriculumResult.curriculum_id;

      const subjectResult = await SyllabusContentModel.getSubjectIdByNameAndCurriculum(data.subject_name, data.curriculum_id);
      if (!subjectResult) {
        const err = new Error('Subject name not found for this curriculum');
        err.code = 'NOT_FOUND';
        throw err;
      }
      data.subject_id = subjectResult.subject_id;

      const created = await SyllabusContentModel.createBook(data);
      return await SyllabusContentModel.getBookById(created.curriculum_book_id);
    } catch (e) {
      throw mapPgError(e);
    }
  },
  async getBookById(curriculumBookId) {
    const row = await SyllabusContentModel.getBookById(curriculumBookId);
    return ensureFound(row, 'Book not found');
  },
  async getBookByKey(key) {
    const rows = await this.listBooks({
      academic_year_id: key.academic_year_id,
      subject_name: key.subject_name,
      version_no: key.version_no
    });
    const row = rows[0];
    return ensureFound(row, 'Book not found');
  },
  async updateBook(curriculumBookId, data) {
    try {
      if (data.academic_year_id || data.subject_name) {
        const currentBook = await SyllabusContentModel.getBookById(curriculumBookId);
        if (!currentBook) {
          const err = new Error('Book not found');
          err.code = 'NOT_FOUND';
          throw err;
        }

        let curriculum_id = data.curriculum_id;
        
        if (data.academic_year_id) {
          const currRes = await SyllabusContentModel.getCurriculumIdByAcademicYearId(data.academic_year_id);
          if (!currRes) {
            const err = new Error('Invalid academic_year_id: no curriculum found');
            err.code = 'NOT_FOUND';
            throw err;
          }
          data.curriculum_id = currRes.curriculum_id;
          curriculum_id = currRes.curriculum_id;
        }

        if (data.subject_name) {
          if (!curriculum_id) {
            curriculum_id = currentBook.curriculum_id;
          }

          const subjRes = await SyllabusContentModel.getSubjectIdByNameAndCurriculum(data.subject_name, curriculum_id);
          if (!subjRes) {
            const err = new Error('Subject name not found for this curriculum');
            err.code = 'NOT_FOUND';
            throw err;
          }
          data.subject_id = subjRes.subject_id;
        } else if (data.academic_year_id) {
          const valid = await SyllabusContentModel.isSubjectInCurriculum(currentBook.subject_id, curriculum_id);
          if (!valid) {
            const err = new Error('Current subject is not valid for the curriculum of the provided academic_year_id');
            err.code = 'NOT_FOUND';
            throw err;
          }
          data.subject_id = currentBook.subject_id;
        }
      }

      const row = await SyllabusContentModel.updateBook(curriculumBookId, data);
      ensureFound(row, 'Book not found');
      return await SyllabusContentModel.getBookById(curriculumBookId);
    } catch (e) {
      throw mapPgError(e);
    }
  },
  async deleteBook(curriculumBookId) {
    const row = await SyllabusContentModel.deleteBook(curriculumBookId);
    return ensureFound(row, 'Book not found');
  },

  async listChapters(filters) {
    return await SyllabusContentModel.listChapters(filters);
  },
  async createChapter(data) {
    try {
      return await SyllabusContentModel.createChapter(data);
    } catch (e) {
      throw mapPgError(e);
    }
  },
  async getChapterById(chapterId) {
    const row = await SyllabusContentModel.getChapterById(chapterId);
    return ensureFound(row, 'Chapter not found');
  },
  async updateChapter(chapterId, data) {
    try {
      const row = await SyllabusContentModel.updateChapter(chapterId, data);
      return ensureFound(row, 'Chapter not found');
    } catch (e) {
      throw mapPgError(e);
    }
  },
  async deleteChapter(chapterId) {
    const row = await SyllabusContentModel.deleteChapter(chapterId);
    return ensureFound(row, 'Chapter not found');
  },

  async listTopicsByChapterId(chapterId) {
    return await SyllabusContentModel.listTopicsByChapterId(chapterId);
  },
  async createTopic(data) {
    try {
      return await SyllabusContentModel.createTopic(data);
    } catch (e) {
      throw mapPgError(e);
    }
  },
  async getTopicById(topicId) {
    const row = await SyllabusContentModel.getTopicById(topicId);
    return ensureFound(row, 'Topic not found');
  },
  async updateTopic(topicId, data) {
    try {
      const row = await SyllabusContentModel.updateTopic(topicId, data);
      return ensureFound(row, 'Topic not found');
    } catch (e) {
      throw mapPgError(e);
    }
  },
  async deleteTopic(topicId) {
    const row = await SyllabusContentModel.deleteTopic(topicId);
    return ensureFound(row, 'Topic not found');
  },

  async listSubtopicsByTopicId(topicId) {
    return await SyllabusContentModel.listSubtopicsByTopicId(topicId);
  },
  async createSubtopic(data) {
    try {
      return await SyllabusContentModel.createSubtopic(data);
    } catch (e) {
      throw mapPgError(e);
    }
  },
  async getSubtopicById(subtopicId) {
    const row = await SyllabusContentModel.getSubtopicById(subtopicId);
    return ensureFound(row, 'Subtopic not found');
  },
  async updateSubtopic(subtopicId, data) {
    try {
      const row = await SyllabusContentModel.updateSubtopic(subtopicId, data);
      return ensureFound(row, 'Subtopic not found');
    } catch (e) {
      throw mapPgError(e);
    }
  },
  async deleteSubtopic(subtopicId) {
    const row = await SyllabusContentModel.deleteSubtopic(subtopicId);
    return ensureFound(row, 'Subtopic not found');
  }
};

module.exports = SyllabusContentService;
