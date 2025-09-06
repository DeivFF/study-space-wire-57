import pool from '../config/database.js';

/**
 * Question Model - Handles all question types: ENEM, OAB, CONCURSO
 */
class Question {
  /**
   * Check if a question with the same title already exists
   * @param {string} title - Question title to check
   * @param {string} excludeId - Question ID to exclude from check (for updates)
   * @returns {boolean} True if title exists
   */
  static async titleExists(title, excludeId = null) {
    const query = excludeId 
      ? 'SELECT id FROM questions WHERE title = $1 AND id != $2 LIMIT 1'
      : 'SELECT id FROM questions WHERE title = $1 LIMIT 1';
    
    const params = excludeId ? [title, excludeId] : [title];
    const result = await pool.query(query, params);
    return result.rows.length > 0;
  }

  /**
   * Create a new question with title uniqueness validation
   * @param {Object} questionData - Question data including options
   * @returns {Object} Created question
   */
  static async create(questionData) {
    const { title, category, subcategory, content, type, year, difficulty, 
            subject_area, legal_branch, exam_phase, institution, position, 
            education_level, metadata = {}, options = [] } = questionData;

    // Validate required fields
    if (!title || !category || !content || !type || !year) {
      throw new Error('Missing required fields: title, category, content, type, year');
    }

    // Check for duplicate title
    const titleExists = await this.titleExists(title);
    if (titleExists) {
      throw new Error(`Question with title "${title}" already exists`);
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Insert question
      const questionQuery = `
        INSERT INTO questions (
          category, subcategory, title, content, type, year, difficulty,
          subject_area, legal_branch, exam_phase, institution, position,
          education_level, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `;

      const questionValues = [
        category, subcategory, title, content, type, year, difficulty,
        subject_area, legal_branch, exam_phase, institution, position,
        education_level, JSON.stringify(metadata)
      ];

      const questionResult = await client.query(questionQuery, questionValues);
      const question = questionResult.rows[0];

      // Insert options if provided (for objective questions)
      if (options.length > 0 && type === 'OBJETIVA') {
        for (const option of options) {
          const optionQuery = `
            INSERT INTO question_options (question_id, option_letter, content, is_correct, explanation)
            VALUES ($1, $2, $3, $4, $5)
          `;
          await client.query(optionQuery, [
            question.id,
            option.letter,
            option.content,
            option.correct || false,
            option.explanation || null
          ]);
        }
      }

      await client.query('COMMIT');
      return question;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  /**
   * Get questions with advanced filtering
   * @param {Object} filters - Filter criteria
   * @param {number} page - Page number for pagination
   * @param {number} limit - Number of items per page
   * @param {string} userId - User ID for personalized filters
   * @returns {Object} Questions with pagination info
   */
  static async findWithFilters(filters = {}, page = 1, limit = 20, userId = null) {
    const offset = (page - 1) * limit;
    
    // Build WHERE clause dynamically
    let whereConditions = ['1=1'];
    let queryParams = [];
    let paramCounter = 1;

    // Category filter (required)
    if (filters.category) {
      whereConditions.push(`q.category = $${paramCounter}`);
      queryParams.push(filters.category);
      paramCounter++;
    }

    // Subcategory filter
    if (filters.subcategory) {
      whereConditions.push(`q.subcategory = $${paramCounter}`);
      queryParams.push(filters.subcategory);
      paramCounter++;
    }

    // Year filter (array of years)
    if (filters.year && Array.isArray(filters.year) && filters.year.length > 0) {
      const yearPlaceholders = filters.year.map(() => `$${paramCounter++}`).join(',');
      whereConditions.push(`q.year IN (${yearPlaceholders})`);
      queryParams.push(...filters.year);
    }

    // Difficulty filter (array)
    if (filters.difficulty && Array.isArray(filters.difficulty) && filters.difficulty.length > 0) {
      const difficultyPlaceholders = filters.difficulty.map(() => `$${paramCounter++}`).join(',');
      whereConditions.push(`q.difficulty IN (${difficultyPlaceholders})`);
      queryParams.push(...filters.difficulty);
    }

    // Subject area filter (array)
    if (filters.subject_area && Array.isArray(filters.subject_area) && filters.subject_area.length > 0) {
      const subjectPlaceholders = filters.subject_area.map(() => `$${paramCounter++}`).join(',');
      whereConditions.push(`q.subject_area IN (${subjectPlaceholders})`);
      queryParams.push(...filters.subject_area);
    }

    // Legal branch filter (for OAB)
    if (filters.legal_branch && Array.isArray(filters.legal_branch) && filters.legal_branch.length > 0) {
      const legalPlaceholders = filters.legal_branch.map(() => `$${paramCounter++}`).join(',');
      whereConditions.push(`q.legal_branch IN (${legalPlaceholders})`);
      queryParams.push(...filters.legal_branch);
    }

    // Exam phase filter (for OAB)
    if (filters.exam_phase) {
      whereConditions.push(`q.exam_phase = $${paramCounter}`);
      queryParams.push(filters.exam_phase);
      paramCounter++;
    }

    // Question type filter (array)
    if (filters.type && Array.isArray(filters.type) && filters.type.length > 0) {
      const typePlaceholders = filters.type.map(() => `$${paramCounter++}`).join(',');
      whereConditions.push(`q.type IN (${typePlaceholders})`);
      queryParams.push(...filters.type);
    }

    // Institution filter (array)
    if (filters.institution && Array.isArray(filters.institution) && filters.institution.length > 0) {
      const institutionPlaceholders = filters.institution.map(() => `$${paramCounter++}`).join(',');
      whereConditions.push(`q.institution IN (${institutionPlaceholders})`);
      queryParams.push(...filters.institution);
    }

    // Position filter (array)
    if (filters.position && Array.isArray(filters.position) && filters.position.length > 0) {
      const positionPlaceholders = filters.position.map(() => `$${paramCounter++}`).join(',');
      whereConditions.push(`q.position IN (${positionPlaceholders})`);
      queryParams.push(...filters.position);
    }

    // Education level filter
    if (filters.education_level) {
      whereConditions.push(`q.education_level = $${paramCounter}`);
      queryParams.push(filters.education_level);
      paramCounter++;
    }

    // User-specific filters (require userId)
    let leftJoins = '';
    if (userId) {
      leftJoins += `
        LEFT JOIN user_question_stats uqs ON q.id = uqs.question_id AND uqs.user_id = $${paramCounter}
        LEFT JOIN user_favorite_questions ufq ON q.id = ufq.question_id AND ufq.user_id = $${paramCounter + 1}
      `;
      queryParams.push(userId, userId);
      paramCounter += 2;

      // Favorites only filter
      if (filters.favorites_only) {
        whereConditions.push('ufq.id IS NOT NULL');
      }

      // Never answered filter
      if (filters.never_answered) {
        whereConditions.push('uqs.id IS NULL');
      }

      // User correct filter
      if (filters.user_correct) {
        whereConditions.push('uqs.is_correct = true');
      }

      // User incorrect filter
      if (filters.user_incorrect) {
        whereConditions.push('uqs.is_correct = false');
      }
    }

    // Error rate filter (join with error rates view)
    let errorRateJoin = '';
    if (filters.min_error_rate && filters.min_error_rate > 0) {
      errorRateJoin = 'LEFT JOIN question_error_rates qer ON q.id = qer.id';
      whereConditions.push(`qer.error_rate_percentage >= $${paramCounter}`);
      queryParams.push(filters.min_error_rate);
      paramCounter++;
    }

    // Build the query
    const baseQuery = `
      SELECT 
        q.id,
        q.category,
        q.subcategory,
        q.title,
        q.content,
        q.type,
        q.year,
        q.difficulty,
        q.subject_area,
        q.legal_branch,
        q.exam_phase,
        q.institution,
        q.position,
        q.education_level,
        q.metadata,
        q.created_at,
        ${userId ? 'CASE WHEN ufq.id IS NOT NULL THEN true ELSE false END as is_favorite,' : 'false as is_favorite,'}
        ${userId ? 'uqs.is_correct as user_answered_correctly,' : 'null as user_answered_correctly,'}
        ${filters.min_error_rate ? 'qer.error_rate_percentage,' : 'null as error_rate_percentage,'}
        COUNT(*) OVER() as total_count
      FROM questions q
      ${leftJoins}
      ${errorRateJoin}
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY q.created_at DESC
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `;

    queryParams.push(limit, offset);

    const result = await pool.query(baseQuery, queryParams);

    const totalCount = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;
    const totalPages = Math.ceil(totalCount / limit);

    // Load options for objective questions
    const questions = result.rows.map(row => {
      const { total_count, ...question } = row;
      return question;
    });

    // Fetch options for all objective questions in a single query
    const objectiveQuestionIds = questions
      .filter(q => q.type === 'OBJETIVA')
      .map(q => q.id);

    if (objectiveQuestionIds.length > 0) {
      const optionsQuery = `
        SELECT question_id, id, option_letter, content, is_correct, explanation
        FROM question_options
        WHERE question_id = ANY($1)
        ORDER BY question_id, option_letter
      `;
      
      const optionsResult = await pool.query(optionsQuery, [objectiveQuestionIds]);
      
      // Group options by question_id
      const optionsByQuestionId = {};
      optionsResult.rows.forEach(option => {
        if (!optionsByQuestionId[option.question_id]) {
          optionsByQuestionId[option.question_id] = [];
        }
        optionsByQuestionId[option.question_id].push(option);
      });

      // Add options to questions
      questions.forEach(question => {
        if (question.type === 'OBJETIVA') {
          question.options = optionsByQuestionId[question.id] || [];
        }
      });
    }

    return {
      questions,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  }

  /**
   * Get question by ID with options
   * @param {string} questionId - Question UUID
   * @param {string} userId - User ID for personalized data
   * @returns {Object} Question with options and user stats
   */
  static async findById(questionId, userId = null) {
    let userJoins = '';
    let userFields = 'null as is_favorite, null as user_answered_correctly';
    
    if (userId) {
      userJoins = `
        LEFT JOIN user_question_stats uqs ON q.id = uqs.question_id AND uqs.user_id = $2
        LEFT JOIN user_favorite_questions ufq ON q.id = ufq.question_id AND ufq.user_id = $3
      `;
      userFields = `
        CASE WHEN ufq.id IS NOT NULL THEN true ELSE false END as is_favorite,
        uqs.is_correct as user_answered_correctly
      `;
    }

    const query = `
      SELECT 
        q.*,
        ${userFields}
      FROM questions q
      ${userJoins}
      WHERE q.id = $1
    `;

    const params = userId ? [questionId, userId, userId] : [questionId];
    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return null;
    }

    const question = result.rows[0];

    // Get question options if it's an objective question
    if (question.type === 'OBJETIVA') {
      const optionsResult = await pool.query(
        'SELECT * FROM question_options WHERE question_id = $1 ORDER BY option_letter',
        [questionId]
      );
      question.options = optionsResult.rows;
    }

    return question;
  }

  /**
   * Submit answer to a question
   * @param {string} questionId - Question UUID
   * @param {string} userId - User UUID
   * @param {boolean} isCorrect - Whether the answer is correct
   * @param {number} timeSpentSeconds - Time spent answering
   * @returns {Object} Answer submission result
   */
  static async submitAnswer(questionId, userId, isCorrect, timeSpentSeconds = null) {
    const query = `
      INSERT INTO user_question_stats (user_id, question_id, is_correct, time_spent_seconds)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, question_id)
      DO UPDATE SET
        is_correct = $3,
        time_spent_seconds = $4,
        answered_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const result = await pool.query(query, [userId, questionId, isCorrect, timeSpentSeconds]);
    return result.rows[0];
  }

  /**
   * Toggle favorite status of a question
   * @param {string} questionId - Question UUID
   * @param {string} userId - User UUID
   * @returns {Object} Favorite status result
   */
  static async toggleFavorite(questionId, userId) {
    // Check if already favorited
    const checkQuery = `
      SELECT id FROM user_favorite_questions 
      WHERE user_id = $1 AND question_id = $2
    `;
    
    const existing = await pool.query(checkQuery, [userId, questionId]);
    
    if (existing.rows.length > 0) {
      // Remove from favorites
      await pool.query(
        'DELETE FROM user_favorite_questions WHERE user_id = $1 AND question_id = $2',
        [userId, questionId]
      );
      return { isFavorite: false };
    } else {
      // Add to favorites
      await pool.query(
        'INSERT INTO user_favorite_questions (user_id, question_id) VALUES ($1, $2)',
        [userId, questionId]
      );
      return { isFavorite: true };
    }
  }

  /**
   * Get question statistics
   * @param {Object} filters - Optional category filter
   * @returns {Object} Question statistics
   */
  static async getStats(filters = {}) {
    let whereCondition = '1=1';
    let queryParams = [];

    if (filters.category) {
      whereCondition = 'q.category = $1';
      queryParams.push(filters.category);
    }

    const query = `
      SELECT 
        COUNT(*) as total_questions,
        COUNT(uqs.id) as total_responses,
        COALESCE(AVG(CASE WHEN uqs.is_correct = false THEN 100.0 ELSE 0.0 END), 0) as average_error_rate,
        json_object_agg(q.category, category_counts.count) FILTER (WHERE category_counts.count IS NOT NULL) as by_category,
        json_object_agg(q.difficulty, difficulty_counts.count) FILTER (WHERE difficulty_counts.count IS NOT NULL) as by_difficulty
      FROM questions q
      LEFT JOIN user_question_stats uqs ON q.id = uqs.question_id
      LEFT JOIN (
        SELECT category, COUNT(*) as count 
        FROM questions 
        WHERE ${whereCondition}
        GROUP BY category
      ) category_counts ON q.category = category_counts.category
      LEFT JOIN (
        SELECT difficulty, COUNT(*) as count 
        FROM questions 
        WHERE ${whereCondition}
        GROUP BY difficulty
      ) difficulty_counts ON q.difficulty = difficulty_counts.difficulty
      WHERE ${whereCondition}
    `;

    const result = await pool.query(query, queryParams);
    return result.rows[0];
  }

  /**
   * Get user's question history
   * @param {string} userId - User UUID
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Object} User's question history with pagination
   */
  static async getUserHistory(userId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const query = `
      SELECT 
        q.id,
        q.title,
        q.category,
        q.difficulty,
        q.subject_area,
        uqs.is_correct,
        uqs.answered_at,
        uqs.time_spent_seconds,
        COUNT(*) OVER() as total_count
      FROM user_question_stats uqs
      JOIN questions q ON uqs.question_id = q.id
      WHERE uqs.user_id = $1
      ORDER BY uqs.answered_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await pool.query(query, [userId, limit, offset]);

    const totalCount = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;
    const totalPages = Math.ceil(totalCount / limit);

    return {
      history: result.rows.map(row => {
        const { total_count, ...record } = row;
        return record;
      }),
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  }
}

export default Question;