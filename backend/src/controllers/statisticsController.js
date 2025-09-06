import pool from '../config/database.js';
import { asyncHandler } from '../utils/studyValidation.js';
import { AppError } from '../utils/studyValidation.js';

/**
 * @desc    Get lesson statistics
 * @route   GET /api/lessons/:id/statistics
 * @access  Private
 */
export const getLessonStatistics = asyncHandler(async (req, res) => {
  const { id: lessonId } = req.params;
  const userId = req.user.id;

  // Verify lesson access
  const lessonCheck = await pool.query(
    'SELECT title FROM lessons WHERE id = $1 AND user_id = $2 AND is_active = true',
    [lessonId, userId]
  );

  if (lessonCheck.rows.length === 0) {
    throw new AppError('Lesson not found or access denied', 404);
  }

  // Get comprehensive lesson statistics
  const statsResult = await pool.query(`
    SELECT 
      -- File statistics
      COUNT(DISTINCT lf.id) as files_count,
      COUNT(DISTINCT CASE WHEN lf.file_type = 'pdf' THEN lf.id END) as pdf_count,
      COUNT(DISTINCT CASE WHEN lf.file_type = 'audio' THEN lf.id END) as audio_count,
      COUNT(DISTINCT CASE WHEN lf.file_type = 'image' THEN lf.id END) as image_count,
      
      -- Note statistics
      COUNT(DISTINCT ln.id) as notes_count,
      
      -- Flashcard statistics
      COUNT(DISTINCT fc.id) as flashcards_count,
      COUNT(DISTINCT CASE WHEN fc.next_review_date <= CURRENT_TIMESTAMP THEN fc.id END) as flashcards_due,
      COUNT(DISTINCT CASE WHEN fc.status = 'mastered' THEN fc.id END) as flashcards_mastered,
      AVG(fc.ease_factor) as avg_flashcard_ease,
      SUM(fc.total_reviews) as total_flashcard_reviews,
      SUM(fc.correct_reviews) as correct_flashcard_reviews,
      
      -- Exercise statistics
      COUNT(DISTINCT le.id) as exercises_count,
      COUNT(DISTINCT ea.id) as total_exercise_attempts,
      COUNT(DISTINCT CASE WHEN ea.is_correct = true THEN ea.id END) as correct_exercise_attempts,
      
      -- Activity statistics
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

  // Calculate accuracy percentages
  const flashcardAccuracy = stats.total_flashcard_reviews > 0 
    ? Math.round((stats.correct_flashcard_reviews / stats.total_flashcard_reviews) * 100)
    : 0;
    
  const exerciseAccuracy = stats.total_exercise_attempts > 0 
    ? Math.round((stats.correct_exercise_attempts / stats.total_exercise_attempts) * 100)
    : 0;

  const response = {
    lesson_id: lessonId,
    lesson_title: lessonCheck.rows[0].title,
    files: {
      total: parseInt(stats.files_count || 0),
      pdf: parseInt(stats.pdf_count || 0),
      audio: parseInt(stats.audio_count || 0),
      image: parseInt(stats.image_count || 0)
    },
    notes: {
      total: parseInt(stats.notes_count || 0)
    },
    flashcards: {
      total: parseInt(stats.flashcards_count || 0),
      due: parseInt(stats.flashcards_due || 0),
      mastered: parseInt(stats.flashcards_mastered || 0),
      total_reviews: parseInt(stats.total_flashcard_reviews || 0),
      correct_reviews: parseInt(stats.correct_flashcard_reviews || 0),
      accuracy_percentage: flashcardAccuracy,
      avg_ease_factor: parseFloat((stats.avg_flashcard_ease || 2.5).toFixed(2))
    },
    exercises: {
      total: parseInt(stats.exercises_count || 0),
      total_attempts: parseInt(stats.total_exercise_attempts || 0),
      correct_attempts: parseInt(stats.correct_exercise_attempts || 0),
      accuracy_percentage: exerciseAccuracy
    },
    activity: {
      total_activities: parseInt(stats.total_activities || 0),
      total_study_time_seconds: parseInt(stats.total_study_time_seconds || 0),
      total_study_time_minutes: Math.round((stats.total_study_time_seconds || 0) / 60),
      last_activity_at: stats.last_activity_at
    }
  };

  res.json({
    success: true,
    data: response
  });
});

/**
 * @desc    Get lesson activity timeline
 * @route   GET /api/lessons/:id/activity
 * @access  Private
 */
export const getLessonActivity = asyncHandler(async (req, res) => {
  const { id: lessonId } = req.params;
  const userId = req.user.id;
  const { limit = 50, type = 'all' } = req.query;

  // Verify lesson access
  const lessonCheck = await pool.query(
    'SELECT title FROM lessons WHERE id = $1 AND user_id = $2 AND is_active = true',
    [lessonId, userId]
  );

  if (lessonCheck.rows.length === 0) {
    throw new AppError('Lesson not found or access denied', 404);
  }

  // Build query with type filter
  let whereClause = 'lesson_id = $1 AND user_id = $2';
  let queryParams = [lessonId, userId];

  if (type !== 'all') {
    whereClause += ` AND activity_type ILIKE $3`;
    queryParams.push(`%${type}%`);
    queryParams.push(limit);
  } else {
    queryParams.push(limit);
  }

  const query = `
    SELECT 
      id, activity_type, details, activity_data,
      session_id, duration_seconds, created_at
    FROM lesson_activity_log
    WHERE ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${queryParams.length}
  `;

  const result = await pool.query(query, queryParams);

  // Format activities for frontend
  const activities = result.rows.map(activity => ({
    id: activity.id,
    type: activity.activity_type,
    details: activity.details,
    data: activity.activity_data,
    timestamp: activity.created_at,
    sessionId: activity.session_id,
    duration: activity.duration_seconds,
  }));

  res.json({
    success: true,
    data: activities
  });
});

/**
 * @desc    Get subject statistics
 * @route   GET /api/subjects/:id/statistics
 * @access  Private
 */
export const getSubjectStatistics = asyncHandler(async (req, res) => {
  const { id: subjectId } = req.params;
  const userId = req.user.id;

  // Verify subject access
  const subjectCheck = await pool.query(
    'SELECT name FROM subjects WHERE id = $1 AND user_id = $2 AND is_active = true',
    [subjectId, userId]
  );

  if (subjectCheck.rows.length === 0) {
    throw new AppError('Subject not found or access denied', 404);
  }

  // Get subject statistics
  const statsResult = await pool.query(`
    SELECT 
      COUNT(DISTINCT l.id) as total_lessons,
      COUNT(DISTINCT CASE WHEN l.completed = true THEN l.id END) as completed_lessons,
      AVG(l.progress) as avg_lesson_progress,
      AVG(l.accuracy) as avg_lesson_accuracy,
      SUM(l.duration_minutes) as total_duration_minutes,
      
      -- Aggregated content statistics
      COUNT(DISTINCT lf.id) as total_files,
      COUNT(DISTINCT ln.id) as total_notes,
      COUNT(DISTINCT fc.id) as total_flashcards,
      COUNT(DISTINCT CASE WHEN fc.next_review_date <= CURRENT_TIMESTAMP THEN fc.id END) as flashcards_due,
      COUNT(DISTINCT le.id) as total_exercises,
      COUNT(DISTINCT ea.id) as total_exercise_attempts,
      COUNT(DISTINCT CASE WHEN ea.is_correct = true THEN ea.id END) as correct_exercise_attempts,
      
      MAX(al.created_at) as last_activity_at
      
    FROM lessons l
    LEFT JOIN lesson_files lf ON l.id = lf.lesson_id
    LEFT JOIN lesson_notes ln ON l.id = ln.lesson_id
    LEFT JOIN lesson_flashcards fc ON l.id = fc.lesson_id
    LEFT JOIN lesson_exercises le ON l.id = le.lesson_id
    LEFT JOIN exercise_attempts ea ON le.id = ea.exercise_id
    LEFT JOIN lesson_activity_log al ON l.id = al.lesson_id
    WHERE l.subject_id = $1 AND l.user_id = $2 AND l.is_active = true
  `, [subjectId, userId]);

  const stats = statsResult.rows[0] || {};

  const response = {
    subject_id: subjectId,
    subject_name: subjectCheck.rows[0].name,
    lessons: {
      total: parseInt(stats.total_lessons || 0),
      completed: parseInt(stats.completed_lessons || 0),
      completion_percentage: stats.total_lessons > 0 
        ? Math.round((stats.completed_lessons / stats.total_lessons) * 100)
        : 0,
      avg_progress: Math.round(parseFloat(stats.avg_lesson_progress || 0)),
      avg_accuracy: Math.round(parseFloat(stats.avg_lesson_accuracy || 0)),
      total_duration_minutes: parseInt(stats.total_duration_minutes || 0)
    },
    content: {
      files: parseInt(stats.total_files || 0),
      notes: parseInt(stats.total_notes || 0),
      flashcards: parseInt(stats.total_flashcards || 0),
      flashcards_due: parseInt(stats.flashcards_due || 0),
      exercises: parseInt(stats.total_exercises || 0)
    },
    performance: {
      total_exercise_attempts: parseInt(stats.total_exercise_attempts || 0),
      correct_exercise_attempts: parseInt(stats.correct_exercise_attempts || 0),
      exercise_accuracy: stats.total_exercise_attempts > 0 
        ? Math.round((stats.correct_exercise_attempts / stats.total_exercise_attempts) * 100)
        : 0,
      last_activity_at: stats.last_activity_at
    }
  };

  res.json({
    success: true,
    data: response
  });
});

/**
 * @desc    Get study type statistics
 * @route   GET /api/study-types/:id/statistics
 * @access  Private
 */
export const getStudyTypeStatistics = asyncHandler(async (req, res) => {
  const { id: studyTypeId } = req.params;
  const userId = req.user.id;

  // Verify study type access
  const studyTypeCheck = await pool.query(
    'SELECT name FROM study_types WHERE id = $1 AND user_id = $2 AND is_active = true',
    [studyTypeId, userId]
  );

  if (studyTypeCheck.rows.length === 0) {
    throw new AppError('Study type not found or access denied', 404);
  }

  // Get comprehensive study type statistics
  const statsResult = await pool.query(`
    SELECT 
      COUNT(DISTINCT s.id) as total_subjects,
      COUNT(DISTINCT l.id) as total_lessons,
      COUNT(DISTINCT CASE WHEN l.completed = true THEN l.id END) as completed_lessons,
      AVG(l.progress) as avg_lesson_progress,
      AVG(l.accuracy) as avg_lesson_accuracy,
      SUM(l.duration_minutes) as total_duration_minutes,
      
      -- Content statistics
      COUNT(DISTINCT lf.id) as total_files,
      COUNT(DISTINCT ln.id) as total_notes,
      COUNT(DISTINCT fc.id) as total_flashcards,
      COUNT(DISTINCT CASE WHEN fc.next_review_date <= CURRENT_TIMESTAMP THEN fc.id END) as flashcards_due,
      COUNT(DISTINCT le.id) as total_exercises,
      
      -- Performance statistics
      COUNT(DISTINCT ea.id) as total_exercise_attempts,
      COUNT(DISTINCT CASE WHEN ea.is_correct = true THEN ea.id END) as correct_exercise_attempts,
      COUNT(DISTINCT al.id) as total_activities,
      MAX(al.created_at) as last_activity_at
      
    FROM study_types st
    LEFT JOIN subjects s ON st.id = s.study_type_id AND s.is_active = true
    LEFT JOIN lessons l ON s.id = l.subject_id AND l.is_active = true
    LEFT JOIN lesson_files lf ON l.id = lf.lesson_id
    LEFT JOIN lesson_notes ln ON l.id = ln.lesson_id
    LEFT JOIN lesson_flashcards fc ON l.id = fc.lesson_id
    LEFT JOIN lesson_exercises le ON l.id = le.lesson_id
    LEFT JOIN exercise_attempts ea ON le.id = ea.exercise_id
    LEFT JOIN lesson_activity_log al ON l.id = al.lesson_id
    WHERE st.id = $1 AND st.user_id = $2
  `, [studyTypeId, userId]);

  const stats = statsResult.rows[0] || {};

  const response = {
    study_type_id: studyTypeId,
    study_type_name: studyTypeCheck.rows[0].name,
    overview: {
      subjects: parseInt(stats.total_subjects || 0),
      lessons: parseInt(stats.total_lessons || 0),
      completed_lessons: parseInt(stats.completed_lessons || 0),
      completion_percentage: stats.total_lessons > 0 
        ? Math.round((stats.completed_lessons / stats.total_lessons) * 100)
        : 0,
      avg_progress: Math.round(parseFloat(stats.avg_lesson_progress || 0)),
      avg_accuracy: Math.round(parseFloat(stats.avg_lesson_accuracy || 0)),
      total_duration_minutes: parseInt(stats.total_duration_minutes || 0)
    },
    content: {
      files: parseInt(stats.total_files || 0),
      notes: parseInt(stats.total_notes || 0),
      flashcards: parseInt(stats.total_flashcards || 0),
      flashcards_due: parseInt(stats.flashcards_due || 0),
      exercises: parseInt(stats.total_exercises || 0)
    },
    performance: {
      total_exercise_attempts: parseInt(stats.total_exercise_attempts || 0),
      correct_exercise_attempts: parseInt(stats.correct_exercise_attempts || 0),
      exercise_accuracy: stats.total_exercise_attempts > 0 
        ? Math.round((stats.correct_exercise_attempts / stats.total_exercise_attempts) * 100)
        : 0,
      total_activities: parseInt(stats.total_activities || 0),
      last_activity_at: stats.last_activity_at
    }
  };

  res.json({
    success: true,
    data: response
  });
});