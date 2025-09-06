import pool from '../config/database.js';
import { asyncHandler } from '../utils/studyValidation.js';
import { AppError } from '../utils/studyValidation.js';

/**
 * @desc    Get lesson notes
 * @route   GET /api/lessons/:id/notes
 * @access  Private
 */
export const getLessonNotes = asyncHandler(async (req, res) => {
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

  const result = await pool.query(`
    SELECT 
      id, title, content, tags, created_at, updated_at
    FROM lesson_notes
    WHERE lesson_id = $1 AND user_id = $2
    ORDER BY updated_at DESC
  `, [lessonId, userId]);

  res.json({
    success: true,
    data: result.rows
  });
});

/**
 * @desc    Create lesson note
 * @route   POST /api/lessons/:id/notes
 * @access  Private
 */
export const createNote = asyncHandler(async (req, res) => {
  const { id: lessonId } = req.params;
  const userId = req.user.id;
  const { title, content, tags = [] } = req.body;

  // Verify lesson access
  const lessonCheck = await pool.query(
    'SELECT title FROM lessons WHERE id = $1 AND user_id = $2 AND is_active = true',
    [lessonId, userId]
  );

  if (lessonCheck.rows.length === 0) {
    throw new AppError('Lesson not found or access denied', 404);
  }

  // Create note
  const result = await pool.query(`
    INSERT INTO lesson_notes (lesson_id, user_id, title, content, tags)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `, [lessonId, userId, title, content, tags]);

  res.status(201).json({
    success: true,
    message: 'Note created successfully',
    data: result.rows[0]
  });
});

/**
 * @desc    Update note
 * @route   PUT /api/notes/:id
 * @access  Private
 */
export const updateNote = asyncHandler(async (req, res) => {
  const { id: noteId } = req.params;
  const userId = req.user.id;
  const { title, content, tags } = req.body;

  const updateFields = [];
  const updateValues = [];
  let paramIndex = 1;

  if (title !== undefined) {
    updateFields.push(`title = $${paramIndex++}`);
    updateValues.push(title);
  }
  if (content !== undefined) {
    updateFields.push(`content = $${paramIndex++}`);
    updateValues.push(content);
  }
  if (tags !== undefined) {
    updateFields.push(`tags = $${paramIndex++}`);
    updateValues.push(tags);
  }

  if (updateFields.length === 0) {
    throw new AppError('No fields to update', 400);
  }

  updateValues.push(noteId, userId);

  const updateQuery = `
    UPDATE lesson_notes 
    SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
    WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
    RETURNING *
  `;

  const result = await pool.query(updateQuery, updateValues);

  if (result.rows.length === 0) {
    throw new AppError('Note not found or access denied', 404);
  }

  res.json({
    success: true,
    message: 'Note updated successfully',
    data: result.rows[0]
  });
});

/**
 * @desc    Delete note
 * @route   DELETE /api/notes/:id
 * @access  Private
 */
export const deleteNote = asyncHandler(async (req, res) => {
  const { id: noteId } = req.params;
  const userId = req.user.id;

  const result = await pool.query(
    'DELETE FROM lesson_notes WHERE id = $1 AND user_id = $2 RETURNING lesson_id',
    [noteId, userId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Note not found or access denied', 404);
  }

  res.json({
    success: true,
    message: 'Note deleted successfully'
  });
});

/**
 * @desc    Search notes
 * @route   GET /api/notes/search
 * @access  Private
 */
export const searchNotes = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { q: query, limit = 50 } = req.query;

  if (!query || query.trim().length < 2) {
    throw new AppError('Search query must be at least 2 characters long', 400);
  }

  const result = await pool.query(`
    SELECT 
      ln.id,
      ln.title,
      ln.content,
      ln.tags,
      ln.created_at,
      ln.updated_at,
      l.title as lesson_title,
      s.name as subject_name,
      st.name as study_type_name
    FROM lesson_notes ln
    JOIN lessons l ON ln.lesson_id = l.id
    JOIN subjects s ON l.subject_id = s.id
    JOIN study_types st ON s.study_type_id = st.id
    WHERE ln.user_id = $1 
    AND (
      ln.title ILIKE $2 
      OR ln.content ILIKE $2 
      OR $3 = ANY(ln.tags)
    )
    ORDER BY ln.updated_at DESC
    LIMIT $4
  `, [userId, `%${query}%`, query, limit]);

  res.json({
    success: true,
    data: result.rows
  });
});