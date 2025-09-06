import pool from '../config/database.js';

/**
 * ExerciseResponse Model - Handles exercise response operations
 */
class ExerciseResponse {
  /**
   * Create or update a user's response
   * @param {string} postId - Post ID
   * @param {string} userId - User ID
   * @param {Object} response - Response data
   * @returns {Object} Response result
   */
 static async createResponse(postId, userId, response) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if post exists and is an exercise
      const postCheck = await client.query(
        'SELECT id, type, data FROM posts WHERE id = $1',
        [postId]
      );

      if (postCheck.rows.length === 0) {
        throw new Error('Post not found');
      }

      if (postCheck.rows[0].type !== 'exercicio') {
        throw new Error('Post is not an exercise');
      }

      const post = postCheck.rows[0];
      const exerciseData = post.data || {};

      // Validate response based on exercise type
      let selectedOptionIndex = null;
      let writtenResponse = null;
      let isCorrect = null;

      if (response.selectedOptionIndex !== undefined) {
        // Multiple choice exercise
        selectedOptionIndex = response.selectedOptionIndex;
        const alternatives = exerciseData.alternativas || [];

        if (selectedOptionIndex < 0 || selectedOptionIndex >= alternatives.length) {
          throw new Error('Invalid option index');
        }

        // Check if selected option is correct
        const selectedOption = alternatives[selectedOptionIndex];
        isCorrect = selectedOption && selectedOption.correta === true;
      } else if (response.writtenResponse !== undefined) {
        // Descriptive exercise
        writtenResponse = response.writtenResponse;
        // For descriptive exercises, we don't automatically validate correctness
        isCorrect = null;
      } else {
        throw new Error('Invalid response format');
      }

      // Check if user has already responded
      const responseCheck = await client.query(
        'SELECT id FROM exercise_responses WHERE post_id = $1 AND user_id = $2',
        [postId, userId]
      );

      let result;
      if (responseCheck.rows.length > 0) {
        // Update existing response
        result = await client.query(
          `UPDATE exercise_responses 
           SET selected_option_index = $1, written_response = $2, is_correct = $3, created_at = CURRENT_TIMESTAMP 
           WHERE post_id = $4 AND user_id = $5 
           RETURNING *`,
          [selectedOptionIndex, writtenResponse, isCorrect, postId, userId]
        );
      } else {
        // Create new response
        result = await client.query(
          `INSERT INTO exercise_responses (post_id, user_id, selected_option_index, written_response, is_correct) 
           VALUES ($1, $2, $3, $4, $5) 
           RETURNING *`,
          [postId, userId, selectedOptionIndex, writtenResponse, isCorrect]
        );
      }

      await client.query('COMMIT');

      // Return response with validation information
      const responseData = result.rows[0];
      const returnData = {
        response: responseData,
        isCorrect
      };

      // For multiple choice, also return the correct option index
      if (selectedOptionIndex !== null) {
        const alternatives = exerciseData.alternativas || [];
        const correctOptionIndex = alternatives.findIndex(option => option.correta === true);
        returnData.correctOptionIndex = correctOptionIndex >= 0 ? correctOptionIndex : null;
      }

      return returnData;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get a user's previous response
   * @param {string} postId - Post ID
   * @param {string} userId - User ID
   * @returns {Object|null} User's response or null
   */
  static async getResponse(postId, userId) {
    try {
      const result = await pool.query(
        'SELECT * FROM exercise_responses WHERE post_id = $1 AND user_id = $2',
        [postId, userId]
      );

      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Validate if a response is correct
   * @param {string} postId - Post ID
   * @param {Object} response - Response data
   * @returns {Object} Validation result
   */
  static async validateResponse(postId, response) {
    try {
      // Get post to verify it exists and is an exercise
      const postResult = await pool.query(
        'SELECT id, type, data FROM posts WHERE id = $1',
        [postId]
      );

      if (postResult.rows.length === 0) {
        throw new Error('Post not found');
      }

      if (postResult.rows[0].type !== 'exercicio') {
        throw new Error('Post is not an exercise');
      }

      const post = postResult.rows[0];
      const exerciseData = post.data || {};
      const alternatives = exerciseData.alternativas || [];

      if (response.selectedOptionIndex !== undefined) {
        // Multiple choice exercise
        const selectedOptionIndex = response.selectedOptionIndex;

        if (selectedOptionIndex < 0 || selectedOptionIndex >= alternatives.length) {
          throw new Error('Invalid option index');
        }

        // Check if selected option is correct
        const selectedOption = alternatives[selectedOptionIndex];
        const isCorrect = selectedOption && selectedOption.correta === true;
        const correctOptionIndex = alternatives.findIndex(option => option.correta === true);

        return {
          isCorrect,
          correctOptionIndex: correctOptionIndex >= 0 ? correctOptionIndex : null,
          explanation: exerciseData.resolucao_comentada || null
        };
      } else if (response.writtenResponse !== undefined) {
        // Descriptive exercise - no automatic validation
        return {
          isCorrect: null,
          explanation: exerciseData.resolucao_comentada || null
        };
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete a user's response (admin functionality)
   * @param {string} postId - Post ID
   * @param {string} userId - User ID
   * @returns {boolean} Success status
   */
  static async deleteResponse(postId, userId) {
    try {
      const result = await pool.query(
        'DELETE FROM exercise_responses WHERE post_id = $1 AND user_id = $2',
        [postId, userId]
      );

      return result.rowCount > 0;
    } catch (error) {
      throw error;
    }
  }
}

export default ExerciseResponse;