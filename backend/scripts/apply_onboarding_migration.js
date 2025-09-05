import pool from '../src/config/database.js';

const applyOnboardingMigration = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Applying onboarding migration...');
    
    await client.query('BEGIN');

    // Check if onboarding_completed column exists in users table
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'onboarding_completed'
    `);
    
    if (columnCheck.rows.length === 0) {
      console.log('Adding onboarding_completed column to users table...');
      await client.query('ALTER TABLE users ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE');
      console.log('✅ Added onboarding_completed column');
    } else {
      console.log('✅ onboarding_completed column already exists');
    }

    // Check if nickname column allows NULL values
    const nicknameNullable = await client.query(`
      SELECT is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'profiles' AND column_name = 'nickname'
    `);
    
    if (nicknameNullable.rows.length > 0 && nicknameNullable.rows[0].is_nullable === 'YES') {
      console.log('Setting NOT NULL constraint on nickname column...');
      await client.query('ALTER TABLE profiles ALTER COLUMN nickname SET NOT NULL');
      console.log('✅ Set NOT NULL constraint on nickname');
    } else {
      console.log('✅ NOT NULL constraint already exists on nickname');
    }

    // Check if unique_nickname constraint exists
    const uniqueCheck = await client.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'profiles' AND constraint_type = 'UNIQUE' AND constraint_name = 'unique_nickname'
    `);
    
    if (uniqueCheck.rows.length === 0) {
      console.log('Adding unique_nickname constraint...');
      await client.query('ALTER TABLE profiles ADD CONSTRAINT unique_nickname UNIQUE (nickname)');
      console.log('✅ Added unique_nickname constraint');
    } else {
      console.log('✅ unique_nickname constraint already exists');
    }

    // Check if index exists
    const indexCheck = await client.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'profiles' AND indexname = 'idx_profiles_nickname_lower'
    `);
    
    if (indexCheck.rows.length === 0) {
      console.log('Creating index for lowercase nickname lookups...');
      await client.query('CREATE INDEX idx_profiles_nickname_lower ON profiles(LOWER(nickname))');
      console.log('✅ Created nickname index');
    } else {
      console.log('✅ Nickname index already exists');
    }

    await client.query('COMMIT');
    console.log('✅ Onboarding migration completed successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Onboarding migration failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
};

applyOnboardingMigration();