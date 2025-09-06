import express from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/authenticateToken.js';
import { body, param, query, validationResult } from 'express-validator';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { createMessageNotification } from '../controllers/notificationsController.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads/messages';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|ppt|pptx|txt|zip/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('File type not allowed'));
    }
  }
});

// Get messages for a conversation
router.get('/', [
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative')
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

    const conversationId = req.conversationId;
    const { limit = 50, offset = 0, before } = req.query;
    const userId = req.user.userId;

    // Check if user is participant in this conversation
    const participantCheck = await pool.query(
      'SELECT id FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2',
      [conversationId, userId]
    );

    if (participantCheck.rows.length === 0) {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied to this conversation' 
      });
    }

    let query = `
      SELECT 
        m.id,
        m.content,
        m.message_type,
        m.file_url,
        m.file_name,
        m.file_size,
        m.reply_to_id,
        m.created_at,
        m.updated_at,
        m.is_deleted,
        -- Sender info
        json_build_object(
          'id', u.id,
          'name', u.name,
          'nickname', COALESCE(p.nickname, 'user'),
          'avatar_url', p.avatar_url
        ) as sender,
        -- Reply to message info
        CASE 
          WHEN m.reply_to_id IS NOT NULL THEN 
            json_build_object(
              'id', rm.id,
              'content', CASE WHEN rm.is_deleted THEN '[Message deleted]' ELSE rm.content END,
              'message_type', rm.message_type,
              'sender_name', ru.name,
              'created_at', rm.created_at
            )
          ELSE NULL 
        END as reply_to,
        -- Reactions
        COALESCE(
          (SELECT json_agg(json_build_object(
            'reaction', mr.reaction,
            'count', reaction_counts.count,
            'users', reaction_counts.users
          ))
          FROM message_reactions mr
          JOIN (
            SELECT 
              mr2.reaction,
              COUNT(*) as count,
              json_agg(json_build_object('id', u2.id, 'name', u2.name)) as users
            FROM message_reactions mr2
            JOIN users u2 ON mr2.user_id = u2.id
            WHERE mr2.message_id = m.id
            GROUP BY mr2.reaction
          ) reaction_counts ON mr.reaction = reaction_counts.reaction
          WHERE mr.message_id = m.id
          GROUP BY mr.message_id), '[]'::json
        ) as reactions,
        -- Read status
        EXISTS(
          SELECT 1 FROM message_reads mr 
          WHERE mr.message_id = m.id AND mr.user_id = $2
        ) as is_read_by_user,
        -- Read timestamp
        (SELECT mr.read_at FROM message_reads mr 
         WHERE mr.message_id = m.id AND mr.user_id = $2 
         LIMIT 1) as read_at
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      LEFT JOIN profiles p ON u.id = p.user_id
      LEFT JOIN messages rm ON m.reply_to_id = rm.id
      LEFT JOIN users ru ON rm.sender_id = ru.id
      WHERE m.conversation_id = $1 
        AND m.is_deleted = false
    `;

    const queryParams = [conversationId, userId];

    if (before) {
      query += ` AND m.created_at < $${queryParams.length + 1}`;
      queryParams.push(before);
    }

    query += ` 
      ORDER BY m.created_at DESC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);
    
    // Reverse the order to show oldest first
    const messages = result.rows.reverse();

    res.json({
      success: true,
      data: messages,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: result.rows.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch messages' 
    });
  }
});

// Send a new message
router.post('/', [
  body('content').trim().isLength({ min: 1, max: 4000 }).withMessage('Content must be between 1 and 4000 characters'),
  body('reply_to_id').optional().isUUID().withMessage('Invalid reply message ID')
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

    const conversationId = req.conversationId;
    const { content, reply_to_id } = req.body;
    const userId = req.user.userId;

    // Check if user is participant in this conversation
    const participantCheck = await pool.query(
      'SELECT id FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2',
      [conversationId, userId]
    );

    if (participantCheck.rows.length === 0) {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied to this conversation' 
      });
    }

    // If replying to a message, verify it exists and belongs to this conversation
    if (reply_to_id) {
      const replyCheck = await pool.query(
        'SELECT id FROM messages WHERE id = $1 AND conversation_id = $2 AND is_deleted = false',
        [reply_to_id, conversationId]
      );

      if (replyCheck.rows.length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'Reply message not found' 
        });
      }
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Insert the message
      const messageResult = await client.query(`
        INSERT INTO messages (conversation_id, sender_id, content, reply_to_id)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [conversationId, userId, content, reply_to_id]);

      const messageId = messageResult.rows[0].id;

      // Update conversation's last_message_at
      await client.query(`
        UPDATE conversations 
        SET last_message_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [conversationId]);

      await client.query('COMMIT');

      // Get the complete message data with sender info
      const query = `
        SELECT 
          m.id,
          m.content,
          m.message_type,
          m.file_url,
          m.file_name,
          m.file_size,
          m.reply_to_id,
          m.created_at,
          m.updated_at,
          m.is_deleted,
          json_build_object(
            'id', u.id,
            'name', u.name,
            'nickname', COALESCE(p.nickname, 'user'),
            'avatar_url', p.avatar_url
          ) as sender,
          CASE 
            WHEN m.reply_to_id IS NOT NULL THEN 
              json_build_object(
                'id', rm.id,
                'content', CASE WHEN rm.is_deleted THEN '[Message deleted]' ELSE rm.content END,
                'message_type', rm.message_type,
                'sender_name', ru.name,
                'created_at', rm.created_at
              )
            ELSE NULL 
          END as reply_to,
          '[]'::json as reactions,
          false as is_read_by_user
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        LEFT JOIN profiles p ON u.id = p.user_id
        LEFT JOIN messages rm ON m.reply_to_id = rm.id
        LEFT JOIN users ru ON rm.sender_id = ru.id
        WHERE m.id = $1
      `;

      const result = await client.query(query, [messageId]);
      const message = result.rows[0];

      // Create notifications for participants (respects mute settings)
      try {
        await createMessageNotification(conversationId, userId, content);
      } catch (notifError) {
        console.error('Error creating message notifications:', notifError);
        // Don't fail the message send if notification fails
      }

      // Emit the message via Socket.io
      const io = req.app.get('io');
      io.to(`conversation:${conversationId}`).emit('message:new', message);

      res.status(201).json({
        success: true,
        data: message
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send message' 
    });
  }
});

// Upload file and send message
router.post('/upload', 
  upload.single('file'), 
  [
    body('content').optional().trim().isLength({ max: 1000 }).withMessage('Content must be max 1000 characters')
  ], 
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          error: 'No file uploaded' 
        });
      }

      const conversationId = req.conversationId;
      const { content = '' } = req.body;
      const userId = req.user.userId;

      // Check if user is participant in this conversation
      const participantCheck = await pool.query(
        'SELECT id FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2',
        [conversationId, userId]
      );

      if (participantCheck.rows.length === 0) {
        return res.status(403).json({ 
          success: false, 
          error: 'Access denied to this conversation' 
        });
      }

      const file = req.file;
      const fileUrl = `/uploads/messages/${file.filename}`;
      const messageType = file.mimetype.startsWith('image/') ? 'image' : 'file';

      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');

        // Insert the message
        const messageResult = await client.query(`
          INSERT INTO messages (
            conversation_id, sender_id, content, message_type, 
            file_url, file_name, file_size
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `, [conversationId, userId, content, messageType, fileUrl, file.originalname, file.size]);

        const messageId = messageResult.rows[0].id;

        // Update conversation's last_message_at
        await client.query(`
          UPDATE conversations 
          SET last_message_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
        `, [conversationId]);

        await client.query('COMMIT');

        // Get the complete message data with sender info
        const query = `
          SELECT 
            m.id,
            m.content,
            m.message_type,
            m.file_url,
            m.file_name,
            m.file_size,
            m.reply_to_id,
            m.created_at,
            m.updated_at,
            m.is_deleted,
            json_build_object(
              'id', u.id,
              'name', u.name,
              'nickname', COALESCE(p.nickname, 'user'),
              'avatar_url', p.avatar_url
            ) as sender,
            '[]'::json as reactions,
            false as is_read_by_user
          FROM messages m
          JOIN users u ON m.sender_id = u.id
          LEFT JOIN profiles p ON u.id = p.user_id
          WHERE m.id = $1
        `;

        const result = await client.query(query, [messageId]);
        const message = result.rows[0];

        // Create notifications for participants (respects mute settings)
        try {
          const notificationContent = content || (messageType === 'image' ? '📷 Sent an image' : '📎 Sent a file');
          await createMessageNotification(conversationId, userId, notificationContent);
        } catch (notifError) {
          console.error('Error creating message notifications:', notifError);
          // Don't fail the message send if notification fails
        }

        // Emit the message via Socket.io
        const io = req.app.get('io');
        io.to(`conversation:${conversationId}`).emit('message:new', message);

        res.status(201).json({
          success: true,
          data: message
        });
      } catch (error) {
        await client.query('ROLLBACK');
        // Clean up uploaded file if database operation failed
        try {
          fs.unlinkSync(file.path);
        } catch (cleanupError) {
          console.error('Error cleaning up file:', cleanupError);
        }
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to upload file' 
      });
    }
  }
);

// Edit a message
router.put('/message/:messageId', [
  param('messageId').isUUID().withMessage('Invalid message ID'),
  body('content').trim().isLength({ min: 1, max: 4000 }).withMessage('Content must be between 1 and 4000 characters')
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

    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;

    const result = await pool.query(`
      UPDATE messages 
      SET content = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND sender_id = $3 AND is_deleted = false AND message_type = 'text'
      RETURNING id, conversation_id
    `, [content, messageId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Message not found or cannot be edited' 
      });
    }

    const { conversation_id } = result.rows[0];

    // Emit update via Socket.io
    const io = req.app.get('io');
    io.to(`conversation:${conversation_id}`).emit('message:updated', {
      id: messageId,
      content,
      updated_at: new Date()
    });

    res.json({
      success: true,
      data: { id: messageId, content }
    });
  } catch (error) {
    console.error('Error editing message:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to edit message' 
    });
  }
});

// Delete a message
router.delete('/message/:messageId', [
  param('messageId').isUUID().withMessage('Invalid message ID')
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

    const { messageId } = req.params;
    const userId = req.user.userId;

    const result = await pool.query(`
      UPDATE messages 
      SET is_deleted = true, deleted_at = CURRENT_TIMESTAMP, content = '[Message deleted]'
      WHERE id = $1 AND sender_id = $2 AND is_deleted = false
      RETURNING id, conversation_id
    `, [messageId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Message not found or already deleted' 
      });
    }

    const { conversation_id } = result.rows[0];

    // Emit deletion via Socket.io
    const io = req.app.get('io');
    io.to(`conversation:${conversation_id}`).emit('message:deleted', {
      id: messageId,
      deleted_at: new Date()
    });

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete message' 
    });
  }
});

// React to a message
router.post('/message/:messageId/reactions', [
  param('messageId').isUUID().withMessage('Invalid message ID'),
  body('reaction').isLength({ min: 1, max: 10 }).withMessage('Reaction must be 1-10 characters')
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

    const { messageId } = req.params;
    const { reaction } = req.body;
    const userId = req.user.userId;

    // Check if message exists and get conversation
    const messageCheck = await pool.query(
      'SELECT m.id, m.conversation_id FROM messages m WHERE m.id = $1 AND m.is_deleted = false',
      [messageId]
    );

    if (messageCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Message not found' 
      });
    }

    const { conversation_id } = messageCheck.rows[0];

    // Check if user is participant in this conversation
    const participantCheck = await pool.query(
      'SELECT id FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2',
      [conversation_id, userId]
    );

    if (participantCheck.rows.length === 0) {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied to this conversation' 
      });
    }

    try {
      // Insert reaction (will fail if already exists due to unique constraint)
      await pool.query(`
        INSERT INTO message_reactions (message_id, user_id, reaction)
        VALUES ($1, $2, $3)
      `, [messageId, userId, reaction]);

      // Emit reaction via Socket.io
      const io = req.app.get('io');
      io.to(`conversation:${conversation_id}`).emit('message:reaction:added', {
        message_id: messageId,
        user_id: userId,
        reaction
      });

      res.status(201).json({
        success: true,
        data: { message_id: messageId, reaction }
      });
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        return res.status(400).json({ 
          success: false, 
          error: 'You have already reacted with this emoji' 
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error adding reaction:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to add reaction' 
    });
  }
});

// Remove reaction from a message
router.delete('/message/:messageId/reactions/:reaction', [
  param('messageId').isUUID().withMessage('Invalid message ID'),
  param('reaction').isLength({ min: 1, max: 10 }).withMessage('Reaction must be 1-10 characters')
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

    const { messageId, reaction } = req.params;
    const userId = req.user.userId;

    // Get conversation and delete reaction
    const result = await pool.query(`
      DELETE FROM message_reactions mr
      USING messages m
      WHERE mr.message_id = m.id 
        AND mr.message_id = $1 
        AND mr.user_id = $2 
        AND mr.reaction = $3
      RETURNING m.conversation_id
    `, [messageId, userId, reaction]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Reaction not found' 
      });
    }

    const { conversation_id } = result.rows[0];

    // Emit reaction removal via Socket.io
    const io = req.app.get('io');
    io.to(`conversation:${conversation_id}`).emit('message:reaction:removed', {
      message_id: messageId,
      user_id: userId,
      reaction
    });

    res.json({
      success: true,
      message: 'Reaction removed successfully'
    });
  } catch (error) {
    console.error('Error removing reaction:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to remove reaction' 
    });
  }
});

// Mark all messages in conversation as read
router.post('/read-all', async (req, res) => {
  try {
    const conversationId = req.conversationId;
    const userId = req.user.userId;

    // Check if user is participant in this conversation
    const participantCheck = await pool.query(
      'SELECT id FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2',
      [conversationId, userId]
    );

    if (participantCheck.rows.length === 0) {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied to this conversation' 
      });
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Mark all unread messages as read
      await client.query(`
        INSERT INTO message_reads (message_id, user_id)
        SELECT m.id, $2
        FROM messages m
        LEFT JOIN message_reads mr ON m.id = mr.message_id AND mr.user_id = $2
        WHERE m.conversation_id = $1 
          AND m.sender_id != $2 
          AND m.is_deleted = false 
          AND mr.id IS NULL
        ON CONFLICT (message_id, user_id) DO NOTHING
      `, [conversationId, userId]);

      // Update participant's last_read_at to most recent message
      await client.query(`
        UPDATE conversation_participants 
        SET last_read_at = COALESCE((
          SELECT MAX(created_at) 
          FROM messages 
          WHERE conversation_id = $1 AND is_deleted = false
        ), CURRENT_TIMESTAMP)
        WHERE conversation_id = $1 AND user_id = $2
      `, [conversationId, userId]);

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'All messages marked as read'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error marking all messages as read:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to mark all messages as read' 
    });
  }
});

// Mark message as read
router.post('/message/:messageId/read', [
  param('messageId').isUUID().withMessage('Invalid message ID')
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

    const { messageId } = req.params;
    const userId = req.user.userId;

    try {
      await pool.query(`
        INSERT INTO message_reads (message_id, user_id)
        VALUES ($1, $2)
        ON CONFLICT (message_id, user_id) DO NOTHING
      `, [messageId, userId]);

      // Update participant's last_read_at
      await pool.query(`
        UPDATE conversation_participants cp
        SET last_read_at = CURRENT_TIMESTAMP
        FROM messages m
        WHERE m.id = $1 AND cp.conversation_id = m.conversation_id AND cp.user_id = $2
      `, [messageId, userId]);

      res.json({
        success: true,
        message: 'Message marked as read'
      });
    } catch (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to mark message as read' 
    });
  }
});

export default router;