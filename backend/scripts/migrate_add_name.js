import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../src/config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const runMigration = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting migration to add name column...');
    
    // Read only the second migration SQL file
    const migrationPath = path.join(__dirname, '../migrations/002_add_name_to_users.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the SQL
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    
    console.log('✅ Name column migration completed successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
};

runMigration();