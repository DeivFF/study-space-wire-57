const pool = require('../config/database');

class RoomsController {
  // Criar nova sala
  static async createRoom(req, res) {
    const client = await pool.connect();
    
    try {
      const { nome, descricao, visibilidade, max_members } = req.body;
      const userId = req.user.id;
      
      // Validações básicas
      if (!nome || nome.trim().length < 3) {
        return res.status(400).json({ 
          error: 'BadRequest', 
          details: [{ field: 'nome', msg: 'Nome deve ter pelo menos 3 caracteres' }]
        });
      }
      
      if (nome.trim().length > 50) {
        return res.status(400).json({ 
          error: 'BadRequest', 
          details: [{ field: 'nome', msg: 'Nome deve ter no máximo 50 caracteres' }]
        });
      }
      
      if (descricao && descricao.length > 200) {
        return res.status(400).json({ 
          error: 'BadRequest', 
          details: [{ field: 'descricao', msg: 'Descrição deve ter no máximo 200 caracteres' }]
        });
      }
      
      const visibility = visibilidade === 'privada' ? 'private' : 'public';
      
      await client.query('BEGIN');
      
      // Gerar código único
      let roomCode;
      let codeExists = true;
      let attempts = 0;
      
      while (codeExists && attempts < 10) {
        const codeResult = await client.query('SELECT generate_room_code() as code');
        roomCode = codeResult.rows[0].code;
        
        const existingCode = await client.query(
          'SELECT 1 FROM rooms WHERE code = $1',
          [roomCode]
        );
        
        codeExists = existingCode.rows.length > 0;
        attempts++;
      }
      
      if (codeExists) {
        await client.query('ROLLBACK');
        return res.status(500).json({ error: 'InternalServerError', msg: 'Erro ao gerar código único' });
      }
      
      // Criar sala
      const roomResult = await client.query(`
        INSERT INTO rooms (name, description, visibility, code, owner_id, max_members, current_members)
        VALUES ($1, $2, $3, $4, $5, $6, 1)
        RETURNING id, name, description, visibility, code, owner_id, max_members, current_members, created_at
      `, [nome.trim(), descricao?.trim() || null, visibility, roomCode, userId, max_members || 10]);
      
      const room = roomResult.rows[0];
      
      // Adicionar owner como membro
      await client.query(`
        INSERT INTO room_members (room_id, user_id, role, joined_at)
        VALUES ($1, $2, 'owner', CURRENT_TIMESTAMP)
      `, [room.id, userId]);
      
      // Criar conversa para a sala
      const conversationResult = await client.query(`
        INSERT INTO conversations (type, name, description, created_by)
        VALUES ('group', $1, $2, $3)
        RETURNING id
      `, [room.name, room.description, userId]);
      
      await client.query(`
        INSERT INTO room_conversations (room_id, conversation_id)
        VALUES ($1, $2)
      `, [room.id, conversationResult.rows[0].id]);
      
      // Adicionar owner como participante da conversa
      await client.query(`
        INSERT INTO conversation_participants (conversation_id, user_id, role, joined_at)
        VALUES ($1, $2, 'admin', CURRENT_TIMESTAMP)
      `, [conversationResult.rows[0].id, userId]);
      
      await client.query('COMMIT');
      
      // Resposta padronizada para o frontend
      res.status(201).json({
        id: room.id,
        nome: room.name,
        descricao: room.description,
        visibilidade: room.visibility === 'private' ? 'privada' : 'publica',
        code: room.code,
        ownerId: room.owner_id,
        currentMembers: room.current_members,
        maxMembers: room.max_members,
        createdAt: room.created_at
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Erro ao criar sala:', error);
      res.status(500).json({ error: 'InternalServerError', traceId: req.traceId });
    } finally {
      client.release();
    }
  }
  
  // Listar salas
  static async listRooms(req, res) {
    try {
      const userId = req.user.id;
      const { filter = 'all', search = '', visibility, favorite, limit = 20 } = req.query;
      
      let baseQuery = `
        SELECT DISTINCT r.id, r.name, r.description, r.visibility, r.code, r.owner_id, 
               r.max_members, r.current_members, r.created_at, r.last_activity,
               CASE WHEN rm.user_id = $1 THEN rm.is_favorite ELSE false END as is_favorite,
               CASE WHEN rm.user_id = $1 THEN true ELSE false END as is_member,
               CASE WHEN r.owner_id = $1 THEN true ELSE false END as is_owner,
               p.name as host_name
        FROM rooms r
        LEFT JOIN room_members rm ON r.id = rm.room_id AND rm.user_id = $1
        LEFT JOIN profiles p ON r.owner_id = p.user_id
        WHERE r.is_active = true
      `;
      
      const params = [userId];
      let paramCount = 1;
      
      // Filtros
      if (filter === 'mine') {
        baseQuery += ` AND rm.user_id = $1`;
      }
      
      if (search) {
        paramCount++;
        baseQuery += ` AND (r.name ILIKE $${paramCount} OR r.description ILIKE $${paramCount})`;
        params.push(`%${search}%`);
      }
      
      if (visibility === 'public' || visibility === 'private') {
        paramCount++;
        baseQuery += ` AND r.visibility = $${paramCount}`;
        params.push(visibility);
      }
      
      if (favorite === 'true') {
        baseQuery += ` AND rm.is_favorite = true`;
      }
      
      // Ordenação: favoritas primeiro, depois públicas, depois por nome
      baseQuery += ` ORDER BY 
        CASE WHEN rm.is_favorite = true THEN 0 ELSE 1 END,
        CASE WHEN r.visibility = 'public' THEN 0 ELSE 1 END,
        r.name ASC
      `;
      
      paramCount++;
      baseQuery += ` LIMIT $${paramCount}`;
      params.push(parseInt(limit));
      
      const result = await pool.query(baseQuery, params);
      
      // Mapear para formato esperado pelo frontend
      const rooms = result.rows.map(room => ({
        id: room.id,
        nome: room.name,
        name: room.name,
        descricao: room.description,
        description: room.description,
        visibilidade: room.visibility === 'private' ? 'privada' : 'publica',
        visibility: room.visibility,
        code: room.code,
        owner_id: room.owner_id,
        host_name: room.host_name,
        max_members: room.max_members,
        member_count: room.current_members,
        members: [], // Para compatibilidade
        is_favorite: room.is_favorite,
        is_favorited: room.is_favorite,
        is_member: room.is_member,
        is_owner: room.is_owner,
        is_active: true,
        created_at: room.created_at,
        last_activity: room.last_activity
      }));
      
      res.json({ items: rooms, nextCursor: null });
      
    } catch (error) {
      console.error('Erro ao listar salas:', error);
      res.status(500).json({ error: 'InternalServerError', traceId: req.traceId });
    }
  }
  
  // Entrar em sala pública
  static async joinRoom(req, res) {
    const client = await pool.connect();
    
    try {
      const { roomId } = req.params;
      const userId = req.user.id;
      
      await client.query('BEGIN');
      
      // Verificar se a sala existe e é pública
      const roomResult = await client.query(`
        SELECT id, name, visibility, max_members, current_members 
        FROM rooms 
        WHERE id = $1 AND is_active = true
      `, [roomId]);
      
      if (roomResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'NotFound', resource: 'room' });
      }
      
      const room = roomResult.rows[0];
      
      if (room.visibility !== 'public') {
        await client.query('ROLLBACK');
        return res.status(403).json({ 
          error: 'Forbidden', 
          msg: 'Esta sala é privada. Solicite acesso ou use um convite.'
        });
      }
      
      // Verificar se há vagas
      if (room.current_members >= room.max_members) {
        await client.query('ROLLBACK');
        return res.status(409).json({ 
          error: 'Conflict', 
          msg: 'Sala lotada'
        });
      }
      
      // Verificar se já é membro
      const memberResult = await client.query(`
        SELECT 1 FROM room_members 
        WHERE room_id = $1 AND user_id = $2
      `, [roomId, userId]);
      
      if (memberResult.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({ 
          error: 'Conflict', 
          msg: 'Você já é membro desta sala'
        });
      }
      
      // Adicionar como membro
      await client.query(`
        INSERT INTO room_members (room_id, user_id, role, joined_at)
        VALUES ($1, $2, 'member', CURRENT_TIMESTAMP)
      `, [roomId, userId]);
      
      // Adicionar à conversa da sala
      const conversationResult = await client.query(`
        SELECT conversation_id FROM room_conversations WHERE room_id = $1
      `, [roomId]);
      
      if (conversationResult.rows.length > 0) {
        await client.query(`
          INSERT INTO conversation_participants (conversation_id, user_id, role, joined_at)
          VALUES ($1, $2, 'member', CURRENT_TIMESTAMP)
          ON CONFLICT (conversation_id, user_id) DO NOTHING
        `, [conversationResult.rows[0].conversation_id, userId]);
      }
      
      await client.query('COMMIT');
      
      res.json({ roomId, role: 'member' });
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Erro ao entrar na sala:', error);
      res.status(500).json({ error: 'InternalServerError', traceId: req.traceId });
    } finally {
      client.release();
    }
  }
  
  // Solicitar acesso a sala privada
  static async requestAccess(req, res) {
    const client = await pool.connect();
    
    try {
      const { roomId } = req.params;
      const { message } = req.body;
      const userId = req.user.id;
      
      await client.query('BEGIN');
      
      // Verificar se a sala existe
      const roomResult = await client.query(`
        SELECT id, name, visibility FROM rooms 
        WHERE id = $1 AND is_active = true
      `, [roomId]);
      
      if (roomResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'NotFound', resource: 'room' });
      }
      
      const room = roomResult.rows[0];
      
      // Verificar se já é membro
      const memberResult = await client.query(`
        SELECT 1 FROM room_members 
        WHERE room_id = $1 AND user_id = $2
      `, [roomId, userId]);
      
      if (memberResult.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({ 
          error: 'Conflict', 
          msg: 'Você já é membro desta sala'
        });
      }
      
      // Verificar se já tem solicitação pendente
      const requestResult = await client.query(`
        SELECT 1 FROM room_access_requests 
        WHERE room_id = $1 AND user_id = $2 AND status = 'pending'
      `, [roomId, userId]);
      
      if (requestResult.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({ 
          error: 'Conflict', 
          msg: 'Você já tem uma solicitação pendente para esta sala'
        });
      }
      
      // Criar solicitação
      const accessRequestResult = await client.query(`
        INSERT INTO room_access_requests (room_id, user_id, message, status, created_at)
        VALUES ($1, $2, $3, 'pending', CURRENT_TIMESTAMP)
        RETURNING id, created_at
      `, [roomId, userId, message]);
      
      await client.query('COMMIT');
      
      res.status(201).json({
        id: accessRequestResult.rows[0].id,
        status: 'pending',
        createdAt: accessRequestResult.rows[0].created_at
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Erro ao solicitar acesso:', error);
      res.status(500).json({ error: 'InternalServerError', traceId: req.traceId });
    } finally {
      client.release();
    }
  }
  
  // Favoritar/desfavoritar sala
  static async toggleFavorite(req, res) {
    try {
      const { roomId } = req.params;
      const { favorite } = req.body;
      const userId = req.user.id;
      
      // Verificar se é membro da sala
      const memberResult = await pool.query(`
        SELECT is_favorite FROM room_members 
        WHERE room_id = $1 AND user_id = $2
      `, [roomId, userId]);
      
      if (memberResult.rows.length === 0) {
        return res.status(404).json({ 
          error: 'NotFound', 
          msg: 'Você não é membro desta sala'
        });
      }
      
      // Atualizar favorito
      await pool.query(`
        UPDATE room_members 
        SET is_favorite = $3 
        WHERE room_id = $1 AND user_id = $2
      `, [roomId, userId, favorite]);
      
      res.json({ roomId, favorite });
      
    } catch (error) {
      console.error('Erro ao favoritar sala:', error);
      res.status(500).json({ error: 'InternalServerError', traceId: req.traceId });
    }
  }
  
  // Listar membros da sala
  static async listMembers(req, res) {
    try {
      const { roomId } = req.params;
      const { search = '', limit = 50 } = req.query;
      const userId = req.user.id;
      
      // Verificar se é membro da sala
      const memberCheck = await pool.query(`
        SELECT 1 FROM room_members 
        WHERE room_id = $1 AND user_id = $2
      `, [roomId, userId]);
      
      if (memberCheck.rows.length === 0) {
        return res.status(403).json({ 
          error: 'Forbidden', 
          msg: 'Acesso negado'
        });
      }
      
      let query = `
        SELECT rm.user_id, rm.role, rm.is_silenced, rm.joined_at,
               p.name, p.nickname, p.avatar_url,
               CASE WHEN u.last_login > NOW() - INTERVAL '5 minutes' THEN true ELSE false END as is_online
        FROM room_members rm
        JOIN profiles p ON rm.user_id = p.user_id
        JOIN users u ON rm.user_id = u.id
        WHERE rm.room_id = $1
      `;
      
      const params = [roomId];
      
      if (search) {
        query += ` AND (p.name ILIKE $2 OR p.nickname ILIKE $2)`;
        params.push(`%${search}%`);
        query += ` ORDER BY rm.role DESC, p.name ASC LIMIT $3`;
        params.push(parseInt(limit));
      } else {
        query += ` ORDER BY rm.role DESC, p.name ASC LIMIT $2`;
        params.push(parseInt(limit));
      }
      
      const result = await pool.query(query, params);
      
      const members = result.rows.map(member => ({
        id: member.user_id,
        name: member.name || member.nickname,
        initials: member.name ? member.name.split(' ').map(n => n[0]).join('').substring(0, 2) : 'U',
        avatar_url: member.avatar_url,
        role: member.role,
        is_silenced: member.is_silenced,
        is_online: member.is_online,
        joined_at: member.joined_at,
        // Campos legacy para compatibilidade
        isHost: member.role === 'owner',
        isModerator: member.role === 'moderator',
        isMuted: member.is_silenced
      }));
      
      res.json({ items: members });
      
    } catch (error) {
      console.error('Erro ao listar membros:', error);
      res.status(500).json({ error: 'InternalServerError', traceId: req.traceId });
    }
  }
  
  // Sair da sala
  static async leaveRoom(req, res) {
    const client = await pool.connect();
    
    try {
      const { roomId } = req.params;
      const userId = req.user.id;
      
      await client.query('BEGIN');
      
      // Remover membro
      const deleteResult = await client.query(`
        DELETE FROM room_members 
        WHERE room_id = $1 AND user_id = $2
        RETURNING role
      `, [roomId, userId]);
      
      if (deleteResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ 
          error: 'NotFound', 
          msg: 'Você não é membro desta sala'
        });
      }
      
      // Remover da conversa
      const conversationResult = await client.query(`
        SELECT conversation_id FROM room_conversations WHERE room_id = $1
      `, [roomId]);
      
      if (conversationResult.rows.length > 0) {
        await client.query(`
          DELETE FROM conversation_participants 
          WHERE conversation_id = $1 AND user_id = $2
        `, [conversationResult.rows[0].conversation_id, userId]);
      }
      
      await client.query('COMMIT');
      
      res.status(204).send();
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Erro ao sair da sala:', error);
      res.status(500).json({ error: 'InternalServerError', traceId: req.traceId });
    } finally {
      client.release();
    }
  }
}

module.exports = RoomsController;