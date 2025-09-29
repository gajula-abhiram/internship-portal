// Set environment for testing
process.env.NODE_ENV = 'development';

console.log('Testing database connection and application tracking queries...\n');

try {
  // Import the database module
  const { getDatabase } = require('../src/lib/database.ts');
  
  console.log('1. Getting database connection...');
  const db = getDatabase();
  
  if (!db) {
    console.log('   ❌ Database connection failed');
    process.exit(1);
  }
  
  console.log('   ✅ Database connection successful');
  
  // Test if the application_tracking table exists
  console.log('2. Checking if application_tracking table exists...');
  try {
    const tableCheck = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='application_tracking'
    `).get();
    
    if (tableCheck) {
      console.log('   ✅ application_tracking table exists');
    } else {
      console.log('   ❌ application_tracking table does not exist');
    }
  } catch (error) {
    console.log('   ❌ Error checking table:', error.message);
  }
  
  // Test querying applications
  console.log('3. Testing application query...');
  try {
    const applications = db.prepare(`
      SELECT a.id, a.status, a.applied_at, i.title as internship_title
      FROM applications a
      JOIN internships i ON a.internship_id = i.id
      LIMIT 5
    `).all();
    
    console.log(`   ✅ Found ${applications.length} applications`);
    applications.forEach(app => {
      console.log(`      - Application ${app.id}: ${app.internship_title} (${app.status})`);
    });
  } catch (error) {
    console.log('   ❌ Error querying applications:', error.message);
  }
  
  // Test querying application tracking
  console.log('4. Testing application tracking query...');
  try {
    // First get an application ID
    const app = db.prepare('SELECT id FROM applications LIMIT 1').get();
    if (app) {
      const trackingSteps = db.prepare(`
        SELECT * FROM application_tracking 
        WHERE application_id = ?
      `).all(app.id);
      
      console.log(`   ✅ Found ${trackingSteps.length} tracking steps for application ${app.id}`);
    } else {
      console.log('   ⚠️  No applications found to test tracking');
    }
  } catch (error) {
    console.log('   ❌ Error querying application tracking:', error.message);
  }
  
  console.log('\n✅ Database connection test completed successfully!');
  
} catch (error) {
  console.error('❌ Database connection test failed:', error.message);
  console.error(error.stack);
  process.exit(1);
}