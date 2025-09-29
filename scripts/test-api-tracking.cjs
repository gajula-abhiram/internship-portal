// Test script to simulate the API tracking endpoint
const Database = require('better-sqlite3');
const path = require('path');

console.log('Testing API tracking endpoint simulation...\n');

try {
  // Connect to the database
  const dbPath = path.join(__dirname, '..', 'internship.db');
  console.log('Database path:', dbPath);
  
  const db = new Database(dbPath);
  console.log('✅ Database connection successful');
  
  // Simulate the API endpoint logic for a student user
  console.log('\nSimulating API tracking for student user...');
  const userId = 2; // Using student user ID from our test data
  
  // Get applications for the student
  console.log('Fetching applications for student...');
  const applicationsQuery = db.prepare(`
    SELECT 
      a.id,
      a.status,
      a.applied_at,
      i.title as internship_title,
      i.company_name,
      u.name as student_name
    FROM applications a
    JOIN internships i ON a.internship_id = i.id
    JOIN users u ON a.student_id = u.id
    WHERE a.student_id = ?
    ORDER BY a.applied_at DESC
  `);
  
  const applications = applicationsQuery.all(userId);
  console.log(`✅ Found ${applications.length} applications for student`);
  
  // Add tracking steps for each application
  console.log('\nAdding tracking steps to applications...');
  const applicationsWithTracking = applications.map((app) => {
    // Get tracking steps
    const trackingQuery = db.prepare(`
      SELECT *
      FROM application_tracking
      WHERE application_id = ?
      ORDER BY created_at ASC
    `);
    
    const trackingSteps = trackingQuery.all(app.id);
    
    console.log(`   Application ${app.id}: ${trackingSteps.length} tracking steps`);
    
    return {
      ...app,
      tracking_steps: trackingSteps
    };
  });
  
  console.log('\n✅ API tracking simulation completed successfully!');
  console.log('\nResults:');
  applicationsWithTracking.forEach(app => {
    console.log(`   Application ${app.id}: ${app.internship_title} (${app.status})`);
    console.log(`   Tracking steps: ${app.tracking_steps.length}`);
  });
  
  db.close();
  
} catch (error) {
  console.error('❌ API tracking simulation failed:', error.message);
  console.error(error.stack);
  process.exit(1);
}