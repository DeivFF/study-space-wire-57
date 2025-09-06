import express from 'express';
import {
  downloadFile,
  markAsPrimary,
  markAsStudied,
  deleteFile,
  renameFile
} from '../controllers/lessonFilesController.js';
import { authenticateToken } from '../middleware/authenticateToken.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * @route   GET /api/files/:id/download
 * @desc    Download file
 * @access  Private
 */
router.get('/:id/download', downloadFile);

/**
 * @route   PUT /api/files/:id/primary
 * @desc    Mark file as primary
 * @access  Private
 */
router.put('/:id/primary', markAsPrimary);

/**
 * @route   PUT /api/files/:id/studied
 * @desc    Mark file as studied
 * @access  Private
 */
router.put('/:id/studied', markAsStudied);

/**
 * @route   PUT /api/files/:id/rename
 * @desc    Rename file
 * @access  Private
 */
router.put('/:id/rename', renameFile);

/**
 * @route   DELETE /api/files/:id
 * @desc    Delete file
 * @access  Private
 */
router.delete('/:id', deleteFile);

export default router;