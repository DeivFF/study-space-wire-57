import express from 'express';
import { asyncHandler } from '../utils/validation.js';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/authenticateToken.js';
import PostsController from '../controllers/postsController.js';
import {
  validatePostCreation,
  validatePostUpdate,
  validatePostSearch,
  validatePostFilters,
  sanitizePostContent,
  checkPostPermission
} from '../middleware/postValidation.js';
import {
  postCreationRateLimiter,
  anonymousPostRateLimiter,
  challengeCreationRateLimiter,
  postInteractionRateLimiter,
  searchRateLimiter
} from '../middleware/rateLimiter.js';

const router = express.Router();

/**
 * @route   GET /api/posts/feed
 * @desc    Get feed with posts from connections (enhanced with new post types)
 * @access  Private
 */
router.get('/feed', authenticateToken, asyncHandler(PostsController.getFeed));

/**
 * @route   GET /api/posts/user/:userId
 * @desc    Get posts by specific user (enhanced with new post types)
 * @access  Private
 */
router.get('/user/:userId', authenticateToken, asyncHandler(PostsController.getUserPosts));

/**
 * @route   POST /api/posts
 * @desc    Create a new post (backward compatible, defaults to publicacao)
 * @access  Private
 */
router.post('/', 
  authenticateToken, 
  postCreationRateLimiter,
  anonymousPostRateLimiter,
  sanitizePostContent,
  validatePostCreation, 
  asyncHandler(PostsController.createPost)
);

/**
 * @route   PUT /api/posts/:id
 * @desc    Update a post (enhanced with new fields)
 * @access  Private
 */
router.put('/:id', 
  authenticateToken,
  sanitizePostContent,
  validatePostUpdate,
  checkPostPermission('update'),
  asyncHandler(PostsController.updatePost)
);

/**
 * @route   DELETE /api/posts/:id
 * @desc    Delete a post
 * @access  Private
 */
router.delete('/:id', 
  authenticateToken,
  checkPostPermission('delete'),
  asyncHandler(PostsController.deletePost)
);

/**
 * @route   POST /api/posts/:id/like
 * @desc    Like or unlike a post
 * @access  Private
 */
router.post('/:id/like', 
  authenticateToken,
  postInteractionRateLimiter,
  checkPostPermission('like'),
  asyncHandler(PostsController.toggleLike)
);

// NEW ENHANCED ENDPOINTS FOR POST CREATION SYSTEM

/**
 * @route   GET /api/posts/:id
 * @desc    Get single post by ID
 * @access  Private
 */
router.get('/:id', 
  authenticateToken,
  checkPostPermission('read'),
  asyncHandler(PostsController.getPost)
);

/**
 * @route   POST /api/posts/:type
 * @desc    Create a post of specific type (publicacao, duvida, exercicio, desafio, enquete)
 * @access  Private
 */
router.post('/:type(publicacao|duvida|exercicio|desafio|enquete)', 
  authenticateToken, 
  postCreationRateLimiter,
  anonymousPostRateLimiter,
  challengeCreationRateLimiter,
  sanitizePostContent,
  validatePostCreation, 
  asyncHandler(PostsController.createPostByType)
);

/**
 * @route   GET /api/posts/filter/advanced
 * @desc    Get posts with advanced filtering options
 * @access  Private
 */
router.get('/filter/advanced', 
  authenticateToken,
  validatePostFilters,
  asyncHandler(PostsController.getFilteredPosts)
);

/**
 * @route   GET /api/posts/type/:type
 * @desc    Get posts by specific type
 * @access  Private
 */
router.get('/type/:type(publicacao|duvida|exercicio|desafio|enquete)', 
  authenticateToken,
  asyncHandler(PostsController.getPostsByType)
);

/**
 * @route   GET /api/posts/search/query
 * @desc    Search posts by content, title and tags
 * @access  Private
 */
router.get('/search/query', 
  authenticateToken,
  searchRateLimiter,
  validatePostSearch,
  asyncHandler(PostsController.searchPosts)
);

/**
 * @route   GET /api/posts/challenges/active
 * @desc    Get active challenges (desafios with future deadlines)
 * @access  Private
 */
router.get('/challenges/active', 
  authenticateToken,
  asyncHandler(PostsController.getActiveChallenges)
);

/**
 * @route   GET /api/posts/:id/comments
 * @desc    Get comments for a post
 * @access  Private
 */
router.get('/:id/comments', 
  authenticateToken,
  checkPostPermission('read'),
  asyncHandler(PostsController.getComments)
);

/**
 * @route   POST /api/posts/:id/comments
 * @desc    Add a comment to a post
 * @access  Private
 */
router.post('/:id/comments', 
  authenticateToken,
  postInteractionRateLimiter,
  checkPostPermission('read'),
  asyncHandler(PostsController.addComment)
);

/**
 * @route   PUT /api/posts/:postId/comments/:commentId
 * @desc    Update a comment
 * @access  Private
 */
router.put('/:postId/comments/:commentId', 
  authenticateToken,
  asyncHandler(PostsController.updateComment)
);

/**
 * @route   DELETE /api/posts/:postId/comments/:commentId
 * @desc    Delete a comment
 * @access  Private
 */
router.delete('/:postId/comments/:commentId', 
  authenticateToken,
  asyncHandler(PostsController.deleteComment)
);

// NEW ENDPOINTS FOR POLL VOTING AND EXERCISE RESPONSES

/**
 * @route   POST /api/posts/:id/vote
 * @desc    Vote on a poll
 * @access  Private
 */
router.post('/:id/vote',
  authenticateToken,
  postInteractionRateLimiter,
  asyncHandler(PostsController.voteOnPoll)
);

/**
 * @route   GET /api/posts/:id/results
 * @desc    Get poll results
 * @access  Private
 */
router.get('/:id/results',
  authenticateToken,
  asyncHandler(PostsController.getPollResults)
);

/**
 * @route   POST /api/posts/:id/respond
 * @desc    Submit exercise response
 * @access  Private
 */
router.post('/:id/respond',
  authenticateToken,
  postInteractionRateLimiter,
  asyncHandler(PostsController.submitExerciseResponse)
);

/**
 * @route   GET /api/posts/:id/response
 * @desc    Get exercise response
 * @access  Private
 */
router.get('/:id/response',
  authenticateToken,
  asyncHandler(PostsController.getExerciseResponse)
);

export default router;