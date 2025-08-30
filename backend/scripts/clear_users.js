import pool from '../src/config/database.js';

const clearUsers = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🗑️ Starting to clear all users and related data...');
    
    await client.query('BEGIN');
    
    // Delete all data from dependent tables first (due to foreign key constraints)
    console.log('🗑️ Deleting login attempts...');
    await client.query('DELETE FROM login_attempts');
    
    console.log('🗑️ Deleting OAuth connections...');
    await client.query('DELETE FROM oauth_connections');
    
    console.log('🗑️ Deleting password reset tokens...');
    await client.query('DELETE FROM password_reset_tokens');
    
    console.log('🗑️ Deleting email verification tokens...');
    await client.query('DELETE FROM email_verification_tokens');
    
    console.log('🗑️ Deleting profiles...');
    await client.query('DELETE FROM profiles');
    
    console.log('🗑️ Deleting users...');
    await client.query('DELETE FROM users');
    
    await client.query('COMMIT');
    console.log('✅ All users and related data cleared successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Failed to clear users:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
};

clearUsers();