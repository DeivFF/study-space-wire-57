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
      return res.status(404).json({ error: 'Lesson not found' });
    }

    const result = await pool.query(
      `SELECT * FROM lesson_exercises WHERE lesson_id = $1 ORDER BY created_at DESC`,
      [lessonId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching exercises:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createExercise = async (req, res) => {
  try {
    const { id: lessonId } = req.params;
    const userId = req.user.id;
    const { title, question_text, question_type, options, correct_answer, explanation, difficulty = 'medio', tags = [], points = 10 } = req.body;

    const lessonCheck = await pool.query(
      'SELECT id FROM lessons WHERE id = $1 AND user_id = $2',
      [lessonId, userId]
    );

    if (lessonCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    const result = await pool.query(
      `INSERT INTO lesson_exercises (lesson_id, title, question_text, question_type, options, correct_answer, explanation, difficulty, tags, points)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [lessonId, title, question_text, question_type, JSON.stringify(options), correct_answer, explanation, difficulty, tags, points]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating exercise:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateExercise = async (req, res) => {
  res.json({ message: 'Update not implemented yet' });
};

export const deleteExercise = async (req, res) => {
  res.json({ message: 'Delete not implemented yet' });
};

export const attemptExercise = async (req, res) => {
  res.json({ message: 'Attempt not implemented yet' });
};

export const getExerciseStats = async (req, res) => {
  res.json({ total_exercises: 0, total_attempts: 0, accuracy: 0 });
};