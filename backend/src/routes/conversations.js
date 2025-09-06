import express from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/authenticateToken.js';
import { body, param, query, validationResult } from 'express-validator';
import messagesRouter from './messages.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Mount messages router for conversation-specific message routes
router.use('/:conversationId/messages', (req, res, next) => {
  req.conversationId = req.params.conversationId;
  next();
}, messagesRouter);

// Get all conversations for the authenticated user
router.get('/', async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const userId = req.user.userId;

    const query = `
      SELECT 
        c.id,
        c.created_at,
        c.updated_at,
        c.last_message_at,
        c.is_archived,
        -- Get the other participant's info (for direct conversations)
        (SELECT json_build_object(
          'id', u.id,
          'name', u.name,
          'email', u.email,
          'avatar_url', pr.avatar_url
        ) FROM users u 
         LEFT JOIN profiles pr ON u.id = pr.user_id
         JOIN conversation_participants cp2 ON u.id = cp2.user_id 
         WHERE cp2.conversation_id = c.id AND cp2.user_id != $1
         LIMIT 1) as other_participant,
        -- Get last message info
        (SELECT json_build_object(
          'id', m.id,
          'content', CASE WHEN m.is_deleted THEN '[Message deleted]' ELSE m.content END,
          'message_type', m.message_type,
          'sender_id', m.sender_id,
          'created_at', m.created_at
        ) FROM messages m 
         WHERE m.conversation_id = c.id 
         ORDER BY m.created_at DESC 
         LIMIT 1) as last_message,
        -- Count unread messages
        (SELECT COUNT(*) 
         FROM messages m 
         LEFT JOIN message_reads mr ON m.id = mr.message_id AND mr.user_id = $1
         WHERE m.conversation_id = c.id 
           AND m.sender_id != $1 
           AND mr.id IS NULL
           AND m.is_deleted = false) as unread_count,
        -- User's participant info
        cp.last_read_at,
        cp.is_muted
      FROM conversations c
      JOIN conversation_participants cp ON c.id = cp.conversation_id
      WHERE cp.user_id = $1
      ORDER BY 
        CASE WHEN c.last_message_at IS NOT NULL THEN c.last_message_at ELSE c.created_at END DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await pool.query(query, [userId, limit, offset]);
    
    res.json({
      success: true,
      data: result.rows,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: result.rows.length
      }
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch conversations' 
    });
  }
});

// Get a specific conversation
router.get('/:id', [
  param('id').isUUID().withMessage('Invalid conversation ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { id } = req.params;
    const userId = req.user.userId;

    // Check if user is participant in this conversation
    const participantCheck = await pool.query(
      'SELECT id FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2',
      [id, userId]
    );

    if (participantCheck.rows.length === 0) {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied to this conversation' 
      });
    }

    const query = `
      SELECT 
        c.id,
        c.created_at,
        c.updated_at,
        c.last_message_at,
        c.is_archived,
        -- Get all participants
        (SELECT json_agg(json_build_object(
          'id', u.id,
          'name', u.name,
          'email', u.email,
          'avatar_url', pr.avatar_url,
          'joined_at', cp.joined_at,
          'is_muted', cp.is_muted,
          'last_read_at', cp.last_read_at
        )) FROM users u 
         LEFT JOIN profiles pr ON u.id = pr.user_id
         JOIN conversation_participants cp ON u.id = cp.user_id 
         WHERE cp.conversation_id = c.id) as participants,
        -- User's participant info
        cp.last_read_at,
        cp.is_muted
      FROM conversations c
      JOIN conversation_participants cp ON c.id = cp.conversation_id
      WHERE c.id = $1 AND cp.user_id = $2
    `;

    const result = await pool.query(query, [id, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Conversation not found' 
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch conversation' 
    });
  }
});

// Create a new conversation
router.post('/', [
  body('participant_id').isUUID().withMessage('Valid participant ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { participant_id } = req.body;
    const userId = req.user.userId;

    // Can't create conversation with yourself
    if (participant_id === userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot create conversation with yourself' 
      });
    }

    // Check if participants are connected
    const connectionCheck = await pool.query(`
      SELECT id FROM user_connections 
      WHERE ((requester_id = $1 AND receiver_id = $2) OR (requester_id = $2 AND receiver_id = $1))
        AND status = 'accepted'
    `, [userId, participant_id]);

    if (connectionCheck.rows.length === 0) {
      return res.status(403).json({ 
        success: false, 
        error: 'Can only create conversations with connected users' 
      });
    }

    // Check if conversation already exists between these users
    const existingQuery = `
      SELECT c.id 
      FROM conversations c
      JOIN conversation_participants cp1 ON c.id = cp1.conversation_id
      JOIN conversation_participants cp2 ON c.id = cp2.conversation_id
      WHERE cp1.user_id = $1 AND cp2.user_id = $2
        AND (SELECT COUNT(*) FROM conversation_participants WHERE conversation_id = c.id) = 2
    `;

    const existing = await pool.query(existingQuery, [userId, participant_id]);
    
    if (existing.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Conversation already exists',
        conversation_id: existing.rows[0].id
      });
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Create conversation
      const conversationResult = await client.query(`
        INSERT INTO conversations DEFAULT VALUES
        RETURNING *
      `);

      const conversationId = conversationResult.rows[0].id;

      // Add participants
      await client.query(`
        INSERT INTO conversation_participants (conversation_id, user_id)
        VALUES ($1, $2), ($1, $3)
      `, [conversationId, userId, participant_id]);

      await client.query('COMMIT');

      // Get the created conversation with participant info
      const query = `
        SELECT 
          c.id,
          c.created_at,
          c.updated_at,
          c.last_message_at,
          c.is_archived,
          (SELECT json_agg(json_build_object(
            'id', u.id,
            'name', u.name,
            'email', u.email,
            'avatar_url', pr.avatar_url,
            'joined_at', cp.joined_at
          )) FROM users u 
           LEFT JOIN profiles pr ON u.id = pr.user_id
           JOIN conversation_participants cp ON u.id = cp.user_id 
           WHERE cp.conversation_id = c.id) as participants
        FROM conversations c
        WHERE c.id = $1
      `;

      const result = await client.query(query, [conversationId]);

      res.status(201).json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create conversation' 
    });
  }
});

// Archive/unarchive a conversation
router.post('/:id/archive', [
  param('id').isUUID().withMessage('Invalid conversation ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { id } = req.params;
    const userId = req.user.userId;

    // Check if user is participant
    const participantCheck = await pool.query(
      'SELECT id FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2',
      [id, userId]
    );

    if (participantCheck.rows.length === 0) {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied to this conversation' 
      });
    }

    const result = await pool.query(`
      UPDATE conversations 
      SET is_archived = NOT is_archived, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING is_archived
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Conversation not found' 
      });
    }

    res.json({
      success: true,
      data: { 
        conversation_id: id,
        is_archived: result.rows[0].is_archived 
      }
    });
  } catch (error) {
    console.error('Error archiving conversation:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to archive conversation' 
    });
  }
});

// Mute/unmute a conversation
router.post('/:id/mute', [
  param('id').isUUID().withMessage('Invalid conversation ID'),
  body('is_muted').isBoolean().withMessage('is_muted must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { id } = req.params;
    const { is_muted } = req.body;
    const userId = req.user.userId;

    const result = await pool.query(`
      UPDATE conversation_participants 
      SET is_muted = $1
      WHERE conversation_id = $2 AND user_id = $3
      RETURNING is_muted
    `, [is_muted, id, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Conversation not found or access denied' 
      });
    }

    res.json({
      success: true,
      data: { 
        conversation_id: id,
        is_muted: result.rows[0].is_muted 
      }
    });
  } catch (error) {
    console.error('Error updating conversation mute status:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update mute status' 
    });
  }
});

// Delete a conversation (only removes the user from participants)
router.delete('/:id', [
  param('id').isUUID().withMessage('Invalid conversation ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { id } = req.params;
    const userId = req.user.userId;

    const result = await pool.query(
      'DELETE FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Conversation not found or already deleted' 
      });
    }

    res.json({
      success: true,
      message: 'Left conversation successfully'
    });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete conversation' 
    });
  }
});

export default router;