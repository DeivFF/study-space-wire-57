import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../src/config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const runUserConnectionsMigration = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting user_connections table migration...');
    
    // Get the specific migration file
    const migrationFile = '006_create_user_connections_table.sql';
    const migrationsDir = path.join(__dirname, '../migrations');
    const migrationPath = path.join(migrationsDir, migrationFile);
    
    // Check if file exists
    if (!fs.existsSync(migrationPath)) {
      console.log(`❌ Migration file not found: ${migrationFile}`);
      process.exit(1);
    }
    
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log(`🔄 Running migration: ${migrationFile}`);
    await client.query(sql);
    console.log(`✅ Completed: ${migrationFile}`);
    console.log('✅ User connections table migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
};

runUserConnectionsMigration();