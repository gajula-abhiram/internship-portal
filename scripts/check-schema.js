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
  
  // Get all tables
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('Existing tables:');
  tables.forEach(table => {
    console.log(`  - ${table.name}`);
  });
  
  // Check if chat tables exist
  const chatTables = ['chat_rooms', 'chat_messages'];
  console.log('\nChat tables status:');
  chatTables.forEach(table => {
    const exists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(table);
    console.log(`  - ${table}: ${exists ? 'EXISTS' : 'MISSING'}`);
  });
  
} catch (error) {
  console.error('Error:', error.message);
}