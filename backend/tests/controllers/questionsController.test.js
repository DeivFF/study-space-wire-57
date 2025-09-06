import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import questionsController from '../../src/controllers/questionsController.js';

// Mock the Question model
const mockQuestion = {
  findWithFilters: jest.fn(),
  findById: jest.fn(),
  submitAnswer: jest.fn(),
  toggleFavorite: jest.fn(),
  getStats: jest.fn(),
  getFilterOptions: jest.fn(),
  getUserHistory: jest.fn()
};

jest.unstable_mockModule('../../src/models/Question.js', () => ({
  default: mockQuestion
}));

// Create test app
const app = express();
app.use(express.json());

// Mock auth middleware
const mockAuth = (req, res, next) => {
  req.user = { id: 'user-123', email: 'test@test.com' };
  next();
};

// Setup routes
app.get('/questions', mockAuth, questionsController.getQuestions);
app.get('/questions/stats', mockAuth, questionsController.getStats);
app.get('/questions/filter-options/:category', mockAuth, questionsController.getFilterOptions);
app.get('/questions/:id', mockAuth, questionsController.getQuestion);
app.post('/questions/:id/answer', mockAuth, questionsController.submitAnswer);
app.post('/questions/:id/favorite', mockAuth, questionsController.toggleFavorite);

describe('Questions Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /questions', () => {
    it('should return questions with pagination', async () => {
      const mockData = {
        data: [
          {
            id: '1',
            title: 'Test Question 1',
            category: 'ENEM',
            year: 2023
          }
        ],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalCount: 1,
          limit: 20,
          hasNextPage: false,
          hasPrevPage: false
        }
      };

      mockQuestion.findWithFilters.mockResolvedValueOnce(mockData);

      const response = await request(app)
        .get('/questions')
        .query({ category: 'ENEM', page: 1 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.pagination.currentPage).toBe(1);
      
      expect(mockQuestion.findWithFilters).toHaveBeenCalledWith(
        { category: 'ENEM', page: '1' },
        1,
        20,
        'user-123'
      );
    });

    it('should handle filters correctly', async () => {
      mockQuestion.findWithFilters.mockResolvedValueOnce({
        data: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalCount: 0,
          limit: 20,
          hasNextPage: false,
          hasPrevPage: false
        }
      });

      await request(app)
        .get('/questions')
        .query({
          category: 'ENEM',
          year: '2022,2023',
          difficulty: 'MEDIO,DIFICIL',
          subject_area: 'Matemática'
        });

      expect(mockQuestion.findWithFilters).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'ENEM',
          year: '2022,2023',
          difficulty: 'MEDIO,DIFICIL',
          subject_area: 'Matemática'
        }),
        1,
        20,
        'user-123'
      );
    });

    it('should handle database errors', async () => {
      mockQuestion.findWithFilters.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .get('/questions')
        .query({ category: 'ENEM' });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Database error');
    });
  });

  describe('GET /questions/:id', () => {
    it('should return question by ID', async () => {
      const mockQuestion_data = {
        id: '1',
        title: 'Test Question',
        content: 'Question content',
        options: [
          { id: '1', option_letter: 'A', content: 'Option A', is_correct: false },
          { id: '2', option_letter: 'B', content: 'Option B', is_correct: true }
        ]
      };

      mockQuestion.findById.mockResolvedValueOnce(mockQuestion_data);

      const response = await request(app)
        .get('/questions/1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Test Question');
      expect(response.body.data.options).toHaveLength(2);
    });

    it('should return 404 for non-existent question', async () => {
      mockQuestion.findById.mockResolvedValueOnce(null);

      const response = await request(app)
        .get('/questions/non-existent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Question not found');
    });
  });

  describe('POST /questions/:id/answer', () => {
    it('should submit answer successfully', async () => {
      mockQuestion.submitAnswer.mockResolvedValueOnce(true);

      const response = await request(app)
        .post('/questions/1/answer')
        .send({
          is_correct: true,
          time_spent_seconds: 120
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Answer submitted successfully');

      expect(mockQuestion.submitAnswer).toHaveBeenCalledWith(
        '1',
        'user-123',
        true,
        120
      );
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/questions/1/answer')
        .send({
          // Missing is_correct field
          time_spent_seconds: 120
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('is_correct is required');
    });

    it('should handle submission failure', async () => {
      mockQuestion.submitAnswer.mockResolvedValueOnce(false);

      const response = await request(app)
        .post('/questions/1/answer')
        .send({
          is_correct: true,
          time_spent_seconds: 120
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Failed to submit answer');
    });
  });

  describe('POST /questions/:id/favorite', () => {
    it('should toggle favorite successfully', async () => {
      mockQuestion.toggleFavorite.mockResolvedValueOnce(true);

      const response = await request(app)
        .post('/questions/1/favorite');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isFavorite).toBe(true);

      expect(mockQuestion.toggleFavorite).toHaveBeenCalledWith('1', 'user-123');
    });

    it('should handle toggle failure', async () => {
      mockQuestion.toggleFavorite.mockResolvedValueOnce(null);

      const response = await request(app)
        .post('/questions/1/favorite');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Failed to toggle favorite');
    });
  });

  describe('GET /questions/stats', () => {
    it('should return question statistics', async () => {
      const mockStats = {
        total_questions: 100,
        total_responses: 500,
        average_error_rate: 25.5,
        by_category: {
          'ENEM': 40,
          'OAB': 35,
          'CONCURSO': 25
        },
        by_difficulty: {
          'FACIL': 30,
          'MEDIO': 45,
          'DIFICIL': 25
        }
      };

      mockQuestion.getStats.mockResolvedValueOnce(mockStats);

      const response = await request(app)
        .get('/questions/stats')
        .query({ category: 'ENEM' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.total_questions).toBe(100);
      expect(response.body.data.by_category).toBeDefined();

      expect(mockQuestion.getStats).toHaveBeenCalledWith('ENEM');
    });

    it('should handle stats without category filter', async () => {
      const mockStats = {
        total_questions: 100,
        total_responses: 500,
        average_error_rate: 25.5
      };

      mockQuestion.getStats.mockResolvedValueOnce(mockStats);

      await request(app).get('/questions/stats');

      expect(mockQuestion.getStats).toHaveBeenCalledWith(undefined);
    });
  });

  describe('GET /questions/filter-options/:category', () => {
    it('should return filter options for category', async () => {
      const mockOptions = {
        years: [2020, 2021, 2022, 2023],
        difficulties: ['FACIL', 'MEDIO', 'DIFICIL'],
        subject_areas: ['Matemática', 'Português', 'História'],
        types: ['OBJETIVA', 'DISCURSIVA']
      };

      mockQuestion.getFilterOptions.mockResolvedValueOnce(mockOptions);

      const response = await request(app)
        .get('/questions/filter-options/ENEM');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.years).toHaveLength(4);
      expect(response.body.data.subject_areas).toContain('Matemática');

      expect(mockQuestion.getFilterOptions).toHaveBeenCalledWith('ENEM');
    });

    it('should validate category parameter', async () => {
      const response = await request(app)
        .get('/questions/filter-options/INVALID');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid category');
    });
  });
});