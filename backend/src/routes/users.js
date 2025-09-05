import express from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/authenticateToken.js';

const router = express.Router();

// Buscar usuários para convite
router.get('/', authenticateToken, async (req, res) => {
  const { query, limit = 10 } = req.query;

  try {
    if (!query || query.trim().length < 2) {
      return res.status(400).json({ 
        error: 'BadRequest', 
        msg: 'Query deve ter pelo menos 2 caracteres' 
      });
    }

    const searchQuery = `%${query.trim()}%`;
    
    const users = await pool.query(
      `SELECT id, name, email
       FROM users 
       WHERE (name ILIKE $1 OR email ILIKE $1)
       AND id != $2
       ORDER BY name
       LIMIT $3`,
      [searchQuery, req.user.userId, limit]
    );

    const formattedUsers = users.rows.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      initials: user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
    }));

    res.json({
      success: true,
      data: formattedUsers
    });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ 
      error: 'InternalServerError', 
      msg: 'Erro interno do servidor' 
    });
  }
});

export default router;