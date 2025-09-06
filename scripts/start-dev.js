#!/usr/bin/env node

// Script to start both frontend and backend in development mode
// This script uses concurrently to run both services in parallel

console.log('🚀 Starting Study Space Development Environment...');
console.log('===============================================');

// Use concurrently to run both services
import { spawn } from 'child_process';

const child = spawn('npx', ['concurrently', '"npm run dev:frontend"', '"npm run dev:backend"'], {
  stdio: 'inherit',
  shell: true
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down development servers...');
  child.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down development servers...');
  child.kill();
  process.exit(0);
});

child.on('error', (error) => {
  console.error('❌ Error starting development servers:', error);
});

child.on('close', (code) => {
  console.log(`\n🛑 Development servers exited with code ${code}`);
});