// Simple script to test if the backend API is responding
// Usage: node test-connection.js

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const API_URL = process.env.PORT ? `http://localhost:${process.env.PORT}` : 'http://localhost:3002';

async function testConnection() {
  console.log(`Testing connection to backend at ${API_URL}...\n`);

  try {
    // Test basic connection
    const response = await fetch(`${API_URL}/health`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend is responding!');
      console.log(`   Status: ${data.status}`);
      console.log(`   Timestamp: ${data.timestamp}`);
      console.log(`   Response time: ${response.headers.get('server-timing') || 'N/A'}`);
    } else {
      console.log('❌ Backend returned an error:');
      console.log(`   Status: ${response.status}`);
      console.log(`   Status Text: ${response.statusText}`);
      
      try {
        const errorData = await response.json();
        console.log(`   Error: ${errorData.error || errorData.message}`);
      } catch (parseError) {
        console.log('   Could not parse error response');
      }
    }
  } catch (error) {
    console.log('❌ Failed to connect to backend:');
    console.log(`   Error: ${error.message}`);
    
    // Check if it's a network error
    if (error.code === 'ECONNREFUSED') {
      console.log('   Possible causes:');
      console.log('   - Backend server is not running');
      console.log('   - Backend server is running on a different port');
      console.log('   - Firewall blocking the connection');
    }
  }
  
  console.log('\n💡 To start the backend server:');
  console.log('   cd backend && npm run dev');
}

// Run the test
testConnection();