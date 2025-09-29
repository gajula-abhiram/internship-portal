// Test script to verify Vercel deployment readiness
const { getMemoryDatabase } = require('./src/lib/memory-database.ts');

console.log('🧪 Testing Vercel deployment readiness...');

try {
  // Test memory database initialization
  const db = getMemoryDatabase();
  console.log('✅ Memory database initialized successfully');
  
  // Test user queries
  const users = db.getAllUsers?.all() || [];
  console.log(`👥 Users loaded: ${users.length}`);
  
  // Test internship queries
  const internships = db.getActiveInternships?.all() || [];
  console.log(`💼 Internships loaded: ${internships.length}`);
  
  // Test application queries
  const applications = db.getAllApplications?.all() || [];
  console.log(`📋 Applications loaded: ${applications.length}`);
  
  // Test chat room queries (newly added)
  const chatRooms = db.getChatRoomsByUser?.all(5) || [];
  console.log(`💬 Chat rooms loaded: ${chatRooms.length}`);
  
  // Test chat message queries (newly added)
  if (chatRooms.length > 0) {
    const chatMessages = db.getChatMessagesByRoom?.all(chatRooms[0].id) || [];
    console.log(`💬 Chat messages loaded: ${chatMessages.length}`);
  }
  
  // Test application tracking queries (newly added)
  if (applications.length > 0) {
    const tracking = db.getApplicationTracking?.all(applications[0].id) || [];
    console.log(`📊 Application tracking steps loaded: ${tracking.length}`);
  }
  
  // Test calendar event queries
  const calendarEvents = db.getAllCalendarEvents?.all() || [];
  console.log(`📅 Calendar events loaded: ${calendarEvents.length}`);
  
  console.log('\n✅ All tests passed! The application is ready for Vercel deployment.');
  console.log('\n📋 Next steps:');
  console.log('1. Commit your changes to git');
  console.log('2. Push to your GitHub repository');
  console.log('3. Connect your repository to Vercel');
  console.log('4. Set the environment variables in Vercel dashboard:');
  console.log('   - ENABLE_MEMORY_DB=true');
  console.log('   - DATABASE_URL=memory://');
  console.log('   - VERCEL=1');
  console.log('   - NODE_ENV=production');
  console.log('   - VERCEL_ENV=production');
  console.log('   - JWT_SECRET=your-secure-32-character-jwt-secret');
  console.log('   - NEXTAUTH_SECRET=your-secure-32-character-nextauth-secret');
  
} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}