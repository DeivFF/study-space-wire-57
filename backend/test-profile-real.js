// Script to test the profile endpoint with a real user
import pool from './src/config/database.js';

const testProfileWithRealUser = async () => {
  try {
    console.log('Testing profile endpoint with real user...');
    
    // First, let's get a real user from the database
    const userResult = await pool.query('SELECT id FROM users LIMIT 1');
    
    if (userResult.rows.length === 0) {
      console.log('No users found in database');
      return;
    }
    
    const userId = userResult.rows[0].id;
    console.log(`Found user with ID: ${userId}`);
    
    // Now let's test the profile query directly
    const profileResult = await pool.query(`
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
        p.private_profile,
        p.deactivated,
        p.deleted
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE u.id = $1
    `, [userId]);
    
    console.log('Profile query result:', profileResult.rows[0]);
    console.log('Profile test completed.');
  } catch (error) {
    console.error('Profile test failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await pool.end();
  }
};

testProfileWithRealUser();