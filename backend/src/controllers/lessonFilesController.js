import pool from '../config/database.js';
import { asyncHandler } from '../utils/studyValidation.js';
import { AppError } from '../utils/studyValidation.js';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * @desc    Get lesson files
 * @route   GET /api/lessons/:id/files
 * @access  Private
 */
export const getLessonFiles = asyncHandler(async (req, res) => {
  const { id: lessonId } = req.params;
  const userId = req.user.id;
  const { type = 'all' } = req.query;

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

  if (type !== 'all') {
    whereClause += ' AND file_type = $3';
    queryParams.push(type);
  }

  const query = `
    SELECT 
      id, file_name, file_type, file_size,
      duration_seconds, mime_type, is_primary, is_studied,
      created_at, updated_at
    FROM lesson_files
    WHERE ${whereClause}
    ORDER BY is_primary DESC, created_at DESC
  `;

  const result = await pool.query(query, queryParams);

  // Format data for frontend
  const files = result.rows.map(file => ({
    id: file.id,
    type: file.file_type,
    name: file.file_name,
    size: file.file_size ? formatFileSize(file.file_size) : null,
    duration: file.duration_seconds ? formatDuration(file.duration_seconds) : null,
    primary: file.is_primary,
    studied: file.is_studied,
    url: `/api/files/${file.id}/download`,
    uploadDate: file.created_at,
    createdAt: file.created_at
  }));

  res.json({
    success: true,
    data: files
  });
});

/**
 * @desc    Upload files to lesson
 * @route   POST /api/lessons/:id/files/upload
 * @access  Private
 */
export const uploadLessonFiles = asyncHandler(async (req, res) => {
  const { id: lessonId } = req.params;
  const userId = req.user.id;
  
  if (!req.files || req.files.length === 0) {
    throw new AppError('No files provided', 400);
  }

  // Verify lesson access
  const lessonCheck = await pool.query(
    'SELECT title FROM lessons WHERE id = $1 AND user_id = $2 AND is_active = true',
    [lessonId, userId]
  );

  if (lessonCheck.rows.length === 0) {
    throw new AppError('Lesson not found or access denied', 404);
  }

  const uploadedFiles = [];
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const file of req.files) {
      // Process and validate file
      const fileInfo = await processFile(file, userId, lessonId);
      
      // Get file type
      const fileType = getFileType(file.mimetype);
      
      // Calculate duration for audio files
      let durationSeconds = null;
      if (fileType === 'audio') {
        // For now, we'll set this to null and calculate it later if needed
        // In production, you'd use a library like ffprobe or node-ffmpeg
        durationSeconds = null;
      }

      // Save to database
      const fileRecord = await client.query(`
        INSERT INTO lesson_files (
          lesson_id, user_id, file_name, file_type,
          file_size, duration_seconds, mime_type, file_path
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [
        lessonId, userId, file.originalname, fileType,
        file.size, durationSeconds, file.mimetype, fileInfo.filePath
      ]);

      uploadedFiles.push({
        id: fileRecord.rows[0].id,
        type: fileType,
        name: file.originalname,
        size: formatFileSize(file.size),
        duration: durationSeconds ? formatDuration(durationSeconds) : null,
        primary: false,
        studied: false,
        url: `/api/files/${fileRecord.rows[0].id}/download`,
        uploadDate: fileRecord.rows[0].created_at,
        createdAt: fileRecord.rows[0].created_at
      });
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: `${uploadedFiles.length} file(s) uploaded successfully`,
      data: uploadedFiles
    });

  } catch (error) {
    await client.query('ROLLBACK');
    
    // Cleanup files in case of error
    for (const file of req.files || []) {
      try {
        if (file.path) {
          await fs.unlink(file.path);
        }
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
    }
    
    throw error;
  } finally {
    client.release();
  }
});

/**
 * @desc    Download file
 * @route   GET /api/files/:id/download
 * @access  Private
 */
export const downloadFile = asyncHandler(async (req, res) => {
  const { id: fileId } = req.params;
  const userId = req.user.id;
  const { preview } = req.query;

  // Verify file access
  const fileResult = await pool.query(
    'SELECT * FROM lesson_files WHERE id = $1 AND user_id = $2',
    [fileId, userId]
  );

  if (fileResult.rows.length === 0) {
    throw new AppError('File not found or access denied', 404);
  }

  const file = fileResult.rows[0];

  // Check if file exists
  try {
    await fs.access(file.file_path);
  } catch (error) {
    throw new AppError('File not found on server', 404);
  }

  // Set headers - different for preview vs download
  if (preview === 'true') {
    // For preview, use inline disposition
    res.setHeader('Content-Disposition', `inline; filename="${file.file_name}"`);
  } else {
    // For download, use attachment disposition
    res.setHeader('Content-Disposition', `attachment; filename="${file.file_name}"`);
  }
  
  res.setHeader('Content-Type', file.mime_type);
  
  // Send file
  res.sendFile(path.resolve(file.file_path));
});

/**
 * @desc    Mark file as primary
 * @route   PUT /api/files/:id/primary
 * @access  Private
 */
export const markAsPrimary = asyncHandler(async (req, res) => {
  const { id: fileId } = req.params;
  const userId = req.user.id;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Verify access
    const fileCheck = await client.query(
      'SELECT lesson_id, file_name FROM lesson_files WHERE id = $1 AND user_id = $2',
      [fileId, userId]
    );

    if (fileCheck.rows.length === 0) {
      throw new AppError('File not found or access denied', 404);
    }

    const { lesson_id: lessonId } = fileCheck.rows[0];

    // Remove primary from other files in the same lesson
    await client.query(
      'UPDATE lesson_files SET is_primary = false WHERE lesson_id = $1 AND user_id = $2',
      [lessonId, userId]
    );

    // Mark current file as primary
    await client.query(
      'UPDATE lesson_files SET is_primary = true WHERE id = $1',
      [fileId]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'File marked as primary successfully'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

/**
 * @desc    Mark file as studied
 * @route   PUT /api/files/:id/studied
 * @access  Private
 */
export const markAsStudied = asyncHandler(async (req, res) => {
  const { id: fileId } = req.params;
  const userId = req.user.id;
  const { studied } = req.body;

  // Verify access and update
  const result = await pool.query(`
    UPDATE lesson_files 
    SET is_studied = $3, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1 AND user_id = $2
    RETURNING lesson_id, file_name, is_studied
  `, [fileId, userId, studied]);

  if (result.rows.length === 0) {
    throw new AppError('File not found or access denied', 404);
  }

  const { is_studied: isStudied } = result.rows[0];

  res.json({
    success: true,
    message: `File ${isStudied ? 'marked as studied' : 'unmarked'} successfully`
  });
});

/**
 * @desc    Rename file
 * @route   PUT /api/files/:id/rename
 * @access  Private
 */
export const renameFile = asyncHandler(async (req, res) => {
  const { id: fileId } = req.params;
  const userId = req.user.id;
  const { fileName } = req.body;

  if (!fileName || !fileName.trim()) {
    throw new AppError('File name is required', 400);
  }

  // Verify access and update
  const result = await pool.query(`
    UPDATE lesson_files 
    SET file_name = $3, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1 AND user_id = $2
    RETURNING lesson_id, file_name
  `, [fileId, userId, fileName.trim()]);

  if (result.rows.length === 0) {
    throw new AppError('File not found or access denied', 404);
  }

  res.json({
    success: true,
    message: 'File renamed successfully',
    data: {
      fileName: result.rows[0].file_name
    }
  });
});

/**
 * @desc    Delete file
 * @route   DELETE /api/files/:id
 * @access  Private
 */
export const deleteFile = asyncHandler(async (req, res) => {
  const { id: fileId } = req.params;
  const userId = req.user.id;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get file info before deleting
    const fileResult = await client.query(
      'SELECT lesson_id, file_name, file_path FROM lesson_files WHERE id = $1 AND user_id = $2',
      [fileId, userId]
    );

    if (fileResult.rows.length === 0) {
      throw new AppError('File not found or access denied', 404);
    }

    const { file_path: filePath } = fileResult.rows[0];

    // Delete from database
    await client.query('DELETE FROM lesson_files WHERE id = $1', [fileId]);

    // Delete from filesystem
    try {
      await fs.unlink(filePath);
    } catch (fsError) {
      console.error('Error deleting file from filesystem:', fsError);
      // Don't fail the operation if file doesn't exist
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

// Helper functions

/**
 * Process uploaded file
 */
async function processFile(file, userId, lessonId) {
  // Validate file type
  const fileType = getFileType(file.mimetype);
  if (!fileType) {
    throw new AppError(`File type not supported: ${file.mimetype}`, 400);
  }

  // Validate file size
  const maxSizes = {
    pdf: 50 * 1024 * 1024,    // 50MB
    audio: 100 * 1024 * 1024, // 100MB
    image: 10 * 1024 * 1024   // 10MB
  };

  if (file.size > maxSizes[fileType]) {
    throw new AppError(`File too large. Maximum size for ${fileType}: ${formatFileSize(maxSizes[fileType])}`, 400);
  }

  // Generate unique filename
  const fileExtension = path.extname(file.originalname);
  const uniqueName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${fileExtension}`;
  
  // Create upload directory structure
  const uploadDir = path.join(
    process.cwd(),
    'uploads',
    'users',
    userId,
    'lessons',
    lessonId,
    'files'
  );

  await fs.mkdir(uploadDir, { recursive: true });

  const filePath = path.join(uploadDir, uniqueName);

  // Save file (assuming file.buffer exists from multer memory storage)
  if (file.buffer) {
    await fs.writeFile(filePath, file.buffer);
  } else if (file.path) {
    // If file is already on disk from multer disk storage
    await fs.rename(file.path, filePath);
  } else {
    throw new AppError('Invalid file data', 400);
  }

  return {
    filename: uniqueName,
    filePath
  };
}

/**
 * Get file type from MIME type
 */
function getFileType(mimeType) {
  const typeMap = {
    'application/pdf': 'pdf',
    'audio/mpeg': 'audio',
    'audio/mp3': 'audio',
    'audio/wav': 'audio',
    'audio/m4a': 'audio',
    'audio/aac': 'audio',
    'image/jpeg': 'image',
    'image/png': 'image',
    'image/gif': 'image',
    'image/webp': 'image'
  };

  return typeMap[mimeType] || null;
}

/**
 * Format file size for display
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format duration for display
 */
function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}