import express from 'express';
import {
  getStudyTypes,
  getStudyTypeWithSubjects,
  createStudyType,
  updateStudyType,
  deleteStudyType
} from '../controllers/studyTypesController.js';
import { getStudyTypeSubjects, createSubject } from '../controllers/subjectsController.js';
import { authenticateToken } from '../middleware/authenticateToken.js';
import { validateRequest, studyValidationSchemas } from '../utils/studyValidation.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// ===============================
// STUDY TYPES ROUTES
// ===============================

/**
 * @route   GET /api/study-types
 * @desc    Get all study types for user
 * @access  Private
 */
router.get('/', getStudyTypes);

/**
 * @route   POST /api/study-types
 * @desc    Create new study type
 * @access  Private
 */
router.post(
  '/',
  validateRequest(studyValidationSchemas.createStudyType),
  createStudyType
);

/**
 * @route   GET /api/study-types/:id
 * @desc    Get study type with subjects
 * @access  Private
 */
router.get('/:id', getStudyTypeWithSubjects);

/**
 * @route   PUT /api/study-types/:id
 * @desc    Update study type
 * @access  Private
 */
router.put(
  '/:id',
  validateRequest(studyValidationSchemas.updateStudyType),
  updateStudyType
);

/**
 * @route   DELETE /api/study-types/:id
 * @desc    Delete study type
 * @access  Private
 */
router.delete('/:id', deleteStudyType);

// ===============================
// SUBJECTS ROUTES (nested under study types)
// ===============================

/**
 * @route   GET /api/study-types/:id/subjects
 * @desc    Get subjects for study type
 * @access  Private
 */
router.get('/:id/subjects', getStudyTypeSubjects);

/**
 * @route   POST /api/study-types/:id/subjects
 * @desc    Create subject in study type
 * @access  Private
 */
router.post(
  '/:id/subjects',
  validateRequest(studyValidationSchemas.createSubject),
  createSubject
);

export default router;