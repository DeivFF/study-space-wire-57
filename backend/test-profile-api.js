// Script to test the profile API endpoint with a real JWT token
import jwt from 'jsonwebtoken';
import pool from './src/config/database.js';

const testProfileAPI = async () => {
  try {
    console.log('Testing profile API endpoint...');
    
    // First, let's get a real user from the database
    const userResult = await pool.query('SELECT id, email FROM users LIMIT 1');
    
    if (userResult.rows.length === 0) {
      console.log('No users found in database');
      return;
    }
    
    const user = userResult.rows[0];
    console.log(`Found user with ID: ${user.id}`);
    
    // Create a JWT token for this user
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production-make-it-long-and-random',
      { expiresIn: '1h' }
    );
    
    console.log(`Generated token: ${token}`);
    
    // Now let's make a request to the profile endpoint
    // We'll use the built-in fetch API
    const response = await fetch(`http://localhost:3002/api/profile/${user.id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log(`Profile API status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Profile API data:', JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.log('Profile API error:', errorText);
    }
    
    console.log('Profile API test completed.');
  } catch (error) {
    console.error('Profile API test failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await pool.end();
  }
};

testProfileAPI();