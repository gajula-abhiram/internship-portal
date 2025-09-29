const Database = require('better-sqlite3');

console.log('Checking current database statistics...\n');

try {
  const db = new Database('internship.db');
  
  // Get student count
  const students = db.prepare(`SELECT COUNT(*) as count FROM users WHERE role = 'STUDENT'`).get();
  console.log(`Students: ${students.count}`);
  
  // Get company count
  const companies = db.prepare(`SELECT COUNT(DISTINCT company_name) as count FROM internships WHERE is_active = 1 AND verification_status = 'VERIFIED'`).get();
  console.log(`Companies: ${companies.count}`);
  
  // Get active internships count
  const internships = db.prepare(`SELECT COUNT(*) as count FROM internships WHERE is_active = 1`).get();
  console.log(`Active Internships: ${internships.count}`);
  
  // Get placement count (applications with offer or completed status)
  const placements = db.prepare(`
    SELECT COUNT(*) as count 
    FROM applications 
    WHERE status IN ('OFFERED', 'OFFER_ACCEPTED', 'COMPLETED')
  `).get();
  console.log(`Placements: ${placements.count}`);
  
  db.close();
  
  console.log('\n✅ Statistics check completed!');
  
} catch (error) {
  console.error('❌ Error checking statistics:', error.message);
  process.exit(1);
}