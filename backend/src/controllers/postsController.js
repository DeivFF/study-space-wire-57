import Post from '../models/Post.js';
import { AppError } from '../utils/validation.js';

/**
 * Posts Controller - Handles all post-related operations
 */
class PostsController {
  /**
   * Create a new post
   * @route POST /api/posts
   * @access Private
   */
  static async createPost(req, res) {
    try {
      const userId = req.user.id;
      const {
        title,
        content,
        type = 'publicacao',
        data = {},
        tags = [],
        isAnonymous = false,
        category = null
      } = req.body;

      // Basic validation
      if (!content || content.trim() === '') {
        throw new AppError('Content is required', 400);
      }

      if (content.length > 10000) {
        throw new AppError('Content must be less than 10,000 characters', 400);
      }

      if (title && title.length > 255) {
        throw new AppError('Title must be less than 255 characters', 400);
      }

      if (tags && tags.length > 10) {
        throw new AppError('Cannot have more than 10 tags', 400);
      }

      // Create post using model
      const post = await Post.create({
        userId,
        title,
        content,
        type,
        data,
        tags,
        isAnonymous,
        category
      });

      // Enrich with author info
      const enrichedPost = await Post.enrichWithAuthorInfo(post, userId);

      res.status(201).json({
        success: true,
        message: 'Post created successfully',
        data: enrichedPost
      });
    } catch (error) {
      console.error('Error creating post:', error);
      
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Create a post of specific type
   * @route POST /api/posts/:type
   * @access Private
   */
  static async createPostByType(req, res) {
    try {
      const { type } = req.params;
      const validTypes = ['publicacao', 'duvida', 'exercicio', 'desafio', 'enquete'];
      
      if (!validTypes.includes(type)) {
        throw new AppError(`Invalid post type. Must be one of: ${validTypes.join(', ')}`, 400);
      }

      // Set type from URL parameter
      req.body.type = type;
      
      // Delegate to createPost
      return await PostsController.createPost(req, res);
    } catch (error) {
      console.error('Error creating post by type:', error);
      
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get posts for user feed
   * @route GET /api/posts/feed
   * @access Private
   */
  static async getFeed(req, res) {
    try {
      const userId = req.user.id;
      const {
        limit = 20,
        offset = 0,
        type = null
      } = req.query;

      const posts = await Post.getFeedPosts(userId, {
        limit: parseInt(limit),
        offset: parseInt(offset),
        type
      });

      res.status(200).json({
        success: true,
        data: {
          posts,
          pagination: {
            limit: parseInt(limit),
            offset: parseInt(offset),
            total: posts.length
          }
        }
      });
    } catch (error) {
      console.error('Error fetching feed:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get posts by user
   * @route GET /api/posts/user/:userId
   * @access Private
   */
  static async getUserPosts(req, res) {
    try {
      const { userId: targetUserId } = req.params;
      const currentUserId = req.user.id;
      const {
        limit = 20,
        offset = 0,
        type = null
      } = req.query;

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(targetUserId)) {
        throw new AppError('Invalid user ID format', 400);
      }

      const posts = await Post.getUserPosts(targetUserId, currentUserId, {
        limit: parseInt(limit),
        offset: parseInt(offset),
        type
      });

      res.status(200).json({
        success: true,
        data: {
          posts,
          pagination: {
            limit: parseInt(limit),
            offset: parseInt(offset),
            total: posts.length
          }
        }
      });
    } catch (error) {
      console.error('Error fetching user posts:', error);
      
      if (error.message === 'User posts are private') {
        return res.status(403).json({
          success: false,
          message: 'This user\'s posts are private'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get post by ID
   * @route GET /api/posts/:id
   * @access Private
   */
  static async getPost(req, res) {
    try {
      const { id } = req.params;
      const currentUserId = req.user.id;

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        throw new AppError('Invalid post ID format', 400);
      }

      const post = await Post.getById(id, currentUserId);

      res.status(200).json({
        success: true,
        data: post
      });
    } catch (error) {
      console.error('Error fetching post:', error);
      
      if (error.message === 'Post not found') {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }

      if (error.message === 'Post is private') {
        return res.status(403).json({
          success: false,
          message: 'Post is private'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Update post
   * @route PUT /api/posts/:id
   * @access Private
   */
  static async updatePost(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const updateData = req.body;

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        throw new AppError('Invalid post ID format', 400);
      }

      // Basic validation
      if (updateData.content !== undefined && updateData.content.length > 10000) {
        throw new AppError('Content must be less than 10,000 characters', 400);
      }

      if (updateData.title !== undefined && updateData.title.length > 255) {
        throw new AppError('Title must be less than 255 characters', 400);
      }

      if (updateData.tags !== undefined && updateData.tags.length > 10) {
        throw new AppError('Cannot have more than 10 tags', 400);
      }

      const post = await Post.update(id, userId, updateData);

      res.status(200).json({
        success: true,
        message: 'Post updated successfully',
        data: post
      });
    } catch (error) {
      console.error('Error updating post:', error);
      
      if (error.message === 'Post not found') {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }

      if (error.message === 'You can only edit your own posts') {
        return res.status(403).json({
          success: false,
          message: 'You can only edit your own posts'
        });
      }

      if (error.message.includes('Validation failed:')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Delete post
   * @route DELETE /api/posts/:id
   * @access Private
   */
  static async deletePost(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        throw new AppError('Invalid post ID format', 400);
      }

      await Post.delete(id, userId);

      res.status(200).json({
        success: true,
        message: 'Post deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting post:', error);
      
      if (error.message === 'Post not found or you do not have permission to delete it') {
        return res.status(404).json({
          success: false,
          message: 'Post not found or you do not have permission to delete it'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Toggle post like
   * @route POST /api/posts/:id/like
   * @access Private
   */
  static async toggleLike(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        throw new AppError('Invalid post ID format', 400);
      }

      const result = await Post.toggleLike(id, userId);

      res.status(200).json({
        success: true,
        message: `Post ${result.action} successfully`,
        data: result
      });
    } catch (error) {
      console.error('Error toggling post like:', error);
      
      if (error.message === 'Post not found') {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get posts with advanced filters
   * @route GET /api/posts/filter
   * @access Private
   */
  static async getFilteredPosts(req, res) {
    try {
      const currentUserId = req.user.id;
      const {
        userId = null,
        type = null,
        tags = null,
        categoriaMateria = null,
        nivelDificuldade = null,
        includeAnonymous = true,
        limit = 20,
        offset = 0
      } = req.query;

      // Parse tags if provided as string
      let parsedTags = null;
      if (tags) {
        try {
          parsedTags = Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim());
        } catch (error) {
          throw new AppError('Invalid tags format', 400);
        }
      }

      const posts = await Post.getWithFilters({
        userId,
        type,
        tags: parsedTags,
        categoriaMateria,
        nivelDificuldade,
        includeAnonymous: includeAnonymous === 'true',
        limit: parseInt(limit),
        offset: parseInt(offset),
        currentUserId
      });

      res.status(200).json({
        success: true,
        data: {
          posts,
          pagination: {
            limit: parseInt(limit),
            offset: parseInt(offset),
            total: posts.length
          },
          filters: {
            userId,
            type,
            tags: parsedTags,
            categoriaMateria,
            nivelDificuldade,
            includeAnonymous: includeAnonymous === 'true'
          }
        }
      });
    } catch (error) {
      console.error('Error getting filtered posts:', error);
      
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get posts by type
   * @route GET /api/posts/type/:type
   * @access Private
   */
  static async getPostsByType(req, res) {
    try {
      const { type } = req.params;
      const userId = req.user.id;
      const {
        limit = 20,
        offset = 0
      } = req.query;

      const validTypes = ['publicacao', 'duvida', 'exercicio', 'desafio', 'enquete'];
      if (!validTypes.includes(type)) {
        throw new AppError(`Invalid post type. Must be one of: ${validTypes.join(', ')}`, 400);
      }

      const posts = await Post.getByType(type, {
        limit: parseInt(limit),
        offset: parseInt(offset),
        userId
      });

      res.status(200).json({
        success: true,
        data: {
          posts,
          pagination: {
            limit: parseInt(limit),
            offset: parseInt(offset),
            total: posts.length
          },
          type
        }
      });
    } catch (error) {
      console.error('Error getting posts by type:', error);
      
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Search posts
   * @route GET /api/posts/search
   * @access Private
   */
  static async searchPosts(req, res) {
    try {
      const currentUserId = req.user.id;
      const {
        q: searchText,
        type = null,
        tags = null,
        limit = 20,
        offset = 0
      } = req.query;

      if (!searchText || searchText.trim() === '') {
        throw new AppError('Search query is required', 400);
      }

      if (searchText.length > 200) {
        throw new AppError('Search query must be less than 200 characters', 400);
      }

      // Parse tags if provided
      let parsedTags = null;
      if (tags) {
        try {
          parsedTags = Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim());
        } catch (error) {
          throw new AppError('Invalid tags format', 400);
        }
      }

      const posts = await Post.search(searchText, {
        type,
        tags: parsedTags,
        limit: parseInt(limit),
        offset: parseInt(offset),
        currentUserId
      });

      res.status(200).json({
        success: true,
        data: {
          posts,
          pagination: {
            limit: parseInt(limit),
            offset: parseInt(offset),
            total: posts.length
          },
          query: searchText,
          filters: {
            type,
            tags: parsedTags
          }
        }
      });
    } catch (error) {
      console.error('Error searching posts:', error);
      
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get active challenges (desafios with future deadlines)
   * @route GET /api/posts/challenges/active
   * @access Private
   */
  static async getActiveChallenges(req, res) {
    try {
      const currentUserId = req.user.id;
      const {
        limit = 20,
        offset = 0
      } = req.query;

      // Get all challenges and filter active ones in application layer
      const allChallenges = await Post.getByType('desafio', {
        limit: parseInt(limit) * 2, // Get more to account for filtering
        offset: parseInt(offset),
        userId: currentUserId
      });

      // Filter active challenges (those with future deadlines)
      const activeChallenges = allChallenges.filter(post => {
        const deadline = post.data?.prazo_limite;
        if (!deadline) return false;
        
        const deadlineDate = new Date(deadline);
        return deadlineDate > new Date();
      });

      // Limit results after filtering
      const limitedChallenges = activeChallenges.slice(0, parseInt(limit));

      res.status(200).json({
        success: true,
        data: {
          posts: limitedChallenges,
          pagination: {
            limit: parseInt(limit),
            offset: parseInt(offset),
            total: limitedChallenges.length
          }
        }
      });
    } catch (error) {
      console.error('Error getting active challenges:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get comments for a post
   * @route GET /api/posts/:id/comments
   * @access Private
   */
  static async getComments(req, res) {
    try {
      const { id: postId } = req.params;
      const {
        limit = 20,
        offset = 0
      } = req.query;

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(postId)) {
        throw new AppError('Invalid post ID format', 400);
      }

      const comments = await Post.getComments(postId, {
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.status(200).json({
        success: true,
        data: {
          comments,
          pagination: {
            limit: parseInt(limit),
            offset: parseInt(offset),
            total: comments.length
          }
        }
      });
    } catch (error) {
      console.error('Error fetching comments:', error);
      
      if (error.message === 'Post not found') {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Add comment to a post
   * @route POST /api/posts/:id/comments
   * @access Private
   */
  static async addComment(req, res) {
    try {
      const { id: postId } = req.params;
      const userId = req.user.id;
      const { content } = req.body;

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(postId)) {
        throw new AppError('Invalid post ID format', 400);
      }

      // Validate content
      if (!content || content.trim() === '') {
        throw new AppError('Comment content is required', 400);
      }

      if (content.length > 2000) {
        throw new AppError('Comment must be less than 2,000 characters', 400);
      }

      const comment = await Post.addComment(postId, userId, content.trim());

      res.status(201).json({
        success: true,
        message: 'Comment added successfully',
        data: comment
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      
      if (error.message === 'Post not found') {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }

      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Update comment
   * @route PUT /api/posts/:postId/comments/:commentId
   * @access Private
   */
  static async updateComment(req, res) {
    try {
      const { postId, commentId } = req.params;
      const userId = req.user.id;
      const { content } = req.body;

      // Validate UUID formats
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(postId) || !uuidRegex.test(commentId)) {
        throw new AppError('Invalid ID format', 400);
      }

      // Validate content
      if (!content || content.trim() === '') {
        throw new AppError('Comment content is required', 400);
      }

      if (content.length > 2000) {
        throw new AppError('Comment must be less than 2,000 characters', 400);
      }

      const comment = await Post.updateComment(commentId, userId, content.trim());

      res.status(200).json({
        success: true,
        message: 'Comment updated successfully',
        data: comment
      });
    } catch (error) {
      console.error('Error updating comment:', error);
      
      if (error.message === 'Comment not found' || error.message === 'You can only edit your own comments') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Delete comment
   * @route DELETE /api/posts/:postId/comments/:commentId
   * @access Private
   */
  static async deleteComment(req, res) {
    try {
      const { postId, commentId } = req.params;
      const userId = req.user.id;

      // Validate UUID formats
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(postId) || !uuidRegex.test(commentId)) {
        throw new AppError('Invalid ID format', 400);
      }

      await Post.deleteComment(commentId, userId);

      res.status(200).json({
        success: true,
        message: 'Comment deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      
      if (error.message === 'Comment not found' || error.message === 'You can only delete your own comments') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Vote on a poll
   * @route POST /api/posts/:id/vote
   * @access Private
   */
  static async voteOnPoll(req, res) {
    try {
      const { id: postId } = req.params;
      const userId = req.user.id;
      const { optionIndex } = req.body;

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(postId)) {
        throw new AppError('Invalid post ID format', 400);
      }

      // Validate optionIndex
      if (optionIndex === undefined || typeof optionIndex !== 'number' || optionIndex < 0) {
        throw new AppError('Invalid option index', 400);
      }

      // Import PollVote model here to avoid circular dependencies
      const PollVote = (await import('../models/PollVote.js')).default;
      
      const result = await PollVote.createVote(postId, userId, optionIndex);

      res.status(200).json({
        success: true,
        message: 'Vote recorded successfully',
        data: result
      });
    } catch (error) {
      console.error('Error voting on poll:', error);
      
      if (error.message === 'Post not found') {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }
      
      if (error.message === 'Post is not a poll') {
        return res.status(400).json({
          success: false,
          message: 'Post is not a poll'
        });
      }
      
      if (error.message === 'Invalid option index') {
        return res.status(400).json({
          success: false,
          message: 'Invalid option index'
        });
      }

      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get poll results
   * @route GET /api/posts/:id/results
   * @access Private
   */
  static async getPollResults(req, res) {
    try {
      const { id: postId } = req.params;
      const userId = req.user.id;

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(postId)) {
        throw new AppError('Invalid post ID format', 400);
      }

      // Import PollVote model here to avoid circular dependencies
      const PollVote = (await import('../models/PollVote.js')).default;
      
      const results = await PollVote.getResults(postId);
      
      // Also get user's vote if they have one
      const userVote = await PollVote.getUserVote(postId, userId);

      // Enhanced response with additional metadata
      res.status(200).json({
        success: true,
        data: {
          results: results.results,
          totalVotes: results.totalVotes,
          userVote: userVote ? userVote.option_index : null,
          hasVoted: userVote !== null,
          // Add metadata for UI components
          metadata: {
            pollId: postId,
            updatedAt: new Date().toISOString(),
            canVote: true // Could be enhanced with more logic
          }
        }
      });
    } catch (error) {
      console.error('Error getting poll results:', error);
      
      if (error.message === 'Post not found') {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }
      
      if (error.message === 'Post is not a poll') {
        return res.status(400).json({
          success: false,
          message: 'Post is not a poll'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Submit exercise response
   * @route POST /api/posts/:id/respond
   * @access Private
   */
  static async submitExerciseResponse(req, res) {
    try {
      const { id: postId } = req.params;
      const userId = req.user.id;
      const response = req.body;

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(postId)) {
        throw new AppError('Invalid post ID format', 400);
      }

      // Validate response
      if (!response || (response.selectedOptionIndex === undefined && response.writtenResponse === undefined)) {
        throw new AppError('Invalid response format', 400);
      }

      // Import ExerciseResponse model here to avoid circular dependencies
      const ExerciseResponse = (await import('../models/ExerciseResponse.js')).default;
      
      const result = await ExerciseResponse.createResponse(postId, userId, response);

      res.status(200).json({
        success: true,
        message: 'Response recorded successfully',
        data: result
      });
    } catch (error) {
      console.error('Error submitting exercise response:', error);
      
      if (error.message === 'Post not found') {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }
      
      if (error.message === 'Post is not an exercise') {
        return res.status(400).json({
          success: false,
          message: 'Post is not an exercise'
        });
      }
      
      if (error.message === 'Invalid option index') {
        return res.status(400).json({
          success: false,
          message: 'Invalid option index'
        });
      }
      
      if (error.message === 'Invalid response format') {
        return res.status(400).json({
          success: false,
          message: 'Invalid response format'
        });
      }

      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get exercise response
   * @route GET /api/posts/:id/response
   * @access Private
   */
  static async getExerciseResponse(req, res) {
    try {
      const { id: postId } = req.params;
      const userId = req.user.id;

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(postId)) {
        throw new AppError('Invalid post ID format', 400);
      }

      // Import ExerciseResponse model here to avoid circular dependencies
      const ExerciseResponse = (await import('../models/ExerciseResponse.js')).default;
      
      const response = await ExerciseResponse.getResponse(postId, userId);

      if (!response) {
        return res.status(404).json({
          success: false,
          message: 'Response not found'
        });
      }

      res.status(200).json({
        success: true,
        data: response
      });
    } catch (error) {
      console.error('Error getting exercise response:', error);
      
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

export default PostsController;