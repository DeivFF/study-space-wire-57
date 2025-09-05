import express from 'express';
import {
  getLessonCompleteData,
  updateLesson,
  deleteLesson
} from '../controllers/lessonsController.js';
import {
  getLessonFiles,
  uploadLessonFiles
} from '../controllers/lessonFilesController.js';
import {
  getLessonNotes,
  createNote
} from '../controllers/lessonNotesController.js';
import {
  getLessonFlashcards,
  createFlashcard
} from '../controllers/flashcardsController.js';
import {
  getLessonExercises,
  createExercise
} from '../controllers/exercisesController.js';
import {
  getLessonActivity,
  clearLessonActivity,
  exportLessonActivity,
  createLessonActivity
} from '../controllers/activityLogController.js';
import { authenticateToken } from '../middleware/authenticateToken.js';
import { validateRequest, studyValidationSchemas } from '../utils/studyValidation.js';
import { uploadMultiple, handleUploadError } from '../middleware/fileUpload.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * @route   GET /api/lessons/:id
 * @desc    Get complete lesson data (for LessonDetail component)
 * @access  Private
 */
router.get('/:id', getLessonCompleteData);

/**
 * @route   PUT /api/lessons/:id
 * @desc    Update lesson
 * @access  Private
 */
router.put(
  '/:id',
  validateRequest(studyValidationSchemas.updateLesson),
  updateLesson
);

/**
 * @route   DELETE /api/lessons/:id
 * @desc    Delete lesson
 * @access  Private
 */
router.delete('/:id', deleteLesson);

// ===============================
// LESSON FILES ROUTES
// ===============================

/**
 * @route   GET /api/lessons/:id/files
 * @desc    Get lesson files
 * @access  Private
 */
router.get('/:id/files', getLessonFiles);

/**
 * @route   POST /api/lessons/:id/files/upload
 * @desc    Upload files to lesson
 * @access  Private
 */
router.post(
  '/:id/files/upload',
  uploadMultiple,
  handleUploadError,
  uploadLessonFiles
);

// ===============================
// LESSON NOTES ROUTES
// ===============================

/**
 * @route   GET /api/lessons/:id/notes
 * @desc    Get lesson notes
 * @access  Private
 */
router.get('/:id/notes', getLessonNotes);

/**
 * @route   POST /api/lessons/:id/notes
 * @desc    Create lesson note
 * @access  Private
 */
router.post(
  '/:id/notes',
  validateRequest(studyValidationSchemas.createNote),
  createNote
);

// ===============================
// LESSON FLASHCARDS ROUTES
// ===============================

/**
 * @route   GET /api/lessons/:id/flashcards
 * @desc    Get lesson flashcards
 * @access  Private
 */
router.get('/:id/flashcards', getLessonFlashcards);

/**
 * @route   POST /api/lessons/:id/flashcards
 * @desc    Create flashcard
 * @access  Private
 */
router.post(
  '/:id/flashcards',
  validateRequest(studyValidationSchemas.createFlashcard),
  createFlashcard
);

// ===============================
// LESSON EXERCISES ROUTES
// ===============================

/**
 * @route   GET /api/lessons/:id/exercises
 * @desc    Get lesson exercises
 * @access  Private
 */
router.get('/:id/exercises', getLessonExercises);

/**
 * @route   POST /api/lessons/:id/exercises
 * @desc    Create exercise
 * @access  Private
 */
router.post(
  '/:id/exercises',
  validateRequest(studyValidationSchemas.createExercise),
  createExercise
);

// ===============================
// LESSON ACTIVITY ROUTES
// ===============================

/**
 * @route   GET /api/lessons/:id/activity
 * @desc    Get lesson activity log
 * @access  Private
 */
router.get('/:id/activity', getLessonActivity);

/**
 * @route   DELETE /api/lessons/:id/activity
 * @desc    Clear lesson activity log
 * @access  Private
 */
router.delete('/:id/activity', clearLessonActivity);

/**
 * @route   POST /api/lessons/:id/activity
 * @desc    Create lesson activity log entry
 * @access  Private
 */
router.post('/:id/activity', createLessonActivity);

/**
 * @route   GET /api/lessons/:id/activity/export
 * @desc    Export lesson activity log
 * @access  Private
 */
router.get('/:id/activity/export', exportLessonActivity);

export default router;