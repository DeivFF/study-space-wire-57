import express from 'express';
import {
  updateFlashcard,
  deleteFlashcard,
  getDueFlashcards,
  reviewFlashcard,
  startStudySession
} from '../controllers/flashcardsController.js';
import { authenticateToken } from '../middleware/authenticateToken.js';
import { validateRequest, studyValidationSchemas } from '../utils/studyValidation.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * @route   GET /api/flashcards/due
 * @desc    Get due flashcards for study
 * @access  Private
 */
router.get('/due', getDueFlashcards);

/**
 * @route   GET /api/flashcards/session/start
 * @desc    Start flashcard study session
 * @access  Private
 */
router.get('/session/start', startStudySession);

/**
 * @route   PUT /api/flashcards/:id
 * @desc    Update flashcard
 * @access  Private
 */
router.put(
  '/:id',
  validateRequest(studyValidationSchemas.updateFlashcard),
  updateFlashcard
);

/**
 * @route   POST /api/flashcards/:id/review
 * @desc    Review flashcard (SRS)
 * @access  Private
 */
router.post(
  '/:id/review',
  validateRequest(studyValidationSchemas.reviewFlashcard),
  reviewFlashcard
);

/**
 * @route   DELETE /api/flashcards/:id
 * @desc    Delete flashcard
 * @access  Private
 */
router.delete('/:id', deleteFlashcard);

export default router;