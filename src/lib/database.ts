import Database from 'better-sqlite3';
import { join } from 'path';
import { getMemoryDatabase } from './memory-database';

// Database instance
let db: Database.Database;

// Check if we're in Vercel production environment
const isVercelProduction = process.env.VERCEL === '1';
const isProduction = process.env.NODE_ENV === 'production';

export function getDatabase() {
  // Use memory database for Vercel production or when ENABLE_MEMORY_DB is set
  if (isVercelProduction || process.env.ENABLE_MEMORY_DB === 'true' || process.env.DATABASE_URL === 'memory://') {
    console.log('Using memory database for serverless environment');
    return null; // Memory database will be handled in getDbQueries
  }
  
  if (!db) {
    let dbPath: string;
    
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('sqlite:')) {
      dbPath = process.env.DATABASE_URL.replace('sqlite:', '');
    } else {
      dbPath = isProduction 
        ? '/tmp/internship.db' 
        : join(process.cwd(), 'internship.db');
    }
    
    try {
      db = new Database(dbPath);
      db.pragma('journal_mode = WAL');
      db.pragma('synchronous = NORMAL');
      db.pragma('cache_size = 1000000');
      db.pragma('foreign_keys = ON');
      initializeDatabase();
    } catch (error) {
      console.error('Failed to initialize SQLite database:', error);
      console.error('Database path:', dbPath);
      return null;
    }
  }
  return db;
}

function initializeDatabase() {
  // Create users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('STUDENT', 'STAFF', 'MENTOR', 'EMPLOYER')),
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      department TEXT,
      current_semester INTEGER,
      skills TEXT, -- JSON array of skills
      resume TEXT, -- Base64 encoded or text content
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create internships table
  db.exec(`
    CREATE TABLE IF NOT EXISTS internships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      required_skills TEXT NOT NULL, -- JSON array
      eligible_departments TEXT NOT NULL, -- JSON array
      stipend_min INTEGER,
      stipend_max INTEGER,
      is_placement BOOLEAN DEFAULT 0,
      posted_by INTEGER NOT NULL,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (posted_by) REFERENCES users(id)
    )
  `);

  // Create applications table
  db.exec(`
    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      internship_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'APPLIED' CHECK (status IN ('APPLIED', 'MENTOR_APPROVED', 'MENTOR_REJECTED', 'INTERVIEWED', 'OFFERED', 'NOT_OFFERED', 'COMPLETED')),
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      mentor_approved_at DATETIME,
      mentor_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES users(id),
      FOREIGN KEY (internship_id) REFERENCES internships(id),
      FOREIGN KEY (mentor_id) REFERENCES users(id),
      UNIQUE(student_id, internship_id)
    )
  `);

  // Create feedback table
  db.exec(`
    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER NOT NULL,
      supervisor_id INTEGER NOT NULL,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      comments TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (application_id) REFERENCES applications(id),
      FOREIGN KEY (supervisor_id) REFERENCES users(id)
    )
  `);

  // Create indexes for better performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_users_department ON users(department);
    CREATE INDEX IF NOT EXISTS idx_applications_student ON applications(student_id);
    CREATE INDEX IF NOT EXISTS idx_applications_internship ON applications(internship_id);
    CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
    CREATE INDEX IF NOT EXISTS idx_internships_active ON internships(is_active);
    CREATE INDEX IF NOT EXISTS idx_feedback_application ON feedback(application_id);
  `);
}

// Database query helpers
export function getDbQueries() {
  // Use memory database for Vercel production or when configured
  if (isVercelProduction || process.env.ENABLE_MEMORY_DB === 'true' || process.env.DATABASE_URL === 'memory://') {
    console.log('Initializing memory database for serverless environment');
    return getMemoryDatabase();
  }
  
  const db = getDatabase();
  if (!db) {
    console.error('Database not available, falling back to memory database');
    return getMemoryDatabase();
  }
  
  try {
    return {
      // User queries
      createUser: db.prepare(`
        INSERT INTO users (username, password_hash, role, name, email, department, current_semester, skills, resume)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `),
      
      getUserByUsername: db.prepare(`
        SELECT * FROM users WHERE username = ?
      `),
      
      getUserById: db.prepare(`
        SELECT * FROM users WHERE id = ?
      `),
      
      updateUser: db.prepare(`
        UPDATE users 
        SET name = ?, email = ?, department = ?, current_semester = ?, skills = ?, resume = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `),

      // Internship queries
      createInternship: db.prepare(`
        INSERT INTO internships (title, description, required_skills, eligible_departments, stipend_min, stipend_max, is_placement, posted_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `),
      
      getActiveInternships: db.prepare(`
        SELECT i.*, u.name as posted_by_name 
        FROM internships i 
        JOIN users u ON i.posted_by = u.id 
        WHERE i.is_active = 1 
        ORDER BY i.created_at DESC
      `),
      
      getInternshipById: db.prepare(`
        SELECT i.*, u.name as posted_by_name 
        FROM internships i 
        JOIN users u ON i.posted_by = u.id 
        WHERE i.id = ?
      `),

      // Application queries
      createApplication: db.prepare(`
        INSERT INTO applications (student_id, internship_id)
        VALUES (?, ?)
      `),
      
      getApplicationsByStudent: db.prepare(`
        SELECT a.*, i.title as internship_title, i.description as internship_description
        FROM applications a
        JOIN internships i ON a.internship_id = i.id
        WHERE a.student_id = ?
        ORDER BY a.created_at DESC
      `),
      
      getApplicationsForMentor: db.prepare(`
        SELECT a.*, i.title as internship_title, u.name as student_name, u.department as student_department
        FROM applications a
        JOIN internships i ON a.internship_id = i.id
        JOIN users u ON a.student_id = u.id
        WHERE u.department IN (SELECT department FROM users WHERE id = ? AND role = 'MENTOR')
        AND a.status = 'APPLIED'
        ORDER BY a.created_at DESC
      `),
      
      getAllApplications: db.prepare(`
        SELECT a.*, i.title as internship_title, u.name as student_name, u.department as student_department,
               m.name as mentor_name
        FROM applications a
        JOIN internships i ON a.internship_id = i.id
        JOIN users u ON a.student_id = u.id
        LEFT JOIN users m ON a.mentor_id = m.id
        ORDER BY a.created_at DESC
      `),
      
      getApplicationsByInternship: db.prepare(`
        SELECT a.*, u.name as student_name, u.department as student_department, u.email as student_email,
               u.skills as student_skills, u.resume as student_resume
        FROM applications a
        JOIN users u ON a.student_id = u.id
        WHERE a.internship_id = ?
        ORDER BY a.created_at DESC
      `),
      
      updateApplicationStatus: db.prepare(`
        UPDATE applications 
        SET status = ?, mentor_id = ?, mentor_approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `),

      // Feedback queries
      createFeedback: db.prepare(`
        INSERT INTO feedback (application_id, supervisor_id, rating, comments)
        VALUES (?, ?, ?, ?)
      `),
      
      getFeedbackByApplication: db.prepare(`
        SELECT f.*, u.name as supervisor_name
        FROM feedback f
        JOIN users u ON f.supervisor_id = u.id
        WHERE f.application_id = ?
      `),
      
      getAllFeedback: db.prepare(`
        SELECT f.*, u.name as supervisor_name, a.student_id, s.name as student_name,
               i.title as internship_title
        FROM feedback f
        JOIN users u ON f.supervisor_id = u.id
        JOIN applications a ON f.application_id = a.id
        JOIN users s ON a.student_id = s.id
        JOIN internships i ON a.internship_id = i.id
        ORDER BY f.created_at DESC
      `),

      // Analytics queries
      getUnplacedStudentsCount: db.prepare(`
        SELECT COUNT(*) as count
        FROM users u
        WHERE u.role = 'STUDENT'
        AND u.id NOT IN (
          SELECT DISTINCT a.student_id 
          FROM applications a 
          WHERE a.status IN ('OFFERED', 'COMPLETED')
        )
      `),
      
      getApplicationStatusBreakdown: db.prepare(`
        SELECT status, COUNT(*) as count
        FROM applications
        GROUP BY status
      `),
      
      getOpenPositionsCount: db.prepare(`
        SELECT COUNT(*) as count
        FROM internships
        WHERE is_active = 1
      `),
      
      getAverageFeedbackRating: db.prepare(`
        SELECT AVG(rating) as average_rating, COUNT(*) as total_feedback
        FROM feedback
      `),
      
      getRecentApplications: db.prepare(`
        SELECT a.*, i.title as internship_title, u.name as student_name, u.department as student_department
        FROM applications a
        JOIN internships i ON a.internship_id = i.id
        JOIN users u ON a.student_id = u.id
        ORDER BY a.created_at DESC
        LIMIT ?
      `),
      
      getTopInternships: db.prepare(`
        SELECT i.*, u.name as posted_by_name, COUNT(a.id) as application_count
        FROM internships i
        JOIN users u ON i.posted_by = u.id
        LEFT JOIN applications a ON i.id = a.internship_id
        WHERE i.is_active = 1
        GROUP BY i.id
        ORDER BY application_count DESC, i.created_at DESC
        LIMIT ?
      `)
    };
  } catch (error) {
    console.error('Error initializing database queries:', error);
    return getMemoryDatabase();
  }
}

export default getDatabase;