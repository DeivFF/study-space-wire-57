import pool from '../config/database.js';

export const getLessonExercises = async (req, res) => {
  try {
    const { id: lessonId } = req.params;
    const userId = req.user.id;

    const lessonCheck = await pool.query(
      'SELECT id FROM lessons WHERE id = $1 AND user_id = $2',
      [lessonId, userId]
    );

    if (lessonCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Lesson not found' });
    }

    const result = await pool.query(
      `SELECT * FROM lesson_exercises WHERE lesson_id = $1 ORDER BY created_at DESC`,
      [lessonId]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching exercises:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const createExercise = async (req, res) => {
  try {
    const { id: lessonId } = req.params;
    const userId = req.user.id;
    const { question_text, question_type, options, correct_answer, explanation, difficulty = 'medio', tags = [] } = req.body;

    const lessonCheck = await pool.query(
      'SELECT id FROM lessons WHERE id = $1 AND user_id = $2',
      [lessonId, userId]
    );

    if (lessonCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Lesson not found' });
    }

    const result = await pool.query(
      `INSERT INTO lesson_exercises (lesson_id, user_id, question_text, question_type, options, correct_answer, explanation, difficulty, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [lessonId, userId, question_text, question_type, JSON.stringify(options), correct_answer || '', explanation, difficulty, tags]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating exercise:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const updateExercise = async (req, res) => {
  try {
    const { exerciseId } = req.params;
    const userId = req.user.id;
    const { question_text, question_type, options, correct_answer, explanation, difficulty, tags } = req.body;

    // Check exercise access via lesson
    const exerciseCheck = await pool.query(`
      SELECT e.id FROM lesson_exercises e
      JOIN lessons l ON e.lesson_id = l.id
      WHERE e.id = $1 AND l.user_id = $2
    `, [exerciseId, userId]);

    if (exerciseCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Exercise not found' });
    }

    const updates = [];
    const values = [];
    let paramIndex = 1;
    if (question_text !== undefined) { updates.push(`question_text = $${paramIndex++}`); values.push(question_text); }
    if (question_type !== undefined) { updates.push(`question_type = $${paramIndex++}`); values.push(question_type); }
    if (options !== undefined) { updates.push(`options = $${paramIndex++}`); values.push(JSON.stringify(options)); }
    if (correct_answer !== undefined) { updates.push(`correct_answer = $${paramIndex++}`); values.push(correct_answer); }
    if (explanation !== undefined) { updates.push(`explanation = $${paramIndex++}`); values.push(explanation); }
    if (difficulty !== undefined) { updates.push(`difficulty = $${paramIndex++}`); values.push(difficulty); }
    if (tags !== undefined) { updates.push(`tags = $${paramIndex++}`); values.push(tags); }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    values.push(exerciseId);
    const query = `UPDATE lesson_exercises SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    
    const result = await pool.query(query, values);
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating exercise:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const deleteExercise = async (req, res) => {
  try {
    const { exerciseId } = req.params;
    const userId = req.user.id;

    // Check exercise access via lesson
    const exerciseCheck = await pool.query(`
      SELECT e.id FROM lesson_exercises e
      JOIN lessons l ON e.lesson_id = l.id
      WHERE e.id = $1 AND l.user_id = $2
    `, [exerciseId, userId]);

    if (exerciseCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Exercise not found' });
    }

    await pool.query('DELETE FROM lesson_exercises WHERE id = $1', [exerciseId]);
    
    res.json({
      success: true,
      message: 'Exercise deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting exercise:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const attemptExercise = async (req, res) => {
  try {
    const { exerciseId } = req.params;
    const userId = req.user.id;
    const { userAnswer, timeSpent } = req.body;

    // Get exercise with lesson check
    const exerciseResult = await pool.query(`
      SELECT e.*, l.id as lesson_id FROM lesson_exercises e
      JOIN lessons l ON e.lesson_id = l.id
      WHERE e.id = $1 AND l.user_id = $2
    `, [exerciseId, userId]);

    if (exerciseResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Exercise not found' });
    }

    const exercise = exerciseResult.rows[0];
    let isCorrect = null;
    let normalizedAnswer = String(userAnswer || '');

    // Calculate correctness based on exercise type
    if (exercise.question_type === 'multiple_choice' || exercise.question_type === 'mcq') {
      const correctIndex = parseInt(exercise.correct_answer) || 0;
      const userIndex = parseInt(normalizedAnswer) || 0;
      isCorrect = correctIndex === userIndex;
    } else if (exercise.question_type === 'truefalse' || exercise.question_type === 'true_false') {
      const correctAnswer = String(exercise.correct_answer).toLowerCase();
      const userAnswerLower = normalizedAnswer.toLowerCase();
      
      // Normalize answers to 0/1
      let correctNorm = correctAnswer === 'true' || correctAnswer === '1' || correctAnswer === 'verdadeiro' ? '1' : '0';
      let userNorm = userAnswerLower === 'true' || userAnswerLower === '1' || userAnswerLower === 'verdadeiro' ? '1' : '0';
      
      isCorrect = correctNorm === userNorm;
    } else if (exercise.question_type === 'essay') {
      // No automatic correction for essays, set as pending/manual
      isCorrect = false;
    }

    // Save attempt
    await pool.query(
      'INSERT INTO exercise_attempts (exercise_id, user_id, user_answer, is_correct, time_spent_seconds) VALUES ($1, $2, $3, $4, $5)',
      [exerciseId, userId, normalizedAnswer, isCorrect, timeSpent || null]
    );

    // Log activity
    const { logActivity } = await import('./activityLogController.js');
    await logActivity(
      exercise.lesson_id,
      userId,
      'exercise_completed',
      `Exercício realizado`,
      timeSpent || null,
      0,
      {
        exerciseId,
        userAnswer: normalizedAnswer,
        correctAnswer: exercise.correct_answer,
        isCorrect,
        timeSpent: timeSpent || 0,
        difficulty: exercise.difficulty,
        questionType: exercise.question_type
      }
    );

    res.json({
      success: true,
      data: {
        correct: isCorrect,
        explanation: exercise.explanation || undefined
      }
    });
  } catch (error) {
    console.error('Error attempting exercise:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const getExerciseStats = async (req, res) => {
  try {
    const { id: lessonId } = req.params;
    const userId = req.user.id;

    // Check lesson access
    const lessonCheck = await pool.query(
      'SELECT id FROM lessons WHERE id = $1 AND user_id = $2',
      [lessonId, userId]
    );

    if (lessonCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Lesson not found' });
    }

    // Get exercise stats
    const statsResult = await pool.query(`
      SELECT 
        COUNT(DISTINCT e.id) as total_exercises,
        COUNT(ea.id) as total_attempts,
        COUNT(CASE WHEN ea.is_correct = true THEN 1 END) as correct_attempts,
        AVG(ea.time_spent) as avg_time_spent
      FROM lesson_exercises e
      LEFT JOIN exercise_attempts ea ON e.id = ea.exercise_id AND ea.user_id = $2
      WHERE e.lesson_id = $1
    `, [lessonId, userId]);

    const stats = statsResult.rows[0];
    const accuracy = stats.total_attempts > 0 ? 
      Math.round((stats.correct_attempts / stats.total_attempts) * 100) : 0;

    res.json({
      success: true,
      data: {
        total_exercises: parseInt(stats.total_exercises) || 0,
        total_attempts: parseInt(stats.total_attempts) || 0,
        accuracy,
        avg_time_spent: parseFloat(stats.avg_time_spent) || 0
      }
    });
  } catch (error) {
    console.error('Error getting exercise stats:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};