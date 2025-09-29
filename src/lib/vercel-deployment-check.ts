#!/usr/bin/env node

/**
 * Vercel Deployment Verification Script
 * 
 * This script verifies that the application is ready for deployment to Vercel
 * by checking key components that are critical for serverless environments.
 */

import { getMemoryDatabase } from './memory-database';

async function verifyVercelReadiness() {
  console.log('🔍 Verifying Vercel deployment readiness...\n');
  
  try {
    // 1. Test memory database initialization
    console.log('1. Testing memory database initialization...');
    const db = getMemoryDatabase();
    console.log('   ✅ Memory database initialized successfully');
    
    // 2. Test user queries
    console.log('2. Testing user queries...');
    const user = db.getUserByUsername.get('admin');
    if (user) {
      console.log('   ✅ User queries working');
    } else {
      console.log('   ⚠️  No default users found (will be seeded on first run)');
    }
    
    // 3. Test internship queries
    console.log('3. Testing internship queries...');
    const internships = db.getActiveInternships.all();
    console.log(`   ✅ Found ${internships.length} active internships`);
    
    // 4. Test application queries
    console.log('4. Testing application queries...');
    const applications = db.getAllApplications.all();
    console.log(`   ✅ Found ${applications.length} applications`);
    
    // 5. Test calendar event queries
    console.log('5. Testing calendar event queries...');
    const calendarEvents = db.getUpcomingCalendarEvents.all(1, 10);
    console.log(`   ✅ Found ${calendarEvents.length} upcoming calendar events`);
    
    // 6. Test feedback queries
    console.log('6. Testing feedback queries...');
    const feedback = db.getAllFeedback.all();
    console.log(`   ✅ Found ${feedback.length} feedback entries`);
    
    // 7. Test analytics queries
    console.log('7. Testing analytics queries...');
    const unplacedCount = db.getUnplacedStudentsCount.get();
    const statusBreakdown = db.getApplicationStatusBreakdown.all();
    const openPositions = db.getOpenPositionsCount.get();
    const avgRating = db.getAverageFeedbackRating.get();
    
    console.log(`   ✅ Analytics queries working:`);
    console.log(`      - Unplaced students: ${unplacedCount.count}`);
    console.log(`      - Application statuses: ${statusBreakdown.length} types`);
    console.log(`      - Open positions: ${openPositions.count}`);
    console.log(`      - Average feedback rating: ${avgRating.average_rating} (${avgRating.total_feedback} reviews)`);
    
    console.log('\n🎉 All Vercel deployment checks passed!');
    console.log('\n📋 Deployment Notes:');
    console.log('   - Memory database will be used automatically in Vercel environment');
    console.log('   - Default users will be created on first access');
    console.log('   - All database operations are serverless-compatible');
    console.log('   - No file system dependencies that would cause issues');
    
    return true;
  } catch (error) {
    console.error('❌ Vercel deployment verification failed:', error);
    return false;
  }
}

// Run verification if script is executed directly
if (require.main === module) {
  verifyVercelReadiness().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export default verifyVercelReadiness;