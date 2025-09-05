import pool from '../config/database.js';
import { asyncHandler } from '../utils/studyValidation.js';
import { AppError } from '../utils/studyValidation.js';

/**
 * @desc    Get lesson activity log
 * @route   GET /api/lessons/:id/activity
 * @access  Private
 */
export const getLessonActivity = asyncHandler(async (req, res) => {
  const { id: lessonId } = req.params;
  const userId = req.user.id;
  const { limit = 50, offset = 0, type = 'all' } = req.query;

  // Verify lesson access
  const lessonCheck = await pool.query(
    'SELECT id FROM lessons WHERE id = $1 AND user_id = $2 AND is_active = true',
    [lessonId, userId]
  );

  if (lessonCheck.rows.length === 0) {
    throw new AppError('Lesson not found or access denied', 404);
  }

  // Build query with type filter
  let whereClause = 'lesson_id = $1 AND user_id = $2';
  let queryParams = [lessonId, userId];
  let paramIndex = 3;

  if (type !== 'all') {
    whereClause += ` AND activity_type = $${paramIndex++}`;
    queryParams.push(type);
  }

  queryParams.push(limit, offset);

  const query = `
    SELECT 
      id,
      activity_type as type,
      details,
      duration_seconds as duration,
      points_earned as points,
      metadata as data,
      created_at as timestamp
    FROM lesson_activity_log
    WHERE ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;

  const result = await pool.query(query, queryParams);

  res.json({
    success: true,
    data: result.rows
  });
});

/**
 * @desc    Get user activity across all lessons
 * @route   GET /api/users/activity
 * @access  Private
 */
export const getUserActivity = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { limit = 100, offset = 0, days = 30 } = req.query;

  const query = `
    SELECT 
      al.id,
      al.activity_type as type,
      al.details,
      al.duration_seconds as duration,
      al.points_earned as points,
      al.metadata as data,
      al.created_at as timestamp,
      l.title as lesson_title,
      s.name as subject_name,
      st.name as study_type_name
    FROM lesson_activity_log al
    JOIN lessons l ON al.lesson_id = l.id
    JOIN subjects s ON l.subject_id = s.id
    JOIN study_types st ON s.study_type_id = st.id
    WHERE al.user_id = $1 
    AND al.created_at >= CURRENT_DATE - INTERVAL '${parseInt(days)} days'
    ORDER BY al.created_at DESC
    LIMIT $2 OFFSET $3
  `;

  const result = await pool.query(query, [userId, limit, offset]);

  // Get activity summary for the period
  const summaryQuery = `
    SELECT 
      COUNT(*) as total_activities,
      COUNT(DISTINCT lesson_id) as lessons_studied,
      SUM(COALESCE(duration_seconds, 0)) as total_time_seconds,
      SUM(COALESCE(points_earned, 0)) as total_points_earned,
      COUNT(*) FILTER (WHERE activity_type = 'file_upload') as files_uploaded,
      COUNT(*) FILTER (WHERE activity_type = 'note_created') as notes_created,
      COUNT(*) FILTER (WHERE activity_type = 'flashcard_reviewed') as flashcards_reviewed,
      COUNT(*) FILTER (WHERE activity_type = 'exercise_completed') as exercises_completed,
      COUNT(*) FILTER (WHERE activity_type = 'session_started') as sessions_started
    FROM lesson_activity_log
    WHERE user_id = $1 
    AND created_at >= CURRENT_DATE - INTERVAL '${parseInt(days)} days'
  `;

  const summaryResult = await pool.query(summaryQuery, [userId]);

  res.json({
    success: true,
    data: {
      activities: result.rows,
      summary: summaryResult.rows[0],
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: result.rows.length === parseInt(limit)
      }
    }
  });
});

/**
 * @desc    Clear lesson activity log
 * @route   DELETE /api/lessons/:id/activity
 * @access  Private
 */
export const clearLessonActivity = asyncHandler(async (req, res) => {
  const { id: lessonId } = req.params;
  const userId = req.user.id;

  // Verify lesson access
  const lessonCheck = await pool.query(
    'SELECT id FROM lessons WHERE id = $1 AND user_id = $2 AND is_active = true',
    [lessonId, userId]
  );

  if (lessonCheck.rows.length === 0) {
    throw new AppError('Lesson not found or access denied', 404);
  }

  const result = await pool.query(
    'DELETE FROM lesson_activity_log WHERE lesson_id = $1 AND user_id = $2 RETURNING COUNT(*)',
    [lessonId, userId]
  );

  res.json({
    success: true,
    message: `Activity history cleared successfully`
  });
});

/**
 * @desc    Log activity (internal service function)
 * @param   {string} lessonId
 * @param   {string} userId
 * @param   {string} activityType
 * @param   {string} details
 * @param   {number} duration - Duration in seconds
 * @param   {number} points - Points earned
 * @param   {object} metadata - Additional data
 */
export const logActivity = async (lessonId, userId, activityType, details, duration = null, points = null, metadata = null) => {
  try {
    await pool.query(`
      INSERT INTO lesson_activity_log (
        lesson_id, user_id, activity_type, details, 
        duration_seconds, points_earned, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [lessonId, userId, activityType, details, duration, points, metadata]);
  } catch (error) {
    console.error('Error logging activity:', error);
    // Don't throw error - activity logging should not break main functionality
  }
};