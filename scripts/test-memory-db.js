#!/usr/bin/env node

/**
 * Simple Memory Database Test Script
 * 
 * This script tests the memory database functionality for Vercel deployment.
 */

console.log('🔍 Testing memory database for Vercel deployment...\n');

try {
  // Test memory database initialization using require (CommonJS)
  console.log('1. Testing memory database initialization...');
  // Use dynamic import to match how the application works
  import('../src/lib/memory-database.ts').then(({ getMemoryDatabase }) => {
    const db = getMemoryDatabase();
    console.log('   ✅ Memory database initialized successfully');
    
    // Test user queries
    console.log('2. Testing user queries...');
    const user = db.getUserByUsername.get('admin');
    if (user) {
      console.log('   ✅ User queries working');
    } else {
      console.log('   ⚠️  No default users found (will be seeded on first run)');
    }
    
    // Test internship queries
    console.log('3. Testing internship queries...');
    const internships = db.getActiveInternships.all();
    console.log(`   ✅ Found ${internships.length} active internships`);
    
    // Test application queries
    console.log('4. Testing application queries...');
    const applications = db.getAllApplications.all();
    console.log(`   ✅ Found ${applications.length} applications`);
    
    console.log('\n🎉 Memory database test completed successfully!');
    console.log('\n📋 Deployment Notes:');
    console.log('   - Memory database will be used automatically in Vercel environment');
    console.log('   - All database operations are serverless-compatible');
    
    process.exit(0);
  }).catch((error) => {
    console.error('❌ Memory database test failed:', error.message);
    process.exit(1);
  });
} catch (error) {
  console.error('❌ Memory database test failed:', error.message);
  process.exit(1);
}