import express from 'express';
import { asyncHandler } from '../utils/validation.js';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/authenticateToken.js';

const router = express.Router();

/**
 * @route   GET /api/profile/search
 * @desc    Search users by name, nickname, or interests
 * @access  Private
 */
router.get('/search', authenticateToken, asyncHandler(async (req, res) => {
  const { q, limit = 10 } = req.query;
  const currentUserId = req.user.id;

  if (!q || q.trim().length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Search query must be at least 2 characters long'
    });
  }

  const searchQuery = q.trim();
  const searchLimit = Math.min(parseInt(limit) || 10, 50); // Max 50 results

  try {
    // Search users by name, nickname, interests, or city
    // Only return public profiles and exclude current user
    const result = await pool.query(`
      SELECT 
        u.id,
        u.name,
        p.nickname,
        p.first_name,
        p.last_name,
        p.avatar_url,
        p.bio,
        p.city,
        p.interests,
        p.private_profile,
        CASE 
          WHEN LOWER(p.nickname) = LOWER($3) THEN 1
          WHEN LOWER(u.name) = LOWER($3) THEN 2
          WHEN LOWER(p.nickname) ILIKE LOWER($4) THEN 3
          WHEN LOWER(u.name) ILIKE LOWER($4) THEN 4
          ELSE 5
        END as priority
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE u.id != $1 
        AND u.is_active = true
        AND (p.private_profile = false OR p.private_profile IS NULL)
        AND (
          LOWER(u.name) ILIKE LOWER($2)
          OR LOWER(p.nickname) ILIKE LOWER($2)
          OR LOWER(p.first_name) ILIKE LOWER($2)
          OR LOWER(p.last_name) ILIKE LOWER($2)
          OR LOWER(p.city) ILIKE LOWER($2)
          OR LOWER(p.interests) ILIKE LOWER($2)
        )
      ORDER BY priority, u.name
      LIMIT $5
    `, [currentUserId, `%${searchQuery}%`, searchQuery, `${searchQuery}%`, searchLimit]);

    const users = result.rows.map(user => ({
      id: user.id,
      name: user.name,
      nickname: user.nickname,
      firstName: user.first_name,
      lastName: user.last_name,
      avatarUrl: user.avatar_url,
      bio: user.bio || '',
      city: user.city || '',
      interests: user.interests ? user.interests.split(',').map(i => i.trim()) : []
    }));

    res.status(200).json({
      success: true,
      data: {
        users,
        query: searchQuery,
        totalResults: users.length
      }
    });

  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}));

/**
 * @route   GET /api/profile/nickname/check
 * @desc    Check if nickname is available
 * @access  Public
 */
router.get('/nickname/check', asyncHandler(async (req, res) => {
  const { nickname } = req.query;

  if (!nickname || nickname.length < 3 || nickname.length > 16) {
    return res.status(400).json({
      success: false,
      message: 'Nickname must be between 3 and 16 characters'
    });
  }

  // Validate nickname format (letters, numbers, ., _, -)
  const nicknameRegex = /^[a-zA-Z0-9._-]+$/;
  if (!nicknameRegex.test(nickname)) {
    return res.status(400).json({
      success: false,
      message: 'Nickname can only contain letters, numbers, period, underscore, and hyphen'
    });
  }

  try {
    const result = await pool.query(
      'SELECT id FROM profiles WHERE LOWER(nickname) = LOWER($1)',
      [nickname]
    );

    const isAvailable = result.rows.length === 0;

    res.status(200).json({
      success: true,
      data: {
        available: isAvailable,
        nickname: nickname
      }
    });
  } catch (error) {
    console.error('Error checking nickname availability:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}));

 /**
  * @route   POST /api/profile/onboarding
  * @desc    Complete user onboarding
  * @access  Private
  */
 router.post('/onboarding', authenticateToken, asyncHandler(async (req, res) => {
    const { nickname, avatarUrl } = req.body;
    const userId = req.user.id;
 
    // If nickname is provided, validate it
    if (nickname) {
      if (nickname.length < 3 || nickname.length > 16) {
        return res.status(400).json({
          success: false,
          message: 'Nickname must be between 3 and 16 characters'
        });
      }
 
      // Validate nickname format (letters, numbers, ., _, -)
      const nicknameRegex = /^[a-zA-Z0-9._-]+$/;
      if (!nicknameRegex.test(nickname)) {
        return res.status(400).json({
          success: false,
          message: 'Nickname can only contain letters, numbers, period, underscore, and hyphen'
        });
      }
 
      // Check if nickname is already taken by another user
      const nicknameCheck = await pool.query(
        'SELECT id FROM profiles WHERE LOWER(nickname) = LOWER($1) AND user_id != $2',
        [nickname, userId]
      );
 
      if (nicknameCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Nickname is already taken'
        });
      }
    }
 
    try {
      // Process avatar - if it's an avatar ID, convert it to a URL
      let processedAvatarUrl = avatarUrl || null;
      if (avatarUrl && avatarUrl.startsWith('a')) {
        // It's an avatar ID, convert it to a URL or generate appropriate representation
        // For now, we'll just store the ID as the avatar_url, but in a real app you might
        // generate a proper URL or store the ID in a different field
        processedAvatarUrl = avatarUrl;
      }
 
      // Start a transaction to update both profiles and users tables
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
 
        // Update profile with nickname (if provided) and avatar
        if (nickname) {
          await client.query(
            'UPDATE profiles SET nickname = $1, avatar_url = $2 WHERE user_id = $3',
            [nickname, processedAvatarUrl, userId]
          );
        } else {
          await client.query(
            'UPDATE profiles SET avatar_url = $1 WHERE user_id = $2',
            [processedAvatarUrl, userId]
          );
        }
 
        // Mark onboarding as completed in users table
        await client.query(
          'UPDATE users SET onboarding_completed = true WHERE id = $1',
          [userId]
        );
 
        await client.query('COMMIT');
 
        res.status(200).json({
          success: true,
          message: 'Onboarding completed successfully',
          data: {
            nickname: nickname || 'Generated nickname',
            avatarUrl: processedAvatarUrl
          }
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }));

/**
 * @route   GET /api/profile/by-nickname/:nickname
 * @desc    Get user profile by nickname
 * @access  Private
 */
router.get('/by-nickname/:nickname', authenticateToken, asyncHandler(async (req, res) => {
  const { nickname } = req.params;
  const userId = req.user.id;

  if (!nickname || nickname.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Invalid nickname'
    });
  }

  try {
    // First get the user by nickname
    const result = await pool.query(`
      SELECT
        u.id,
        u.email,
        u.name,
        u.onboarding_completed,
        u.email_verified as is_verified,
        u.is_active,
        p.nickname,
        p.avatar_url,
        p.first_name,
        p.last_name,
        p.bio,
        p.city,
        p.interests,
        p.contact_email,
        p.contact_visible_to_friends,
        p.private_profile
      FROM users u
      INNER JOIN profiles p ON u.id = p.user_id
      WHERE LOWER(p.nickname) = LOWER($1) AND u.is_active = true
    `, [nickname.trim()]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userProfile = result.rows[0];
    const isOwnProfile = userProfile.id === userId;

    // Check privacy settings for non-own profiles
    if (!isOwnProfile && userProfile.private_profile) {
      return res.status(403).json({
        success: false,
        message: 'This profile is private'
      });
    }

    // Check connection status if not own profile
    let connectionStatus = null;
    if (!isOwnProfile) {
      const connectionResult = await pool.query(`
        SELECT status FROM user_connections 
        WHERE (requester_id = $1 AND receiver_id = $2) 
           OR (requester_id = $2 AND receiver_id = $1)
        ORDER BY created_at DESC
        LIMIT 1
      `, [userId, userProfile.id]);
      
      connectionStatus = connectionResult.rows.length > 0 ? connectionResult.rows[0].status : null;
    }

    // Format the response
    const profileData = {
      id: userProfile.id,
      name: userProfile.name,
      nickname: userProfile.nickname,
      firstName: userProfile.first_name,
      lastName: userProfile.last_name,
      avatarUrl: userProfile.avatar_url,
      bio: userProfile.bio || '',
      city: userProfile.city || '',
      interests: userProfile.interests ? userProfile.interests.split(',').map(i => i.trim()) : [],
      privateProfile: userProfile.private_profile || false,
      isOwnProfile,
      connectionStatus
    };

    // Add private information only if it's own profile
    if (isOwnProfile) {
      profileData.email = userProfile.email;
      profileData.contactEmail = userProfile.contact_email || userProfile.email;
      profileData.contactVisibleToFriends = userProfile.contact_visible_to_friends || false;
      profileData.onboardingCompleted = userProfile.onboarding_completed;
      profileData.isVerified = userProfile.is_verified;
    } else {
      // For non-own profiles, only show contact info if they're friends and it's visible
      if (connectionStatus === 'accepted' && userProfile.contact_visible_to_friends) {
        profileData.contactEmail = userProfile.contact_email || userProfile.email;
      }
    }

    res.status(200).json({
      success: true,
      data: profileData
    });

  } catch (error) {
    console.error('Error fetching user profile by nickname:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}));

/**
  * @route   GET /api/profile/:id
  * @desc    Get user profile by ID
  * @access  Private (only authenticated users can access)
  */
 router.get('/:id', authenticateToken, asyncHandler(async (req, res) => {
   const { id } = req.params;
   const userId = req.user.id;

   // Validate UUID format
   const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
   if (!uuidRegex.test(id)) {
     return res.status(400).json({
       success: false,
       message: 'Invalid user ID format'
     });
   }

   // Check if user is trying to access their own profile
   const isOwnProfile = id === userId;

   try {
     // Query to get user profile with privacy information
     const result = await pool.query(`
       SELECT
         u.id,
         u.email,
         u.name,
         u.onboarding_completed,
         u.email_verified as is_verified,
         u.is_active,
         p.nickname,
         p.avatar_url,
         p.first_name,
         p.last_name,
         p.bio,
         p.city,
         p.interests,
         p.contact_email,
         p.contact_visible_to_friends,
         p.private_profile
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE u.id = $1 AND u.is_active = true
     `, [id]);

     if (result.rows.length === 0) {
       return res.status(404).json({
         success: false,
         message: 'User not found'
       });
     }

     const userProfile = result.rows[0];

     // Check privacy settings for non-own profiles
     if (!isOwnProfile && userProfile.private_profile) {
       return res.status(403).json({
         success: false,
         message: 'This profile is private'
       });
     }

     // Check connection status if not own profile
     let connectionStatus = null;
     if (!isOwnProfile) {
       const connectionResult = await pool.query(`
         SELECT status FROM user_connections 
         WHERE (requester_id = $1 AND receiver_id = $2) 
            OR (requester_id = $2 AND receiver_id = $1)
         ORDER BY created_at DESC
         LIMIT 1
       `, [userId, id]);
       
       connectionStatus = connectionResult.rows.length > 0 ? connectionResult.rows[0].status : null;
     }

     // Format the response based on privacy settings and relationship
     const profileData = {
       id: userProfile.id,
       name: userProfile.name,
       nickname: userProfile.nickname,
       firstName: userProfile.first_name,
       lastName: userProfile.last_name,
       avatarUrl: userProfile.avatar_url,
       bio: userProfile.bio || '',
       city: userProfile.city || '',
       interests: userProfile.interests ? userProfile.interests.split(',').map(i => i.trim()) : [],
       privateProfile: userProfile.private_profile || false,
       isOwnProfile,
       connectionStatus
     };

     // Add private information only if it's own profile
     if (isOwnProfile) {
       profileData.email = userProfile.email;
       profileData.contactEmail = userProfile.contact_email || userProfile.email;
       profileData.contactVisibleToFriends = userProfile.contact_visible_to_friends || false;
       profileData.onboardingCompleted = userProfile.onboarding_completed;
       profileData.isVerified = userProfile.is_verified;
     } else {
       // Show contact info only if visible to friends and they are connected
       if (userProfile.contact_visible_to_friends && connectionStatus === 'accepted') {
         profileData.contactEmail = userProfile.contact_email || userProfile.email;
       }
     }

     res.status(200).json({
       success: true,
       data: profileData
     });
   } catch (error) {
     console.error('Error fetching user profile:', error);
     res.status(500).json({
       success: false,
       message: 'Internal server error',
       error: process.env.NODE_ENV === 'development' ? error.message : undefined
     });
   }
 }));


/**
 * @route   GET /api/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(`
      SELECT
        u.id,
        u.email,
        u.name,
        u.onboarding_completed,
        u.email_verified as is_verified,
        p.nickname,
        p.avatar_url,
        p.first_name,
        p.last_name,
        p.bio,
        p.city,
        p.interests,
        p.contact_email,
        p.contact_visible_to_friends,
        p.private_profile
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE u.id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    const userProfile = result.rows[0];

    const profileData = {
      id: userProfile.id,
      email: userProfile.email,
      name: userProfile.name,
      firstName: userProfile.first_name,
      lastName: userProfile.last_name,
      nickname: userProfile.nickname,
      avatarUrl: userProfile.avatar_url,
      bio: userProfile.bio || '',
      city: userProfile.city || '',
      interests: userProfile.interests ? userProfile.interests.split(',').map(i => i.trim()) : [],
      contactEmail: userProfile.contact_email || userProfile.email,
      contactVisibleToFriends: userProfile.contact_visible_to_friends || false,
      privateProfile: userProfile.private_profile || false,
      onboardingCompleted: userProfile.onboarding_completed,
      isVerified: userProfile.is_verified
    };

    res.status(200).json({
      success: true,
      data: profileData
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}));

/**
 * @route   PUT /api/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const {
    nickname,
    firstName,
    lastName,
    bio,
    city,
    interests,
    contactEmail,
    contactVisibleToFriends,
    privateProfile,
    avatarUrl
  } = req.body;

  // Validate nickname if provided
  if (nickname) {
    if (nickname.length < 3 || nickname.length > 16) {
      return res.status(400).json({
        success: false,
        message: 'Nickname must be between 3 and 16 characters'
      });
    }

    const nicknameRegex = /^[a-zA-Z0-9._-]+$/;
    if (!nicknameRegex.test(nickname)) {
      return res.status(400).json({
        success: false,
        message: 'Nickname can only contain letters, numbers, period, underscore, and hyphen'
      });
    }

    // Check if nickname is already taken
    const nicknameCheck = await pool.query(
      'SELECT id FROM profiles WHERE LOWER(nickname) = LOWER($1) AND user_id != $2',
      [nickname, userId]
    );

    if (nicknameCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Nickname is already taken'
      });
    }
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Update users table if name components are provided
    if (firstName || lastName) {
      const nameParts = [];
      if (firstName) nameParts.push(firstName);
      if (lastName) nameParts.push(lastName);
      const fullName = nameParts.join(' ');

      await client.query(
        'UPDATE users SET name = $1 WHERE id = $2',
        [fullName, userId]
      );
    }

    // Prepare interests as comma-separated string
    const interestsString = Array.isArray(interests) ? interests.join(', ') : interests;

    // Update profile
    await client.query(`
      UPDATE profiles SET
        nickname = COALESCE($1, nickname),
        first_name = COALESCE($2, first_name),
        last_name = COALESCE($3, last_name),
        bio = COALESCE($4, bio),
        city = COALESCE($5, city),
        interests = COALESCE($6, interests),
        contact_email = COALESCE($7, contact_email),
        contact_visible_to_friends = COALESCE($8, contact_visible_to_friends),
        private_profile = COALESCE($9, private_profile),
        avatar_url = COALESCE($10, avatar_url),
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $11
    `, [
      nickname,
      firstName,
      lastName,
      bio,
      city,
      interestsString,
      contactEmail,
      contactVisibleToFriends,
      privateProfile,
      avatarUrl,
      userId
    ]);

    await client.query('COMMIT');

    // Fetch updated profile
    const result = await pool.query(`
      SELECT
        u.id,
        u.email,
        u.name,
        p.nickname,
        p.avatar_url,
        p.first_name,
        p.last_name,
        p.bio,
        p.city,
        p.interests,
        p.contact_email,
        p.contact_visible_to_friends,
        p.private_profile
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE u.id = $1
    `, [userId]);

    const userProfile = result.rows[0];

    const profileData = {
      id: userProfile.id,
      email: userProfile.email,
      name: userProfile.name,
      firstName: userProfile.first_name,
      lastName: userProfile.last_name,
      nickname: userProfile.nickname,
      avatarUrl: userProfile.avatar_url,
      bio: userProfile.bio || '',
      city: userProfile.city || '',
      interests: userProfile.interests ? userProfile.interests.split(',').map(i => i.trim()) : [],
      contactEmail: userProfile.contact_email || userProfile.email,
      contactVisibleToFriends: userProfile.contact_visible_to_friends || false,
      privateProfile: userProfile.private_profile || false
    };

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: profileData
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  } finally {
    client.release();
  }
}));

/**
 * @route   GET /api/profile/:userId/posts
 * @desc    Get user posts for profile display
 * @access  Private
 */
router.get('/:userId/posts', authenticateToken, asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user.id;
  const { limit = 5, offset = 0 } = req.query;

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid user ID format'
    });
  }

  try {
    // Check if the profile exists and determine privacy settings
    const profileResult = await pool.query(`
      SELECT p.private_profile, u.is_active
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE u.id = $1
    `, [userId]);

    if (profileResult.rows.length === 0 || !profileResult.rows[0].is_active) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const { private_profile } = profileResult.rows[0];
    const isOwnProfile = userId === currentUserId;

    // Check if user can view posts
    if (!isOwnProfile && private_profile) {
      // Check if users are connected as friends
      const connectionResult = await pool.query(`
        SELECT status FROM user_connections 
        WHERE (requester_id = $1 AND receiver_id = $2) 
           OR (requester_id = $2 AND receiver_id = $1)
        ORDER BY created_at DESC
        LIMIT 1
      `, [currentUserId, userId]);
      
      const connectionStatus = connectionResult.rows.length > 0 ? connectionResult.rows[0].status : null;
      
      if (connectionStatus !== 'accepted') {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view this user\'s posts'
        });
      }
    }

    // Fetch user posts
    const postsResult = await pool.query(`
      SELECT 
        p.id,
        p.title,
        p.content,
        p.data,
        p.type,
        p.category,
        p.tags,
        p.is_anonymous,
        p.created_at,
        p.updated_at,
        u.name as author_name,
        pr.nickname as author_nickname,
        pr.avatar_url as author_avatar,
        COALESCE(p.likes_count, 0) as like_count,
        COALESCE(p.comments_count, 0) as comment_count,
        EXISTS(
          SELECT 1 FROM post_likes pl 
          WHERE pl.post_id = p.id AND pl.user_id = $2
        ) as is_liked_by_current_user
      FROM posts p
      INNER JOIN users u ON p.user_id = u.id
      LEFT JOIN profiles pr ON u.id = pr.user_id
      WHERE p.user_id = $1 
        AND u.is_active = true
      ORDER BY p.created_at DESC
      LIMIT $3 OFFSET $4
    `, [userId, currentUserId, parseInt(limit), parseInt(offset)]);

    const posts = postsResult.rows.map(post => ({
      id: post.id,
      content: post.content,
      title: post.title,
      data: post.data,
      type: post.type,
      category: post.category,
      tags: post.tags || [],
      isAnonymous: post.is_anonymous || false,
      likesCount: post.like_count,
      commentsCount: post.comment_count,
      isLiked: post.is_liked_by_current_user,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
      author: {
        id: userId,
        name: post.author_name,
        nickname: post.author_nickname,
        avatarUrl: post.author_avatar
      },
      comments: [] // Will be populated if needed
    }));

    // Check if there are more posts
    const totalCountResult = await pool.query(`
      SELECT COUNT(*) as total
      FROM posts p
      INNER JOIN users u ON p.user_id = u.id
      WHERE p.user_id = $1 
        AND u.is_active = true
    `, [userId]);

    const totalPosts = parseInt(totalCountResult.rows[0].total);
    const hasMore = (parseInt(offset) + posts.length) < totalPosts;

    res.json({
      success: true,
      data: {
        posts,
        hasMore,
        totalPosts
      }
    });

  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}));

export default router;