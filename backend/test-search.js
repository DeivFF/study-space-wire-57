import pool from './src/config/database.js';
import dotenv from 'dotenv';
dotenv.config();

// Test the search functionality
async function testSearch() {
  try {
    const q = 'Deiv';
    const limit = 10;
    const currentUserId = 'bc908bb2-55de-4204-baf8-1ca5d029cfd1';

    if (!q || q.trim().length < 2) {
      console.log('Query too short');
      return;
    }

    const searchQuery = q.trim();
    const searchLimit = Math.min(parseInt(limit) || 10, 50);

    console.log('Searching for:', searchQuery, 'with limit:', searchLimit);

    const result = await pool.query(`
      SELECT DISTINCT
        u.id,
        u.name,
        p.nickname,
        p.first_name,
        p.last_name,
        p.avatar_url,
        p.bio,
        p.city,
        p.interests,
        p.private_profile
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
      ORDER BY
        CASE 
          WHEN LOWER(p.nickname) = LOWER($3) THEN 1
          WHEN LOWER(u.name) = LOWER($3) THEN 2
          WHEN LOWER(p.nickname) ILIKE LOWER($4) THEN 3
          WHEN LOWER(u.name) ILIKE LOWER($4) THEN 4
          ELSE 5
        END,
        u.name
      LIMIT $5
    `, [currentUserId, `%${searchQuery}%`, searchQuery, `${searchQuery}%`, searchLimit]);

    console.log('Raw results:', result.rows.length, 'users found');
    
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

    console.log('Transformed users:');
    users.forEach(u => console.log('-', u.name, '(nickname:', u.nickname + ')'));

    const response = {
      success: true,
      data: {
        users,
        query: searchQuery,
        totalResults: users.length
      }
    };

    console.log('\nAPI Response:', JSON.stringify(response, null, 2));

  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

testSearch();