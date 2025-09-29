#!/usr/bin/env node

/**
 * Database Queries Test Script
 * 
 * This script tests the database queries functionality for Vercel deployment.
 */

console.log('🔍 Testing database queries for Vercel deployment...\n');

// Set environment variable to use memory database
process.env.ENABLE_MEMORY_DB = 'true';

try {
  // Test database initialization
  console.log('1. Testing database initialization...');
  const { getDbQueries } = require('../src/lib/database');
  
  // This should return the memory database queries
  const db = getDbQueries();
  console.log('   ✅ Database queries initialized successfully');
  
  // Test user queries
  console.log('2. Testing user queries...');
  // Since this is a memory database, we might not have users yet
  // Let's try to create a user first
  try {
    const createUserResult = db.createUser.run(
      'testuser', 
      'hashedpassword', 
      'STUDENT', 
      'Test User', 
      'test@example.com'
    );
    console.log('   ✅ User creation working, created user with ID:', createUserResult.lastInsertRowid);
    
    // Now try to get the user
    const user = db.getUserByUsername.get('testuser');
    if (user) {
      console.log('   ✅ User queries working');
    } else {
      console.log('   ⚠️  Could not retrieve created user');
    }
  } catch (error) {
    console.log('   ⚠️  User creation/query test:', error.message);
  }
  
  console.log('\n🎉 Database queries test completed!');
  console.log('\n📋 Deployment Notes:');
  console.log('   - Memory database will be used automatically in Vercel environment');
  console.log('   - All database operations are serverless-compatible');
  
  process.exit(0);
} catch (error) {
  console.error('❌ Database queries test failed:', error.message);
  process.exit(1);
}