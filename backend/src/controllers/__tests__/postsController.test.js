import PostsController from '../postsController.js';
import Post from '../../models/Post.js';
import PollVote from '../../models/PollVote.js';
import ExerciseResponse from '../../models/ExerciseResponse.js';

// Mock the models
jest.mock('../../models/Post.js');
jest.mock('../../models/PollVote.js');
jest.mock('../../models/ExerciseResponse.js');

describe('PostsController', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockReq = {
      user: { id: 'user-id' },
      params: {},
      body: {},
      query: {}
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    mockNext = jest.fn();
  });

  describe('voteOnPoll', () => {
    it('should successfully record a vote', async () => {
      mockReq.params = { id: 'post-id' };
      mockReq.body = { optionIndex: 0 };
      
      const mockResult = {
        vote: { id: 'vote-id' },
        results: {
          results: [
            { optionIndex: 0, optionText: 'Option 1', voteCount: 1, percentage: 100 },
            { optionIndex: 1, optionText: 'Option 2', voteCount: 0, percentage: 0 }
          ],
          totalVotes: 1
        }
      };
      
      PollVote.createVote.mockResolvedValue(mockResult);
      
      await PostsController.voteOnPoll(mockReq, mockRes, mockNext);
      
      expect(PollVote.createVote).toHaveBeenCalledWith('post-id', 'user-id', 0);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Vote recorded successfully',
        data: mockResult
      });
    });

    it('should handle validation errors', async () => {
      mockReq.params = { id: 'invalid-uuid' };
      mockReq.body = { optionIndex: 0 };
      
      await PostsController.voteOnPoll(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid post ID format'
      });
    });

    it('should handle missing option index', async () => {
      mockReq.params = { id: 'post-id' };
      mockReq.body = {}; // Missing optionIndex
      
      await PostsController.voteOnPoll(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid option index'
      });
    });

    it('should handle model errors', async () => {
      mockReq.params = { id: 'post-id' };
      mockReq.body = { optionIndex: 0 };
      
      PollVote.createVote.mockRejectedValue(new Error('Post not found'));
      
      await PostsController.voteOnPoll(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Post not found'
      });
    });
  });

  describe('getPollResults', () => {
    it('should successfully retrieve poll results', async () => {
      mockReq.params = { id: 'post-id' };
      
      const mockResults = {
        results: [
          { optionIndex: 0, optionText: 'Option 1', voteCount: 1, percentage: 100 },
          { optionIndex: 1, optionText: 'Option 2', voteCount: 0, percentage: 0 }
        ],
        totalVotes: 1
      };
      
      const mockUserVote = { option_index: 0 };
      
      PollVote.getResults.mockResolvedValue(mockResults);
      PollVote.getUserVote.mockResolvedValue(mockUserVote);
      
      await PostsController.getPollResults(mockReq, mockRes, mockNext);
      
      expect(PollVote.getResults).toHaveBeenCalledWith('post-id');
      expect(PollVote.getUserVote).toHaveBeenCalledWith('post-id', 'user-id');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          ...mockResults,
          userVote: 0
        }
      });
    });

    it('should handle validation errors', async () => {
      mockReq.params = { id: 'invalid-uuid' };
      
      await PostsController.getPollResults(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid post ID format'
      });
    });

    it('should handle model errors', async () => {
      mockReq.params = { id: 'post-id' };
      
      PollVote.getResults.mockRejectedValue(new Error('Post not found'));
      
      await PostsController.getPollResults(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Post not found'
      });
    });
  });

  describe('submitExerciseResponse', () => {
    it('should successfully submit exercise response', async () => {
      mockReq.params = { id: 'post-id' };
      mockReq.body = { selectedOptionIndex: 0 };
      
      const mockResult = {
        response: { id: 'response-id', is_correct: true },
        isCorrect: true,
        correctOptionIndex: 0
      };
      
      ExerciseResponse.createResponse.mockResolvedValue(mockResult);
      
      await PostsController.submitExerciseResponse(mockReq, mockRes, mockNext);
      
      expect(ExerciseResponse.createResponse).toHaveBeenCalledWith('post-id', 'user-id', { selectedOptionIndex: 0 });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Response recorded successfully',
        data: mockResult
      });
    });

    it('should handle validation errors', async () => {
      mockReq.params = { id: 'invalid-uuid' };
      mockReq.body = { selectedOptionIndex: 0 };
      
      await PostsController.submitExerciseResponse(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid post ID format'
      });
    });

    it('should handle invalid response format', async () => {
      mockReq.params = { id: 'post-id' };
      mockReq.body = {}; // Missing required fields
      
      await PostsController.submitExerciseResponse(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid response format'
      });
    });

    it('should handle model errors', async () => {
      mockReq.params = { id: 'post-id' };
      mockReq.body = { selectedOptionIndex: 0 };
      
      ExerciseResponse.createResponse.mockRejectedValue(new Error('Post not found'));
      
      await PostsController.submitExerciseResponse(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Post not found'
      });
    });
  });

  describe('getExerciseResponse', () => {
    it('should successfully retrieve exercise response', async () => {
      mockReq.params = { id: 'post-id' };
      
      const mockResponse = { id: 'response-id', selected_option_index: 0 };
      
      ExerciseResponse.getResponse.mockResolvedValue(mockResponse);
      
      await PostsController.getExerciseResponse(mockReq, mockRes, mockNext);
      
      expect(ExerciseResponse.getResponse).toHaveBeenCalledWith('post-id', 'user-id');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockResponse
      });
    });

    it('should handle validation errors', async () => {
      mockReq.params = { id: 'invalid-uuid' };
      
      await PostsController.getExerciseResponse(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid post ID format'
      });
    });

    it('should handle response not found', async () => {
      mockReq.params = { id: 'post-id' };
      
      ExerciseResponse.getResponse.mockResolvedValue(null);
      
      await PostsController.getExerciseResponse(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Response not found'
      });
    });
  });
});