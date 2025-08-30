import express from 'express';
import { asyncHandler } from '../utils/validation.js';
import { authenticateToken } from '../middleware/authenticateToken.js';
import QuestionsController from '../controllers/questionsController.js';
import { searchRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

/**
 * @route   GET /api/users/question-history
 * @desc    Get user's question history
 * @access  Private
 */
router.get('/question-history', 
  authenticateToken, 
  searchRateLimiter,
  asyncHandler(QuestionsController.getUserHistory)
);

export default router;