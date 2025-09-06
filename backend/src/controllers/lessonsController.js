import pool from '../config/database.js';
import { asyncHandler } from '../utils/studyValidation.js';
import { AppError } from '../utils/studyValidation.js';

/**
 * @desc    Get lessons for a subject
 * @route   GET /api/subjects/:id/lessons
 * @access  Private
 */
export const getSubjectLessons = asyncHandler(async (req, res) => {
  const { id: subjectId } = req.params;
  const userId = req.user.id;
  const { 
    difficulty = 'all', 
    completed = 'all', 
    search = '',
    limit = 20,
    offset = 0 
  } = req.query;

  // Verify subject access
  const subjectCheck = await pool.query(`
    SELECT s.name, st.name as study_type_name 
    FROM subjects s 
    JOIN study_types st ON s.study_type_id = st.id
    WHERE s.id = $1 AND s.user_id = $2 AND s.is_active = true
  `, [subjectId, userId]);

  if (subjectCheck.rows.length === 0) {
    throw new AppError('Subject not found or access denied', 404);
  }

  // Build query with filters
  let whereConditions = ['l.subject_id = $1', 'l.user_id = $2', 'l.is_active = true'];
  let queryParams = [subjectId, userId];
  let paramIndex = 3;

  if (difficulty !== 'all') {
    whereConditions.push(`l.difficulty = $${paramIndex++}`);
    queryParams.push(difficulty);
  }

  if (completed === 'true') {
    whereConditions.push(`l.completed = true`);
  } else if (completed === 'false') {
    whereConditions.push(`l.completed = false`);
  }

  if (search.trim()) {
    whereConditions.push(`(l.title ILIKE $${paramIndex++} OR l.description ILIKE $${paramIndex++})`);
    queryParams.push(`%${search}%`, `%${search}%`);
  }

  queryParams.push(limit, offset);

  const query = `
    SELECT 
      l.*,
      COUNT(DISTINCT lf.id) as files_count,
      COUNT(DISTINCT ln.id) as notes_count,
      COUNT(DISTINCT fc.id) as flashcards_count,
      COUNT(DISTINCT CASE WHEN fc.next_review_date <= CURRENT_TIMESTAMP THEN fc.id END) as flashcards_due,
      COUNT(DISTINCT le.id) as exercises_count
    FROM lessons l
    LEFT JOIN lesson_files lf ON l.id = lf.lesson_id
    LEFT JOIN lesson_notes ln ON l.id = ln.lesson_id
    LEFT JOIN lesson_flashcards fc ON l.id = fc.lesson_id
    LEFT JOIN lesson_exercises le ON l.id = le.lesson_id
    WHERE ${whereConditions.join(' AND ')}
    GROUP BY l.id
    ORDER BY l.order_index ASC, l.created_at DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;

  const result = await pool.query(query, queryParams);

  // Get total count for pagination
  const countQueryParams = queryParams.slice(0, -2); // Remove limit and offset
  const countQuery = `
    SELECT COUNT(*) as total
    FROM lessons l
    WHERE ${whereConditions.join(' AND ')}
  `;
  const countResult = await pool.query(countQuery, countQueryParams);

  // If it's a simple request (no filters), return just the lessons array
  const isSimpleRequest = difficulty === 'all' && completed === 'all' && !search.trim() && limit == 20 && offset == 0;
  
  if (isSimpleRequest) {
    res.json({
      success: true,
      data: result.rows
    });
  } else {
    res.json({
      success: true,
      data: {
        lessons: result.rows,
        pagination: {
          total: parseInt(countResult.rows[0].total),
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: result.rows.length === parseInt(limit)
        },
        subject: {
          id: subjectId,
          name: subjectCheck.rows[0].name,
          study_type_name: subjectCheck.rows[0].study_type_name
        }
      }
    });
  }
});

/**
 * @desc    Get complete lesson data (for LessonDetail component)
 * @route   GET /api/lessons/:id
 * @access  Private
 */
export const getLessonCompleteData = asyncHandler(async (req, res) => {
  const { id: lessonId } = req.params;
  const userId = req.user.id;

  // Get lesson with subject and study type info
  const lessonResult = await pool.query(`
    SELECT 
      l.*,
      s.name as subject_name,
      s.color as subject_color,
      st.name as study_type_name,
      st.color as study_type_color,
      st.icon as study_type_icon
    FROM lessons l
    JOIN subjects s ON l.subject_id = s.id
    JOIN study_types st ON s.study_type_id = st.id
    WHERE l.id = $1 AND l.user_id = $2 AND l.is_active = true
  `, [lessonId, userId]);

  if (lessonResult.rows.length === 0) {
    throw new AppError('Lesson not found or access denied', 404);
  }

  const lesson = lessonResult.rows[0];

  // Get lesson statistics
  const statsResult = await pool.query(`
    SELECT 
      COUNT(DISTINCT lf.id) as files_count,
      COUNT(DISTINCT CASE WHEN lf.file_type = 'pdf' THEN lf.id END) as pdf_count,
      COUNT(DISTINCT CASE WHEN lf.file_type = 'audio' THEN lf.id END) as audio_count,
      COUNT(DISTINCT CASE WHEN lf.file_type = 'image' THEN lf.id END) as image_count,
      COUNT(DISTINCT ln.id) as notes_count,
      COUNT(DISTINCT fc.id) as flashcards_count,
      COUNT(DISTINCT CASE WHEN fc.next_review_date <= CURRENT_TIMESTAMP THEN fc.id END) as flashcards_due,
      COUNT(DISTINCT CASE WHEN fc.status = 'mastered' THEN fc.id END) as flashcards_mastered,
      COUNT(DISTINCT le.id) as exercises_count,
      COUNT(DISTINCT ea.id) as total_exercise_attempts,
      COUNT(DISTINCT CASE WHEN ea.is_correct = true THEN ea.id END) as correct_exercise_attempts,
      COUNT(DISTINCT al.id) as total_activities,
      SUM(COALESCE(al.duration_seconds, 0)) as total_study_time_seconds,
      MAX(al.created_at) as last_activity_at
    FROM lessons l
    LEFT JOIN lesson_files lf ON l.id = lf.lesson_id
    LEFT JOIN lesson_notes ln ON l.id = ln.lesson_id
    LEFT JOIN lesson_flashcards fc ON l.id = fc.lesson_id
    LEFT JOIN lesson_exercises le ON l.id = le.lesson_id
    LEFT JOIN exercise_attempts ea ON le.id = ea.exercise_id
    LEFT JOIN lesson_activity_log al ON l.id = al.lesson_id
    WHERE l.id = $1 AND l.user_id = $2
    GROUP BY l.id
  `, [lessonId, userId]);

  const stats = statsResult.rows[0] || {};

  // Compile complete lesson data
  const lessonData = {
    ...lesson,
    statistics: {
      files_count: parseInt(stats.files_count || 0),
      pdf_count: parseInt(stats.pdf_count || 0),
      audio_count: parseInt(stats.audio_count || 0),
      image_count: parseInt(stats.image_count || 0),
      notes_count: parseInt(stats.notes_count || 0),
      flashcards_count: parseInt(stats.flashcards_count || 0),
      flashcards_due: parseInt(stats.flashcards_due || 0),
      flashcards_mastered: parseInt(stats.flashcards_mastered || 0),
      exercises_count: parseInt(stats.exercises_count || 0),
      total_exercise_attempts: parseInt(stats.total_exercise_attempts || 0),
      correct_exercise_attempts: parseInt(stats.correct_exercise_attempts || 0),
      exercise_accuracy: stats.total_exercise_attempts > 0 
        ? Math.round((stats.correct_exercise_attempts / stats.total_exercise_attempts) * 100)
        : 0,
      total_activities: parseInt(stats.total_activities || 0),
      total_study_time_seconds: parseInt(stats.total_study_time_seconds || 0),
      last_activity_at: stats.last_activity_at
    }
  };

  res.json({
    success: true,
    data: lessonData
  });
});

/**
 * @desc    Create lesson
 * @route   POST /api/subjects/:id/lessons
 * @access  Private
 */
export const createLesson = asyncHandler(async (req, res) => {
  const { id: subjectId } = req.params;
  const userId = req.user.id;
  const { title, description, content, difficulty = 'medio', duration_minutes } = req.body;

  // Verify subject access
  const subjectCheck = await pool.query(
    'SELECT id FROM subjects WHERE id = $1 AND user_id = $2 AND is_active = true',
    [subjectId, userId]
  );

  if (subjectCheck.rows.length === 0) {
    throw new AppError('Subject not found or access denied', 404);
  }

  // Get next order index
  const orderResult = await pool.query(
    'SELECT COALESCE(MAX(order_index), 0) + 1 as next_order FROM lessons WHERE subject_id = $1 AND user_id = $2 AND is_active = true',
    [subjectId, userId]
  );
  const orderIndex = orderResult.rows[0].next_order;

  // Create lesson
  const result = await pool.query(`
    INSERT INTO lessons (
      title, description, content, subject_id, user_id, 
      difficulty, duration_minutes, order_index
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `, [title, description, content, subjectId, userId, difficulty, duration_minutes, orderIndex]);

  res.status(201).json({
    success: true,
    message: 'Lesson created successfully',
    data: result.rows[0]
  });
});

/**
 * @desc    Update lesson
 * @route   PUT /api/lessons/:id
 * @access  Private
 */
export const updateLesson = asyncHandler(async (req, res) => {
  const { id: lessonId } = req.params;
  const userId = req.user.id;
  const { title, description, content, difficulty, progress, accuracy, completed, duration_minutes } = req.body;

  const updateFields = [];
  const updateValues = [];
  let paramIndex = 1;

  if (title !== undefined) {
    updateFields.push(`title = $${paramIndex++}`);
    updateValues.push(title);
  }
  if (description !== undefined) {
    updateFields.push(`description = $${paramIndex++}`);
    updateValues.push(description);
  }
  if (content !== undefined) {
    updateFields.push(`content = $${paramIndex++}`);
    updateValues.push(content);
  }
  if (difficulty !== undefined) {
    updateFields.push(`difficulty = $${paramIndex++}`);
    updateValues.push(difficulty);
  }
  if (progress !== undefined) {
    updateFields.push(`progress = $${paramIndex++}`);
    updateValues.push(progress);
  }
  if (accuracy !== undefined) {
    updateFields.push(`accuracy = $${paramIndex++}`);
    updateValues.push(accuracy);
  }
  if (completed !== undefined) {
    updateFields.push(`completed = $${paramIndex++}`);
    updateValues.push(completed);
  }
  if (duration_minutes !== undefined) {
    updateFields.push(`duration_minutes = $${paramIndex++}`);
    updateValues.push(duration_minutes);
  }

  if (updateFields.length === 0) {
    throw new AppError('No fields to update', 400);
  }

  updateValues.push(lessonId, userId);

  const updateQuery = `
    UPDATE lessons 
    SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
    WHERE id = $${paramIndex++} AND user_id = $${paramIndex++} AND is_active = true
    RETURNING *
  `;

  const result = await pool.query(updateQuery, updateValues);

  if (result.rows.length === 0) {
    throw new AppError('Lesson not found or access denied', 404);
  }

  res.json({
    success: true,
    message: 'Lesson updated successfully',
    data: result.rows[0]
  });
});

/**
 * @desc    Delete lesson (soft delete)
 * @route   DELETE /api/lessons/:id
 * @access  Private
 */
export const deleteLesson = asyncHandler(async (req, res) => {
  const { id: lessonId } = req.params;
  const userId = req.user.id;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Soft delete lesson
    const result = await client.query(
      'UPDATE lessons SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2 AND is_active = true RETURNING title',
      [lessonId, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Lesson not found or access denied', 404);
    }

    // The CASCADE foreign key relationships will handle marking lesson content as inactive through database triggers

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Lesson deleted successfully'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});