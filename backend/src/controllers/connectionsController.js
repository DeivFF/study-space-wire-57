import pool from '../config/database.js';
import { AppError, asyncHandler } from '../utils/validation.js';

/**
 * @desc    Send a connection request to another user
 * @route   POST /api/connections
 * @access  Private
 */
export const sendConnectionRequest = asyncHandler(async (req, res) => {
  const { receiverId } = req.body;
  const requesterId = req.user.userId;

  // Validate input
  if (!receiverId) {
    throw new AppError('Receiver ID is required', 400);
  }

  // Check if user is trying to connect with themselves
  if (requesterId === receiverId) {
    throw new AppError('You cannot send a connection request to yourself', 400);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if receiver user exists and is active
    const receiverResult = await client.query(
      'SELECT id, name FROM users WHERE id = $1 AND is_active = true',
      [receiverId]
    );

    if (receiverResult.rows.length === 0) {
      throw new AppError('User not found or account is deactivated', 404);
    }

    const receiver = receiverResult.rows[0];

    // Check if connection request already exists
    const existingConnection = await client.query(
      `SELECT id, status FROM user_connections 
       WHERE (requester_id = $1 AND receiver_id = $2) 
       OR (requester_id = $2 AND receiver_id = $1)`,
      [requesterId, receiverId]
    );

    if (existingConnection.rows.length > 0) {
      const connection = existingConnection.rows[0];
      
      // If already friends, return appropriate message
      if (connection.status === 'accepted') {
        throw new AppError('You are already connected with this user', 400);
      }
      
      // If request is pending and current user is the requester
      if (connection.status === 'pending' && connection.requester_id === requesterId) {
        throw new AppError('Connection request already sent', 400);
      }
      
      // If request is pending and current user is the receiver
      if (connection.status === 'pending' && connection.receiver_id === requesterId) {
        throw new AppError('You already have a pending connection request from this user. Please check your requests', 400);
      }
      
      // If blocked, handle appropriately
      if (connection.status === 'blocked') {
        throw new AppError('Unable to send connection request', 400);
      }
    }

    // Check if user has blocked the receiver
    const blockCheck = await client.query(
      `SELECT id FROM user_connections 
       WHERE requester_id = $1 AND receiver_id = $2 AND status = 'blocked'`,
      [requesterId, receiverId]
    );

    if (blockCheck.rows.length > 0) {
      throw new AppError('Unable to send connection request', 400);
    }

    // Create connection request
    const connectionResult = await client.query(
      `INSERT INTO user_connections (requester_id, receiver_id, status)
       VALUES ($1, $2, $3)
       RETURNING id, requester_id, receiver_id, status, created_at, updated_at`,
      [requesterId, receiverId, 'pending']
    );

    const connection = connectionResult.rows[0];

    // Get requester info for notification
    const requesterResult = await client.query(
      'SELECT u.name, p.nickname, p.avatar_url FROM users u LEFT JOIN profiles p ON u.id = p.user_id WHERE u.id = $1',
      [requesterId]
    );
    
    const requesterInfo = requesterResult.rows[0];

    // Create notification for the receiver
    await client.query(
      `INSERT INTO notifications (user_id, type, sender_id, related_id, title, message)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        receiverId, 
        'connection_request', 
        requesterId, 
        connection.id,
        'Solicitação de amizade',
        `${requesterInfo?.name || 'Alguém'} quer se conectar com você`
      ]
    );

    await client.query('COMMIT');

    // Emit Socket.io notification to receiver
    const io = req.app.get('io');
    if (io) {
      // Get requester info for notification
      const requesterResult = await pool.query(
        'SELECT u.name, p.nickname, p.avatar_url FROM users u LEFT JOIN profiles p ON u.id = p.user_id WHERE u.id = $1',
        [requesterId]
      );
      
      const requesterInfo = requesterResult.rows[0];
      
      io.to(`user:${receiverId}`).emit('notification:friend_request', {
        type: 'friend_request',
        requestId: connection.id,
        from: {
          id: requesterId,
          name: requesterInfo?.name || 'Unknown User',
          nickname: requesterInfo?.nickname || 'user',
          avatarUrl: requesterInfo?.avatar_url
        },
        timestamp: Date.now()
      });
    }

    res.status(201).json({
      success: true,
      message: 'Connection request sent successfully',
      data: {
        connection: {
          id: connection.id,
          requesterId: connection.requester_id,
          receiverId: connection.receiver_id,
          status: connection.status,
          createdAt: connection.created_at,
          updatedAt: connection.updated_at
        }
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

/**
 * @desc    Search for users by name or nickname
 * @route   GET /api/connections/search
 * @access  Private
 */
export const searchUsers = asyncHandler(async (req, res) => {
  const { query, limit = 10 } = req.query;
  const userId = req.user.userId;

  // Validate input
  if (!query || query.trim().length === 0) {
    throw new AppError('Search query is required', 400);
  }

  // Validate limit
  const limitNum = parseInt(limit);
  if (isNaN(limitNum) || limitNum <= 0 || limitNum > 50) {
    throw new AppError('Limit must be a number between 1 and 50', 400);
  }

  try {
    // Search for users by name or nickname, excluding current user and blocked users
    const searchResult = await pool.query(
      `SELECT u.id, u.name, u.email, p.nickname, p.avatar_url, p.first_name, p.last_name
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE u.id != $1 
       AND u.is_active = true
       AND (u.name ILIKE $2 OR p.nickname ILIKE $2)
       AND u.id NOT IN (
         SELECT receiver_id FROM user_connections 
         WHERE requester_id = $1 AND status = 'blocked'
       )
       ORDER BY u.name
       LIMIT $3`,
      [userId, `%${query.trim()}%`, limitNum]
    );

    const users = searchResult.rows.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      nickname: user.nickname,
      avatarUrl: user.avatar_url,
      firstName: user.first_name,
      lastName: user.last_name
    }));

    res.json({
      success: true,
      message: 'Users retrieved successfully',
      data: users
    });
  } catch (error) {
    console.error('Error searching users:', error);
    throw new AppError('Failed to search users', 500);
  }
});

/**
 * @desc    Get pending connection requests for the current user
 * @route   GET /api/connections/requests
 * @access  Private
 */
export const getConnectionRequests = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  try {
    // Get pending connection requests where current user is the receiver
    const requestsResult = await pool.query(
      `SELECT 
         uc.id,
         uc.requester_id,
         uc.receiver_id,
         uc.status,
         uc.created_at,
         uc.updated_at,
         u.name as requester_name,
         u.email as requester_email,
         p.nickname as requester_nickname,
         p.avatar_url as requester_avatar_url
       FROM user_connections uc
       JOIN users u ON uc.requester_id = u.id
       LEFT JOIN profiles p ON uc.requester_id = p.user_id
       WHERE uc.receiver_id = $1 
       AND uc.status = 'pending'
       AND u.is_active = true
       ORDER BY uc.created_at DESC`,
      [userId]
    );

    const requests = requestsResult.rows.map(request => ({
      id: request.id,
      requesterId: request.requester_id,
      receiverId: request.receiver_id,
      status: request.status,
      createdAt: request.created_at,
      updatedAt: request.updated_at,
      requester: {
        id: request.requester_id,
        name: request.requester_name,
        email: request.requester_email,
        nickname: request.requester_nickname,
        avatarUrl: request.requester_avatar_url
      }
    }));

    res.json({
      success: true,
      message: 'Connection requests retrieved successfully',
      data: requests
    });
  } catch (error) {
    console.error('Error fetching connection requests:', error);
    throw new AppError('Failed to fetch connection requests', 500);
  }
});

/**
 * @desc    Accept or reject a connection request
 * @route   PUT /api/connections/:id
 * @access  Private
 */
export const respondToConnectionRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { action } = req.body; // 'accept' or 'reject'
  const userId = req.user.userId;

  // Validate input
  if (!action || (action !== 'accept' && action !== 'reject')) {
    throw new AppError('Action must be either "accept" or "reject"', 400);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if connection request exists and user is the receiver
    const connectionResult = await client.query(
      `SELECT id, requester_id, receiver_id, status 
       FROM user_connections 
       WHERE id = $1 AND receiver_id = $2 AND status = 'pending'`,
      [id, userId]
    );

    if (connectionResult.rows.length === 0) {
      throw new AppError('Connection request not found or you are not authorized to respond to this request', 404);
    }

    const connection = connectionResult.rows[0];
    const newStatus = action === 'accept' ? 'accepted' : 'rejected';

    // Update connection status
    const updateResult = await client.query(
      `UPDATE user_connections 
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, requester_id, receiver_id, status, created_at, updated_at`,
      [newStatus, id]
    );

    const updatedConnection = updateResult.rows[0];

    // Get responder info for notification
    const responderResult = await client.query(
      'SELECT u.name, p.nickname, p.avatar_url FROM users u LEFT JOIN profiles p ON u.id = p.user_id WHERE u.id = $1',
      [userId]
    );
    
    const responderInfo = responderResult.rows[0];

    // Create notification for the requester if accepted
    if (action === 'accept') {
      await client.query(
        `INSERT INTO notifications (user_id, type, sender_id, related_id, title, message)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          connection.requester_id, 
          'connection_accepted', 
          userId, 
          updatedConnection.id,
          'Solicitação aceita!',
          `${responderInfo?.name || 'Alguém'} aceitou sua solicitação de amizade`
        ]
      );
    }

    await client.query('COMMIT');

    // Emit Socket.io notification
    const io = req.app.get('io');
    if (io) {
      // Get responder info for notification
      const responderResult = await pool.query(
        'SELECT u.name, p.nickname, p.avatar_url FROM users u LEFT JOIN profiles p ON u.id = p.user_id WHERE u.id = $1',
        [userId]
      );
      
      const responderInfo = responderResult.rows[0];
      const requesterId = connection.requester_id;
      
      if (action === 'accept') {
        // Notify both users about accepted friendship
        io.to(`user:${requesterId}`).emit('notification:friend_accepted', {
          type: 'friend_accepted',
          from: {
            id: userId,
            name: responderInfo?.name || 'Unknown User',
            nickname: responderInfo?.nickname || 'user',
            avatarUrl: responderInfo?.avatar_url
          },
          timestamp: Date.now()
        });
        
        // Also notify the responder (for UI updates)
        io.to(`user:${userId}`).emit('notification:friend_accepted', {
          type: 'friend_accepted',
          from: {
            id: requesterId,
            name: 'You are now friends!',
            nickname: 'system'
          },
          timestamp: Date.now()
        });
      } else {
        // Notify requester about rejection
        io.to(`user:${requesterId}`).emit('notification:friend_rejected', {
          type: 'friend_rejected',
          from: {
            id: userId,
            name: responderInfo?.name || 'Unknown User',
            nickname: responderInfo?.nickname || 'user',
            avatarUrl: responderInfo?.avatar_url
          },
          timestamp: Date.now()
        });
      }
    }

    res.json({
      success: true,
      message: `Connection request ${action}ed successfully`,
      data: {
        connection: {
          id: updatedConnection.id,
          requesterId: updatedConnection.requester_id,
          receiverId: updatedConnection.receiver_id,
          status: updatedConnection.status,
          createdAt: updatedConnection.created_at,
          updatedAt: updatedConnection.updated_at
        }
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

/**
 * @desc    Remove an existing connection or cancel a pending request
 * @route   DELETE /api/connections/:id
 * @access  Private
 */
export const removeConnection = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if connection exists and user is either requester or receiver
    const connectionResult = await client.query(
      `SELECT id, requester_id, receiver_id, status 
       FROM user_connections 
       WHERE id = $1 AND (requester_id = $2 OR receiver_id = $2)`,
      [id, userId]
    );

    if (connectionResult.rows.length === 0) {
      throw new AppError('Connection not found or you are not authorized to remove this connection', 404);
    }

    const connection = connectionResult.rows[0];

    // Delete the connection
    await client.query('DELETE FROM user_connections WHERE id = $1', [id]);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Connection removed successfully',
      data: {
        connection: {
          id: connection.id,
          requesterId: connection.requester_id,
          receiverId: connection.receiver_id,
          status: connection.status
        }
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

/**
 * @desc    Get all connections for the current user
 * @route   GET /api/connections
 * @access  Private
 */
export const getConnections = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { status = 'accepted' } = req.query;

  // Validate status parameter
  const validStatuses = ['pending', 'accepted', 'rejected', 'blocked'];
  if (!validStatuses.includes(status)) {
    throw new AppError(`Status must be one of: ${validStatuses.join(', ')}`, 400);
  }

  try {
    // Get connections for the current user
    const connectionsResult = await pool.query(
      `SELECT 
         uc.id,
         uc.requester_id,
         uc.receiver_id,
         uc.status,
         uc.created_at,
         uc.updated_at,
         u.id as user_id,
         u.name as user_name,
         u.email as user_email,
         u.last_login as user_last_login,
         p.nickname as user_nickname,
         p.avatar_url as user_avatar_url,
         p.status as user_profile_status
       FROM user_connections uc
       JOIN users u ON (uc.requester_id = u.id OR uc.receiver_id = u.id)
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE (uc.requester_id = $1 OR uc.receiver_id = $1)
       AND uc.status = $2
       AND u.id != $1
       AND u.is_active = true
       ORDER BY uc.created_at DESC`,
      [userId, status]
    );

    const connections = connectionsResult.rows.map(connection => ({
      id: connection.id,
      requesterId: connection.requester_id,
      receiverId: connection.receiver_id,
      status: connection.status,
      createdAt: connection.created_at,
      updatedAt: connection.updated_at,
      user: {
        id: connection.user_id,
        name: connection.user_name,
        email: connection.user_email,
        nickname: connection.user_nickname,
        avatarUrl: connection.user_avatar_url,
        status: connection.user_profile_status,
        lastLogin: connection.user_last_login
      }
    }));

    res.json({
      success: true,
      message: 'Connections retrieved successfully',
      data: connections
    });
  } catch (error) {
    console.error('Error fetching connections:', error);
    throw new AppError('Failed to fetch connections', 500);
  }
});

/**
 * @desc    Block a user from sending connection requests
 * @route   POST /api/connections/block
 * @access  Private
 */
export const blockUser = asyncHandler(async (req, res) => {
  const { userId: blockedUserId } = req.body;
  const blockerId = req.user.userId;

  // Validate input
  if (!blockedUserId) {
    throw new AppError('User ID to block is required', 400);
  }

  // Check if user is trying to block themselves
 if (blockerId === blockedUserId) {
    throw new AppError('You cannot block yourself', 400);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if blocked user exists and is active
    const userResult = await client.query(
      'SELECT id, name FROM users WHERE id = $1 AND is_active = true',
      [blockedUserId]
    );

    if (userResult.rows.length === 0) {
      throw new AppError('User not found or account is deactivated', 404);
    }

    const blockedUser = userResult.rows[0];

    // Check if block relationship already exists
    const existingBlock = await client.query(
      `SELECT id, status FROM user_connections 
       WHERE requester_id = $1 AND receiver_id = $2 AND status = 'blocked'`,
      [blockerId, blockedUserId]
    );

    if (existingBlock.rows.length > 0) {
      throw new AppError('User is already blocked', 400);
    }

    // Check if there's an existing connection (accepted, pending, etc.)
    const existingConnection = await client.query(
      `SELECT id, status FROM user_connections 
       WHERE (requester_id = $1 AND receiver_id = $2) 
       OR (requester_id = $2 AND receiver_id = $1)`,
      [blockerId, blockedUserId]
    );

    if (existingConnection.rows.length > 0) {
      // Update existing connection to blocked
      await client.query(
        `UPDATE user_connections 
         SET status = 'blocked', updated_at = NOW()
         WHERE (requester_id = $1 AND receiver_id = $2) 
         OR (requester_id = $2 AND receiver_id = $1)`,
        [blockerId, blockedUserId]
      );
    } else {
      // Create new blocked connection
      await client.query(
        `INSERT INTO user_connections (requester_id, receiver_id, status)
         VALUES ($1, $2, $3)`,
        [blockerId, blockedUserId, 'blocked']
      );
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'User blocked successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

/**
 * @desc    Unblock a previously blocked user
 * @route   DELETE /api/connections/block/:id
 * @access  Private
 */
export const unblockUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if block relationship exists and user is the blocker
    const blockResult = await client.query(
      `SELECT id FROM user_connections 
       WHERE id = $1 AND requester_id = $2 AND status = 'blocked'`,
      [id, userId]
    );

    if (blockResult.rows.length === 0) {
      throw new AppError('Block relationship not found or you are not authorized to unblock this user', 404);
    }

    // Delete the block relationship
    await client.query('DELETE FROM user_connections WHERE id = $1', [id]);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'User unblocked successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});