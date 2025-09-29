import Database from 'better-sqlite3';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getDatabase() {
  const dbPath = process.env.NODE_ENV === 'production' 
    ? '/tmp/internship.db' 
    : join(process.cwd(), 'internship.db');
  
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  return db;
}

try {
  const db = getDatabase();
  
  console.log('Testing database operations...');
  
  // Check current counts
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const internshipCount = db.prepare('SELECT COUNT(*) as count FROM internships').get().count;
  const applicationCount = db.prepare('SELECT COUNT(*) as count FROM applications').get().count;
  
  console.log(`Current counts - Users: ${userCount}, Internships: ${internshipCount}, Applications: ${applicationCount}`);
  
  // Try to insert a simple application
  const student = db.prepare('SELECT id FROM users WHERE role = ? LIMIT 1').get('STUDENT');
  const internship = db.prepare('SELECT id FROM internships LIMIT 1').get();
  
  console.log('Sample student:', student);
  console.log('Sample internship:', internship);
  
  if (student && internship) {
    const result = db.prepare(`
      INSERT INTO applications (student_id, internship_id, status)
      VALUES (?, ?, ?)
    `).run(student.id, internship.id, 'APPLIED');
    
    console.log('Successfully inserted application with ID:', result.lastInsertRowid);
    
    // Check the new count
    const newApplicationCount = db.prepare('SELECT COUNT(*) as count FROM applications').get().count;
    console.log(`New applications count: ${newApplicationCount}`);
  } else {
    console.log('Could not find student or internship for testing');
  }
} catch (error) {
  console.error('Error testing database:', error);
}