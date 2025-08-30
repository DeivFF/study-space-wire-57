import pool from './src/config/database.js';

async function checkTables() {
  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('Existing tables:');
    result.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
    
    // Check if refresh_tokens table exists
    const refreshTokenTable = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'refresh_tokens'
      )
    `);
    
    console.log(`\nRefresh tokens table exists: ${refreshTokenTable.rows[0].exists}`);
    
    await pool.end();
  } catch (error) {
    console.error('Error checking tables:', error.message);
  }
}

checkTables();