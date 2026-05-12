const Joi = require('joi');

const userContext = Joi.object({
  tenantId: Joi.string().trim().min(1).invalid('undefined').required(),
  campusId: Joi.string().trim().uuid().invalid('undefined').required()
}).unknown(true);

const ids = {
  curriculumBookId: Joi.number().integer().min(1).required(),
  academicYearId: Joi.number().integer().min(1).required(),
  chapterId: Joi.number().integer().min(1).required(),
  topicId: Joi.number().integer().min(1).required(),
  subtopicId: Joi.number().integer().min(1).required()
};

const numberOrNull = Joi.number().allow(null);
const intOrNull = Joi.number().integer().min(1).allow(null);

const createBookBody = Joi.object({
  academic_year_id: Joi.number().integer().min(1).required(),
  subject_name: Joi.string().trim().min(1).max(255).required(),
  book_name: Joi.string().trim().min(1).max(255).required(),
  version_no: Joi.number().integer().min(1).optional(),
  is_active: Joi.boolean().optional()
}).unknown(true);

const updateBookBody = Joi.object({
  academic_year_id: Joi.number().integer().min(1).optional(),
  subject_name: Joi.string().trim().min(1).max(255).optional(),
  book_name: Joi.string().trim().min(1).max(255).optional(),
  version_no: Joi.number().integer().min(1).optional(),
  is_active: Joi.boolean().optional()
}).min(1).unknown(true);

const createChapterBody = Joi.object({
  curriculum_book_id: Joi.number().integer().min(1).required(),
  chapter_title: Joi.string().trim().min(1).max(255).required(),
  chapter_description: Joi.string().allow(null, '').optional(),
  sequence_order: Joi.number().integer().min(0).optional(),
  default_hours: numberOrNull.optional()
}).unknown(true);

const updateChapterBody = Joi.object({
  curriculum_book_id: Joi.number().integer().min(1).optional(),
  chapter_title: Joi.string().trim().min(1).max(255).optional(),
  chapter_description: Joi.string().allow(null, '').optional(),
  sequence_order: Joi.number().integer().min(0).optional(),
  default_hours: numberOrNull.optional()
}).min(1).unknown(true);

const createTopicBody = Joi.object({
  chapter_id: Joi.number().integer().min(1).required(),
  topic_title: Joi.string().trim().min(1).max(255).required(),
  topic_description: Joi.string().allow(null, '').optional(),
  sequence_order: Joi.number().integer().min(0).optional(),
  default_hours: numberOrNull.optional()
}).unknown(true);

const updateTopicBody = Joi.object({
  chapter_id: Joi.number().integer().min(1).optional(),
  topic_title: Joi.string().trim().min(1).max(255).optional(),
  topic_description: Joi.string().allow(null, '').optional(),
  sequence_order: Joi.number().integer().min(0).optional(),
  default_hours: numberOrNull.optional()
}).min(1).unknown(true);

const createSubtopicBody = Joi.object({
  topic_id: Joi.number().integer().min(1).required(),
  subtopic_title: Joi.string().trim().min(1).max(255).required(),
  subtopic_description: Joi.string().allow(null, '').optional(),
  sequence_order: Joi.number().integer().min(0).optional(),
  default_hours: numberOrNull.optional()
}).unknown(true);

const updateSubtopicBody = Joi.object({
  topic_id: Joi.number().integer().min(1).optional(),
  subtopic_title: Joi.string().trim().min(1).max(255).optional(),
  subtopic_description: Joi.string().allow(null, '').optional(),
  sequence_order: Joi.number().integer().min(0).optional(),
  default_hours: numberOrNull.optional()
}).min(1).unknown(true);

module.exports = {
  getBooks: {
    user: userContext,
    query: Joi.object({
      academic_year_id: Joi.number().integer().min(1).optional(),
      subject_name: Joi.string().trim().min(1).max(255).optional(),
      version_no: Joi.number().integer().min(1).optional(),
      is_active: Joi.boolean().optional()
    })
  },
  createBook: {
    user: userContext,
    body: createBookBody
  },
  getBookById: {
    user: userContext,
    params: Joi.object({
      curriculumBookId: ids.curriculumBookId
    })
  },
  getBookByKey: {
    user: userContext,
    params: Joi.object({
      academicYearId: ids.academicYearId,
      subjectName: Joi.string().trim().min(1).max(255).required(),
      versionNo: Joi.number().integer().min(1).required()
    })
  },
  updateBook: {
    user: userContext,
    params: Joi.object({
      curriculumBookId: ids.curriculumBookId
    }),
    body: updateBookBody
  },
  deleteBook: {
    user: userContext,
    params: Joi.object({
      curriculumBookId: ids.curriculumBookId
    })
  },

  getChapters: {
    user: userContext,
    query: Joi.object({
      curriculum_book_id: Joi.number().integer().min(1).optional()
    })
  },
  createChapter: {
    user: userContext,
    body: createChapterBody
  },
  getChapterById: {
    user: userContext,
    params: Joi.object({
      chapterId: ids.chapterId
    })
  },
  updateChapter: {
    user: userContext,
    params: Joi.object({
      chapterId: ids.chapterId
    }),
    body: updateChapterBody
  },
  deleteChapter: {
    user: userContext,
    params: Joi.object({
      chapterId: ids.chapterId
    })
  },

  getTopics: {
    user: userContext,
    query: Joi.object({
      chapter_id: Joi.number().integer().min(1).optional()
    })
  },
  createTopic: {
    user: userContext,
    body: createTopicBody
  },
  getTopicById: {
    user: userContext,
    params: Joi.object({
      topicId: ids.topicId
    })
  },
  updateTopic: {
    user: userContext,
    params: Joi.object({
      topicId: ids.topicId
    }),
    body: updateTopicBody
  },
  deleteTopic: {
    user: userContext,
    params: Joi.object({
      topicId: ids.topicId
    })
  },

  getSubtopics: {
    user: userContext,
    query: Joi.object({
      topic_id: Joi.number().integer().min(1).optional()
    })
  },
  createSubtopic: {
    user: userContext,
    body: createSubtopicBody
  },
  getSubtopicById: {
    user: userContext,
    params: Joi.object({
      subtopicId: ids.subtopicId
    })
  },
  updateSubtopic: {
    user: userContext,
    params: Joi.object({
      subtopicId: ids.subtopicId
    }),
    body: updateSubtopicBody
  },
  deleteSubtopic: {
    user: userContext,
    params: Joi.object({
      subtopicId: ids.subtopicId
    })
  }
};
