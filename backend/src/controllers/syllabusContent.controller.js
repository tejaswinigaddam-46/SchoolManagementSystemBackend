const SyllabusContentService = require('../services/syllabusContent.service');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

const statusFromError = (error) => {
  if (!error) return 500;
  if (error.code === 'NOT_FOUND') return 404;
  if (error.code === 'DUPLICATE') return 409;
  if (error.code === 'FK') return 400;
  if (error.code === 'NO_FIELDS') return 400;
  return 500;
};

const syllabusContentController = {
  getBooks: async (req, res) => {
    try {
      const filters = {
        academic_year_id: req.query.academic_year_id === undefined
          ? undefined
          : (req.query.academic_year_id === null || req.query.academic_year_id === 'null' ? undefined : parseInt(req.query.academic_year_id)),
        subject_name: req.query.subject_name === undefined ? undefined : String(req.query.subject_name),
        version_no: req.query.version_no ? parseInt(req.query.version_no) : undefined,
        is_active: req.query.is_active === undefined ? undefined : (req.query.is_active === 'true' || req.query.is_active === true)
      };
      const booksRaw = await SyllabusContentService.listBooks(filters);
      const books = booksRaw.map(b => ({
        curriculum_book_id: b.curriculum_book_id,
        book_name: b.book_name,
        academic_year_id: b.academic_year_id,
        subject_name: b.subject_name,
        version_no: b.version_no,
        is_active: b.is_active,
        created_at: b.created_at
      }));
      return successResponse(res, 'Books fetched successfully', { books });
    } catch (error) {
      logger.error('Error in getBooks controller:', error);
      return errorResponse(res, error.message || 'Failed to fetch books', statusFromError(error));
    }
  },

  createBook: async (req, res) => {
    try {
      const bookRaw = await SyllabusContentService.createBook(req.body);
      const book = {
        curriculum_book_id: bookRaw.curriculum_book_id,
        book_name: bookRaw.book_name,
        academic_year_id: bookRaw.academic_year_id,
        subject_name: bookRaw.subject_name,
        version_no: bookRaw.version_no,
        is_active: bookRaw.is_active,
        created_at: bookRaw.created_at
      };
      return successResponse(res, 'Book created successfully', { book }, 201);
    } catch (error) {
      logger.error('Error in createBook controller:', error);
      return errorResponse(res, error.message || 'Failed to create book', statusFromError(error));
    }
  },

  getBookById: async (req, res) => {
    try {
      const bookRaw = await SyllabusContentService.getBookById(parseInt(req.params.curriculumBookId));
      const book = {
        curriculum_book_id: bookRaw.curriculum_book_id,
        book_name: bookRaw.book_name,
        academic_year_id: bookRaw.academic_year_id,
        subject_name: bookRaw.subject_name,
        version_no: bookRaw.version_no,
        is_active: bookRaw.is_active,
        created_at: bookRaw.created_at
      };
      return successResponse(res, 'Book fetched successfully', { book });
    } catch (error) {
      logger.error('Error in getBookById controller:', error);
      return errorResponse(res, error.message || 'Failed to fetch book', statusFromError(error));
    }
  },

  getBookByKey: async (req, res) => {
    try {
      const bookRaw = await SyllabusContentService.getBookByKey({
        academic_year_id: parseInt(req.params.academicYearId),
        subject_name: String(req.params.subjectName),
        version_no: parseInt(req.params.versionNo)
      });
      const book = {
        curriculum_book_id: bookRaw.curriculum_book_id,
        book_name: bookRaw.book_name,
        academic_year_id: bookRaw.academic_year_id,
        subject_name: bookRaw.subject_name,
        version_no: bookRaw.version_no,
        is_active: bookRaw.is_active,
        created_at: bookRaw.created_at
      };
      return successResponse(res, 'Book fetched successfully', { book });
    } catch (error) {
      logger.error('Error in getBookByKey controller:', error);
      return errorResponse(res, error.message || 'Failed to fetch book', statusFromError(error));
    }
  },

  updateBook: async (req, res) => {
    try {
      const bookRaw = await SyllabusContentService.updateBook(parseInt(req.params.curriculumBookId), req.body);
      const book = {
        curriculum_book_id: bookRaw.curriculum_book_id,
        book_name: bookRaw.book_name,
        academic_year_id: bookRaw.academic_year_id,
        subject_name: bookRaw.subject_name,
        version_no: bookRaw.version_no,
        is_active: bookRaw.is_active,
        created_at: bookRaw.created_at
      };
      return successResponse(res, 'Book updated successfully', { book });
    } catch (error) {
      logger.error('Error in updateBook controller:', error);
      return errorResponse(res, error.message || 'Failed to update book', statusFromError(error));
    }
  },

  updateBookByKey: async (req, res) => {
    try {
      const bookRaw = await SyllabusContentService.updateBookByKey(
        {
          academic_year_id: parseInt(req.params.academicYearId),
          subject_name: String(req.params.subjectName),
          version_no: parseInt(req.params.versionNo)
        },
        req.body
      );
      const book = {
        curriculum_book_id: bookRaw.curriculum_book_id,
        book_name: bookRaw.book_name,
        academic_year_id: bookRaw.academic_year_id,
        subject_name: bookRaw.subject_name,
        version_no: bookRaw.version_no,
        is_active: bookRaw.is_active,
        created_at: bookRaw.created_at
      };
      return successResponse(res, 'Book updated successfully', { book });
    } catch (error) {
      logger.error('Error in updateBookByKey controller:', error);
      return errorResponse(res, error.message || 'Failed to update book', statusFromError(error));
    }
  },

  deleteBook: async (req, res) => {
    try {
      await SyllabusContentService.deleteBook(parseInt(req.params.curriculumBookId));
      return successResponse(res, 'Book deleted successfully');
    } catch (error) {
      logger.error('Error in deleteBook controller:', error);
      return errorResponse(res, error.message || 'Failed to delete book', statusFromError(error));
    }
  },

  deleteBookByKey: async (req, res) => {
    try {
      await SyllabusContentService.deleteBookByKey({
        academic_year_id: parseInt(req.params.academicYearId),
        subject_name: String(req.params.subjectName),
        version_no: parseInt(req.params.versionNo)
      });
      return successResponse(res, 'Book deleted successfully');
    } catch (error) {
      logger.error('Error in deleteBookByKey controller:', error);
      return errorResponse(res, error.message || 'Failed to delete book', statusFromError(error));
    }
  },

  getChapters: async (req, res) => {
    try {
      const filters = {
        curriculum_book_id: req.query.curriculum_book_id ? parseInt(req.query.curriculum_book_id) : undefined
      };
      const chapters = await SyllabusContentService.listChapters(filters);
      return successResponse(res, 'Chapters fetched successfully', { chapters });
    } catch (error) {
      logger.error('Error in getChapters controller:', error);
      return errorResponse(res, error.message || 'Failed to fetch chapters', statusFromError(error));
    }
  },

  createChapter: async (req, res) => {
    try {
      const chapter = await SyllabusContentService.createChapter(req.body);
      return successResponse(res, 'Chapter created successfully', { chapter }, 201);
    } catch (error) {
      logger.error('Error in createChapter controller:', error);
      return errorResponse(res, error.message || 'Failed to create chapter', statusFromError(error));
    }
  },

  getChapterById: async (req, res) => {
    try {
      const chapter = await SyllabusContentService.getChapterById(parseInt(req.params.chapterId));
      return successResponse(res, 'Chapter fetched successfully', { chapter });
    } catch (error) {
      logger.error('Error in getChapterById controller:', error);
      return errorResponse(res, error.message || 'Failed to fetch chapter', statusFromError(error));
    }
  },

  updateChapter: async (req, res) => {
    try {
      const chapter = await SyllabusContentService.updateChapter(parseInt(req.params.chapterId), req.body);
      return successResponse(res, 'Chapter updated successfully', { chapter });
    } catch (error) {
      logger.error('Error in updateChapter controller:', error);
      return errorResponse(res, error.message || 'Failed to update chapter', statusFromError(error));
    }
  },

  deleteChapter: async (req, res) => {
    try {
      await SyllabusContentService.deleteChapter(parseInt(req.params.chapterId));
      return successResponse(res, 'Chapter deleted successfully');
    } catch (error) {
      logger.error('Error in deleteChapter controller:', error);
      return errorResponse(res, error.message || 'Failed to delete chapter', statusFromError(error));
    }
  },

  getTopics: async (req, res) => {
    try {
      const topics = await SyllabusContentService.listTopicsByChapterId(parseInt(req.params.chapterId));
      return successResponse(res, 'Topics fetched successfully', { topics });
    } catch (error) {
      logger.error('Error in getTopics controller:', error);
      return errorResponse(res, error.message || 'Failed to fetch topics', statusFromError(error));
    }
  },

  createTopic: async (req, res) => {
    try {
      const topic = await SyllabusContentService.createTopic(req.body);
      return successResponse(res, 'Topic created successfully', { topic }, 201);
    } catch (error) {
      logger.error('Error in createTopic controller:', error);
      return errorResponse(res, error.message || 'Failed to create topic', statusFromError(error));
    }
  },

  getTopicById: async (req, res) => {
    try {
      const topic = await SyllabusContentService.getTopicById(parseInt(req.params.topicId));
      return successResponse(res, 'Topic fetched successfully', { topic });
    } catch (error) {
      logger.error('Error in getTopicById controller:', error);
      return errorResponse(res, error.message || 'Failed to fetch topic', statusFromError(error));
    }
  },

  updateTopic: async (req, res) => {
    try {
      const topic = await SyllabusContentService.updateTopic(parseInt(req.params.topicId), req.body);
      return successResponse(res, 'Topic updated successfully', { topic });
    } catch (error) {
      logger.error('Error in updateTopic controller:', error);
      return errorResponse(res, error.message || 'Failed to update topic', statusFromError(error));
    }
  },

  deleteTopic: async (req, res) => {
    try {
      await SyllabusContentService.deleteTopic(parseInt(req.params.topicId));
      return successResponse(res, 'Topic deleted successfully');
    } catch (error) {
      logger.error('Error in deleteTopic controller:', error);
      return errorResponse(res, error.message || 'Failed to delete topic', statusFromError(error));
    }
  },

  getSubtopics: async (req, res) => {
    try {
      const subtopics = await SyllabusContentService.listSubtopicsByTopicId(parseInt(req.params.topicId));
      return successResponse(res, 'Subtopics fetched successfully', { subtopics });
    } catch (error) {
      logger.error('Error in getSubtopics controller:', error);
      return errorResponse(res, error.message || 'Failed to fetch subtopics', statusFromError(error));
    }
  },

  createSubtopic: async (req, res) => {
    try {
      const subtopic = await SyllabusContentService.createSubtopic(req.body);
      return successResponse(res, 'Subtopic created successfully', { subtopic }, 201);
    } catch (error) {
      logger.error('Error in createSubtopic controller:', error);
      return errorResponse(res, error.message || 'Failed to create subtopic', statusFromError(error));
    }
  },

  getSubtopicById: async (req, res) => {
    try {
      const subtopic = await SyllabusContentService.getSubtopicById(parseInt(req.params.subtopicId));
      return successResponse(res, 'Subtopic fetched successfully', { subtopic });
    } catch (error) {
      logger.error('Error in getSubtopicById controller:', error);
      return errorResponse(res, error.message || 'Failed to fetch subtopic', statusFromError(error));
    }
  },

  updateSubtopic: async (req, res) => {
    try {
      const subtopic = await SyllabusContentService.updateSubtopic(parseInt(req.params.subtopicId), req.body);
      return successResponse(res, 'Subtopic updated successfully', { subtopic });
    } catch (error) {
      logger.error('Error in updateSubtopic controller:', error);
      return errorResponse(res, error.message || 'Failed to update subtopic', statusFromError(error));
    }
  },

  deleteSubtopic: async (req, res) => {
    try {
      await SyllabusContentService.deleteSubtopic(parseInt(req.params.subtopicId));
      return successResponse(res, 'Subtopic deleted successfully');
    } catch (error) {
      logger.error('Error in deleteSubtopic controller:', error);
      return errorResponse(res, error.message || 'Failed to delete subtopic', statusFromError(error));
    }
  }
};

module.exports = syllabusContentController;
