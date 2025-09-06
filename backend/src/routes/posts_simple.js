import express from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/authenticateToken.js';

const router = express.Router();

// Simple test endpoint
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) as count FROM posts');
    res.json({ 
      message: 'Posts API working', 
      total_posts: parseInt(result.rows[0].count),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// Get all posts (simple version)
router.get('/all', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, title, content, type, created_at, likes_count, comments_count 
      FROM posts 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    res.json({ posts: result.rows });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Create simple post (for testing)
router.post('/test', authenticateToken, async (req, res) => {
  try {
    const { title, content, type = 'publicacao' } = req.body;
    const userId = req.user.userId;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    const result = await pool.query(`
      INSERT INTO posts (user_id, title, content, type, data, tags, is_anonymous)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [userId, title, content, type, '{}', [], false]);
    
    res.status(201).json({ 
      message: 'Post created successfully',
      post: result.rows[0]
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

export default router;