import ExerciseResponse from '../ExerciseResponse.js';
import pool from '../../config/database.js';

// Mock the database pool
jest.mock('../../config/database.js');

describe('ExerciseResponse Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createResponse', () => {
    it('should create a new response for multiple choice exercise', async () => {
      const mockQuery = jest.fn()
        .mockResolvedValueOnce({ rows: [{ id: 'post-id', type: 'exercicio', data: { alternativas: [{ texto: 'Option 1', correta: true }, { texto: 'Option 2', correta: false }] } }] }) // postCheck
        .mockResolvedValueOnce({ rows: [] }) // responseCheck
        .mockResolvedValueOnce({ rows: [{ id: 'response-id', is_correct: true }] }); // insert response

      pool.connect = jest.fn().mockReturnValue({
        query: mockQuery,
        release: jest.fn()
      });

      const result = await ExerciseResponse.createResponse('post-id', 'user-id', { selectedOptionIndex: 0 });

      expect(result).toEqual({
        response: { id: 'response-id', is_correct: true },
        isCorrect: true,
        correctOptionIndex: 0
      });
    });

    it('should create a new response for descriptive exercise', async () => {
      const mockQuery = jest.fn()
        .mockResolvedValueOnce({ rows: [{ id: 'post-id', type: 'exercicio', data: { tipo_exercicio: 'dissertativo' } }] }) // postCheck
        .mockResolvedValueOnce({ rows: [] }) // responseCheck
        .mockResolvedValueOnce({ rows: [{ id: 'response-id' }] }); // insert response

      pool.connect = jest.fn().mockReturnValue({
        query: mockQuery,
        release: jest.fn()
      });

      const result = await ExerciseResponse.createResponse('post-id', 'user-id', { writtenResponse: 'This is my answer' });

      expect(result).toEqual({
        response: { id: 'response-id' },
        isCorrect: null
      });
    });

    it('should update existing response when user has already responded', async () => {
      const mockQuery = jest.fn()
        .mockResolvedValueOnce({ rows: [{ id: 'post-id', type: 'exercicio', data: { alternativas: [{ texto: 'Option 1', correta: true }, { texto: 'Option 2', correta: false }] } }] }) // postCheck
        .mockResolvedValueOnce({ rows: [{ id: 'existing-response-id' }] }) // responseCheck
        .mockResolvedValueOnce({ rows: [{ id: 'updated-response-id', is_correct: false }] }); // update response

      pool.connect = jest.fn().mockReturnValue({
        query: mockQuery,
        release: jest.fn()
      });

      const result = await ExerciseResponse.createResponse('post-id', 'user-id', { selectedOptionIndex: 1 });

      expect(result).toEqual({
        response: { id: 'updated-response-id', is_correct: false },
        isCorrect: false,
        correctOptionIndex: 0
      });
    });

    it('should throw error for non-existent post', async () => {
      const mockQuery = jest.fn().mockResolvedValueOnce({ rows: [] }); // postCheck returns empty

      pool.connect = jest.fn().mockReturnValue({
        query: mockQuery,
        release: jest.fn()
      });

      await expect(ExerciseResponse.createResponse('non-existent-post', 'user-id', { selectedOptionIndex: 0 }))
        .rejects.toThrow('Post not found');
    });

    it('should throw error for non-exercise post', async () => {
      const mockQuery = jest.fn().mockResolvedValueOnce({ rows: [{ id: 'post-id', type: 'publicacao' }] }); // postCheck returns non-exercise

      pool.connect = jest.fn().mockReturnValue({
        query: mockQuery,
        release: jest.fn()
      });

      await expect(ExerciseResponse.createResponse('post-id', 'user-id', { selectedOptionIndex: 0 }))
        .rejects.toThrow('Post is not an exercise');
    });

    it('should throw error for invalid option index', async () => {
      const mockQuery = jest.fn().mockResolvedValueOnce({ rows: [{ id: 'post-id', type: 'exercicio', data: { alternativas: [{ texto: 'Option 1', correta: true }] } }] }); // postCheck

      pool.connect = jest.fn().mockReturnValue({
        query: mockQuery,
        release: jest.fn()
      });

      await expect(ExerciseResponse.createResponse('post-id', 'user-id', { selectedOptionIndex: 5 })) // Index out of bounds
        .rejects.toThrow('Invalid option index');
    });

    it('should throw error for invalid response format', async () => {
      const mockQuery = jest.fn().mockResolvedValueOnce({ rows: [{ id: 'post-id', type: 'exercicio', data: { alternativas: [{ texto: 'Option 1', correta: true }] } }] }); // postCheck

      pool.connect = jest.fn().mockReturnValue({
        query: mockQuery,
        release: jest.fn()
      });

      await expect(ExerciseResponse.createResponse('post-id', 'user-id', {})) // Empty response
        .rejects.toThrow('Invalid response format');
    });
  });

  describe('getResponse', () => {
    it('should return user\'s previous response', async () => {
      const mockQuery = jest.fn().mockResolvedValueOnce({ rows: [{ id: 'response-id', selected_option_index: 1 }] });

      pool.query = mockQuery;

      const result = await ExerciseResponse.getResponse('post-id', 'user-id');

      expect(result).toEqual({ id: 'response-id', selected_option_index: 1 });
    });

    it('should return null when user hasn\'t responded', async () => {
      const mockQuery = jest.fn().mockResolvedValueOnce({ rows: [] });

      pool.query = mockQuery;

      const result = await ExerciseResponse.getResponse('post-id', 'user-id');

      expect(result).toBeNull();
    });
  });

  describe('validateResponse', () => {
    it('should validate correct multiple choice response', async () => {
      const mockQuery = jest.fn().mockResolvedValueOnce({ rows: [{ id: 'post-id', type: 'exercicio', data: { alternativas: [{ texto: 'Option 1', correta: true }, { texto: 'Option 2', correta: false }] } }] });

      pool.query = mockQuery;

      const result = await ExerciseResponse.validateResponse('post-id', { selectedOptionIndex: 0 });

      expect(result).toEqual({
        isCorrect: true,
        correctOptionIndex: 0,
        explanation: undefined
      });
    });

    it('should validate incorrect multiple choice response', async () => {
      const mockQuery = jest.fn().mockResolvedValueOnce({ rows: [{ id: 'post-id', type: 'exercicio', data: { alternativas: [{ texto: 'Option 1', correta: true }, { texto: 'Option 2', correta: false }] } }] });

      pool.query = mockQuery;

      const result = await ExerciseResponse.validateResponse('post-id', { selectedOptionIndex: 1 });

      expect(result).toEqual({
        isCorrect: false,
        correctOptionIndex: 0,
        explanation: undefined
      });
    });

    it('should handle descriptive exercise validation', async () => {
      const mockQuery = jest.fn().mockResolvedValueOnce({ rows: [{ id: 'post-id', type: 'exercicio', data: { tipo_exercicio: 'dissertativo' } }] });

      pool.query = mockQuery;

      const result = await ExerciseResponse.validateResponse('post-id', { writtenResponse: 'My answer' });

      expect(result).toEqual({
        isCorrect: null,
        explanation: undefined
      });
    });

    it('should throw error for non-existent post', async () => {
      const mockQuery = jest.fn().mockResolvedValueOnce({ rows: [] });

      pool.query = mockQuery;

      await expect(ExerciseResponse.validateResponse('non-existent-post', { selectedOptionIndex: 0 }))
        .rejects.toThrow('Post not found');
    });

    it('should throw error for non-exercise post', async () => {
      const mockQuery = jest.fn().mockResolvedValueOnce({ rows: [{ id: 'post-id', type: 'publicacao' }] });

      pool.query = mockQuery;

      await expect(ExerciseResponse.validateResponse('post-id', { selectedOptionIndex: 0 }))
        .rejects.toThrow('Post is not an exercise');
    });
  });
});