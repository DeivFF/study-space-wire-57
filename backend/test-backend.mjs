#!/usr/bin/env node

// Simple test script to check if backend is working
import fetch from 'node-fetch';

const baseUrl = 'http://localhost:3002';

async function testBackend() {
  try {
    console.log('Testing backend health...');
    const healthResponse = await fetch(`${baseUrl}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);

    // Test nickname availability check
    console.log('\nTesting nickname availability...');
    const nicknameResponse = await fetch(`${baseUrl}/api/profile/nickname/check?nickname=testuser`);
    const nicknameData = await nicknameResponse.json();
    console.log('✅ Nickname check:', nicknameData);

    console.log('\n✅ Backend is working correctly!');
  } catch (error) {
    console.error('❌ Backend test failed:', error.message);
  }
}

testBackend();