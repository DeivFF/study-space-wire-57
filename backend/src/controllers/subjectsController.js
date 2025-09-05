import pool from '../config/database.js';
import { asyncHandler } from '../utils/validation.js';
import { AppError } from '../utils/validation.js';

/**
 * @desc    Get subjects for a study type
 * @route   GET /api/study-types/:id/subjects
 * @access  Private
 */
export const getStudyTypeSubjects = asyncHandler(async (req, res) => {
  const { id: studyTypeId } = req.params;
  const userId = req.user.id;
  const { search = '', limit = 20, offset = 0 } = req.query;

  // Verify study type access
  const studyTypeCheck = await pool.query(
    'SELECT name FROM study_types WHERE id = $1 AND user_id = $2 AND is_active = true',
    [studyTypeId, userId]
  );

  if (studyTypeCheck.rows.length === 0) {
    throw new AppError('Study type not found or access denied', 404);
  }

  // Build query with search
  let whereConditions = ['s.study_type_id = $1', 's.user_id = $2', 's.is_active = true'];
  let queryParams = [studyTypeId, userId];
  let paramIndex = 3;

  if (search.trim()) {
    whereConditions.push(`(s.name ILIKE $${paramIndex++} OR s.description ILIKE $${paramIndex++})`);
    queryParams.push(`%${search}%`, `%${search}%`);
  }

  queryParams.push(limit, offset);

  const query = `
    SELECT 
      s.id,
      s.name,
      s.description,
      s.color,
      s.order_index,
      s.created_at,
      s.updated_at,
      COUNT(DISTINCT l.id) as lessons_count,
      COUNT(DISTINCT CASE WHEN l.completed = true THEN l.id END) as completed_lessons,
      COALESCE(AVG(l.progress), 0) as avg_progress,
      COALESCE(AVG(l.accuracy), 0) as avg_accuracy
    FROM subjects s
    LEFT JOIN lessons l ON s.id = l.subject_id AND l.is_active = true
    WHERE ${whereConditions.join(' AND ')}
    GROUP BY s.id, s.name, s.description, s.color, s.order_index, s.created_at, s.updated_at
    ORDER BY s.order_index ASC, s.created_at DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;

  const result = await pool.query(query, queryParams);

  // Get total count for pagination  
  const countQueryParams = queryParams.slice(0, -2); // Remove limit and offset
  const countQuery = `
    SELECT COUNT(*) as total
    FROM subjects s
    WHERE ${whereConditions.join(' AND ')}
  `;
  const countResult = await pool.query(countQuery, countQueryParams);

  res.json({
    success: true,
    data: {
      subjects: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: result.rows.length === parseInt(limit)
      },
      studyType: {
        id: studyTypeId,
        name: studyTypeCheck.rows[0].name
      }
    }
  });
});

/**
 * @desc    Get subject with lessons
 * @route   GET /api/subjects/:id
 * @access  Private
 */
export const getSubjectWithLessons = asyncHandler(async (req, res) => {
  const { id: subjectId } = req.params;
  const userId = req.user.id;

  // Get subject
  const subjectResult = await pool.query(`
    SELECT s.*, st.name as study_type_name
    FROM subjects s
    JOIN study_types st ON s.study_type_id = st.id
    WHERE s.id = $1 AND s.user_id = $2 AND s.is_active = true
  `, [subjectId, userId]);

  if (subjectResult.rows.length === 0) {
    throw new AppError('Subject not found or access denied', 404);
  }

  // Get lessons with counts
  const lessonsResult = await pool.query(`
    SELECT 
      l.id,
      l.title,
      l.description,
      l.difficulty,
      l.progress,
      l.accuracy,
      l.completed,
      l.duration_minutes,
      l.order_index,
      l.created_at,
      l.updated_at,
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
    WHERE l.subject_id = $1 AND l.user_id = $2 AND l.is_active = true
    GROUP BY l.id, l.title, l.description, l.difficulty, l.progress, l.accuracy, 
             l.completed, l.duration_minutes, l.order_index, l.created_at, l.updated_at
    ORDER BY l.order_index ASC, l.created_at DESC
  `, [subjectId, userId]);

  res.json({
    success: true,
    data: {
      ...subjectResult.rows[0],
      lessons: lessonsResult.rows
    }
  });
});

/**
 * @desc    Create subject
 * @route   POST /api/study-types/:id/subjects
 * @access  Private
 */
export const createSubject = asyncHandler(async (req, res) => {
  const { id: studyTypeId } = req.params;
  const userId = req.user.id;
  const { name, description, color = '#28a745' } = req.body;

  // Verify study type access
  const studyTypeCheck = await pool.query(
    'SELECT id FROM study_types WHERE id = $1 AND user_id = $2 AND is_active = true',
    [studyTypeId, userId]
  );

  if (studyTypeCheck.rows.length === 0) {
    throw new AppError('Study type not found or access denied', 404);
  }

  // Check if subject with same name exists in this study type
  const existingResult = await pool.query(
    'SELECT id FROM subjects WHERE name = $1 AND study_type_id = $2 AND user_id = $3 AND is_active = true',
    [name, studyTypeId, userId]
  );

  if (existingResult.rows.length > 0) {
    throw new AppError('Subject with this name already exists in this study type', 409);
  }

  // Get next order index
  const orderResult = await pool.query(
    'SELECT COALESCE(MAX(order_index), 0) + 1 as next_order FROM subjects WHERE study_type_id = $1 AND user_id = $2 AND is_active = true',
    [studyTypeId, userId]
  );
  const orderIndex = orderResult.rows[0].next_order;

  // Create subject
  const result = await pool.query(`
    INSERT INTO subjects (name, description, color, study_type_id, user_id, order_index)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `, [name, description, color, studyTypeId, userId, orderIndex]);

  res.status(201).json({
    success: true,
    message: 'Subject created successfully',
    data: result.rows[0]
  });
});

/**
 * @desc    Update subject
 * @route   PUT /api/subjects/:id
 * @access  Private
 */
export const updateSubject = asyncHandler(async (req, res) => {
  const { id: subjectId } = req.params;
  const userId = req.user.id;
  const { name, description, color, order_index } = req.body;

  const updateFields = [];
  const updateValues = [];
  let paramIndex = 1;

  if (name !== undefined) {
    updateFields.push(`name = $${paramIndex++}`);
    updateValues.push(name);
  }
  if (description !== undefined) {
    updateFields.push(`description = $${paramIndex++}`);
    updateValues.push(description);
  }
  if (color !== undefined) {
    updateFields.push(`color = $${paramIndex++}`);
    updateValues.push(color);
  }
  if (order_index !== undefined) {
    updateFields.push(`order_index = $${paramIndex++}`);
    updateValues.push(order_index);
  }

  if (updateFields.length === 0) {
    throw new AppError('No fields to update', 400);
  }

  updateValues.push(subjectId, userId);

  // Check if name conflicts with existing subject (if name is being updated)
  if (name !== undefined) {
    const conflictResult = await pool.query(`
      SELECT s.id FROM subjects s
      WHERE s.name = $1 AND s.user_id = $2 AND s.id != $3 AND s.is_active = true
      AND s.study_type_id = (SELECT study_type_id FROM subjects WHERE id = $3)
    `, [name, userId, subjectId]);

    if (conflictResult.rows.length > 0) {
      throw new AppError('Subject with this name already exists in this study type', 409);
    }
  }

  const updateQuery = `
    UPDATE subjects 
    SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
    WHERE id = $${paramIndex++} AND user_id = $${paramIndex++} AND is_active = true
    RETURNING *
  `;

  const result = await pool.query(updateQuery, updateValues);

  if (result.rows.length === 0) {
    throw new AppError('Subject not found or access denied', 404);
  }

  res.json({
    success: true,
    message: 'Subject updated successfully',
    data: result.rows[0]
  });
});

/**
 * @desc    Delete subject (soft delete)
 * @route   DELETE /api/subjects/:id
 * @access  Private
 */
export const deleteSubject = asyncHandler(async (req, res) => {
  const { id: subjectId } = req.params;
  const userId = req.user.id;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // First, check if subject exists and get subject info
    const subjectResult = await client.query(
      'SELECT name FROM subjects WHERE id = $1 AND user_id = $2 AND is_active = true',
      [subjectId, userId]
    );

    if (subjectResult.rows.length === 0) {
      throw new AppError('Subject not found or access denied', 404);
    }

    // Get count of lessons that will be affected
    const lessonsCountResult = await client.query(
      'SELECT COUNT(*) as count FROM lessons WHERE subject_id = $1 AND user_id = $2 AND is_active = true',
      [subjectId, userId]
    );

    const lessonsCount = parseInt(lessonsCountResult.rows[0].count);

    // Soft delete all lessons associated with this subject
    const lessonsResult = await client.query(
      'UPDATE lessons SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE subject_id = $1 AND user_id = $2 AND is_active = true RETURNING id, title',
      [subjectId, userId]
    );

    // Soft delete all related lesson content (flashcards, notes, files, exercises, etc.)
    if (lessonsResult.rows.length > 0) {
      const lessonIds = lessonsResult.rows.map(row => row.id);
      
      // Delete lesson files
      await client.query(
        'UPDATE lesson_files SET is_active = false WHERE lesson_id = ANY($1)',
        [lessonIds]
      );
      
      // Delete lesson notes
      await client.query(
        'UPDATE lesson_notes SET is_active = false WHERE lesson_id = ANY($1)',
        [lessonIds]
      );
      
      // Delete lesson flashcards
      await client.query(
        'UPDATE lesson_flashcards SET is_active = false WHERE lesson_id = ANY($1)',
        [lessonIds]
      );
      
      // Delete lesson exercises
      await client.query(
        'UPDATE lesson_exercises SET is_active = false WHERE lesson_id = ANY($1)',
        [lessonIds]
      );
    }

    // Finally, soft delete the subject
    await client.query(
      'UPDATE subjects SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2 AND is_active = true',
      [subjectId, userId]
    );

    await client.query('COMMIT');

    console.log(`Subject "${subjectResult.rows[0].name}" deleted successfully. ${lessonsCount} lessons and their content were also marked as inactive.`);

    res.json({
      success: true,
      message: `Subject deleted successfully. ${lessonsCount} associated lessons were also removed.`,
      data: {
        subjectName: subjectResult.rows[0].name,
        lessonsDeleted: lessonsCount
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});