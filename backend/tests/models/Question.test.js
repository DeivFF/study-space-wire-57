import { jest } from '@jest/globals';
import Question from '../../src/models/Question.js';
import pool from '../../src/config/database.js';

// Mock the database pool
jest.mock('../../src/config/database.js', () => ({
  default: {
    query: jest.fn(),
    connect: jest.fn()
  }
}));

describe('Question Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('titleExists', () => {
    it('should return true if title exists', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ id: '123' }]
      });

      const exists = await Question.titleExists('Test Question');
      
      expect(exists).toBe(true);
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT id FROM questions WHERE title = $1 LIMIT 1',
        ['Test Question']
      );
    });

    it('should return false if title does not exist', async () => {
      pool.query.mockResolvedValueOnce({
        rows: []
      });

      const exists = await Question.titleExists('Non-existent Question');
      
      expect(exists).toBe(false);
    });

    it('should exclude specific ID when checking title exists', async () => {
      pool.query.mockResolvedValueOnce({
        rows: []
      });

      const exists = await Question.titleExists('Test Question', '456');
      
      expect(exists).toBe(false);
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT id FROM questions WHERE title = $1 AND id != $2 LIMIT 1',
        ['Test Question', '456']
      );
    });
  });

  describe('create', () => {
    const mockClient = {
      query: jest.fn(),
      release: jest.fn()
    };

    beforeEach(() => {
      pool.connect.mockResolvedValue(mockClient);
      mockClient.query.mockClear();
      mockClient.release.mockClear();
    });

    it('should create a new question successfully', async () => {
      // Mock titleExists to return false (no duplicate)
      pool.query.mockResolvedValueOnce({ rows: [] });
      
      // Mock transaction
      mockClient.query.mockResolvedValueOnce(); // BEGIN
      mockClient.query.mockResolvedValueOnce({ // INSERT question
        rows: [{ 
          id: '123',
          title: 'Test Question',
          category: 'ENEM',
          content: 'Test content',
          type: 'OBJETIVA',
          year: 2023
        }]
      });
      mockClient.query.mockResolvedValueOnce(); // COMMIT

      const questionData = {
        title: 'Test Question',
        category: 'ENEM',
        content: 'Test content',
        type: 'OBJETIVA',
        year: 2023,
        options: [
          { letter: 'A', content: 'Option A', correct: false },
          { letter: 'B', content: 'Option B', correct: true }
        ]
      };

      const result = await Question.create(questionData);

      expect(result.title).toBe('Test Question');
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });

    it('should throw error for missing required fields', async () => {
      const incompleteData = {
        title: 'Test Question'
        // Missing required fields
      };

      await expect(Question.create(incompleteData))
        .rejects
        .toThrow('Missing required fields: title, category, content, type, year');
    });

    it('should throw error for duplicate title', async () => {
      // Mock titleExists to return true (duplicate found)
      pool.query.mockResolvedValueOnce({ rows: [{ id: '123' }] });

      const questionData = {
        title: 'Duplicate Question',
        category: 'ENEM',
        content: 'Test content',
        type: 'OBJETIVA',
        year: 2023
      };

      await expect(Question.create(questionData))
        .rejects
        .toThrow('Question with title "Duplicate Question" already exists');
    });

    it('should rollback transaction on error', async () => {
      // Mock titleExists to return false
      pool.query.mockResolvedValueOnce({ rows: [] });
      
      // Mock transaction failure
      mockClient.query.mockResolvedValueOnce(); // BEGIN
      mockClient.query.mockRejectedValueOnce(new Error('Database error')); // INSERT fails
      mockClient.query.mockResolvedValueOnce(); // ROLLBACK

      const questionData = {
        title: 'Test Question',
        category: 'ENEM',
        content: 'Test content',
        type: 'OBJETIVA',
        year: 2023
      };

      await expect(Question.create(questionData))
        .rejects
        .toThrow('Database error');

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('findWithFilters', () => {
    it('should build correct query for category filter', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      });
      pool.query.mockResolvedValueOnce({
        rows: [{ count: '0' }]
      });

      const filters = { category: 'ENEM' };
      await Question.findWithFilters(filters, 1, 20);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("WHERE 1=1 AND q.category = $"),
        expect.arrayContaining(['ENEM'])
      );
    });

    it('should handle year array filter', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      });
      pool.query.mockResolvedValueOnce({
        rows: [{ count: '0' }]
      });

      const filters = { 
        category: 'ENEM',
        year: [2022, 2023] 
      };
      await Question.findWithFilters(filters, 1, 20);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("AND q.year = ANY($"),
        expect.arrayContaining(['ENEM', [2022, 2023]])
      );
    });

    it('should include user-specific data when userId provided', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      });
      pool.query.mockResolvedValueOnce({
        rows: [{ count: '0' }]
      });

      await Question.findWithFilters({}, 1, 20, 'user-123');

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("LEFT JOIN user_question_stats"),
        expect.anything()
      );
    });
  });

  describe('submitAnswer', () => {
    it('should submit answer successfully', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ id: '123' }]
      });

      const result = await Question.submitAnswer('question-123', 'user-456', true, 120);

      expect(result).toBe(true);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO user_question_stats"),
        ['user-456', 'question-123', true, 120]
      );
    });

    it('should handle database errors gracefully', async () => {
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      const result = await Question.submitAnswer('question-123', 'user-456', true, 120);

      expect(result).toBe(false);
    });
  });

  describe('toggleFavorite', () => {
    it('should add favorite when not exists', async () => {
      // Mock check for existing favorite (not found)
      pool.query.mockResolvedValueOnce({
        rows: []
      });
      // Mock insert favorite
      pool.query.mockResolvedValueOnce({
        rows: [{ id: '123' }]
      });

      const result = await Question.toggleFavorite('question-123', 'user-456');

      expect(result).toBe(true);
    });

    it('should remove favorite when exists', async () => {
      // Mock check for existing favorite (found)
      pool.query.mockResolvedValueOnce({
        rows: [{ id: '123' }]
      });
      // Mock delete favorite
      pool.query.mockResolvedValueOnce({
        rows: []
      });

      const result = await Question.toggleFavorite('question-123', 'user-456');

      expect(result).toBe(false);
    });
  });
});