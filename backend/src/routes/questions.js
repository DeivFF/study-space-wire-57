import express from 'express';
import { asyncHandler } from '../utils/validation.js';
import { authenticateToken } from '../middleware/authenticateToken.js';
import QuestionsController from '../controllers/questionsController.js';
import {
  postInteractionRateLimiter,
  searchRateLimiter
} from '../middleware/rateLimiter.js';

const router = express.Router();

/**
 * @route   GET /api/questions
 * @desc    Get questions with filtering
 * @access  Private
 */
router.get('/', 
  authenticateToken, 
  searchRateLimiter,
  asyncHandler(QuestionsController.getQuestions)
);

/**
 * @route   GET /api/questions/stats
 * @desc    Get question statistics
 * @access  Private
 */
router.get('/stats', 
  authenticateToken, 
  asyncHandler(QuestionsController.getStats)
);

/**
 * @route   GET /api/questions/filter-options/:category
 * @desc    Get available filter options for a category
 * @access  Private
 */
router.get('/filter-options/:category', 
  authenticateToken, 
  asyncHandler(QuestionsController.getFilterOptions)
);

/**
 * @route   GET /api/questions/:id
 * @desc    Get a specific question by ID
 * @access  Private
 */
router.get('/:id', 
  authenticateToken, 
  asyncHandler(QuestionsController.getQuestionById)
);

/**
 * @route   POST /api/questions/:id/answer
 * @desc    Submit an answer to a question
 * @access  Private
 */
router.post('/:id/answer', 
  authenticateToken, 
  postInteractionRateLimiter,
  asyncHandler(QuestionsController.submitAnswer)
);

/**
 * @route   POST /api/questions/:id/favorite
 * @desc    Toggle favorite status of a question
 * @access  Private
 */
router.post('/:id/favorite', 
  authenticateToken, 
  postInteractionRateLimiter,
  asyncHandler(QuestionsController.toggleFavorite)
);

export default router;