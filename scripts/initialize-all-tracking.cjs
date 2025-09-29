// Script to initialize tracking steps for all applications that don't have them
const Database = require('better-sqlite3');
const path = require('path');

console.log('Initializing tracking steps for all applications...\n');

try {
  // Connect to the database
  const dbPath = path.join(__dirname, '..', 'internship.db');
  console.log('Database path:', dbPath);
  
  const db = new Database(dbPath);
  console.log('✅ Database connection successful');
  
  // Get all applications
  console.log('\nFetching all applications...');
  const applications = db.prepare(`
    SELECT id FROM applications
  `).all();
  
  console.log(`✅ Found ${applications.length} applications`);
  
  // Initialize default tracking steps
  const defaultSteps = [
    { step: 'Application Submitted', status: 'COMPLETED' },
    { step: 'Resume Review', status: 'PENDING' },
    { step: 'Document Verification', status: 'PENDING' },
    { step: 'Mentor Review', status: 'PENDING' },
    { step: 'Employer Review', status: 'PENDING' },
    { step: 'Interview Scheduling', status: 'PENDING' },
    { step: 'Interview Process', status: 'PENDING' },
    { step: 'Feedback Collection', status: 'PENDING' },
    { step: 'Final Decision', status: 'PENDING' },
    { step: 'Offer Processing', status: 'PENDING' }
  ];
  
  const trackingStmt = db.prepare(`
    INSERT INTO application_tracking (application_id, step, status, completed_at)
    VALUES (?, ?, ?, ?)
  `);
  
  let initializedCount = 0;
  
  // Process each application
  for (const app of applications) {
    // Check if tracking steps already exist
    const existingSteps = db.prepare(`
      SELECT COUNT(*) as count FROM application_tracking WHERE application_id = ?
    `).get(app.id);
    
    if (existingSteps.count === 0) {
      console.log(`\nInitializing tracking steps for application ${app.id}...`);
      
      // Initialize tracking steps
      defaultSteps.forEach(track => {
        const completedAt = track.status === 'COMPLETED' ? new Date().toISOString() : null;
        trackingStmt.run(app.id, track.step, track.status, completedAt);
        console.log(`   ✅ Added: ${track.step}`);
      });
      
      initializedCount++;
    } else {
      console.log(`\n✅ Application ${app.id} already has tracking steps (${existingSteps.count})`);
    }
  }
  
  console.log(`\n✅ Tracking initialization completed!`);
  console.log(`   - Initialized tracking for ${initializedCount} applications`);
  console.log(`   - Skipped ${applications.length - initializedCount} applications (already had tracking)`);
  
  // Verify the results
  console.log('\nVerifying results...');
  const totalSteps = db.prepare('SELECT COUNT(*) as count FROM application_tracking').get();
  console.log(`✅ Total tracking steps in database: ${totalSteps.count}`);
  
  db.close();
  console.log('\n🎉 All tracking steps initialized successfully!');
  
} catch (error) {
  console.error('❌ Tracking initialization failed:', error.message);
  console.error(error.stack);
  process.exit(1);
}