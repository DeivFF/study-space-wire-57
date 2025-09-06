import pool from '../config/database.js';

class RoomsController {
  // Criar nova sala
  static async createRoom(req, res) {
    const client = await pool.connect();
    
    try {
      const { nome, descricao, visibilidade } = req.body;
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
        INSERT INTO rooms (name, description, visibility, code, owner_id, current_members)
        VALUES ($1, $2, $3, $4, $5, 0)
        RETURNING id, name, description, visibility, code, owner_id, current_members, created_at
      `, [nome.trim(), descricao?.trim() || null, visibility, roomCode, userId]);
      
      const room = roomResult.rows[0];
      
      // Adicionar owner como membro
      await client.query(`
        INSERT INTO room_members (room_id, user_id, role, joined_at)
        VALUES ($1, $2, 'owner', CURRENT_TIMESTAMP)
      `, [room.id, userId]);
      
      // Criar conversa para a sala
      const conversationResult = await client.query(`
        INSERT INTO conversations DEFAULT VALUES
        RETURNING id
      `);
      
      await client.query(`
        INSERT INTO room_conversations (room_id, conversation_id)
        VALUES ($1, $2)
      `, [room.id, conversationResult.rows[0].id]);
      
      // Adicionar owner como participante da conversa
      await client.query(`
        INSERT INTO conversation_participants (conversation_id, user_id, joined_at)
        VALUES ($1, $2, CURRENT_TIMESTAMP)
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
      
      console.log('🔍 [ListRooms] Request params:', { userId, filter, search, visibility, favorite, limit });
      
      let baseQuery = `
        SELECT DISTINCT r.id, r.name, r.description, r.visibility, r.code, r.owner_id, 
               r.current_members, r.created_at, r.last_activity,
               CASE WHEN rm.user_id = $1 THEN rm.is_favorite ELSE false END as is_favorite,
               CASE WHEN rm.user_id = $1 THEN true ELSE false END as is_member,
               CASE WHEN r.owner_id = $1 THEN true ELSE false END as is_owner,
               CASE WHEN rm.user_id = $1 THEN rm.role ELSE null END as user_role,
               u.name as host_name,
               CASE WHEN rm.is_favorite = true THEN 0 ELSE 1 END as favorite_order,
               CASE WHEN r.visibility = 'public' THEN 0 ELSE 1 END as visibility_order
        FROM rooms r
        LEFT JOIN room_members rm ON r.id = rm.room_id AND rm.user_id = $1
        LEFT JOIN users u ON r.owner_id = u.id
        LEFT JOIN user_connections uc ON (
          (uc.requester_id = $1 AND uc.receiver_id = r.owner_id) OR 
          (uc.receiver_id = $1 AND uc.requester_id = r.owner_id)
        ) AND uc.status = 'accepted'
        WHERE r.is_active = true
        AND (
          r.owner_id = $1                    -- Own rooms
          OR rm.user_id = $1                 -- Rooms where user is member
          OR uc.id IS NOT NULL               -- Rooms from friends
        )
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
        favorite_order,
        visibility_order,
        r.name ASC
      `;
      
      paramCount++;
      baseQuery += ` LIMIT $${paramCount}`;
      params.push(parseInt(limit));
      
      console.log('🔍 [ListRooms] Final query:', baseQuery);
      console.log('🔍 [ListRooms] Query params:', params);
      
      const result = await pool.query(baseQuery, params);
      
      console.log('🔍 [ListRooms] Query result rows:', result.rows.length);
      
      // Mapear para formato esperado pelo frontend
      const rooms = result.rows.map(room => {
        return {
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
          member_count: room.current_members,
          members: [], // Para compatibilidade
          is_favorite: room.is_favorite,
          is_favorited: room.is_favorite,
          is_member: room.is_member,
          is_owner: room.is_owner,
          user_role: room.user_role, // Include user_role from database
          is_active: true,
          created_at: room.created_at,
          last_activity: room.last_activity
        };
      });
      
      res.json({ items: rooms, nextCursor: null });
      
    } catch (error) {
      console.error('🚨 [ListRooms] Erro ao listar salas:', error);
      console.error('🚨 [ListRooms] Error details:', {
        message: error.message,
        code: error.code,
        detail: error.detail,
        hint: error.hint,
        position: error.position,
        routine: error.routine,
        file: error.file,
        line: error.line,
        column: error.column
      });
      res.status(500).json({ error: 'InternalServerError', traceId: req.traceId });
    }
  }
  
  // Entrar em sala pública/privada com verificação de amizade
  static async joinRoom(req, res) {
    const client = await pool.connect();
    
    try {
      const { roomId } = req.params;
      const userId = req.user.id;
      
      await client.query('BEGIN');
      
      // Verificar se a sala existe
      const roomResult = await client.query(`
        SELECT id, name, visibility, current_members, owner_id
        FROM rooms 
        WHERE id = $1 AND is_active = true
      `, [roomId]);
      
      if (roomResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'NotFound', resource: 'room' });
      }
      
      const room = roomResult.rows[0];
      
      // Se é sala privada, verificar amizade com owner
      if (room.visibility === 'private') {
        const friendshipResult = await client.query(`
          SELECT id FROM user_connections 
          WHERE ((requester_id = $1 AND receiver_id = $2) OR 
                 (receiver_id = $1 AND requester_id = $2))
          AND status = 'accepted'
        `, [userId, room.owner_id]);
        
        if (friendshipResult.rows.length === 0 && room.owner_id !== userId) {
          await client.query('ROLLBACK');
          return res.status(403).json({ 
            error: 'Forbidden', 
            msg: 'Você precisa ser amigo do proprietário para entrar nesta sala privada.',
            requiresPermission: true,
            roomInfo: {
              id: room.id,
              name: room.name,
              visibility: room.visibility
            }
          });
        }
      }
      
      // Se é sala pública, verificar amizade com owner
      if (room.visibility === 'public') {
        const friendshipResult = await client.query(`
          SELECT id FROM user_connections 
          WHERE ((requester_id = $1 AND receiver_id = $2) OR 
                 (receiver_id = $1 AND requester_id = $2))
          AND status = 'accepted'
        `, [userId, room.owner_id]);
        
        if (friendshipResult.rows.length === 0 && room.owner_id !== userId) {
          await client.query('ROLLBACK');
          return res.status(403).json({ 
            error: 'Forbidden', 
            msg: 'Apenas amigos do proprietário podem entrar nesta sala.',
            requiresFriendship: true
          });
        }
      }
      
      
      // Verificar se já é membro
      const memberResult = await client.query(`
        SELECT role FROM room_members 
        WHERE room_id = $1 AND user_id = $2
      `, [roomId, userId]);
      
      if (memberResult.rows.length > 0) {
        await client.query('ROLLBACK');
        // Se já é membro, retornar sucesso com o role atual
        return res.json({ 
          roomId, 
          role: memberResult.rows[0].role,
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
          INSERT INTO conversation_participants (conversation_id, user_id, joined_at)
          VALUES ($1, $2, CURRENT_TIMESTAMP)
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
        SELECT role FROM room_members 
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
      
      // Emitir evento WebSocket para owner/moderadores
      const io = req.app.get('io');
      if (io) {
        // Buscar owner e moderadores da sala
        const moderatorsResult = await client.query(`
          SELECT user_id FROM room_members 
          WHERE room_id = $1 AND role IN ('owner', 'moderator')
        `, [roomId]);
        
        const userInfo = await client.query(`
          SELECT name FROM users WHERE id = $1
        `, [userId]);
        
        moderatorsResult.rows.forEach(mod => {
          io.to(`user:${mod.user_id}`).emit('room:access_requested', {
            roomId,
            roomName: room.name,
            requestId: accessRequestResult.rows[0].id,
            requesterName: userInfo.rows[0].name,
            timestamp: Date.now()
          });
        });
      }
      
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
      console.log('🔍 Checking membership for:', { roomId, userId });
      
      const memberCheck = await pool.query(`
        SELECT 1 FROM room_members 
        WHERE room_id = $1 AND user_id = $2
      `, [roomId, userId]);
      
      console.log('👥 Membership check result:', memberCheck.rows.length);
      
      if (memberCheck.rows.length === 0) {
        // Debug: verificar se o usuário existe na sala com qualquer role
        const debugCheck = await pool.query(`
          SELECT user_id, role FROM room_members 
          WHERE room_id = $1
        `, [roomId]);
        
        console.log('🚨 User not found as member. All members in room:', debugCheck.rows);
        console.log('🚨 Looking for userId:', userId, typeof userId);
        
        return res.status(403).json({ 
          error: 'Forbidden', 
          msg: 'Acesso negado'
        });
      }
      
      let query = `
        SELECT rm.user_id, rm.role, rm.is_silenced, rm.joined_at,
               CONCAT(p.first_name, ' ', p.last_name) as name, p.nickname, p.avatar_url, u.email,
               CASE WHEN u.last_login > NOW() - INTERVAL '5 minutes' THEN true ELSE false END as is_online
        FROM room_members rm
        JOIN profiles p ON rm.user_id = p.user_id
        JOIN users u ON rm.user_id = u.id
        WHERE rm.room_id = $1
      `;
      
      const params = [roomId];
      
      if (search) {
        query += ` AND (CONCAT(p.first_name, ' ', p.last_name) ILIKE $2 OR p.nickname ILIKE $2)`;
        params.push(`%${search}%`);
        query += ` ORDER BY rm.role DESC, CONCAT(p.first_name, ' ', p.last_name) ASC LIMIT $3`;
        params.push(parseInt(limit));
      } else {
        query += ` ORDER BY rm.role DESC, CONCAT(p.first_name, ' ', p.last_name) ASC LIMIT $2`;
        params.push(parseInt(limit));
      }
      
      const result = await pool.query(query, params);
      
      const members = result.rows.map(member => ({
        id: member.user_id,
        name: member.name || member.nickname,
        email: member.email,
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

  // Sistema de Convites
  static async sendInvite(req, res) {
    const { roomId } = req.params;
    const senderId = req.user.id;
    const { userId } = req.body;

    try {
      // Verificar se o usuário é member/moderator/owner da sala
      const member = await pool.query(
        'SELECT role FROM room_members WHERE room_id = $1 AND user_id = $2',
        [roomId, senderId]
      );

      if (member.rows.length === 0) {
        return res.status(403).json({ error: 'Forbidden', msg: 'Você não é membro desta sala' });
      }

      // Verificar se o usuário convidado existe
      const user = await pool.query('SELECT id, name FROM users WHERE id = $1', [userId]);
      if (user.rows.length === 0) {
        return res.status(404).json({ error: 'NotFound', msg: 'Usuário não encontrado' });
      }

      // Verificar se já é membro
      const existingMember = await pool.query(
        'SELECT room_id FROM room_members WHERE room_id = $1 AND user_id = $2',
        [roomId, userId]
      );

      if (existingMember.rows.length > 0) {
        return res.status(400).json({ error: 'BadRequest', msg: 'Usuário já é membro da sala' });
      }

      // Verificar se já tem convite pendente
      const existingInvite = await pool.query(
        `SELECT id FROM room_invitations 
         WHERE room_id = $1 AND invitee_id = $2 AND status = 'pending'`,
        [roomId, userId]
      );

      if (existingInvite.rows.length > 0) {
        return res.status(400).json({ error: 'BadRequest', msg: 'Convite já enviado para este usuário' });
      }

      // Obter informações da sala e do remetente para a notificação
      const roomInfo = await pool.query(
        'SELECT name FROM rooms WHERE id = $1',
        [roomId]
      );
      const senderInfo = await pool.query(
        'SELECT name FROM users WHERE id = $1',
        [senderId]
      );

      // Criar convite
      const invite = await pool.query(
        `INSERT INTO room_invitations (room_id, invitee_id, inviter_id)
         VALUES ($1, $2, $3) RETURNING *`,
        [roomId, userId, senderId]
      );

      // Criar notificação para o usuário convidado
      if (roomInfo.rows.length > 0 && senderInfo.rows.length > 0) {
        const roomName = roomInfo.rows[0].name;
        const senderName = senderInfo.rows[0].name;
        const inviteId = invite.rows[0].id;
        
        await pool.query(
          `INSERT INTO notifications (user_id, type, sender_id, related_id, title, message)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            userId,
            'room_invite',
            senderId,
            inviteId, // Store invitation ID instead of room ID
            'Convite para sala de estudo',
            `${senderName} te convidou para participar da sala "${roomName}"`
          ]
        );

        // Emitir notificação em tempo real via WebSocket
        const io = req.app.get('io');
        if (io) {
          io.to(`user:${userId}`).emit('notification:room_invite', {
            type: 'room_invite',
            inviteId: inviteId,
            roomId: roomId,
            roomName: roomName,
            from: {
              id: senderId,
              name: senderName
            },
            timestamp: Date.now()
          });
          console.log(`Real-time room invite notification sent to user ${userId}`);
        }
      }

      res.status(201).json({
        success: true,
        data: invite.rows[0]
      });
    } catch (error) {
      console.error('Error sending invite:', error);
      res.status(500).json({ error: 'InternalServerError', msg: 'Erro interno do servidor' });
    }
  }

  static async listInvites(req, res) {
    const { roomId } = req.params;
    const userId = req.user.id;

    try {
      // Verificar se é membro da sala
      const member = await pool.query(
        'SELECT role FROM room_members WHERE room_id = $1 AND user_id = $2',
        [roomId, userId]
      );

      if (member.rows.length === 0) {
        return res.status(403).json({ error: 'Forbidden', msg: 'Você não é membro desta sala' });
      }

      const invites = await pool.query(
        `SELECT ri.id, ri.room_id, ri.invitee_id as invited_user_id, 
                ri.inviter_id as invited_by_id, ri.status, ri.message,
                ri.created_at, ri.expires_at, ri.responded_at,
                u.name as invited_user_name, u.email as invited_user_email,
                ib.name as invited_by_name
         FROM room_invitations ri
         JOIN users u ON ri.invitee_id = u.id
         JOIN users ib ON ri.inviter_id = ib.id
         WHERE ri.room_id = $1 AND ri.status = 'pending'
         ORDER BY ri.created_at DESC`,
        [roomId]
      );

      res.json({
        success: true,
        data: invites.rows
      });
    } catch (error) {
      console.error('Error listing invites:', error);
      res.status(500).json({ error: 'InternalServerError', msg: 'Erro interno do servidor' });
    }
  }

  static async revokeInvite(req, res) {
    const { roomId, inviteId } = req.params;
    const userId = req.user.id;

    try {
      // Verificar se é membro da sala
      const member = await pool.query(
        'SELECT role FROM room_members WHERE room_id = $1 AND user_id = $2',
        [roomId, userId]
      );

      if (member.rows.length === 0) {
        return res.status(403).json({ error: 'Forbidden', msg: 'Você não é membro desta sala' });
      }

      // Buscar o convite antes de revogar para obter o invitee_id
      const inviteCheck = await pool.query(
        `SELECT invitee_id FROM room_invitations 
         WHERE id = $1 AND room_id = $2 AND status = 'pending'`,
        [inviteId, roomId]
      );

      if (inviteCheck.rows.length === 0) {
        return res.status(404).json({ error: 'NotFound', msg: 'Convite não encontrado' });
      }

      const inviteeId = inviteCheck.rows[0].invitee_id;

      await pool.query('BEGIN');

      try {
        // Revogar convite
        const result = await pool.query(
          `DELETE FROM room_invitations 
           WHERE id = $1 AND room_id = $2 AND status = 'pending'
           RETURNING *`,
          [inviteId, roomId]
        );

        // Remover notificação correspondente
        await pool.query(
          `DELETE FROM notifications 
           WHERE type = 'room_invite' 
           AND related_id = $1 
           AND user_id = $2`,
          [inviteId, inviteeId]
        );

        // Emitir evento WebSocket para remover notificação em tempo real
        const io = req.app.get('io');
        if (io) {
          io.to(`user:${inviteeId}`).emit('notification:room_invite_revoked', {
            inviteId: inviteId,
            roomId: roomId,
            timestamp: Date.now()
          });
          console.log(`Real-time room invite revocation notification sent to user ${inviteeId}`);
        }

        await pool.query('COMMIT');

        res.json({
          success: true,
          data: result.rows[0]
        });
      } catch (error) {
        await pool.query('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('Error revoking invite:', error);
      res.status(500).json({ error: 'InternalServerError', msg: 'Erro interno do servidor' });
    }
  }

  static async acceptInvite(req, res) {
    const { inviteId } = req.params;
    const userId = req.user.id;

    console.log(`🎯 [AcceptInvite] Starting invitation acceptance - inviteId: ${inviteId}, userId: ${userId}`);

    try {
      // Verificar se o convite existe e é para este usuário
      console.log(`🔍 [AcceptInvite] Searching for invitation with inviteId: ${inviteId}, userId: ${userId}`);
      const invite = await pool.query(
        `SELECT * FROM room_invitations 
         WHERE id = $1 AND invitee_id = $2 AND status = 'pending'`,
        [inviteId, userId]
      );

      console.log(`📋 [AcceptInvite] Invitation query result: ${invite.rows.length} rows found`);
      if (invite.rows.length > 0) {
        console.log(`📄 [AcceptInvite] Found invitation:`, {
          id: invite.rows[0].id,
          room_id: invite.rows[0].room_id,
          status: invite.rows[0].status,
          invitee_id: invite.rows[0].invitee_id
        });
      }

      if (invite.rows.length === 0) {
        console.log(`❌ [AcceptInvite] No invitation found - returning 404`);
        return res.status(404).json({ error: 'NotFound', msg: 'Convite não encontrado' });
      }

      const roomId = invite.rows[0].room_id;
      console.log(`🏠 [AcceptInvite] Room ID extracted: ${roomId}`);

      // Verificar se já é membro
      console.log(`👤 [AcceptInvite] Checking existing membership for roomId: ${roomId}, userId: ${userId}`);
      const existingMember = await pool.query(
        'SELECT room_id FROM room_members WHERE room_id = $1 AND user_id = $2',
        [roomId, userId]
      );

      console.log(`👥 [AcceptInvite] Existing membership check: ${existingMember.rows.length} rows found`);

      if (existingMember.rows.length > 0) {
        console.log(`⚠️ [AcceptInvite] User is already a member - updating invitation status to accepted and returning`);
        // Se já é membro, apenas marca o convite como aceito
        await pool.query(
          `UPDATE room_invitations 
           SET status = 'accepted', responded_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [inviteId]
        );
        return res.json({
          success: true,
          msg: 'Você já é membro desta sala',
          data: { roomId: roomId }
        });
      }

      console.log(`🔄 [AcceptInvite] Starting database transaction`);
      await pool.query('BEGIN');

      try {
        // Limpar convites antigos conflitantes se existirem
        console.log(`🧹 [AcceptInvite] Cleaning up any conflicting old invitations`);
        await pool.query(
          `UPDATE room_invitations 
           SET status = 'expired' 
           WHERE room_id = $1 AND invitee_id = $2 AND id != $3 AND status != 'pending'`,
          [roomId, userId, inviteId]
        );
        // Adicionar como membro
        console.log(`➕ [AcceptInvite] Adding user as room member`);
        await pool.query(
          'INSERT INTO room_members (room_id, user_id, role, joined_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)',
          [roomId, userId, 'member']
        );
        console.log(`✅ [AcceptInvite] Successfully added user as room member`);

        // Marcar convite como aceito
        console.log(`📝 [AcceptInvite] Updating invitation status to accepted`);
        await pool.query(
          `UPDATE room_invitations 
           SET status = 'accepted', responded_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [inviteId]
        );
        console.log(`✅ [AcceptInvite] Successfully updated invitation status`);

        // Adicionar à conversa da sala
        console.log(`💬 [AcceptInvite] Searching for room conversation`);
        const conversationResult = await pool.query(
          'SELECT conversation_id FROM room_conversations WHERE room_id = $1',
          [roomId]
        );
        
        console.log(`💬 [AcceptInvite] Conversation search result: ${conversationResult.rows.length} rows found`);
        
        if (conversationResult.rows.length > 0) {
          const conversationId = conversationResult.rows[0].conversation_id;
          console.log(`💬 [AcceptInvite] Adding user to conversation: ${conversationId}`);
          await pool.query(
            `INSERT INTO conversation_participants (conversation_id, user_id, joined_at)
             VALUES ($1, $2, CURRENT_TIMESTAMP)
             ON CONFLICT (conversation_id, user_id) DO NOTHING`,
            [conversationId, userId]
          );
          console.log(`✅ [AcceptInvite] Successfully added user to conversation`);
        } else {
          console.log(`⚠️ [AcceptInvite] No conversation found for room ${roomId}`);
        }

        console.log(`✅ [AcceptInvite] Committing transaction`);
        await pool.query('COMMIT');

        console.log(`🎉 [AcceptInvite] Invitation acceptance completed successfully`);
        res.json({
          success: true,
          msg: 'Convite aceito com sucesso',
          data: {
            roomId: roomId
          }
        });
      } catch (error) {
        console.error(`💥 [AcceptInvite] Error in transaction, rolling back:`, error);
        await pool.query('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error(`🚨 [AcceptInvite] Fatal error accepting invite:`, {
        inviteId,
        userId,
        error: error.message,
        stack: error.stack
      });
      res.status(500).json({ error: 'InternalServerError', msg: 'Erro interno do servidor' });
    }
  }

  static async rejectInvite(req, res) {
    const { inviteId } = req.params;
    const userId = req.user.id;

    try {
      // Verificar se o convite existe e é para este usuário
      const invite = await pool.query(
        `SELECT * FROM room_invitations 
         WHERE id = $1 AND invitee_id = $2 AND status = 'pending'`,
        [inviteId, userId]
      );

      if (invite.rows.length === 0) {
        return res.status(404).json({ error: 'NotFound', msg: 'Convite não encontrado' });
      }

      // Marcar convite como rejeitado
      await pool.query(
        `UPDATE room_invitations 
         SET status = 'declined', responded_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [inviteId]
      );

      res.json({
        success: true,
        msg: 'Convite rejeitado com sucesso'
      });
    } catch (error) {
      console.error('Error rejecting invite:', error);
      res.status(500).json({ error: 'InternalServerError', msg: 'Erro interno do servidor' });
    }
  }

  // Links de Convite
  static async createInviteLink(req, res) {
    const { roomId } = req.params;
    const userId = req.user.id;
    const { expiresIn = 24 } = req.body; // Default 24 horas

    try {
      // Verificar se é owner/moderator
      const member = await pool.query(
        'SELECT role FROM room_members WHERE room_id = $1 AND user_id = $2',
        [roomId, userId]
      );

      if (member.rows.length === 0 || !['owner', 'moderator'].includes(member.rows[0].role)) {
        return res.status(403).json({ error: 'Forbidden', msg: 'Apenas owners e moderadores podem criar links' });
      }

      // Desativar link anterior se existir
      await pool.query(
        'UPDATE room_invite_links SET is_active = false WHERE room_id = $1 AND is_active = true',
        [roomId]
      );

      // Criar novo link
      const expiresAt = new Date(Date.now() + expiresIn * 60 * 60 * 1000);
      const link = await pool.query(
        `INSERT INTO room_invite_links (room_id, created_by_id, expires_at)
         VALUES ($1, $2, $3) RETURNING *`,
        [roomId, userId, expiresAt]
      );

      res.status(201).json({
        success: true,
        data: {
          ...link.rows[0],
          link: `${req.protocol}://${req.get('host')}/sala/convite/${link.rows[0].code}`
        }
      });
    } catch (error) {
      console.error('Error creating invite link:', error);
      res.status(500).json({ error: 'InternalServerError', msg: 'Erro interno do servidor' });
    }
  }

  static async getActiveInviteLink(req, res) {
    const { roomId } = req.params;
    const userId = req.user.id;

    try {
      // Verificar se é membro
      const member = await pool.query(
        'SELECT role FROM room_members WHERE room_id = $1 AND user_id = $2',
        [roomId, userId]
      );

      if (member.rows.length === 0) {
        return res.status(403).json({ error: 'Forbidden', msg: 'Você não é membro desta sala' });
      }

      const link = await pool.query(
        `SELECT * FROM room_invite_links 
         WHERE room_id = $1 AND is_active = true AND expires_at > CURRENT_TIMESTAMP`,
        [roomId]
      );

      if (link.rows.length === 0) {
        return res.status(404).json({ error: 'NotFound', msg: 'Nenhum link ativo encontrado' });
      }

      res.json({
        success: true,
        data: {
          ...link.rows[0],
          link: `${req.protocol}://${req.get('host')}/sala/convite/${link.rows[0].code}`
        }
      });
    } catch (error) {
      console.error('Error getting active invite link:', error);
      res.status(500).json({ error: 'InternalServerError', msg: 'Erro interno do servidor' });
    }
  }

  // Aprovação de Solicitações
  static async listAccessRequests(req, res) {
    const { roomId } = req.params;
    const userId = req.user.id;

    try {
      // Verificar se é owner/moderator
      const member = await pool.query(
        'SELECT role FROM room_members WHERE room_id = $1 AND user_id = $2',
        [roomId, userId]
      );

      if (member.rows.length === 0 || !['owner', 'moderator'].includes(member.rows[0].role)) {
        return res.status(403).json({ error: 'Forbidden', msg: 'Apenas owners e moderadores podem ver solicitações' });
      }

      const requests = await pool.query(
        `SELECT rar.*, u.name as user_name, u.email as user_email
         FROM room_access_requests rar
         JOIN users u ON rar.user_id = u.id
         WHERE rar.room_id = $1 AND rar.status = 'pending'
         ORDER BY rar.created_at DESC`,
        [roomId]
      );

      res.json({
        success: true,
        data: requests.rows
      });
    } catch (error) {
      console.error('Error listing access requests:', error);
      res.status(500).json({ error: 'InternalServerError', msg: 'Erro interno do servidor' });
    }
  }

  static async approveAccessRequest(req, res) {
    const { roomId, requestId } = req.params;
    const userId = req.user.id;

    try {
      // Verificar se é owner/moderator
      const member = await pool.query(
        'SELECT role FROM room_members WHERE room_id = $1 AND user_id = $2',
        [roomId, userId]
      );

      if (member.rows.length === 0 || !['owner', 'moderator'].includes(member.rows[0].role)) {
        return res.status(403).json({ error: 'Forbidden', msg: 'Apenas owners e moderadores podem aprovar solicitações' });
      }

      // Verificar se a solicitação existe
      const request = await pool.query(
        'SELECT * FROM room_access_requests WHERE id = $1 AND room_id = $2 AND status = $3',
        [requestId, roomId, 'pending']
      );

      if (request.rows.length === 0) {
        return res.status(404).json({ error: 'NotFound', msg: 'Solicitação não encontrada' });
      }

      await pool.query('BEGIN');

      try {
        // Adicionar como membro
        await pool.query(
          'INSERT INTO room_members (room_id, user_id, role, joined_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)',
          [roomId, request.rows[0].user_id, 'member']
        );

        // Marcar solicitação como aprovada
        await pool.query(
          'UPDATE room_access_requests SET status = $1, reviewed_by = $2, reviewed_at = CURRENT_TIMESTAMP WHERE id = $3',
          ['approved', userId, requestId]
        );

        // Emitir evento WebSocket para o solicitante
        const io = req.app.get('io');
        if (io) {
          const roomInfo = await pool.query('SELECT name FROM rooms WHERE id = $1', [roomId]);
          io.to(`user:${request.rows[0].user_id}`).emit('room:access_approved', {
            roomId,
            roomName: roomInfo.rows[0].name,
            approvedBy: userId,
            timestamp: Date.now()
          });
        }

        await pool.query('COMMIT');

        res.json({
          success: true,
          msg: 'Solicitação aprovada com sucesso'
        });
      } catch (error) {
        await pool.query('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('Error approving access request:', error);
      res.status(500).json({ error: 'InternalServerError', msg: 'Erro interno do servidor' });
    }
  }

  static async rejectAccessRequest(req, res) {
    const { roomId, requestId } = req.params;
    const userId = req.user.id;

    try {
      // Verificar se é owner/moderator
      const member = await pool.query(
        'SELECT role FROM room_members WHERE room_id = $1 AND user_id = $2',
        [roomId, userId]
      );

      if (member.rows.length === 0 || !['owner', 'moderator'].includes(member.rows[0].role)) {
        return res.status(403).json({ error: 'Forbidden', msg: 'Apenas owners e moderadores podem rejeitar solicitações' });
      }

      const result = await pool.query(
        'UPDATE room_access_requests SET status = $1, reviewed_by = $2, reviewed_at = CURRENT_TIMESTAMP WHERE id = $3 AND room_id = $4 AND status = $5 RETURNING *',
        ['rejected', userId, requestId, roomId, 'pending']
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'NotFound', msg: 'Solicitação não encontrada' });
      }

      // Emitir evento WebSocket para o solicitante
      const io = req.app.get('io');
      if (io) {
        const roomInfo = await pool.query('SELECT name FROM rooms WHERE id = $1', [roomId]);
        io.to(`user:${result.rows[0].user_id}`).emit('room:access_rejected', {
          roomName: roomInfo.rows[0].name,
          rejectedBy: userId,
          timestamp: Date.now()
        });
      }

      res.json({
        success: true,
        msg: 'Solicitação rejeitada'
      });
    } catch (error) {
      console.error('Error rejecting access request:', error);
      res.status(500).json({ error: 'InternalServerError', msg: 'Erro interno do servidor' });
    }
  }

  // Sistema de Moderação
  static async promoteMember(req, res) {
    const { roomId, memberId } = req.params;
    const userId = req.user.id;

    try {
      // Verificar se é owner
      const ownerCheck = await pool.query(
        'SELECT role FROM room_members WHERE room_id = $1 AND user_id = $2',
        [roomId, userId]
      );

      if (ownerCheck.rows.length === 0 || ownerCheck.rows[0].role !== 'owner') {
        return res.status(403).json({ error: 'Forbidden', msg: 'Apenas owners podem promover membros' });
      }

      const result = await pool.query(
        `UPDATE room_members SET role = 'moderator'
         WHERE room_id = $1 AND user_id = $2 AND role = 'member' RETURNING *`,
        [roomId, memberId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'NotFound', msg: 'Membro não encontrado ou já é moderador' });
      }

      // Log da moderação
      await pool.query(
        'INSERT INTO room_moderation_logs (room_id, moderator_id, target_user_id, action) VALUES ($1, $2, $3, $4)',
        [roomId, userId, memberId, 'promote']
      );

      // Notificar via WebSocket sobre a mudança de role
      const io = req.app.get('io');
      if (io) {
        // Notificar todos os membros da sala sobre a mudança
        io.to(`room:${roomId}`).emit('room:member_role_changed', {
          roomId,
          memberId,
          newRole: 'moderator',
          action: 'promote',
          timestamp: Date.now()
        });

        // Notificar o usuário promovido
        io.to(`user:${memberId}`).emit('room:role_updated', {
          roomId,
          newRole: 'moderator',
          action: 'promote',
          timestamp: Date.now()
        });
      }

      res.json({
        success: true,
        msg: 'Membro promovido a moderador'
      });
    } catch (error) {
      console.error('Error promoting member:', error);
      res.status(500).json({ error: 'InternalServerError', msg: 'Erro interno do servidor' });
    }
  }

  static async demoteMember(req, res) {
    const { roomId, memberId } = req.params;
    const userId = req.user.id;

    try {
      // Verificar se é owner
      const ownerCheck = await pool.query(
        'SELECT role FROM room_members WHERE room_id = $1 AND user_id = $2',
        [roomId, userId]
      );

      if (ownerCheck.rows.length === 0 || ownerCheck.rows[0].role !== 'owner') {
        return res.status(403).json({ error: 'Forbidden', msg: 'Apenas owners podem rebaixar moderadores' });
      }

      const result = await pool.query(
        `UPDATE room_members SET role = 'member'
         WHERE room_id = $1 AND user_id = $2 AND role = 'moderator' RETURNING *`,
        [roomId, memberId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'NotFound', msg: 'Moderador não encontrado' });
      }

      // Log da moderação
      await pool.query(
        'INSERT INTO room_moderation_logs (room_id, moderator_id, target_user_id, action) VALUES ($1, $2, $3, $4)',
        [roomId, userId, memberId, 'demote']
      );

      // Notificar via WebSocket sobre a mudança de role
      const io = req.app.get('io');
      if (io) {
        // Notificar todos os membros da sala sobre a mudança
        io.to(`room:${roomId}`).emit('room:member_role_changed', {
          roomId,
          memberId,
          newRole: 'member',
          action: 'demote',
          timestamp: Date.now()
        });

        // Notificar o usuário rebaixado
        io.to(`user:${memberId}`).emit('room:role_updated', {
          roomId,
          newRole: 'member',
          action: 'demote',
          timestamp: Date.now()
        });
      }

      res.json({
        success: true,
        msg: 'Moderador rebaixado a membro'
      });
    } catch (error) {
      console.error('Error demoting member:', error);
      res.status(500).json({ error: 'InternalServerError', msg: 'Erro interno do servidor' });
    }
  }

  static async kickMember(req, res) {
    const { roomId, memberId } = req.params;
    const userId = req.user.id;

    try {
      // Verificar se é owner/moderator
      const moderatorCheck = await pool.query(
        'SELECT role FROM room_members WHERE room_id = $1 AND user_id = $2',
        [roomId, userId]
      );

      if (moderatorCheck.rows.length === 0 || !['owner', 'moderator'].includes(moderatorCheck.rows[0].role)) {
        return res.status(403).json({ error: 'Forbidden', msg: 'Apenas owners e moderadores podem expulsar membros' });
      }

      // Verificar se o target existe e não é owner
      const targetMember = await pool.query(
        'SELECT role FROM room_members WHERE room_id = $1 AND user_id = $2',
        [roomId, memberId]
      );

      if (targetMember.rows.length === 0) {
        return res.status(404).json({ error: 'NotFound', msg: 'Membro não encontrado' });
      }

      if (targetMember.rows[0].role === 'owner') {
        return res.status(403).json({ error: 'Forbidden', msg: 'Não é possível expulsar o owner da sala' });
      }

      // Moderadores só podem expulsar members, não outros moderadores (apenas owner pode)
      if (moderatorCheck.rows[0].role === 'moderator' && targetMember.rows[0].role === 'moderator') {
        return res.status(403).json({ error: 'Forbidden', msg: 'Moderadores não podem expulsar outros moderadores' });
      }

      await pool.query('BEGIN');
      
      try {
        // Remover da tabela de membros
        const result = await pool.query(
          'DELETE FROM room_members WHERE room_id = $1 AND user_id = $2 RETURNING *',
          [roomId, memberId]
        );

        // Limpar convites antigos para permitir novos convites no futuro
        await pool.query(
          'DELETE FROM room_invitations WHERE room_id = $1 AND invitee_id = $2',
          [roomId, memberId]
        );

        // Remover da conversa da sala
        const conversationResult = await pool.query(
          'SELECT conversation_id FROM room_conversations WHERE room_id = $1',
          [roomId]
        );
        
        if (conversationResult.rows.length > 0) {
          await pool.query(
            'DELETE FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2',
            [conversationResult.rows[0].conversation_id, memberId]
          );
        }

        // Log da moderação
        await pool.query(
          'INSERT INTO room_moderation_logs (room_id, moderator_id, target_user_id, action) VALUES ($1, $2, $3, $4)',
          [roomId, userId, memberId, 'kick']
        );

        await pool.query('COMMIT');
      } catch (error) {
        await pool.query('ROLLBACK');
        throw error;
      }

      res.json({
        success: true,
        msg: 'Membro expulso da sala'
      });
    } catch (error) {
      console.error('Error kicking member:', error);
      res.status(500).json({ error: 'InternalServerError', msg: 'Erro interno do servidor' });
    }
  }

  // Sistema de Chat
  static async getRoomMessages(req, res) {
    const { roomId } = req.params;
    const userId = req.user.id;
    const { limit = 50, offset = 0 } = req.query;

    try {
      // Verificar se é membro da sala
      console.log('🔍 [Messages] Checking membership for:', { roomId, userId });
      
      const member = await pool.query(
        'SELECT room_id FROM room_members WHERE room_id = $1 AND user_id = $2',
        [roomId, userId]
      );

      console.log('👥 [Messages] Membership check result:', member.rows.length);

      if (member.rows.length === 0) {
        // Debug: verificar todos os membros da sala
        const debugCheck = await pool.query(`
          SELECT user_id, role FROM room_members 
          WHERE room_id = $1
        `, [roomId]);
        
        console.log('🚨 [Messages] User not found as member. All members:', debugCheck.rows);
        console.log('🚨 [Messages] Looking for userId:', userId, typeof userId);
        
        return res.status(403).json({ error: 'Forbidden', msg: 'Você não é membro desta sala' });
      }

      // Buscar conversation_id da sala
      const roomConv = await pool.query(
        'SELECT conversation_id FROM room_conversations WHERE room_id = $1',
        [roomId]
      );

      if (roomConv.rows.length === 0) {
        return res.status(404).json({ error: 'NotFound', msg: 'Chat da sala não encontrado' });
      }

      const conversationId = roomConv.rows[0].conversation_id;

      // Buscar mensagens
      const messages = await pool.query(
        `SELECT 
          m.id,
          m.content,
          m.message_type,
          m.reply_to_id,
          m.created_at,
          m.updated_at,
          m.sender_id,
          u.name as sender_name,
          u.email as sender_email,
          -- Reply to message info
          CASE 
            WHEN m.reply_to_id IS NOT NULL THEN 
              json_build_object(
                'id', rm.id,
                'content', rm.content,
                'sender_name', ru.name
              )
            ELSE NULL 
          END as reply_to
         FROM messages m
         JOIN users u ON m.sender_id = u.id
         LEFT JOIN messages rm ON m.reply_to_id = rm.id
         LEFT JOIN users ru ON rm.sender_id = ru.id
         WHERE m.conversation_id = $1
         ORDER BY m.created_at DESC
         LIMIT $2 OFFSET $3`,
        [conversationId, limit, offset]
      );

      // Verificar se há mais mensagens
      const totalCount = await pool.query(
        'SELECT COUNT(*) FROM messages WHERE conversation_id = $1',
        [conversationId]
      );

      const hasMore = parseInt(offset) + parseInt(limit) < parseInt(totalCount.rows[0].count);

      res.json({
        success: true,
        data: messages.rows.reverse(), // Inverter para ordem cronológica (mais antigas primeiro)
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: parseInt(totalCount.rows[0].count),
          has_more: hasMore
        }
      });
    } catch (error) {
      console.error('Error getting room messages:', error);
      res.status(500).json({ error: 'InternalServerError', msg: 'Erro interno do servidor' });
    }
  }

  static async sendRoomMessage(req, res) {
    const { roomId } = req.params;
    const userId = req.user.id;
    const { content, message_type = 'text', reply_to_id } = req.body;

    try {
      // Verificar se é membro da sala
      const member = await pool.query(
        'SELECT room_id FROM room_members WHERE room_id = $1 AND user_id = $2',
        [roomId, userId]
      );

      if (member.rows.length === 0) {
        return res.status(403).json({ error: 'Forbidden', msg: 'Você não é membro desta sala' });
      }

      // Buscar conversation_id da sala
      const roomConv = await pool.query(
        'SELECT conversation_id FROM room_conversations WHERE room_id = $1',
        [roomId]
      );

      if (roomConv.rows.length === 0) {
        return res.status(404).json({ error: 'NotFound', msg: 'Chat da sala não encontrado' });
      }

      const conversationId = roomConv.rows[0].conversation_id;

      // If replying to a message, verify it exists and belongs to this conversation
      if (reply_to_id) {
        const replyCheck = await pool.query(
          'SELECT id FROM messages WHERE id = $1 AND conversation_id = $2 AND is_deleted = false',
          [reply_to_id, conversationId]
        );

        if (replyCheck.rows.length === 0) {
          return res.status(400).json({ 
            error: 'BadRequest', 
            msg: 'Mensagem de resposta não encontrada' 
          });
        }
      }

      // Criar mensagem
      const message = await pool.query(
        `INSERT INTO messages (conversation_id, sender_id, content, message_type, reply_to_id)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [conversationId, userId, content, message_type, reply_to_id]
      );

      // Get the complete message data with sender info and reply info
      const query = `
        SELECT 
          m.id,
          m.content,
          m.message_type,
          m.reply_to_id,
          m.created_at,
          m.updated_at,
          m.sender_id,
          u.name as sender_name,
          u.email as sender_email,
          CASE 
            WHEN m.reply_to_id IS NOT NULL THEN 
              json_build_object(
                'id', rm.id,
                'content', rm.content,
                'sender_name', ru.name
              )
            ELSE NULL 
          END as reply_to
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        LEFT JOIN messages rm ON m.reply_to_id = rm.id
        LEFT JOIN users ru ON rm.sender_id = ru.id
        WHERE m.id = $1
      `;

      const result = await pool.query(query, [message.rows[0].id]);
      const messageWithSender = result.rows[0];

      res.status(201).json({
        success: true,
        data: messageWithSender
      });
    } catch (error) {
      console.error('Error sending room message:', error);
      res.status(500).json({ error: 'InternalServerError', msg: 'Erro interno do servidor' });
    }
  }

  // Excluir sala
  static async deleteRoom(req, res) {
    const client = await pool.connect();
    
    try {
      const { roomId } = req.params;
      const userId = req.user.id;
      
      console.log(`🗑️ [DeleteRoom] Starting room deletion - roomId: ${roomId}, userId: ${userId}`);
      
      await client.query('BEGIN');
      
      // Verificar se o usuário é owner da sala
      const ownerResult = await client.query(`
        SELECT role, name FROM rooms r
        JOIN room_members rm ON r.id = rm.room_id 
        WHERE r.id = $1 AND rm.user_id = $2 AND r.is_active = true
      `, [roomId, userId]);
      
      if (ownerResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ 
          error: 'NotFound', 
          msg: 'Sala não encontrada'
        });
      }
      
      const userRole = ownerResult.rows[0].role;
      const roomName = ownerResult.rows[0].name;
      
      if (userRole !== 'owner') {
        await client.query('ROLLBACK');
        return res.status(403).json({ 
          error: 'Forbidden', 
          msg: 'Apenas o proprietário pode excluir a sala'
        });
      }
      
      console.log(`🔍 [DeleteRoom] Verified owner permissions for room: ${roomName}`);
      
      // Buscar todos os membros para notificar via WebSocket
      const membersResult = await client.query(`
        SELECT user_id FROM room_members WHERE room_id = $1
      `, [roomId]);
      
      const memberIds = membersResult.rows.map(row => row.user_id);
      console.log(`👥 [DeleteRoom] Found ${memberIds.length} members to notify`);
      
      // Buscar conversation_id para cleanup
      const conversationResult = await client.query(`
        SELECT conversation_id FROM room_conversations WHERE room_id = $1
      `, [roomId]);
      
      const conversationId = conversationResult.rows[0]?.conversation_id;
      
      // Cleanup transacional de todas as tabelas relacionadas
      console.log(`🧹 [DeleteRoom] Starting cleanup of related tables`);
      
      // 1. Remover participantes da conversa
      if (conversationId) {
        await client.query(`
          DELETE FROM conversation_participants 
          WHERE conversation_id = $1
        `, [conversationId]);
        console.log(`✅ [DeleteRoom] Removed conversation participants`);
      }
      
      // 2. Remover mensagens da conversa
      if (conversationId) {
        await client.query(`
          DELETE FROM messages 
          WHERE conversation_id = $1
        `, [conversationId]);
        console.log(`✅ [DeleteRoom] Removed messages`);
      }
      
      // 3. Remover conversa da sala
      await client.query(`
        DELETE FROM room_conversations 
        WHERE room_id = $1
      `, [roomId]);
      console.log(`✅ [DeleteRoom] Removed room conversations`);
      
      // 4. Remover conversa
      if (conversationId) {
        await client.query(`
          DELETE FROM conversations 
          WHERE id = $1
        `, [conversationId]);
        console.log(`✅ [DeleteRoom] Removed conversations`);
      }
      
      // 5. Remover convites pendentes
      await client.query(`
        DELETE FROM room_invitations 
        WHERE room_id = $1
      `, [roomId]);
      console.log(`✅ [DeleteRoom] Removed room invitations`);
      
      // 6. Remover solicitações de acesso
      await client.query(`
        DELETE FROM room_access_requests 
        WHERE room_id = $1
      `, [roomId]);
      console.log(`✅ [DeleteRoom] Removed access requests`);
      
      // 7. Remover links de convite
      await client.query(`
        DELETE FROM room_invite_links 
        WHERE room_id = $1
      `, [roomId]);
      console.log(`✅ [DeleteRoom] Removed invite links`);
      
      // 8. Remover logs de moderação
      await client.query(`
        DELETE FROM room_moderation_logs 
        WHERE room_id = $1
      `, [roomId]);
      console.log(`✅ [DeleteRoom] Removed moderation logs`);
      
      // 9. Remover notificações relacionadas
      await client.query(`
        DELETE FROM notifications 
        WHERE type IN ('room_invite', 'room_access_request', 'room_member_joined', 'room_member_left')
        AND (related_id = $1 OR related_id IN (
          SELECT id FROM room_invitations WHERE room_id = $1
        ))
      `, [roomId]);
      console.log(`✅ [DeleteRoom] Removed notifications`);
      
      // 10. Remover membros da sala
      await client.query(`
        DELETE FROM room_members 
        WHERE room_id = $1
      `, [roomId]);
      console.log(`✅ [DeleteRoom] Removed room members`);
      
      // 11. Finalmente, excluir a sala
      await client.query(`
        DELETE FROM rooms 
        WHERE id = $1
      `, [roomId]);
      console.log(`✅ [DeleteRoom] Removed room record`);
      
      await client.query('COMMIT');
      
      // Notificar todos os membros via WebSocket
      const io = req.app.get('io');
      if (io) {
        console.log(`📢 [DeleteRoom] Sending WebSocket notifications to ${memberIds.length} members`);
        
        memberIds.forEach(memberId => {
          // Notificar que a sala foi excluída
          io.to(`user:${memberId}`).emit('room:deleted', {
            roomId,
            roomName,
            deletedBy: userId,
            timestamp: Date.now()
          });
          
          // Se não é o próprio owner, notificar que foi removido
          if (memberId !== userId) {
            io.to(`user:${memberId}`).emit('room:removed_from_room', {
              roomId,
              roomName,
              reason: 'room_deleted',
              timestamp: Date.now()
            });
          }
        });
        
        console.log(`✅ [DeleteRoom] WebSocket notifications sent successfully`);
      }
      
      console.log(`🎉 [DeleteRoom] Room "${roomName}" deleted successfully by user ${userId}`);
      
      res.status(204).send();
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('🚨 [DeleteRoom] Error deleting room:', {
        roomId: req.params.roomId,
        userId: req.user.id,
        error: error.message,
        stack: error.stack
      });
      res.status(500).json({ error: 'InternalServerError', traceId: req.traceId });
    } finally {
      client.release();
    }
  }

  // Sair da sala
  static async leaveRoom(req, res) {
    const client = await pool.connect();
    
    try {
      const { roomId } = req.params;
      const userId = req.user.id;
      
      console.log(`🚪 [LeaveRoom] Starting leave process - roomId: ${roomId}, userId: ${userId}`);
      
      await client.query('BEGIN');
      
      // Verificar se o usuário é membro da sala
      const memberResult = await client.query(`
        SELECT role FROM room_members 
        WHERE room_id = $1 AND user_id = $2
      `, [roomId, userId]);
      
      if (memberResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ 
          error: 'NotFound', 
          msg: 'Você não é membro desta sala'
        });
      }
      
      const userRole = memberResult.rows[0].role;
      let newOwnerId = null;
      
      // Se o usuário é o owner, encontrar o próximo owner
      if (userRole === 'owner') {
        console.log('🔄 Owner está saindo da sala, transferindo propriedade...');
        
        // 1. Buscar o moderador mais antigo
        const moderatorResult = await client.query(`
          SELECT user_id, joined_at 
          FROM room_members 
          WHERE room_id = $1 AND role = 'moderator' AND user_id != $2
          ORDER BY joined_at ASC 
          LIMIT 1
        `, [roomId, userId]);
        
        if (moderatorResult.rows.length > 0) {
          newOwnerId = moderatorResult.rows[0].user_id;
          console.log(`👑 Transferindo propriedade para moderador mais antigo: ${newOwnerId}`);
        } else {
          // 2. Se não há moderadores, buscar o membro mais antigo
          const memberResult = await client.query(`
            SELECT user_id, joined_at 
            FROM room_members 
            WHERE room_id = $1 AND role = 'member' AND user_id != $2
            ORDER BY joined_at ASC 
            LIMIT 1
          `, [roomId, userId]);
          
          if (memberResult.rows.length > 0) {
            newOwnerId = memberResult.rows[0].user_id;
            console.log(`👑 Transferindo propriedade para membro mais antigo: ${newOwnerId}`);
          } else {
            console.log('⚠️ Não há outros membros na sala. Sala será desativada.');
            
            // Desativar a sala se não há outros membros
            await client.query(`
              UPDATE rooms SET is_active = false 
              WHERE id = $1
            `, [roomId]);
            
            // Remover o owner
            await client.query(`
              DELETE FROM room_members 
              WHERE room_id = $1 AND user_id = $2
            `, [roomId, userId]);
            
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
            
            return res.status(204).send();
          }
        }
        
        // Transferir propriedade para o novo owner
        if (newOwnerId) {
          // Primeiro remover o owner atual (para evitar violação de constraint)
          await client.query(`
            DELETE FROM room_members 
            WHERE room_id = $1 AND user_id = $2
          `, [roomId, userId]);
          
          // Depois promover o novo owner
          await client.query(`
            UPDATE room_members 
            SET role = 'owner' 
            WHERE room_id = $1 AND user_id = $2
          `, [roomId, newOwnerId]);
          
          // Atualizar owner_id e current_members na tabela rooms
          await client.query(`
            UPDATE rooms 
            SET owner_id = $1, current_members = 1
            WHERE id = $2
          `, [newOwnerId, roomId]);
          
          console.log(`✅ Propriedade transferida com sucesso para usuário: ${newOwnerId}`);
          
          // Notificar via WebSocket sobre a mudança de ownership
          const io = req.app.get('io');
          if (io) {
            // Notificar o novo owner
            io.to(`user:${newOwnerId}`).emit('room:ownership_transferred', {
              roomId,
              newRole: 'owner',
              message: 'Você agora é o proprietário desta sala',
              timestamp: Date.now()
            });
            
            // Notificar todos os membros da sala sobre a mudança
            io.to(`room:${roomId}`).emit('room:owner_changed', {
              roomId,
              oldOwnerId: userId,
              newOwnerId,
              timestamp: Date.now()
            });
            
            console.log(`📢 Notificações de transferência de propriedade enviadas`);
          }
          
          // Owner já foi removido acima, pular a remoção normal
        } else {
          // Se não há novo owner, apenas remover o usuário atual
          await client.query(`
            DELETE FROM room_members 
            WHERE room_id = $1 AND user_id = $2
          `, [roomId, userId]);
        }
      } else {
        // Se não é owner, apenas remover normalmente
        await client.query(`
          DELETE FROM room_members 
          WHERE room_id = $1 AND user_id = $2
        `, [roomId, userId]);
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
      
      // Atualizar contador de membros (apenas para não-owners, owners já foram tratados)
      if (userRole !== 'owner') {
        await client.query(`
          UPDATE rooms 
          SET current_members = current_members - 1 
          WHERE id = $1
        `, [roomId]);
      }
      
      await client.query('COMMIT');
      
      console.log(`✅ [LeaveRoom] Successfully left room - roomId: ${roomId}, userId: ${userId}`);
      res.status(204).send();
      
    } catch (error) {
      await client.query('ROLLBACK');
      const { roomId: errorRoomId } = req.params;
      const errorUserId = req.user.id;
      console.error(`🚨 [LeaveRoom] Error leaving room - roomId: ${errorRoomId}, userId: ${errorUserId}:`, {
        error: error.message,
        stack: error.stack,
        traceId: req.traceId,
        timestamp: new Date().toISOString()
      });
      res.status(500).json({ 
        error: 'InternalServerError', 
        msg: 'Erro interno do servidor ao sair da sala',
        traceId: req.traceId 
      });
    } finally {
      client.release();
    }
  }
}

export default RoomsController;