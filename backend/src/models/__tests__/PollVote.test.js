import PollVote from '../PollVote.js';
import pool from '../../config/database.js';

// Mock the database pool
jest.mock('../../config/database.js');

describe('PollVote Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createVote', () => {
    it('should create a new vote when user hasn\'t voted before', async () => {
      const mockQuery = jest.fn()
        .mockResolvedValueOnce({ rows: [{ id: 'post-id', type: 'enquete', data: { poll_options: ['Option 1', 'Option 2'] } }] }) // postCheck
        .mockResolvedValueOnce({ rows: [] }) // voteCheck
        .mockResolvedValueOnce({ rows: [{ id: 'vote-id' }] }) // insert vote
        .mockResolvedValueOnce({ rows: [ // getResults
          { option_index: 0, vote_count: 1 },
          { option_index: 1, vote_count: 0 }
        ] });

      pool.connect = jest.fn().mockReturnValue({
        query: mockQuery,
        release: jest.fn()
      });

      const result = await PollVote.createVote('post-id', 'user-id', 0);

      expect(result).toEqual({
        vote: { id: 'vote-id' },
        results: {
          results: [
            { optionIndex: 0, optionText: 'Option 1', voteCount: 1, percentage: 100 },
            { optionIndex: 1, optionText: 'Option 2', voteCount: 0, percentage: 0 }
          ],
          totalVotes: 1
        }
      });
    });

    it('should update existing vote when user has already voted', async () => {
      const mockQuery = jest.fn()
        .mockResolvedValueOnce({ rows: [{ id: 'post-id', type: 'enquete', data: { poll_options: ['Option 1', 'Option 2'] } }] }) // postCheck
        .mockResolvedValueOnce({ rows: [{ id: 'existing-vote-id' }] }) // voteCheck
        .mockResolvedValueOnce({ rows: [{ id: 'updated-vote-id' }] }) // update vote
        .mockResolvedValueOnce({ rows: [ // getResults
          { option_index: 0, vote_count: 1 },
          { option_index: 1, vote_count: 0 }
        ] });

      pool.connect = jest.fn().mockReturnValue({
        query: mockQuery,
        release: jest.fn()
      });

      const result = await PollVote.createVote('post-id', 'user-id', 0);

      expect(result).toEqual({
        vote: { id: 'updated-vote-id' },
        results: {
          results: [
            { optionIndex: 0, optionText: 'Option 1', voteCount: 1, percentage: 100 },
            { optionIndex: 1, optionText: 'Option 2', voteCount: 0, percentage: 0 }
          ],
          totalVotes: 1
        }
      });
    });

    it('should throw error for non-existent post', async () => {
      const mockQuery = jest.fn().mockResolvedValueOnce({ rows: [] }); // postCheck returns empty

      pool.connect = jest.fn().mockReturnValue({
        query: mockQuery,
        release: jest.fn()
      });

      await expect(PollVote.createVote('non-existent-post', 'user-id', 0))
        .rejects.toThrow('Post not found');
    });

    it('should throw error for non-poll post', async () => {
      const mockQuery = jest.fn().mockResolvedValueOnce({ rows: [{ id: 'post-id', type: 'publicacao' }] }); // postCheck returns non-poll

      pool.connect = jest.fn().mockReturnValue({
        query: mockQuery,
        release: jest.fn()
      });

      await expect(PollVote.createVote('post-id', 'user-id', 0))
        .rejects.toThrow('Post is not a poll');
    });

    it('should throw error for invalid option index', async () => {
      const mockQuery = jest.fn().mockResolvedValueOnce({ rows: [{ id: 'post-id', type: 'enquete', data: { poll_options: ['Option 1', 'Option 2'] } }] }); // postCheck

      pool.connect = jest.fn().mockReturnValue({
        query: mockQuery,
        release: jest.fn()
      });

      await expect(PollVote.createVote('post-id', 'user-id', 5)) // Index out of bounds
        .rejects.toThrow('Invalid option index');
    });
  });

  describe('getResults', () => {
    it('should calculate vote percentages correctly', async () => {
      const mockQuery = jest.fn()
        .mockResolvedValueOnce({ rows: [{ id: 'post-id', type: 'enquete', data: { poll_options: ['Option 1', 'Option 2'] } }] }) // postCheck
        .mockResolvedValueOnce({ rows: [ // voteCountsResult
          { option_index: 0, vote_count: 3 },
          { option_index: 1, vote_count: 2 }
        ] });

      pool.query = mockQuery;

      const result = await PollVote.getResults('post-id');

      expect(result).toEqual({
        results: [
          { optionIndex: 0, optionText: 'Option 1', voteCount: 3, percentage: 60 },
          { optionIndex: 1, optionText: 'Option 2', voteCount: 2, percentage: 40 }
        ],
        totalVotes: 5
      });
    });

    it('should handle zero votes correctly', async () => {
      const mockQuery = jest.fn()
        .mockResolvedValueOnce({ rows: [{ id: 'post-id', type: 'enquete', data: { poll_options: ['Option 1', 'Option 2'] } }] }) // postCheck
        .mockResolvedValueOnce({ rows: [] }); // voteCountsResult (no votes)

      pool.query = mockQuery;

      const result = await PollVote.getResults('post-id');

      expect(result).toEqual({
        results: [
          { optionIndex: 0, optionText: 'Option 1', voteCount: 0, percentage: 0 },
          { optionIndex: 1, optionText: 'Option 2', voteCount: 0, percentage: 0 }
        ],
        totalVotes: 0
      });
    });
  });

  describe('getUserVote', () => {
    it('should return user\'s previous vote', async () => {
      const mockQuery = jest.fn().mockResolvedValueOnce({ rows: [{ option_index: 1 }] });

      pool.query = mockQuery;

      const result = await PollVote.getUserVote('post-id', 'user-id');

      expect(result).toEqual({ option_index: 1 });
    });

    it('should return null when user hasn\'t voted', async () => {
      const mockQuery = jest.fn().mockResolvedValueOnce({ rows: [] });

      pool.query = mockQuery;

      const result = await PollVote.getUserVote('post-id', 'user-id');

      expect(result).toBeNull();
    });
  });
});