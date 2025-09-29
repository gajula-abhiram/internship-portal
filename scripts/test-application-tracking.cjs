// Test script to verify application tracking initialization
const Database = require('better-sqlite3');
const path = require('path');

console.log('Testing application tracking initialization...\n');

try {
  // Connect to the database
  const dbPath = path.join(__dirname, '..', 'internship.db');
  console.log('Database path:', dbPath);
  
  const db = new Database(dbPath);
  console.log('✅ Database connection successful');
  
  // Get an existing application ID
  console.log('\nGetting existing application...');
  const app = db.prepare('SELECT id FROM applications LIMIT 1').get();
  if (!app) {
    console.log('❌ No applications found');
    db.close();
    process.exit(1);
  }
  
  console.log(`✅ Found application ID: ${app.id}`);
  
  // Check current tracking steps for this application
  console.log('\nChecking current tracking steps...');
  const currentSteps = db.prepare(`
    SELECT * FROM application_tracking 
    WHERE application_id = ?
  `).all(app.id);
  
  console.log(`Found ${currentSteps.length} tracking steps`);
  
  if (currentSteps.length === 0) {
    console.log('\nInitializing tracking steps for application...');
    
    // Initialize default tracking steps for the application
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

    defaultSteps.forEach(track => {
      const completedAt = track.status === 'COMPLETED' ? new Date().toISOString() : null;
      trackingStmt.run(app.id, track.step, track.status, completedAt);
      console.log(`   ✅ Added tracking step: ${track.step}`);
    });
    
    console.log('\n✅ Tracking steps initialized successfully!');
    
    // Verify the initialization
    console.log('\nVerifying tracking steps...');
    const updatedSteps = db.prepare(`
      SELECT * FROM application_tracking 
      WHERE application_id = ?
    `).all(app.id);
    
    console.log(`✅ Found ${updatedSteps.length} tracking steps after initialization`);
    updatedSteps.forEach(step => {
      console.log(`   - ${step.step}: ${step.status}`);
    });
  } else {
    console.log('✅ Tracking steps already exist for this application');
    currentSteps.forEach(step => {
      console.log(`   - ${step.step}: ${step.status}`);
    });
  }
  
  db.close();
  console.log('\n✅ Application tracking test completed successfully!');
  
} catch (error) {
  console.error('❌ Application tracking test failed:', error.message);
  console.error(error.stack);
  process.exit(1);
}