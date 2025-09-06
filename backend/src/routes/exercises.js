import express from 'express';
import { getLessonExercises, createExercise, updateExercise, deleteExercise, attemptExercise, getExerciseStats } from '../controllers/exercisesController.js';
import { authenticateToken } from '../middleware/authenticateToken.js';

const router = express.Router();
router.use(authenticateToken);

router.get('/lesson/:id', getLessonExercises);
router.post('/lesson/:id', createExercise);
router.put('/:exerciseId', updateExercise);
router.delete('/:exerciseId', deleteExercise);
router.post('/:exerciseId/attempt', attemptExercise);
router.get('/lesson/:id/stats', getExerciseStats);

export default router;