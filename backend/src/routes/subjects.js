import express from 'express';
import {
  getSubjectWithLessons,
  updateSubject,
  deleteSubject
} from '../controllers/subjectsController.js';
import { 
  getSubjectLessons,
  createLesson 
} from '../controllers/lessonsController.js';
import { authenticateToken } from '../middleware/authenticateToken.js';
import { validateRequest, studyValidationSchemas } from '../utils/studyValidation.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * @route   GET /api/subjects/:id
 * @desc    Get subject with lessons
 * @access  Private
 */
router.get('/:id', getSubjectWithLessons);

/**
 * @route   PUT /api/subjects/:id
 * @desc    Update subject
 * @access  Private
 */
router.put(
  '/:id',
  validateRequest(studyValidationSchemas.updateSubject),
  updateSubject
);

/**
 * @route   DELETE /api/subjects/:id
 * @desc    Delete subject
 * @access  Private
 */
router.delete('/:id', deleteSubject);

// ===============================
// LESSONS ROUTES (nested under subjects)
// ===============================

/**
 * @route   GET /api/subjects/:id/lessons
 * @desc    Get lessons for subject
 * @access  Private
 */
router.get('/:id/lessons', getSubjectLessons);

/**
 * @route   POST /api/subjects/:id/lessons
 * @desc    Create lesson in subject
 * @access  Private
 */
router.post(
  '/:id/lessons',
  validateRequest(studyValidationSchemas.createLesson),
  createLesson
);

export default router;