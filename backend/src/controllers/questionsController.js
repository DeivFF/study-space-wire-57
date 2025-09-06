import Question from '../models/Question.js';
import { AppError } from '../utils/validation.js';
import pool from '../config/database.js';

/**
 * Questions Controller - Handles all question-related operations
 */
class QuestionsController {
  /**
   * Get questions with filtering
   * @route GET /api/questions
   * @access Private
   */
  static async getQuestions(req, res) {
    try {
      const userId = req.user.id;
      const {
        category,
        subcategory,
        year,
        difficulty,
        subject_area,
        legal_branch,
        exam_phase,
        type,
        institution,
        position,
        education_level,
        favorites_only,
        never_answered,
        user_correct,
        user_incorrect,
        min_error_rate,
        page = 1,
        limit = 20
      } = req.query;

      // Validate required category
      if (!category) {
        throw new AppError('Category is required', 400);
      }

      if (!['ENEM', 'OAB', 'CONCURSO'].includes(category)) {
        throw new AppError('Invalid category. Must be ENEM, OAB, or CONCURSO', 400);
      }

      // Parse arrays from query strings
      const filters = {
        category,
        subcategory,
        year: year ? year.split(',').map(Number) : undefined,
        difficulty: difficulty ? difficulty.split(',') : undefined,
        subject_area: subject_area ? subject_area.split(',') : undefined,
        legal_branch: legal_branch ? legal_branch.split(',') : undefined,
        exam_phase,
        type: type ? type.split(',') : undefined,
        institution: institution ? institution.split(',') : undefined,
        position: position ? position.split(',') : undefined,
        education_level,
        favorites_only: favorites_only === 'true',
        never_answered: never_answered === 'true',
        user_correct: user_correct === 'true',
        user_incorrect: user_incorrect === 'true',
        min_error_rate: min_error_rate ? parseFloat(min_error_rate) : undefined
      };

      // Remove undefined values
      Object.keys(filters).forEach(key => 
        filters[key] === undefined && delete filters[key]
      );

      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(50, Math.max(1, parseInt(limit))); // Max 50 per page

      const result = await Question.findWithFilters(filters, pageNum, limitNum, userId);

      res.json({
        success: true,
        data: result.questions,
        pagination: result.pagination,
        filters: filters
      });

    } catch (error) {
      console.error('Error getting questions:', error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get a specific question by ID
   * @route GET /api/questions/:id
   * @access Private
   */
  static async getQuestionById(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      if (!id) {
        throw new AppError('Question ID is required', 400);
      }

      const question = await Question.findById(id, userId);

      if (!question) {
        throw new AppError('Question not found', 404);
      }

      res.json({
        success: true,
        data: question
      });

    } catch (error) {
      console.error('Error getting question:', error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Submit an answer to a question
   * @route POST /api/questions/:id/answer
   * @access Private
   */
  static async submitAnswer(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { is_correct, time_spent_seconds } = req.body;

      if (!id) {
        throw new AppError('Question ID is required', 400);
      }

      if (typeof is_correct !== 'boolean') {
        throw new AppError('is_correct must be a boolean', 400);
      }

      if (time_spent_seconds !== undefined && time_spent_seconds !== null) {
        if (typeof time_spent_seconds !== 'number' || time_spent_seconds < 0) {
          throw new AppError('time_spent_seconds must be a positive number', 400);
        }
      }

      // Verify question exists
      const question = await Question.findById(id);
      if (!question) {
        throw new AppError('Question not found', 404);
      }

      const result = await Question.submitAnswer(id, userId, is_correct, time_spent_seconds);

      res.json({
        success: true,
        data: result,
        message: 'Answer submitted successfully'
      });

    } catch (error) {
      console.error('Error submitting answer:', error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Toggle favorite status of a question
   * @route POST /api/questions/:id/favorite
   * @access Private
   */
  static async toggleFavorite(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      if (!id) {
        throw new AppError('Question ID is required', 400);
      }

      // Verify question exists
      const question = await Question.findById(id);
      if (!question) {
        throw new AppError('Question not found', 404);
      }

      const result = await Question.toggleFavorite(id, userId);

      res.json({
        success: true,
        data: result,
        message: `Question ${result.isFavorite ? 'added to' : 'removed from'} favorites`
      });

    } catch (error) {
      console.error('Error toggling favorite:', error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get question statistics
   * @route GET /api/questions/stats
   * @access Private
   */
  static async getStats(req, res) {
    try {
      const { category } = req.query;

      const filters = {};
      if (category) {
        if (!['ENEM', 'OAB', 'CONCURSO'].includes(category)) {
          throw new AppError('Invalid category. Must be ENEM, OAB, or CONCURSO', 400);
        }
        filters.category = category;
      }

      const stats = await Question.getStats(filters);

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('Error getting stats:', error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get user's question history
   * @route GET /api/users/question-history
   * @access Private
   */
  static async getUserHistory(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20 } = req.query;

      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(50, Math.max(1, parseInt(limit))); // Max 50 per page

      const result = await Question.getUserHistory(userId, pageNum, limitNum);

      res.json({
        success: true,
        data: result.history,
        pagination: result.pagination
      });

    } catch (error) {
      console.error('Error getting user history:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get available filter options for a category
   * @route GET /api/questions/filter-options/:category
   * @access Private
   */
  static async getFilterOptions(req, res) {
    try {
      const { category } = req.params;

      if (!['ENEM', 'OAB', 'CONCURSO'].includes(category)) {
        throw new AppError('Invalid category. Must be ENEM, OAB, or CONCURSO', 400);
      }

      // Get available values for each filter type
      const queries = {
        years: 'SELECT DISTINCT year FROM questions WHERE category = $1 ORDER BY year DESC',
        difficulties: 'SELECT DISTINCT difficulty FROM questions WHERE category = $1 AND difficulty IS NOT NULL ORDER BY difficulty',
        subject_areas: 'SELECT DISTINCT subject_area FROM questions WHERE category = $1 AND subject_area IS NOT NULL ORDER BY subject_area',
        types: 'SELECT DISTINCT type FROM questions WHERE category = $1 ORDER BY type'
      };

      // Category-specific queries
      if (category === 'OAB') {
        queries.legal_branches = 'SELECT DISTINCT legal_branch FROM questions WHERE category = $1 AND legal_branch IS NOT NULL ORDER BY legal_branch';
        queries.exam_phases = 'SELECT DISTINCT exam_phase FROM questions WHERE category = $1 AND exam_phase IS NOT NULL ORDER BY exam_phase';
      }

      if (category === 'CONCURSO') {
        queries.subcategories = 'SELECT DISTINCT subcategory FROM questions WHERE category = $1 AND subcategory IS NOT NULL ORDER BY subcategory';
        queries.institutions = 'SELECT DISTINCT institution FROM questions WHERE category = $1 AND institution IS NOT NULL ORDER BY institution';
        queries.positions = 'SELECT DISTINCT position FROM questions WHERE category = $1 AND position IS NOT NULL ORDER BY position';
        queries.education_levels = 'SELECT DISTINCT education_level FROM questions WHERE category = $1 AND education_level IS NOT NULL ORDER BY education_level';
      }

      const results = {};
      
      for (const [key, query] of Object.entries(queries)) {
        const result = await pool.query(query, [category]);
        results[key] = result.rows.map(row => Object.values(row)[0]);
      }

      res.json({
        success: true,
        data: results
      });

    } catch (error) {
      console.error('Error getting filter options:', error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

export default QuestionsController;