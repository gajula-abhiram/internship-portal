const Database = require('better-sqlite3');
const db = new Database('internship.db');

console.log('Checking current database statistics...');

try {
  // Get student count
  const studentCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('STUDENT').count;
  console.log('Student count:', studentCount);
  
  // Get company count
  const companyCount = db.prepare('SELECT COUNT(DISTINCT company_name) as count FROM internships WHERE is_active = 1 AND verification_status = ?').get('VERIFIED').count;
  console.log('Company count:', companyCount);
  
  // Get active internships
  const activeInternships = db.prepare('SELECT COUNT(*) as count FROM internships WHERE is_active = 1').get().count;
  console.log('Active internships:', activeInternships);
  
  // Check if company_name column exists
  const columns = db.prepare("PRAGMA table_info(internships)").all();
  console.log('Internships table columns:', columns.map(c => c.name));
  
} catch (error) {
  console.error('Error checking statistics:', error.message);
}

db.close();