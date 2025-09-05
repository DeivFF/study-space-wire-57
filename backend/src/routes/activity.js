import express from 'express';
import {
  getUserActivity
} from '../controllers/activityLogController.js';
import { authenticateToken } from '../middleware/authenticateToken.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * @route   GET /api/activity/user
 * @desc    Get user activity across all lessons
 * @access  Private
 */
router.get('/user', getUserActivity);

export default router;