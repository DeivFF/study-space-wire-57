import pool from './src/config/database.js';

const checkUsers = async () => {
  const client = await pool.connect();
  
  try {
    console.log('Checking users in database...');
    
    // Get all users
    const usersResult = await client.query(`
      SELECT u.id, u.name, u.email, p.nickname, p.first_name, p.last_name
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      ORDER BY u.created_at
    `);
    
    console.log('Users found:', usersResult.rows);
    
    // Test search query directly
    console.log('\nTesting search query...');
    const searchResult = await client.query(
      `SELECT u.id, u.name, u.email, p.nickname, p.avatar_url, p.first_name, p.last_name
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE u.id != $1 
       AND u.is_active = true
       AND (u.name ILIKE $2 OR p.nickname ILIKE $2)
       ORDER BY u.name
       LIMIT $3`,
      ['85fbe37d-19bd-4c89-a5b3-08722b08ae4b', '%test%', 10]
    );
    
    console.log('Search results:', searchResult.rows);
    
    // Test the exact same search query as used in connections controller
    console.log('\nTesting exact search query from connections controller...');
    const exactSearchResult = await client.query(
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
      ['556be289-f52f-46b6-9e8e-cdfe8b962635', '%test%', 10]  // Using one of the new user IDs
    );
    
    console.log('Exact search results:', exactSearchResult.rows);
  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    client.release();
    await pool.end();
  }
};

checkUsers();