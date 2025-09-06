import pool from '../config/database.js';
import { AppError, asyncHandler } from '../utils/validation.js';

/**
 * @desc    Get user notifications
 * @route   GET /api/notifications
 * @access  Private
 */
export const getNotifications = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { limit = 20, offset = 0 } = req.query;

  try {
    // Validate limit and offset
    const limitNum = parseInt(limit);
    const offsetNum = parseInt(offset);
    
    if (isNaN(limitNum) || limitNum <= 0 || limitNum > 100) {
      throw new AppError('Limit must be a number between 1 and 100', 400);
    }
    
    if (isNaN(offsetNum) || offsetNum < 0) {
      throw new AppError('Offset must be a non-negative number', 400);
    }

    // Get notifications for the user
    const notificationsResult = await pool.query(
      `SELECT 
         n.id,
         n.user_id,
         n.type,
         n.sender_id,
         n.related_id,
         n.title,
         n.message,
         n.read,
         n.created_at,
         n.updated_at,
         u.name as sender_name,
         u.email as sender_email,
         p.nickname as sender_nickname,
         p.avatar_url as sender_avatar_url
       FROM notifications n
       LEFT JOIN users u ON n.sender_id = u.id
       LEFT JOIN profiles p ON n.sender_id = p.user_id
       WHERE n.user_id = $1
       ORDER BY n.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limitNum, offsetNum]
    );

    const notifications = notificationsResult.rows.map(notification => ({
      id: notification.id,
      userId: notification.user_id,
      type: notification.type,
      senderId: notification.sender_id,
      relatedId: notification.related_id,
      title: notification.title,
      message: notification.message,
      read: notification.read,
      createdAt: notification.created_at,
      updatedAt: notification.updated_at,
      sender: {
        id: notification.sender_id,
        name: notification.sender_name,
        email: notification.sender_email,
        nickname: notification.sender_nickname,
        avatarUrl: notification.sender_avatar_url
      }
    }));

    res.json({
      success: true,
      message: 'Notifications retrieved successfully',
      data: notifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw new AppError('Failed to fetch notifications', 500);
  }
});

/**
 * @desc    Mark notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private
 */
export const markNotificationAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  try {
    // Check if notification exists and belongs to user
    const notificationResult = await pool.query(
      `SELECT id, user_id, read FROM notifications WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (notificationResult.rows.length === 0) {
      throw new AppError('Notification not found or you are not authorized to update this notification', 404);
    }

    const notification = notificationResult.rows[0];

    // If already read, return success
    if (notification.read) {
      return res.json({
        success: true,
        message: 'Notification already marked as read',
        data: {
          notification: {
            id: notification.id,
            userId: notification.user_id,
            read: notification.read
          }
        }
      });
    }

    // Mark notification as read
    const updateResult = await pool.query(
      `UPDATE notifications 
       SET read = true, updated_at = NOW()
       WHERE id = $1
       RETURNING id, user_id, read, created_at, updated_at`,
      [id]
    );

    const updatedNotification = updateResult.rows[0];

    res.json({
      success: true,
      message: 'Notification marked as read successfully',
      data: {
        notification: {
          id: updatedNotification.id,
          userId: updatedNotification.user_id,
          read: updatedNotification.read,
          createdAt: updatedNotification.created_at,
          updatedAt: updatedNotification.updated_at
        }
      }
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw new AppError('Failed to mark notification as read', 500);
  }
});

/**
 * @desc    Mark all notifications as read
 * @route   PUT /api/notifications/read-all
 * @access  Private
 */
export const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  try {
    // Mark all unread notifications as read
    const updateResult = await pool.query(
      `UPDATE notifications 
       SET read = true, updated_at = NOW()
       WHERE user_id = $1 AND read = false
       RETURNING id, user_id, read, created_at, updated_at`,
      [userId]
    );

    const updatedNotifications = updateResult.rows.map(notification => ({
      id: notification.id,
      userId: notification.user_id,
      read: notification.read,
      createdAt: notification.created_at,
      updatedAt: notification.updated_at
    }));

    res.json({
      success: true,
      message: `${updatedNotifications.length} notifications marked as read successfully`,
      data: {
        notifications: updatedNotifications
      }
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw new AppError('Failed to mark all notifications as read', 500);
  }
});

/**
 * @desc    Delete notification
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
export const deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  try {
    // Check if notification exists and belongs to user
    const notificationResult = await pool.query(
      `SELECT id, user_id FROM notifications WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (notificationResult.rows.length === 0) {
      throw new AppError('Notification not found or you are not authorized to delete this notification', 404);
    }

    // Delete notification
    await pool.query('DELETE FROM notifications WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Notification deleted successfully',
      data: {
        notification: {
          id: id
        }
      }
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw new AppError('Failed to delete notification', 500);
  }
});

/**
 * @desc    Get unread notifications count
 * @route   GET /api/notifications/unread-count
 * @access  Private
 */
export const getUnreadNotificationsCount = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  try {
    // Get count of unread notifications
    const countResult = await pool.query(
      `SELECT COUNT(*) as unread_count
       FROM notifications 
       WHERE user_id = $1 AND read = false`,
      [userId]
    );

    const unreadCount = parseInt(countResult.rows[0].unread_count);

    res.json({
      success: true,
      message: 'Unread notifications count retrieved successfully',
      data: {
        count: unreadCount
      }
    });
  } catch (error) {
    console.error('Error fetching unread notifications count:', error);
    throw new AppError('Failed to fetch unread notifications count', 500);
  }
});

/**
 * @desc    Create a message notification for conversation participants (respects mute settings)
 * @access  Internal use only
 */
export const createMessageNotification = async (conversationId, senderId, message) => {
  try {
    // Get all participants except sender and exclude muted conversations
    const participantsResult = await pool.query(
      `SELECT cp.user_id, u.name as user_name
       FROM conversation_participants cp
       JOIN users u ON cp.user_id = u.id
       WHERE cp.conversation_id = $1 
         AND cp.user_id != $2 
         AND cp.is_muted = false`,
      [conversationId, senderId]
    );

    // Get sender info
    const senderResult = await pool.query(
      `SELECT u.name, p.nickname 
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE u.id = $1`,
      [senderId]
    );

    const senderName = senderResult.rows[0]?.nickname || senderResult.rows[0]?.name || 'Someone';
    const previewText = message.length > 50 ? message.substring(0, 47) + '...' : message;

    // Create notifications for each participant
    const notifications = [];
    for (const participant of participantsResult.rows) {
      const notificationResult = await pool.query(
        `INSERT INTO notifications (user_id, type, sender_id, related_id, title, message)
         VALUES ($1, 'message', $2, $3, $4, $5)
         RETURNING id, user_id, type, sender_id, related_id, title, message, read, created_at, updated_at`,
        [
          participant.user_id,
          senderId,
          conversationId,
          `New message from ${senderName}`,
          previewText
        ]
      );
      notifications.push(notificationResult.rows[0]);
    }

    return notifications;
  } catch (error) {
    console.error('Error creating message notifications:', error);
    throw error;
  }
};

/**
 * @desc    Create a notification for a user
 * @route   POST /api/notifications
 * @access  Private (Internal use only - should be called by other controllers)
 */
export const createNotification = asyncHandler(async (req, res) => {
  const { userId, type, senderId, relatedId, title, message } = req.body;

  try {
    // Validate required fields
    if (!userId || !type || !title || !message) {
      throw new AppError('Missing required fields: userId, type, title, message', 400);
    }

    // Create notification
    const notificationResult = await pool.query(
      `INSERT INTO notifications (user_id, type, sender_id, related_id, title, message)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, user_id, type, sender_id, related_id, title, message, read, created_at, updated_at`,
      [userId, type, senderId || null, relatedId || null, title, message]
    );

    const notification = notificationResult.rows[0];

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: {
        notification: {
          id: notification.id,
          userId: notification.user_id,
          type: notification.type,
          senderId: notification.sender_id,
          relatedId: notification.related_id,
          title: notification.title,
          message: notification.message,
          read: notification.read,
          createdAt: notification.created_at,
          updatedAt: notification.updated_at
        }
      }
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    throw new AppError('Failed to create notification', 500);
  }
});