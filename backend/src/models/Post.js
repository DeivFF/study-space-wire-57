import pool from '../config/database.js';

/**
 * Post Model - Handles all post types: publicacao, duvida, exercicio, desafio
 */
class Post {
  /**
   * Validate post data based on type
   * @param {string} type - Post type
   * @param {Object} data - JSONB data specific to post type
   * @param {string} title - Post title (optional for some types)
   * @param {string} content - Post content
   * @returns {Object} Validation result
   */
  static validatePostData(type, data = {}, title, content) {
    const errors = [];
    
    // Define valid values used across different post types
    const validDifficultyLevels = ['iniciante', 'intermediario', 'avancado', 'especialista'];

    // Content is always required
    if (!content || content.trim() === '') {
      errors.push('Content is required for all post types');
    }

    switch (type) {
      case 'publicacao':
        // Publicacoes have minimal requirements - just content
        break;

      case 'duvida':
        // Title is required for duvidas
        if (!title || title.trim() === '') {
          errors.push('Title is required for duvida posts');
        }
        
        // Required JSONB fields
        if (!data.categoria_materia) {
          errors.push('categoria_materia is required for duvida posts');
        }
        if (!data.nivel_dificuldade) {
          errors.push('nivel_dificuldade is required for duvida posts');
        }

        // Validate nivel_dificuldade values
        if (data.nivel_dificuldade && !validDifficultyLevels.includes(data.nivel_dificuldade)) {
          errors.push('nivel_dificuldade must be one of: ' + validDifficultyLevels.join(', '));
        }
        break;

      case 'exercicio':
        // Title is required for exercicios
        if (!title || title.trim() === '') {
          errors.push('Title is required for exercicio posts');
        }

        // Required JSONB fields
        if (!data.tipo_exercicio) {
          errors.push('tipo_exercicio is required for exercicio posts');
        }
        if (!data.nivel_dificuldade) {
          errors.push('nivel_dificuldade is required for exercicio posts');
        }

        // Validate tipo_exercicio values
        const validExerciseTypes = ['pratica', 'teoria', 'projeto', 'desafio_codigo'];
        if (data.tipo_exercicio && !validExerciseTypes.includes(data.tipo_exercicio)) {
          errors.push('tipo_exercicio must be one of: ' + validExerciseTypes.join(', '));
        }

        // Validate nivel_dificuldade values
        if (data.nivel_dificuldade && !validDifficultyLevels.includes(data.nivel_dificuldade)) {
          errors.push('nivel_dificuldade must be one of: ' + validDifficultyLevels.join(', '));
        }
        break;

      case 'desafio':
        // Required JSONB fields
        if (!data.nivel_dificuldade) {
          errors.push('nivel_dificuldade is required for desafio posts');
        }
        if (!data.prazo_limite) {
          errors.push('prazo_limite is required for desafio posts');
        }

        // Validate prazo_limite is a future date
        if (data.prazo_limite) {
          const deadline = new Date(data.prazo_limite);
          if (isNaN(deadline.getTime())) {
            errors.push('prazo_limite must be a valid date');
          } else if (deadline <= new Date()) {
            errors.push('prazo_limite must be in the future');
          }
        }

        // Validate nivel_dificuldade values
        if (data.nivel_dificuldade && !validDifficultyLevels.includes(data.nivel_dificuldade)) {
          errors.push('nivel_dificuldade must be one of: ' + validDifficultyLevels.join(', '));
        }
        break;

      case 'enquete':
        // Title is required for enquetes (poll question)
        if (!title || title.trim() === '') {
          errors.push('Title is required for enquete posts');
        }

        // Required JSONB fields
        if (!data.poll_question) {
          errors.push('poll_question is required for enquete posts');
        }
        if (!data.poll_options || !Array.isArray(data.poll_options) || data.poll_options.length < 2) {
          errors.push('poll_options is required and must have at least 2 options for enquete posts');
        }
        if (!data.poll_duration || isNaN(parseInt(data.poll_duration))) {
          errors.push('poll_duration is required and must be a number for enquete posts');
        }

        // Validate poll duration is positive
        if (data.poll_duration && parseInt(data.poll_duration) <= 0) {
          errors.push('poll_duration must be a positive number');
        }

        // Validate poll options
        if (data.poll_options && Array.isArray(data.poll_options)) {
          const validOptions = data.poll_options.filter(opt => opt && opt.trim());
          if (validOptions.length < 2) {
            errors.push('At least 2 valid poll options are required');
          }
          if (data.poll_options.length > 8) {
            errors.push('Maximum 8 poll options allowed');
          }
        }
        break;

      default:
        errors.push(`Invalid post type: ${type}. Must be one of: publicacao, duvida, exercicio, desafio, enquete`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Create a new post
   * @param {Object} postData - Post data
   * @returns {Object} Created post
   */
  static async create(postData) {
    const {
      userId,
      title,
      content,
      type = 'publicacao',
      data = {},
      tags = [],
      isAnonymous = false,
      category = null
    } = postData;

    // Validate post data
    const validation = this.validatePostData(type, data, title, content);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query(`
        INSERT INTO posts (
          user_id, title, content, type, data, tags, is_anonymous, category
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [userId, title?.trim() || null, content.trim(), type, JSON.stringify(data), tags, isAnonymous, category]);

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get posts with advanced filtering
   * @param {Object} filters - Filtering options
   * @returns {Array} Filtered posts
   */
  static async getWithFilters(filters = {}) {
    const {
      userId = null,
      type = null,
      tags = null,
      categoriaMateria = null,
      nivelDificuldade = null,
      includeAnonymous = true,
      limit = 20,
      offset = 0,
      currentUserId = null
    } = filters;

    try {
      // Use the database function for optimized filtering
      const result = await pool.query(`
        SELECT * FROM get_posts_with_filters($1, $2, $3, $4, $5, $6, $7, $8)
      `, [userId, type, tags, categoriaMateria, nivelDificuldade, includeAnonymous, limit, offset]);

      // Enrich with author information
      const enrichedPosts = [];
      for (const post of result.rows) {
        const enrichedPost = await this.enrichWithAuthorInfo(post, currentUserId);
        enrichedPosts.push(enrichedPost);
      }

      return enrichedPosts;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get posts for user feed (from connections)
   * @param {string} userId - Current user ID
   * @param {Object} options - Pagination and filter options
   * @returns {Array} Feed posts
   */
  static async getFeedPosts(userId, options = {}) {
    const { limit = 20, offset = 0, type = null } = options;

    try {
      let typeFilter = type ? 'AND p.type = $4' : '';
      let queryParams = [userId, limit, offset];
      if (type) queryParams.push(type);

      const result = await pool.query(`
        SELECT 
          p.*,
          u.name as author_name,
          pr.nickname as author_nickname,
          pr.avatar_url as author_avatar,
          COALESCE(pl.is_liked, false) as is_liked
        FROM posts p
        JOIN users u ON p.user_id = u.id
        LEFT JOIN profiles pr ON u.id = pr.user_id
        LEFT JOIN (
          SELECT post_id, true as is_liked
          FROM post_likes
          WHERE user_id = $1
        ) pl ON p.id = pl.post_id
        WHERE (p.user_id = $1 
           OR p.user_id IN (
             SELECT CASE 
               WHEN requester_id = $1 THEN receiver_id
               WHEN receiver_id = $1 THEN requester_id
             END
             FROM user_connections 
             WHERE status = 'accepted' 
             AND (requester_id = $1 OR receiver_id = $1)
           ))
        ${typeFilter}
        ORDER BY p.created_at DESC
        LIMIT $2 OFFSET $3
      `, queryParams);

      // Enrich posts with recent comments
      const postsWithComments = [];
      for (const post of result.rows) {
        const commentsResult = await pool.query(`
          SELECT 
            c.*,
            u.name as author_name,
            pr.nickname as author_nickname,
            pr.avatar_url as author_avatar
          FROM post_comments c
          JOIN users u ON c.user_id = u.id
          LEFT JOIN profiles pr ON u.id = pr.user_id
          WHERE c.post_id = $1
          ORDER BY c.created_at ASC
          LIMIT 3
        `, [post.id]);

        const formattedPost = this.formatPostResponse(post);
        formattedPost.isLiked = post.is_liked;
        formattedPost.comments = commentsResult.rows.map(comment => ({
          id: comment.id,
          content: comment.content,
          createdAt: comment.created_at,
          updatedAt: comment.updated_at,
          author: {
            id: comment.user_id,
            name: comment.author_name,
            nickname: comment.author_nickname,
            avatarUrl: comment.author_avatar
          }
        }));
        
        postsWithComments.push(formattedPost);
      }

      return postsWithComments;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get posts by specific user
   * @param {string} targetUserId - Target user ID
   * @param {string} currentUserId - Current user ID
   * @param {Object} options - Pagination and filter options
   * @returns {Array} User posts
   */
  static async getUserPosts(targetUserId, currentUserId, options = {}) {
    const { limit = 20, offset = 0, type = null } = options;

    try {
      // Check privacy settings
      const canView = await this.canViewUserPosts(targetUserId, currentUserId);
      if (!canView) {
        throw new Error('User posts are private');
      }

      let typeFilter = type ? 'AND p.type = $4' : '';
      let queryParams = [targetUserId, limit, offset];
      if (type) queryParams.push(type);

      const result = await pool.query(`
        SELECT 
          p.*,
          u.name as author_name,
          pr.nickname as author_nickname,
          pr.avatar_url as author_avatar
        FROM posts p
        JOIN users u ON p.user_id = u.id
        LEFT JOIN profiles pr ON u.id = pr.user_id
        WHERE p.user_id = $1 ${typeFilter}
        ORDER BY p.created_at DESC
        LIMIT $2 OFFSET $3
      `, queryParams);

      return result.rows.map(post => this.formatPostResponse(post));
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get post by ID
   * @param {string} postId - Post ID
   * @param {string} currentUserId - Current user ID (for privacy check)
   * @returns {Object} Post data
   */
  static async getById(postId, currentUserId = null) {
    try {
      const result = await pool.query(`
        SELECT 
          p.*,
          u.name as author_name,
          pr.nickname as author_nickname,
          pr.avatar_url as author_avatar
        FROM posts p
        LEFT JOIN users u ON p.user_id = u.id AND p.is_anonymous = false
        LEFT JOIN profiles pr ON u.id = pr.user_id AND p.is_anonymous = false
        WHERE p.id = $1
      `, [postId]);

      if (result.rows.length === 0) {
        throw new Error('Post not found');
      }

      const post = result.rows[0];
      
      // Check if user can view this post (privacy check)
      if (!post.is_anonymous && post.user_id !== currentUserId) {
        const canView = await this.canViewUserPosts(post.user_id, currentUserId);
        if (!canView) {
          throw new Error('Post is private');
        }
      }

      return this.formatPostResponse(post);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update post
   * @param {string} postId - Post ID
   * @param {string} userId - User ID (for ownership check)
   * @param {Object} updateData - Data to update
   * @returns {Object} Updated post
   */
  static async update(postId, userId, updateData) {
    const { title, content, data, tags, category } = updateData;

    try {
      // Get current post to validate ownership and type
      const currentPost = await pool.query(
        'SELECT * FROM posts WHERE id = $1',
        [postId]
      );

      if (currentPost.rows.length === 0) {
        throw new Error('Post not found');
      }

      if (currentPost.rows[0].user_id !== userId) {
        throw new Error('You can only edit your own posts');
      }

      const post = currentPost.rows[0];

      // Validate updated data if provided
      if (data || title !== undefined || content !== undefined) {
        const newData = data || post.data;
        const newTitle = title !== undefined ? title : post.title;
        const newContent = content !== undefined ? content : post.content;

        const validation = this.validatePostData(post.type, newData, newTitle, newContent);
        if (!validation.isValid) {
          throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
      }

      const result = await pool.query(`
        UPDATE posts SET
          title = COALESCE($1, title),
          content = COALESCE($2, content),
          data = COALESCE($3, data),
          tags = COALESCE($4, tags),
          category = COALESCE($5, category),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $6 AND user_id = $7
        RETURNING *
      `, [title, content, data ? JSON.stringify(data) : null, tags, category, postId, userId]);

      const enrichedPost = await this.enrichWithAuthorInfo(result.rows[0], userId);
      return enrichedPost;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete post
   * @param {string} postId - Post ID
   * @param {string} userId - User ID (for ownership check)
   * @returns {boolean} Success status
   */
  static async delete(postId, userId) {
    try {
      const result = await pool.query(
        'DELETE FROM posts WHERE id = $1 AND user_id = $2 RETURNING id',
        [postId, userId]
      );

      if (result.rows.length === 0) {
        throw new Error('Post not found or you do not have permission to delete it');
      }

      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Toggle post like
   * @param {string} postId - Post ID
   * @param {string} userId - User ID
   * @returns {Object} Like status and count
   */
  static async toggleLike(postId, userId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if post exists
      const postCheck = await client.query('SELECT id FROM posts WHERE id = $1', [postId]);
      if (postCheck.rows.length === 0) {
        throw new Error('Post not found');
      }

      // Check if user already liked this post
      const likeCheck = await client.query(
        'SELECT id FROM post_likes WHERE post_id = $1 AND user_id = $2',
        [postId, userId]
      );

      let action;
      let newLikesCount;

      if (likeCheck.rows.length > 0) {
        // Unlike the post
        await client.query(
          'DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2',
          [postId, userId]
        );
        action = 'unliked';
      } else {
        // Like the post
        await client.query(
          'INSERT INTO post_likes (post_id, user_id) VALUES ($1, $2)',
          [postId, userId]
        );
        action = 'liked';
      }

      // Get updated likes count
      const countResult = await client.query(
        'SELECT likes_count FROM posts WHERE id = $1',
        [postId]
      );
      newLikesCount = countResult.rows[0].likes_count;

      await client.query('COMMIT');

      return {
        action,
        likesCount: newLikesCount
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Check if current user can view target user's posts
   * @param {string} targetUserId - Target user ID
   * @param {string} currentUserId - Current user ID
   * @returns {boolean} Can view status
   */
  static async canViewUserPosts(targetUserId, currentUserId) {
    if (!currentUserId) return false;
    if (targetUserId === currentUserId) return true;

    try {
      // Check if target user has private profile
      const userCheck = await pool.query(`
        SELECT u.is_active, p.private_profile
        FROM users u
        LEFT JOIN profiles p ON u.id = p.user_id
        WHERE u.id = $1
      `, [targetUserId]);

      if (userCheck.rows.length === 0 || !userCheck.rows[0].is_active) {
        return false;
      }

      const targetUser = userCheck.rows[0];
      
      // If profile is not private, can view
      if (!targetUser.private_profile) {
        return true;
      }

      // Check connection status
      const connectionCheck = await pool.query(`
        SELECT status FROM user_connections
        WHERE ((requester_id = $1 AND receiver_id = $2) OR (requester_id = $2 AND receiver_id = $1))
        AND status = 'accepted'
      `, [currentUserId, targetUserId]);

      return connectionCheck.rows.length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Enrich post with author information
   * @param {Object} post - Post object
   * @param {string} currentUserId - Current user ID
   * @returns {Object} Enriched post
   */
  static async enrichWithAuthorInfo(post, currentUserId = null) {
    if (post.is_anonymous) {
      return this.formatPostResponse({
        ...post,
        author_name: 'Usuário Anônimo',
        author_nickname: null,
        author_avatar: null
      });
    }

    if (post.author_name) {
      // Already has author info
      return this.formatPostResponse(post);
    }

    try {
      const authorResult = await pool.query(`
        SELECT u.name, p.nickname, p.avatar_url
        FROM users u
        LEFT JOIN profiles p ON u.id = p.user_id
        WHERE u.id = $1
      `, [post.user_id]);

      const author = authorResult.rows[0] || {};

      return this.formatPostResponse({
        ...post,
        author_name: author.name || 'Unknown User',
        author_nickname: author.nickname,
        author_avatar: author.avatar_url
      });
    } catch (error) {
      return this.formatPostResponse(post);
    }
  }

  /**
   * Format post response
   * @param {Object} post - Raw post data
   * @returns {Object} Formatted post
   */
  static formatPostResponse(post) {
    return {
      id: post.id,
      title: post.title,
      content: post.content,
      type: post.type,
      data: post.data,
      tags: post.tags,
      isAnonymous: post.is_anonymous,
      category: post.category,
      likesCount: post.likes_count,
      commentsCount: post.comments_count,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
      author: post.is_anonymous ? {
        id: null,
        name: 'Usuário Anônimo',
        nickname: null,
        avatarUrl: null
      } : {
        id: post.user_id,
        name: post.author_name,
        nickname: post.author_nickname,
        avatarUrl: post.author_avatar
      }
    };
  }

  /**
   * Get posts by type with pagination
   * @param {string} type - Post type
   * @param {Object} options - Pagination options
   * @returns {Array} Posts of specified type
   */
  static async getByType(type, options = {}) {
    const { limit = 20, offset = 0, userId = null } = options;

    return this.getWithFilters({
      type,
      limit,
      offset,
      currentUserId: userId
    });
  }

  /**
   * Search posts by text content
   * @param {string} searchText - Text to search
   * @param {Object} filters - Additional filters
   * @returns {Array} Matching posts
   */
  static async search(searchText, filters = {}) {
    const {
      type = null,
      tags = null,
      limit = 20,
      offset = 0,
      currentUserId = null
    } = filters;

    try {
      let typeFilter = type ? 'AND p.type = $4' : '';
      let tagsFilter = tags && tags.length > 0 ? 'AND p.tags && $5' : '';
      
      let queryParams = [searchText, searchText, limit, offset];
      let paramIndex = 4;
      
      if (type) {
        queryParams[paramIndex - 1] = type;
        paramIndex++;
      }
      if (tags && tags.length > 0) {
        queryParams[paramIndex - 1] = tags;
        paramIndex++;
      }

      const result = await pool.query(`
        SELECT 
          p.*,
          u.name as author_name,
          pr.nickname as author_nickname,
          pr.avatar_url as author_avatar,
          ts_rank(to_tsvector('portuguese', p.title || ' ' || p.content), plainto_tsquery('portuguese', $1)) as rank
        FROM posts p
        LEFT JOIN users u ON p.user_id = u.id AND p.is_anonymous = false
        LEFT JOIN profiles pr ON u.id = pr.user_id AND p.is_anonymous = false
        WHERE (
          to_tsvector('portuguese', p.title || ' ' || p.content) @@ plainto_tsquery('portuguese', $1)
          OR p.title ILIKE '%' || $2 || '%'
          OR p.content ILIKE '%' || $2 || '%'
        )
        ${typeFilter}
        ${tagsFilter}
        ORDER BY rank DESC, p.created_at DESC
        LIMIT $3 OFFSET $4
      `, queryParams);

      return result.rows.map(post => this.formatPostResponse(post));
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get comments for a post
   * @param {string} postId - Post ID
   * @param {Object} options - Pagination options
   * @returns {Array} Comments
   */
  static async getComments(postId, options = {}) {
    const { limit = 20, offset = 0 } = options;

    try {
      // Check if post exists
      const postCheck = await pool.query('SELECT id FROM posts WHERE id = $1', [postId]);
      if (postCheck.rows.length === 0) {
        throw new Error('Post not found');
      }

      const result = await pool.query(`
        SELECT 
          c.*,
          u.name as author_name,
          p.nickname as author_nickname,
          p.avatar_url as author_avatar
        FROM post_comments c
        JOIN users u ON c.user_id = u.id
        LEFT JOIN profiles p ON u.id = p.user_id
        WHERE c.post_id = $1
        ORDER BY c.created_at ASC
        LIMIT $2 OFFSET $3
      `, [postId, limit, offset]);

      return result.rows.map(comment => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.created_at,
        updatedAt: comment.updated_at,
        author: {
          id: comment.user_id,
          name: comment.author_name,
          nickname: comment.author_nickname,
          avatarUrl: comment.author_avatar
        }
      }));
    } catch (error) {
      throw error;
    }
  }

  /**
   * Add comment to a post
   * @param {string} postId - Post ID
   * @param {string} userId - User ID
   * @param {string} content - Comment content
   * @returns {Object} Created comment
   */
  static async addComment(postId, userId, content) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if post exists
      const postCheck = await client.query('SELECT id FROM posts WHERE id = $1', [postId]);
      if (postCheck.rows.length === 0) {
        throw new Error('Post not found');
      }

      // Create comment
      const commentResult = await client.query(`
        INSERT INTO post_comments (post_id, user_id, content)
        VALUES ($1, $2, $3)
        RETURNING *
      `, [postId, userId, content]);

      // Update comments count
      await client.query(`
        UPDATE posts SET comments_count = comments_count + 1
        WHERE id = $1
      `, [postId]);

      await client.query('COMMIT');

      // Get comment with author info
      const enrichedResult = await pool.query(`
        SELECT 
          c.*,
          u.name as author_name,
          p.nickname as author_nickname,
          p.avatar_url as author_avatar
        FROM post_comments c
        JOIN users u ON c.user_id = u.id
        LEFT JOIN profiles p ON u.id = p.user_id
        WHERE c.id = $1
      `, [commentResult.rows[0].id]);

      const comment = enrichedResult.rows[0];
      return {
        id: comment.id,
        content: comment.content,
        createdAt: comment.created_at,
        updatedAt: comment.updated_at,
        author: {
          id: comment.user_id,
          name: comment.author_name,
          nickname: comment.author_nickname,
          avatarUrl: comment.author_avatar
        }
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update comment
   * @param {string} commentId - Comment ID
   * @param {string} userId - User ID (for ownership check)
   * @param {string} content - New content
   * @returns {Object} Updated comment
   */
  static async updateComment(commentId, userId, content) {
    try {
      // Check ownership and update
      const result = await pool.query(`
        UPDATE post_comments 
        SET content = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND user_id = $3
        RETURNING *
      `, [content, commentId, userId]);

      if (result.rows.length === 0) {
        throw new Error('Comment not found or you can only edit your own comments');
      }

      // Get comment with author info
      const enrichedResult = await pool.query(`
        SELECT 
          c.*,
          u.name as author_name,
          p.nickname as author_nickname,
          p.avatar_url as author_avatar
        FROM post_comments c
        JOIN users u ON c.user_id = u.id
        LEFT JOIN profiles p ON u.id = p.user_id
        WHERE c.id = $1
      `, [commentId]);

      const comment = enrichedResult.rows[0];
      return {
        id: comment.id,
        content: comment.content,
        createdAt: comment.created_at,
        updatedAt: comment.updated_at,
        author: {
          id: comment.user_id,
          name: comment.author_name,
          nickname: comment.author_nickname,
          avatarUrl: comment.author_avatar
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete comment
   * @param {string} commentId - Comment ID
   * @param {string} userId - User ID (for ownership check)
   * @returns {boolean} Success status
   */
  static async deleteComment(commentId, userId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get comment to check ownership and get post_id
      const commentCheck = await client.query(
        'SELECT post_id FROM post_comments WHERE id = $1 AND user_id = $2',
        [commentId, userId]
      );

      if (commentCheck.rows.length === 0) {
        throw new Error('Comment not found or you can only delete your own comments');
      }

      const postId = commentCheck.rows[0].post_id;

      // Delete comment
      await client.query('DELETE FROM post_comments WHERE id = $1', [commentId]);

      // Update comments count
      await client.query(`
        UPDATE posts SET comments_count = GREATEST(comments_count - 1, 0)
        WHERE id = $1
      `, [postId]);

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

export default Post;