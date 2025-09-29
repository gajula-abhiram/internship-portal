import Database from 'better-sqlite3';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getDatabase() {
  const dbPath = join(process.cwd(), 'internship.db');
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  return db;
}

try {
  const db = getDatabase();
  
  // Check users table structure
  const userColumns = db.prepare("PRAGMA table_info(users)").all();
  console.log('Users table columns:');
  userColumns.forEach(col => {
    console.log(`  - ${col.name} (${col.type}) ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
  });
  
  // Check if placement_status column exists
  const hasPlacementStatus = userColumns.some(col => col.name === 'placement_status');
  console.log(`\nHas placement_status column: ${hasPlacementStatus}`);
  
  // Check internships table structure
  const internshipColumns = db.prepare("PRAGMA table_info(internships)").all();
  console.log('\nInternships table columns:');
  internshipColumns.forEach(col => {
    console.log(`  - ${col.name} (${col.type}) ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
  });
  
  // Check applications table structure
  const applicationColumns = db.prepare("PRAGMA table_info(applications)").all();
  console.log('\nApplications table columns:');
  applicationColumns.forEach(col => {
    console.log(`  - ${col.name} (${col.type}) ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
  });
  
} catch (error) {
  console.error('Error:', error.message);
}