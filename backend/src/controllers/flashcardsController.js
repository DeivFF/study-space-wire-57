import pool from '../config/database.js';
import { asyncHandler } from '../utils/studyValidation.js';
import { AppError } from '../utils/studyValidation.js';
import crypto from 'crypto';

/**
 * @desc    Get lesson flashcards
 * @route   GET /api/lessons/:id/flashcards
 * @access  Private
 */
export const getLessonFlashcards = asyncHandler(async (req, res) => {
  const { id: lessonId } = req.params;
  const userId = req.user.id;
  const { status = 'all', limit = 50, offset = 0 } = req.query;

  // Verify lesson access
  const lessonCheck = await pool.query(
    'SELECT id FROM lessons WHERE id = $1 AND user_id = $2 AND is_active = true',
    [lessonId, userId]
  );

  if (lessonCheck.rows.length === 0) {
    throw new AppError('Lesson not found or access denied', 404);
  }

  // Build query with status filter
  let whereClause = 'lesson_id = $1 AND user_id = $2';
  let queryParams = [lessonId, userId];
  let paramIndex = 3;

  if (status === 'due') {
    whereClause += ` AND next_review_date <= CURRENT_TIMESTAMP`;
  } else if (status === 'new') {
    whereClause += ` AND total_reviews = 0`;
  } else if (status === 'mastered') {
    whereClause += ` AND status = 'mastered'`;
  }

  queryParams.push(limit, offset);

  const query = `
    SELECT 
      id, front_content, back_content, tags,
      ease_factor, interval_days, next_review_date,
      total_reviews, correct_reviews, status,
      CASE 
        WHEN next_review_date <= CURRENT_TIMESTAMP THEN 'due'
        WHEN total_reviews = 0 THEN 'new'
        WHEN status = 'mastered' THEN 'mastered'
        ELSE 'learning'
      END as current_status,
      created_at, updated_at
    FROM lesson_flashcards
    WHERE ${whereClause}
    ORDER BY 
      CASE 
        WHEN next_review_date <= CURRENT_TIMESTAMP THEN next_review_date 
        ELSE NULL 
      END ASC NULLS LAST,
      created_at DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;

  const result = await pool.query(query, queryParams);

  // Get statistics
  const statsQuery = `
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE next_review_date <= CURRENT_TIMESTAMP) as due,
      COUNT(*) FILTER (WHERE total_reviews = 0) as new,
      COUNT(*) FILTER (WHERE status = 'mastered') as mastered,
      AVG(ease_factor)::DECIMAL(4,2) as avg_ease_factor,
      SUM(total_reviews) as total_reviews,
      SUM(correct_reviews) as correct_reviews
    FROM lesson_flashcards
    WHERE lesson_id = $1 AND user_id = $2
  `;
  const statsResult = await pool.query(statsQuery, [lessonId, userId]);

  res.json({
    success: true,
    data: {
      flashcards: result.rows,
      statistics: statsResult.rows[0],
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: result.rows.length === parseInt(limit)
      }
    }
  });
});

/**
 * @desc    Create flashcard
 * @route   POST /api/lessons/:id/flashcards
 * @access  Private
 */
export const createFlashcard = asyncHandler(async (req, res) => {
  const { id: lessonId } = req.params;
  const userId = req.user.id;
  const { front_content, back_content, tags = [] } = req.body;

  // Verify lesson access
  const lessonCheck = await pool.query(
    'SELECT title FROM lessons WHERE id = $1 AND user_id = $2 AND is_active = true',
    [lessonId, userId]
  );

  if (lessonCheck.rows.length === 0) {
    throw new AppError('Lesson not found or access denied', 404);
  }

  // Create flashcard
  const result = await pool.query(`
    INSERT INTO lesson_flashcards (
      lesson_id, user_id, front_content, back_content, tags,
      ease_factor, interval_days, next_review_date, status
    ) VALUES ($1, $2, $3, $4, $5, 2.50, 1, CURRENT_TIMESTAMP, 'new')
    RETURNING *
  `, [lessonId, userId, front_content, back_content, tags]);

  res.status(201).json({
    success: true,
    message: 'Flashcard created successfully',
    data: result.rows[0]
  });
});

/**
 * @desc    Update flashcard
 * @route   PUT /api/flashcards/:id
 * @access  Private
 */
export const updateFlashcard = asyncHandler(async (req, res) => {
  const { id: flashcardId } = req.params;
  const userId = req.user.id;
  const { front_content, back_content, tags } = req.body;

  const updateFields = [];
  const updateValues = [];
  let paramIndex = 1;

  if (front_content !== undefined) {
    updateFields.push(`front_content = $${paramIndex++}`);
    updateValues.push(front_content);
  }
  if (back_content !== undefined) {
    updateFields.push(`back_content = $${paramIndex++}`);
    updateValues.push(back_content);
  }
  if (tags !== undefined) {
    updateFields.push(`tags = $${paramIndex++}`);
    updateValues.push(tags);
  }

  if (updateFields.length === 0) {
    throw new AppError('No fields to update', 400);
  }

  updateValues.push(flashcardId, userId);

  const updateQuery = `
    UPDATE lesson_flashcards 
    SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
    WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
    RETURNING *
  `;

  const result = await pool.query(updateQuery, updateValues);

  if (result.rows.length === 0) {
    throw new AppError('Flashcard not found or access denied', 404);
  }

  res.json({
    success: true,
    message: 'Flashcard updated successfully',
    data: result.rows[0]
  });
});

/**
 * @desc    Delete flashcard
 * @route   DELETE /api/flashcards/:id
 * @access  Private
 */
export const deleteFlashcard = asyncHandler(async (req, res) => {
  const { id: flashcardId } = req.params;
  const userId = req.user.id;

  const result = await pool.query(
    'DELETE FROM lesson_flashcards WHERE id = $1 AND user_id = $2 RETURNING lesson_id',
    [flashcardId, userId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Flashcard not found or access denied', 404);
  }

  res.json({
    success: true,
    message: 'Flashcard deleted successfully'
  });
});

/**
 * @desc    Get due flashcards for study session
 * @route   GET /api/flashcards/due
 * @access  Private
 */
export const getDueFlashcards = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { lesson_id = null, limit = 20 } = req.query;

  let whereClause = 'fc.user_id = $1 AND fc.next_review_date <= CURRENT_TIMESTAMP';
  let queryParams = [userId];
  let paramIndex = 2;

  if (lesson_id) {
    whereClause += ` AND fc.lesson_id = $${paramIndex++}`;
    queryParams.push(lesson_id);
  }

  queryParams.push(limit);

  const query = `
    SELECT 
      fc.*,
      l.title as lesson_title,
      s.name as subject_name,
      st.name as study_type_name
    FROM lesson_flashcards fc
    JOIN lessons l ON fc.lesson_id = l.id
    JOIN subjects s ON l.subject_id = s.id
    JOIN study_types st ON s.study_type_id = st.id
    WHERE ${whereClause}
    ORDER BY fc.next_review_date ASC
    LIMIT $${paramIndex++}
  `;

  const result = await pool.query(query, queryParams);

  res.json({
    success: true,
    data: result.rows
  });
});

/**
 * @desc    Review flashcard (SRS algorithm)
 * @route   POST /api/flashcards/:id/review
 * @access  Private
 */
export const reviewFlashcard = asyncHandler(async (req, res) => {
  const { id: flashcardId } = req.params;
  const userId = req.user.id;
  const { quality } = req.body; // quality: 0-5 (SM-2 algorithm)

  // Validate quality
  if (quality < 0 || quality > 5) {
    throw new AppError('Quality must be between 0 and 5', 400);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get current flashcard state
    const flashcardResult = await client.query(
      'SELECT * FROM lesson_flashcards WHERE id = $1 AND user_id = $2',
      [flashcardId, userId]
    );

    if (flashcardResult.rows.length === 0) {
      throw new AppError('Flashcard not found or access denied', 404);
    }

    const flashcard = flashcardResult.rows[0];

    // Apply SM-2 algorithm
    const { 
      easeFactor, 
      intervalDays, 
      nextReviewDate, 
      wasCorrect 
    } = calculateSRS(flashcard, quality);

    // Determine status based on total_reviews and ease_factor
    let status = 'learning';
    if (easeFactor >= 2.5 && flashcard.total_reviews >= 5) {
      status = 'mastered';
    } else if (flashcard.total_reviews === 0) {
      status = 'new';
    }

    // Update flashcard
    const updateResult = await client.query(`
      UPDATE lesson_flashcards 
      SET 
        ease_factor = $3,
        interval_days = $4,
        next_review_date = $5,
        total_reviews = total_reviews + 1,
        correct_reviews = correct_reviews + $6,
        status = $7,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `, [
      flashcardId, userId, easeFactor, intervalDays, 
      nextReviewDate, wasCorrect ? 1 : 0, status
    ]);

    await client.query('COMMIT');

    const updatedFlashcard = updateResult.rows[0];

    res.json({
      success: true,
      message: 'Flashcard reviewed successfully',
      data: {
        flashcard_id: updatedFlashcard.id,
        quality,
        ease_factor: updatedFlashcard.ease_factor,
        interval_days: updatedFlashcard.interval_days,
        next_review_date: updatedFlashcard.next_review_date,
        total_reviews: updatedFlashcard.total_reviews,
        correct_reviews: updatedFlashcard.correct_reviews,
        status: updatedFlashcard.status
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

/**
 * @desc    Start flashcard study session
 * @route   GET /api/flashcards/session/start
 * @access  Private
 */
export const startStudySession = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { lesson_id = null, limit = 20 } = req.query;

  let whereClause = 'fc.user_id = $1 AND fc.next_review_date <= CURRENT_TIMESTAMP';
  let queryParams = [userId];
  let paramIndex = 2;

  if (lesson_id) {
    whereClause += ` AND fc.lesson_id = $${paramIndex++}`;
    queryParams.push(lesson_id);
  }

  queryParams.push(limit);

  const flashcardsResult = await pool.query(`
    SELECT 
      fc.*,
      l.title as lesson_title,
      s.name as subject_name,
      st.name as study_type_name
    FROM lesson_flashcards fc
    JOIN lessons l ON fc.lesson_id = l.id
    JOIN subjects s ON l.subject_id = s.id
    JOIN study_types st ON s.study_type_id = st.id
    WHERE ${whereClause}
    ORDER BY fc.next_review_date ASC
    LIMIT $${paramIndex++}
  `, queryParams);

  const flashcards = flashcardsResult.rows;
  const sessionId = crypto.randomUUID();

  res.json({
    success: true,
    data: {
      session_id: sessionId,
      flashcards,
      total_cards: flashcards.length,
      estimated_time_minutes: Math.ceil(flashcards.length * 0.5) // ~30s per card
    }
  });
});

// Helper function: SM-2 Algorithm implementation
function calculateSRS(currentCard, quality) {
  let { ease_factor: easeFactor, interval_days: intervalDays, total_reviews } = currentCard;
  
  if (quality >= 3) {
    // Correct response - calculate next interval based on current reviews
    const reviewCount = (total_reviews || 0) + 1;
    
    if (reviewCount === 1) {
      intervalDays = 1;
    } else if (reviewCount === 2) {
      intervalDays = 6;
    } else {
      intervalDays = Math.round(intervalDays * easeFactor);
    }
    
    // Update ease factor
    easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    easeFactor = Math.max(easeFactor, 1.3);
    
  } else {
    // Incorrect response - reset interval but keep some progress
    intervalDays = 1;
    easeFactor = Math.max(easeFactor - 0.2, 1.3);
  }

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + intervalDays);

  return {
    easeFactor,
    intervalDays,
    nextReviewDate,
    wasCorrect: quality >= 3
  };
}