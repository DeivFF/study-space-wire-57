import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../src/config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const runProfileMigration = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Running profile fields migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '../migrations/005_add_profile_fields.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('🔄 Executing migration...');
    await client.query(sql);
    console.log('✅ Profile fields migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
};

runProfileMigration();