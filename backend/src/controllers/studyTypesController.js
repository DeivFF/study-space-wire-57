import pool from '../config/database.js';
import { asyncHandler } from '../utils/validation.js';
import { AppError } from '../utils/validation.js';

/**
 * @desc    Get all study types for user
 * @route   GET /api/study-types
 * @access  Private
 */
export const getStudyTypes = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const result = await pool.query(`
    SELECT 
      st.id,
      st.name,
      st.description,
      st.color,
      st.icon,
      st.created_at,
      st.updated_at,
      COUNT(DISTINCT s.id) as subjects_count,
      COUNT(DISTINCT l.id) as lessons_count
    FROM study_types st
    LEFT JOIN subjects s ON st.id = s.study_type_id AND s.is_active = true
    LEFT JOIN lessons l ON s.id = l.subject_id AND l.is_active = true
    WHERE st.user_id = $1 AND st.is_active = true
    GROUP BY st.id, st.name, st.description, st.color, st.icon, st.created_at, st.updated_at
    ORDER BY st.created_at DESC
  `, [userId]);

  res.json({
    success: true,
    data: result.rows
  });
});

/**
 * @desc    Get study type with subjects
 * @route   GET /api/study-types/:id
 * @access  Private
 */
export const getStudyTypeWithSubjects = asyncHandler(async (req, res) => {
  const { id: studyTypeId } = req.params;
  const userId = req.user.id;

  // Get study type
  const studyTypeResult = await pool.query(
    'SELECT * FROM study_types WHERE id = $1 AND user_id = $2 AND is_active = true',
    [studyTypeId, userId]
  );

  if (studyTypeResult.rows.length === 0) {
    throw new AppError('Study type not found or access denied', 404);
  }

  // Get subjects with lesson counts
  const subjectsResult = await pool.query(`
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
      COALESCE(AVG(l.progress), 0) as avg_progress
    FROM subjects s
    LEFT JOIN lessons l ON s.id = l.subject_id AND l.is_active = true
    WHERE s.study_type_id = $1 AND s.user_id = $2 AND s.is_active = true
    GROUP BY s.id, s.name, s.description, s.color, s.order_index, s.created_at, s.updated_at
    ORDER BY s.order_index ASC, s.created_at DESC
  `, [studyTypeId, userId]);

  res.json({
    success: true,
    data: {
      ...studyTypeResult.rows[0],
      subjects: subjectsResult.rows
    }
  });
});

/**
 * @desc    Create new study type
 * @route   POST /api/study-types
 * @access  Private
 */
export const createStudyType = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { name, description, color = '#007bff', icon = 'book' } = req.body;

  // Check if study type with same name exists
  const existingResult = await pool.query(
    'SELECT id FROM study_types WHERE name = $1 AND user_id = $2 AND is_active = true',
    [name, userId]
  );

  if (existingResult.rows.length > 0) {
    throw new AppError('Study type with this name already exists', 409);
  }

  // Create study type
  const result = await pool.query(`
    INSERT INTO study_types (name, description, color, icon, user_id)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `, [name, description, color, icon, userId]);

  res.status(201).json({
    success: true,
    message: 'Study type created successfully',
    data: result.rows[0]
  });
});

/**
 * @desc    Update study type
 * @route   PUT /api/study-types/:id
 * @access  Private
 */
export const updateStudyType = asyncHandler(async (req, res) => {
  const { id: studyTypeId } = req.params;
  const userId = req.user.id;
  const { name, description, color, icon } = req.body;

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
  if (icon !== undefined) {
    updateFields.push(`icon = $${paramIndex++}`);
    updateValues.push(icon);
  }

  if (updateFields.length === 0) {
    throw new AppError('No fields to update', 400);
  }

  updateValues.push(studyTypeId, userId);

  // Check if name conflicts with existing study type (if name is being updated)
  if (name !== undefined) {
    const conflictResult = await pool.query(
      'SELECT id FROM study_types WHERE name = $1 AND user_id = $2 AND id != $3 AND is_active = true',
      [name, userId, studyTypeId]
    );

    if (conflictResult.rows.length > 0) {
      throw new AppError('Study type with this name already exists', 409);
    }
  }

  const updateQuery = `
    UPDATE study_types 
    SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
    WHERE id = $${paramIndex++} AND user_id = $${paramIndex++} AND is_active = true
    RETURNING *
  `;

  const result = await pool.query(updateQuery, updateValues);

  if (result.rows.length === 0) {
    throw new AppError('Study type not found or access denied', 404);
  }

  res.json({
    success: true,
    message: 'Study type updated successfully',
    data: result.rows[0]
  });
});

/**
 * @desc    Delete study type (soft delete)
 * @route   DELETE /api/study-types/:id
 * @access  Private
 */
export const deleteStudyType = asyncHandler(async (req, res) => {
  const { id: studyTypeId } = req.params;
  const userId = req.user.id;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Soft delete study type
    const result = await client.query(
      'UPDATE study_types SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2 AND is_active = true RETURNING name',
      [studyTypeId, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Study type not found or access denied', 404);
    }

    // The CASCADE foreign key relationships will handle marking subjects and lessons as inactive through database triggers

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Study type deleted successfully'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});