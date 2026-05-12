const express = require('express');
const router = express.Router();
const syllabusContentController = require('../controllers/syllabusContent.controller');
const { authenticate, requirePermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');
const validate = require('../middleware/validation');
const syllabusContentSchema = require('../schemas/syllabusContent.schema');

router.get(
  '/books',
  authenticate,
  requirePermission(PERMISSIONS.SYLLABUS_BOOK_LIST_READ),
  validate(syllabusContentSchema.getBooks),
  syllabusContentController.getBooks
);

router.post(
  '/books',
  authenticate,
  requirePermission(PERMISSIONS.SYLLABUS_BOOK_CREATE),
  validate(syllabusContentSchema.createBook),
  syllabusContentController.createBook
);

router.get(
  '/books/:curriculumBookId',
  authenticate,
  requirePermission(PERMISSIONS.SYLLABUS_BOOK_ITEM_READ),
  validate(syllabusContentSchema.getBookById),
  syllabusContentController.getBookById
);

router.put(
  '/books/:curriculumBookId',
  authenticate,
  requirePermission(PERMISSIONS.SYLLABUS_BOOK_EDIT),
  validate(syllabusContentSchema.updateBook),
  syllabusContentController.updateBook
);

router.delete(
  '/books/:curriculumBookId',
  authenticate,
  requirePermission(PERMISSIONS.SYLLABUS_BOOK_DELETE),
  validate(syllabusContentSchema.deleteBook),
  syllabusContentController.deleteBook
);

router.get(
  '/books/by-key/:academicYearId/:subjectName/:versionNo',
  authenticate,
  requirePermission(PERMISSIONS.SYLLABUS_BOOK_ITEM_READ),
  validate(syllabusContentSchema.getBookByKey),
  syllabusContentController.getBookByKey
);

router.get(
  '/chapters',
  authenticate,
  requirePermission(PERMISSIONS.SYLLABUS_CHAPTER_LIST_READ),
  validate(syllabusContentSchema.getChapters),
  syllabusContentController.getChapters
);

router.post(
  '/chapters',
  authenticate,
  requirePermission(PERMISSIONS.SYLLABUS_CHAPTER_CREATE),
  validate(syllabusContentSchema.createChapter),
  syllabusContentController.createChapter
);

router.get(
  '/chapters/:chapterId',
  authenticate,
  requirePermission(PERMISSIONS.SYLLABUS_CHAPTER_ITEM_READ),
  validate(syllabusContentSchema.getChapterById),
  syllabusContentController.getChapterById
);

router.put(
  '/chapters/:chapterId',
  authenticate,
  requirePermission(PERMISSIONS.SYLLABUS_CHAPTER_EDIT),
  validate(syllabusContentSchema.updateChapter),
  syllabusContentController.updateChapter
);

router.delete(
  '/chapters/:chapterId',
  authenticate,
  requirePermission(PERMISSIONS.SYLLABUS_CHAPTER_DELETE),
  validate(syllabusContentSchema.deleteChapter),
  syllabusContentController.deleteChapter
);

router.get(
  '/chapters/:chapterId/topics',
  authenticate,
  requirePermission(PERMISSIONS.SYLLABUS_TOPIC_LIST_READ),
  validate(syllabusContentSchema.getTopics),
  syllabusContentController.getTopics
);

router.post(
  '/topics',
  authenticate,
  requirePermission(PERMISSIONS.SYLLABUS_TOPIC_CREATE),
  validate(syllabusContentSchema.createTopic),
  syllabusContentController.createTopic
);

router.get(
  '/topics/:topicId',
  authenticate,
  requirePermission(PERMISSIONS.SYLLABUS_TOPIC_ITEM_READ),
  validate(syllabusContentSchema.getTopicById),
  syllabusContentController.getTopicById
);

router.put(
  '/topics/:topicId',
  authenticate,
  requirePermission(PERMISSIONS.SYLLABUS_TOPIC_EDIT),
  validate(syllabusContentSchema.updateTopic),
  syllabusContentController.updateTopic
);

router.delete(
  '/topics/:topicId',
  authenticate,
  requirePermission(PERMISSIONS.SYLLABUS_TOPIC_DELETE),
  validate(syllabusContentSchema.deleteTopic),
  syllabusContentController.deleteTopic
);

router.get(
  '/topics/:topicId/subtopics',
  authenticate,
  requirePermission(PERMISSIONS.SYLLABUS_SUBTOPIC_LIST_READ),
  validate(syllabusContentSchema.getSubtopics),
  syllabusContentController.getSubtopics
);

router.post(
  '/subtopics',
  authenticate,
  requirePermission(PERMISSIONS.SYLLABUS_SUBTOPIC_CREATE),
  validate(syllabusContentSchema.createSubtopic),
  syllabusContentController.createSubtopic
);

router.get(
  '/subtopics/:subtopicId',
  authenticate,
  requirePermission(PERMISSIONS.SYLLABUS_SUBTOPIC_ITEM_READ),
  validate(syllabusContentSchema.getSubtopicById),
  syllabusContentController.getSubtopicById
);

router.put(
  '/subtopics/:subtopicId',
  authenticate,
  requirePermission(PERMISSIONS.SYLLABUS_SUBTOPIC_EDIT),
  validate(syllabusContentSchema.updateSubtopic),
  syllabusContentController.updateSubtopic
);

router.delete(
  '/subtopics/:subtopicId',
  authenticate,
  requirePermission(PERMISSIONS.SYLLABUS_SUBTOPIC_DELETE),
  validate(syllabusContentSchema.deleteSubtopic),
  syllabusContentController.deleteSubtopic
);

module.exports = router;
