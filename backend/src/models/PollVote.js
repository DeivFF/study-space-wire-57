import pool from '../config/database.js';

/**
 * PollVote Model - Handles poll voting operations
 */
class PollVote {
  /**
   * Create or update a user's vote
   * @param {string} postId - Post ID
   * @param {string} userId - User ID
   * @param {number} optionIndex - Selected option index
   * @returns {Object} Vote result
   */
  static async createVote(postId, userId, optionIndex) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if post exists and is a poll
      const postCheck = await client.query(
        'SELECT id, type, data FROM posts WHERE id = $1',
        [postId]
      );

      if (postCheck.rows.length === 0) {
        throw new Error('Post not found');
      }

      if (postCheck.rows[0].type !== 'enquete') {
        throw new Error('Post is not a poll');
      }

      const post = postCheck.rows[0];
      const pollOptions = post.data?.poll_options || [];

      if (optionIndex < 0 || optionIndex >= pollOptions.length) {
        throw new Error('Invalid option index');
      }

      // Check if user has already voted
      const voteCheck = await client.query(
        'SELECT id FROM poll_votes WHERE post_id = $1 AND user_id = $2',
        [postId, userId]
      );

      let result;
      if (voteCheck.rows.length > 0) {
        // Update existing vote
        result = await client.query(
          'UPDATE poll_votes SET option_index = $1, created_at = CURRENT_TIMESTAMP WHERE post_id = $2 AND user_id = $3 RETURNING *',
          [optionIndex, postId, userId]
        );
      } else {
        // Create new vote
        result = await client.query(
          'INSERT INTO poll_votes (post_id, user_id, option_index) VALUES ($1, $2, $3) RETURNING *',
          [postId, userId, optionIndex]
        );
      }

      // Get updated results
      const results = await this.getResults(postId);

      await client.query('COMMIT');

      return {
        vote: result.rows[0],
        results
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get poll results with vote counts and percentages
   * @param {string} postId - Post ID
   * @returns {Object} Poll results
   */
  static async getResults(postId) {
    try {
      // Get post to verify it exists and is a poll
      const postResult = await pool.query(
        'SELECT id, type, data FROM posts WHERE id = $1',
        [postId]
      );

      if (postResult.rows.length === 0) {
        throw new Error('Post not found');
      }

      if (postResult.rows[0].type !== 'enquete') {
        throw new Error('Post is not a poll');
      }

      const post = postResult.rows[0];
      const pollOptions = post.data?.poll_options || [];

      // Get vote counts for each option
      const voteCountsResult = await pool.query(
        `SELECT 
          option_index,
          COUNT(*) as vote_count
        FROM poll_votes 
        WHERE post_id = $1
        GROUP BY option_index
        ORDER BY option_index`,
        [postId]
      );

      // Create a map of option index to vote count
      const voteCounts = {};
      let totalVotes = 0;

      voteCountsResult.rows.forEach(row => {
        voteCounts[row.option_index] = parseInt(row.vote_count);
        totalVotes += parseInt(row.vote_count);
      });

      // Calculate percentages and create results array
      const results = pollOptions.map((option, index) => {
        const voteCount = voteCounts[index] || 0;
        const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 10000) / 100 : 0;

        return {
          optionIndex: index,
          optionText: option,
          voteCount,
          percentage
        };
      });

      return {
        results,
        totalVotes
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get a user's previous vote
   * @param {string} postId - Post ID
   * @param {string} userId - User ID
   * @returns {Object|null} User's vote or null
   */
  static async getUserVote(postId, userId) {
    try {
      const result = await pool.query(
        'SELECT option_index FROM poll_votes WHERE post_id = $1 AND user_id = $2',
        [postId, userId]
      );

      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete a user's vote (admin functionality)
   * @param {string} postId - Post ID
   * @param {string} userId - User ID
   * @returns {boolean} Success status
   */
  static async deleteVote(postId, userId) {
    try {
      const result = await pool.query(
        'DELETE FROM poll_votes WHERE post_id = $1 AND user_id = $2',
        [postId, userId]
      );

      return result.rowCount > 0;
    } catch (error) {
      throw error;
    }
  }
}

export default PollVote;