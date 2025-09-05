import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../src/config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const runMigration = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting database migration...');
    
    // Create migrations table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Get all migration files from the migrations directory
    const migrationsDir = path.join(__dirname, '../migrations');
    const files = fs.readdirSync(migrationsDir);
    
    // Filter and sort migration files by name (numerical order)
    const migrationFiles = files
      .filter(file => file.endsWith('.sql'))
      .sort(); // Sorts alphabetically, which works for numbered files
    
    if (migrationFiles.length === 0) {
      console.log('❌ No migration files found.');
      process.exit(1);
    }
    
    console.log(`📋 Found ${migrationFiles.length} migration files:`);
    migrationFiles.forEach(file => console.log(`   - ${file}`));
    
    // Get list of already applied migrations
    const appliedMigrationsResult = await client.query('SELECT name FROM migrations ORDER BY name');
    const appliedMigrations = appliedMigrationsResult.rows.map(row => row.name);
    
    await client.query('BEGIN');
    
    let migrationsApplied = 0;
    
    // Execute each migration file in order if not already applied
    for (const file of migrationFiles) {
      if (appliedMigrations.includes(file)) {
        console.log(`⏭️  Skipping already applied migration: ${file}`);
        continue;
      }
      
      const migrationPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(migrationPath, 'utf8');
      
      console.log(`🔄 Running migration: ${file}`);
      
      // Split the SQL into statements and execute each one individually
      const statements = sql.split(';').filter(stmt => stmt.trim() !== '');
      
      for (const statement of statements) {
        if (statement.trim() !== '') {
          try {
            await client.query(statement);
          } catch (stmtError) {
            // If it's a "relation already exists" error, we can ignore it
            if (stmtError.message.includes('já existe') || stmtError.message.includes('already exists')) {
              console.log(`⚠️  Skipping statement (already exists): ${statement.substring(0, 50)}...`);
            } else {
              // Re-throw other errors
              throw stmtError;
            }
          }
        }
      }
      
      // Record that this migration has been applied
      await client.query(
        'INSERT INTO migrations (name) VALUES ($1)',
        [file]
      );
      
      console.log(`✅ Completed: ${file}`);
      migrationsApplied++;
    }
    
    await client.query('COMMIT');
    
    if (migrationsApplied === 0) {
      console.log('✅ All migrations already applied. Nothing to do.');
    } else {
      console.log(`✅ ${migrationsApplied} new migrations applied successfully!`);
    }
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