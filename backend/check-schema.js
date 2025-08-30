// Script to check if the database schema is correct
import pool from './src/config/database.js';

const checkSchema = async () => {
  try {
    console.log('Checking database schema...');
    
    // Check if users table exists
    const usersTable = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'users'
    `);
    
    if (usersTable.rows.length === 0) {
      console.log('❌ Users table does not exist');
      return;
    }
    console.log('✅ Users table exists');
    
    // Check if profiles table exists
    const profilesTable = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'profiles'
    `);
    
    if (profilesTable.rows.length === 0) {
      console.log('❌ Profiles table does not exist');
      return;
    }
    console.log('✅ Profiles table exists');
    
    // Check columns in users table
    const usersColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'users'
      ORDER BY ordinal_position
    `);
    
    console.log('\nUsers table columns:');
    usersColumns.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type}, ${row.is_nullable})`);
    });
    
    // Check columns in profiles table
    const profileColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'profiles'
      ORDER BY ordinal_position
    `);
    
    console.log('\nProfiles table columns:');
    profileColumns.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type}, ${row.is_nullable})`);
    });
    
    // Check if the new columns exist
    const newColumns = ['bio', 'city', 'interests', 'contact_email', 'contact_visible_to_friends', 'private_profile', 'deactivated', 'deleted'];
    const existingColumns = profileColumns.rows.map(row => row.column_name);
    
    newColumns.forEach(column => {
      if (existingColumns.includes(column)) {
        console.log(`✅ Column ${column} exists`);
      } else {
        console.log(`❌ Column ${column} does not exist`);
      }
    });
    
    console.log('\nSchema check completed.');
  } catch (error) {
    console.error('Schema check failed:', error.message);
  } finally {
    await pool.end();
  }
};

checkSchema();