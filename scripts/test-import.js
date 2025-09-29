import Database from 'better-sqlite3';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Test script running...');

function getDatabase() {
  const dbPath = join(process.cwd(), 'internship.db');
  console.log('Database path:', dbPath);
  
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  return db;
}

try {
  const db = getDatabase();
  console.log('Database connection successful');
  
  // Test a simple query
  const result = db.prepare('SELECT COUNT(*) as count FROM users').get();
  console.log('User count:', result.count);
  
} catch (error) {
  console.error('Error:', error.message);
}

console.log('Test script completed');