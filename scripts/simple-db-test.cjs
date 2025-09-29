// Simple database test
const path = require('path');
const Database = require('better-sqlite3');

console.log('Testing database connection...\n');

try {
  // Connect to the database
  const dbPath = path.join(__dirname, '..', 'internship.db');
  console.log('Database path:', dbPath);
  
  const db = new Database(dbPath);
  console.log('✅ Database connection successful');
  
  // Test if the application_tracking table exists
  console.log('\nChecking if application_tracking table exists...');
  try {
    const tableCheck = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='application_tracking'
    `).get();
    
    if (tableCheck) {
      console.log('✅ application_tracking table exists');
    } else {
      console.log('❌ application_tracking table does not exist');
    }
  } catch (error) {
    console.log('❌ Error checking table:', error.message);
  }
  
  // Check how many tracking steps exist
  console.log('\nChecking tracking steps count...');
  try {
    const count = db.prepare('SELECT COUNT(*) as count FROM application_tracking').get();
    console.log(`✅ Found ${count.count} tracking steps in the database`);
  } catch (error) {
    console.log('❌ Error counting tracking steps:', error.message);
  }
  
  // Test querying applications
  console.log('\nTesting application query...');
  try {
    const applications = db.prepare(`
      SELECT a.id, a.status, a.applied_at, i.title as internship_title
      FROM applications a
      JOIN internships i ON a.internship_id = i.id
      LIMIT 5
    `).all();
    
    console.log(`✅ Found ${applications.length} applications`);
    applications.forEach(app => {
      console.log(`   - Application ${app.id}: ${app.internship_title} (${app.status})`);
    });
  } catch (error) {
    console.log('❌ Error querying applications:', error.message);
  }
  
  // Test querying application tracking
  console.log('\nTesting application tracking query...');
  try {
    // First get an application ID
    const app = db.prepare('SELECT id FROM applications LIMIT 1').get();
    if (app) {
      const trackingSteps = db.prepare(`
        SELECT * FROM application_tracking 
        WHERE application_id = ?
      `).all(app.id);
      
      console.log(`✅ Found ${trackingSteps.length} tracking steps for application ${app.id}`);
    } else {
      console.log('⚠️ No applications found to test tracking');
    }
  } catch (error) {
    console.log('❌ Error querying application tracking:', error.message);
  }
  
  db.close();
  console.log('\n✅ Database test completed successfully!');
  
} catch (error) {
  console.error('❌ Database test failed:', error.message);
  console.error(error.stack);
  process.exit(1);
}