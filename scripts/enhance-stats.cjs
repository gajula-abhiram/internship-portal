const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

console.log('Enhancing database statistics...\n');

try {
  const db = new Database('internship.db');
  
  // Get current counts
  const currentStats = db.prepare(`
    SELECT 
      (SELECT COUNT(*) FROM users WHERE role = 'STUDENT') as students,
      (SELECT COUNT(DISTINCT company_name) FROM internships WHERE is_active = 1 AND verification_status = 'VERIFIED') as companies,
      (SELECT COUNT(*) FROM internships WHERE is_active = 1) as internships
  `).get();
  
  console.log('Current Statistics:');
  console.log(`  Students: ${currentStats.students}`);
  console.log(`  Companies: ${currentStats.companies}`);
  console.log(`  Internships: ${currentStats.internships}`);
  
  // Generate more student users to reach ~5000
  const studentsToAdd = Math.max(0, 5000 - currentStats.students);
  console.log(`\nAdding ${studentsToAdd} student users...`);
  
  if (studentsToAdd > 0) {
    // Get the default password hash from existing users
    const defaultUser = db.prepare(`SELECT password_hash FROM users LIMIT 1`).get();
    const passwordHash = defaultUser.password_hash;
    
    // Prepare insert statement
    const insertStmt = db.prepare(`
      INSERT INTO users (username, password_hash, role, name, email, department, current_semester)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    // Add students in batches
    const batchSize = 100;
    let addedStudents = 0;
    
    for (let i = 0; i < studentsToAdd; i += batchSize) {
      const batchEnd = Math.min(i + batchSize, studentsToAdd);
      
      // Begin transaction
      db.prepare('BEGIN').run();
      
      try {
        for (let j = i; j < batchEnd; j++) {
          const studentId = currentStats.students + j + 1;
          const department = ['Computer Science', 'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering'][Math.floor(Math.random() * 4)];
          const semester = Math.floor(Math.random() * 8) + 1;
          
          insertStmt.run(
            `student${studentId}`,
            passwordHash,
            'STUDENT',
            `Student ${studentId}`,
            `student${studentId}@university.edu`,
            department,
            semester
          );
          
          addedStudents++;
        }
        
        // Commit transaction
        db.prepare('COMMIT').run();
        console.log(`  Added ${addedStudents} students so far...`);
      } catch (error) {
        // Rollback transaction
        db.prepare('ROLLBACK').run();
        console.error('Error adding students:', error.message);
        break;
      }
    }
    
    console.log(`✅ Added ${addedStudents} student users`);
  }
  
  // Generate more companies and internships to reach 200+
  const companiesToAdd = Math.max(0, 200 - currentStats.companies);
  console.log(`\nAdding ${companiesToAdd} companies and internships...`);
  
  if (companiesToAdd > 0) {
    // Prepare insert statement for internships
    const insertInternshipStmt = db.prepare(`
      INSERT INTO internships (
        title, description, required_skills, eligible_departments, 
        stipend_min, stipend_max, is_placement, company_name, 
        location, duration_weeks, application_deadline, 
        start_date, verification_status, posted_by, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    // Get an employer user ID to use as posted_by
    const employer = db.prepare(`SELECT id FROM users WHERE role = 'EMPLOYER' LIMIT 1`).get();
    const postedById = employer ? employer.id : 1;
    
    // Add companies and internships
    for (let i = 0; i < companiesToAdd; i++) {
      const companyId = currentStats.companies + i + 1;
      const companyName = `Tech Company ${companyId}`;
      const isPlacement = Math.random() > 0.7; // 30% placement opportunities
      
      // Create 1-3 internships per company
      const internshipsPerCompany = Math.floor(Math.random() * 3) + 1;
      
      for (let j = 0; j