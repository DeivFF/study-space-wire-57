import express from 'express';
import {
  updateNote,
  deleteNote,
  searchNotes
} from '../controllers/lessonNotesController.js';
import { authenticateToken } from '../middleware/authenticateToken.js';
import { validateRequest, studyValidationSchemas } from '../utils/studyValidation.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * @route   PUT /api/notes/:id
 * @desc    Update note
 * @access  Private
 */
router.put(
  '/:id',
  validateRequest(studyValidationSchemas.updateNote),
  updateNote
);

/**
 * @route   DELETE /api/notes/:id
 * @desc    Delete note
 * @access  Private
 */
router.delete('/:id', deleteNote);

/**
 * @route   GET /api/notes/search
 * @desc    Search notes
 * @access  Private
 */
router.get('/search', searchNotes);

export default router;