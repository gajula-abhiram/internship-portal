import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import sqlite3 from 'better-sqlite3';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Database setup (copied from database.ts)
 */
function getDatabase() {
  const dbPath = process.env.NODE_ENV === 'production' 
    ? '/tmp/internship.db' 
    : join(process.cwd(), 'internship.db');
  
  const db = new sqlite3(dbPath);
  db.pragma('journal_mode = WAL');
  initializeDatabase(db);
  return db;
}

function initializeDatabase(db) {
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
      skills TEXT,
      resume TEXT,
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
      required_skills TEXT NOT NULL,
      eligible_departments TEXT NOT NULL,
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

  // Create indexes
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

/**
 * Auth utilities (copied from auth.ts)
 */
async function hashPassword(password) {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Seed script to populate the database with Rajasthan-specific sample data
 * Usage: node scripts/seed.js
 */

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    const db = getDatabase();

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    db.prepare('DELETE FROM feedback').run();
    db.prepare('DELETE FROM applications').run();
    db.prepare('DELETE FROM internships').run();
    db.prepare('DELETE FROM users').run();

    // Sample password hash - now meets strong password requirements
    const defaultPasswordHash = await hashPassword('Password123!');

    // Seed Users
    console.log('👥 Seeding users...');
    
    // Students - Expanded with more diverse backgrounds
    const students = [
      { username: 'amit.sharma', name: 'Amit Sharma', email: 'amit.sharma@rtu.ac.in', department: 'Computer Science', semester: 6 },
      { username: 'priya.singh', name: 'Priya Singh', email: 'priya.singh@rtu.ac.in', department: 'Information Technology', semester: 6 },
      { username: 'rajesh.kumar', name: 'Rajesh Kumar', email: 'rajesh.kumar@rtu.ac.in', department: 'Computer Science', semester: 7 },
      { username: 'neha.gupta', name: 'Neha Gupta', email: 'neha.gupta@jec.ac.in', department: 'Electronics & Communication', semester: 5 },
      { username: 'vivek.agarwal', name: 'Vivek Agarwal', email: 'vivek.agarwal@rtu.ac.in', department: 'Mechanical Engineering', semester: 6 },
      { username: 'pooja.jain', name: 'Pooja Jain', email: 'pooja.jain@jec.ac.in', department: 'Civil Engineering', semester: 7 },
      { username: 'rohit.meena', name: 'Rohit Meena', email: 'rohit.meena@rtu.ac.in', department: 'Electrical Engineering', semester: 5 },
      { username: 'kavya.sharma', name: 'Kavya Sharma', email: 'kavya.sharma@jec.ac.in', department: 'Computer Science', semester: 8 },
      { username: 'arjun.patel', name: 'Arjun Patel', email: 'arjun.patel@rtu.ac.in', department: 'Information Technology', semester: 6 },
      { username: 'ritu.choudhary', name: 'Ritu Choudhary', email: 'ritu.choudhary@jec.ac.in', department: 'Electronics & Communication', semester: 7 },
      
      // Additional students for better demonstration
      { username: 'aakash.gupta', name: 'Aakash Gupta', email: 'aakash.gupta@rtu.ac.in', department: 'Computer Science', semester: 6 },
      { username: 'shreya.mittal', name: 'Shreya Mittal', email: 'shreya.mittal@jec.ac.in', department: 'Information Technology', semester: 5 },
      { username: 'karan.singh', name: 'Karan Singh', email: 'karan.singh@rtu.ac.in', department: 'Mechanical Engineering', semester: 7 },
      { username: 'ananya.joshi', name: 'Ananya Joshi', email: 'ananya.joshi@jec.ac.in', department: 'Electronics & Communication', semester: 6 },
      { username: 'dev.agarwal', name: 'Dev Agarwal', email: 'dev.agarwal@rtu.ac.in', department: 'Civil Engineering', semester: 8 },
      { username: 'ishita.sharma', name: 'Ishita Sharma', email: 'ishita.sharma@jec.ac.in', department: 'Electrical Engineering', semester: 5 },
      { username: 'mohit.verma', name: 'Mohit Verma', email: 'mohit.verma@rtu.ac.in', department: 'Computer Science', semester: 7 },
      { username: 'tanya.gupta', name: 'Tanya Gupta', email: 'tanya.gupta@jec.ac.in', department: 'Information Technology', semester: 6 },
      { username: 'rahul.jain', name: 'Rahul Jain', email: 'rahul.jain@rtu.ac.in', department: 'Mechanical Engineering', semester: 5 },
      { username: 'nidhi.agarwal', name: 'Nidhi Agarwal', email: 'nidhi.agarwal@jec.ac.in', department: 'Electronics & Communication', semester: 8 },
      { username: 'varun.sharma', name: 'Varun Sharma', email: 'varun.sharma@rtu.ac.in', department: 'Civil Engineering', semester: 6 },
      { username: 'sakshi.singh', name: 'Sakshi Singh', email: 'sakshi.singh@jec.ac.in', department: 'Electrical Engineering', semester: 7 },
      { username: 'anirudh.gupta', name: 'Anirudh Gupta', email: 'anirudh.gupta@rtu.ac.in', department: 'Computer Science', semester: 5 },
      { username: 'divya.mittal', name: 'Divya Mittal', email: 'divya.mittal@jec.ac.in', department: 'Information Technology', semester: 6 },
      { username: 'harsh.agarwal', name: 'Harsh Agarwal', email: 'harsh.agarwal@rtu.ac.in', department: 'Mechanical Engineering', semester: 8 },
      
      // Additional students to increase the count
      { username: 'aditi.sharma', name: 'Aditi Sharma', email: 'aditi.sharma@rtu.ac.in', department: 'Computer Science', semester: 5 },
      { username: 'vikas.patel', name: 'Vikas Patel', email: 'vikas.patel@jec.ac.in', department: 'Information Technology', semester: 6 },
      { username: 'priyanka.gupta', name: 'Priyanka Gupta', email: 'priyanka.gupta@rtu.ac.in', department: 'Electronics & Communication', semester: 7 },
      { username: 'rahul.mishra', name: 'Rahul Mishra', email: 'rahul.mishra@jec.ac.in', department: 'Mechanical Engineering', semester: 4 },
      { username: 'anita.jain', name: 'Anita Jain', email: 'anita.jain@rtu.ac.in', department: 'Civil Engineering', semester: 6 },
      { username: 'sumit.verma', name: 'Sumit Verma', email: 'sumit.verma@jec.ac.in', department: 'Electrical Engineering', semester: 5 },
      { username: 'poonam.singh', name: 'Poonam Singh', email: 'poonam.singh@rtu.ac.in', department: 'Computer Science', semester: 7 },
      { username: 'akash.meena', name: 'Akash Meena', email: 'akash.meena@jec.ac.in', department: 'Information Technology', semester: 6 },
      { username: 'sunita.sharma', name: 'Sunita Sharma', email: 'sunita.sharma@rtu.ac.in', department: 'Electronics & Communication', semester: 8 },
      { username: 'deepak.jain', name: 'Deepak Jain', email: 'deepak.jain@jec.ac.in', department: 'Mechanical Engineering', semester: 5 },
      
      { username: 'anjali.gupta', name: 'Anjali Gupta', email: 'anjali.gupta@rtu.ac.in', department: 'Civil Engineering', semester: 7 },
      { username: 'manoj.singh', name: 'Manoj Singh', email: 'manoj.singh@jec.ac.in', department: 'Electrical Engineering', semester: 6 },
      { username: 'rekha.patel', name: 'Rekha Patel', email: 'rekha.patel@rtu.ac.in', department: 'Computer Science', semester: 5 },
      { username: 'suresh.mishra', name: 'Suresh Mishra', email: 'suresh.mishra@jec.ac.in', department: 'Information Technology', semester: 8 },
      { username: 'kavita.verma', name: 'Kavita Verma', email: 'kavita.verma@rtu.ac.in', department: 'Electronics & Communication', semester: 4 },
      { username: 'raj.kumar', name: 'Raj Kumar', email: 'raj.kumar@jec.ac.in', department: 'Mechanical Engineering', semester: 6 },
      { username: 'poonam.jain', name: 'Poonam Jain', email: 'poonam.jain@rtu.ac.in', department: 'Civil Engineering', semester: 7 },
      { username: 'vikash.sharma', name: 'Vikash Sharma', email: 'vikash.sharma@jec.ac.in', department: 'Electrical Engineering', semester: 5 },
      { username: 'radhika.singh', name: 'Radhika Singh', email: 'radhika.singh@rtu.ac.in', department: 'Computer Science', semester: 6 },
      { username: 'amit.patel', name: 'Amit Patel', email: 'amit.patel@jec.ac.in', department: 'Information Technology', semester: 7 },
      
      { username: 'neha.mishra', name: 'Neha Mishra', email: 'neha.mishra@rtu.ac.in', department: 'Electronics & Communication', semester: 5 },
      { username: 'ravi.verma', name: 'Ravi Verma', email: 'ravi.verma@jec.ac.in', department: 'Mechanical Engineering', semester: 8 },
      { username: 'poonam.mishra', name: 'Poonam Mishra', email: 'poonam.mishra@rtu.ac.in', department: 'Civil Engineering', semester: 6 },
      { username: 'sandeep.jain', name: 'Sandeep Jain', email: 'sandeep.jain@jec.ac.in', department: 'Electrical Engineering', semester: 4 },
      { username: 'anjali.singh', name: 'Anjali Singh', email: 'anjali.singh@rtu.ac.in', department: 'Computer Science', semester: 7 },
      { username: 'manish.gupta', name: 'Manish Gupta', email: 'manish.gupta@jec.ac.in', department: 'Information Technology', semester: 5 },
      { username: 'rekha.verma', name: 'Rekha Verma', email: 'rekha.verma@rtu.ac.in', department: 'Electronics & Communication', semester: 6 },
      { username: 'sunita.patel', name: 'Sunita Patel', email: 'sunita.patel@jec.ac.in', department: 'Mechanical Engineering', semester: 7 },
      { username: 'deepak.singh', name: 'Deepak Singh', email: 'deepak.singh@rtu.ac.in', department: 'Civil Engineering', semester: 5 },
      { username: 'poonam.verma', name: 'Poonam Verma', email: 'poonam.verma@jec.ac.in', department: 'Electrical Engineering', semester: 8 },
      
      { username: 'vikas.sharma', name: 'Vikas Sharma', email: 'vikas.sharma@rtu.ac.in', department: 'Computer Science', semester: 4 },
      { username: 'radhika.jain', name: 'Radhika Jain', email: 'radhika.jain@jec.ac.in', department: 'Information Technology', semester: 6 },
      { username: 'amit.mishra', name: 'Amit Mishra', email: 'amit.mishra@rtu.ac.in', department: 'Electronics & Communication', semester: 7 },
      { username: 'neha.verma', name: 'Neha Verma', email: 'neha.verma@jec.ac.in', department: 'Mechanical Engineering', semester: 5 },
      { username: 'ravi.patel', name: 'Ravi Patel', email: 'ravi.patel@rtu.ac.in', department: 'Civil Engineering', semester: 6 },
      { username: 'poonam.sharma', name: 'Poonam Sharma', email: 'poonam.sharma@jec.ac.in', department: 'Electrical Engineering', semester: 7 },
      { username: 'sandeep.singh', name: 'Sandeep Singh', email: 'sandeep.singh@rtu.ac.in', department: 'Computer Science', semester: 5 },
      { username: 'anjali.verma', name: 'Anjali Verma', email: 'anjali.verma@jec.ac.in', department: 'Information Technology', semester: 8 },
      { username: 'manish.jain', name: 'Manish Jain', email: 'manish.jain@rtu.ac.in', department: 'Electronics & Communication', semester: 4 },
      { username: 'rekha.sharma', name: 'Rekha Sharma', email: 'rekha.sharma@jec.ac.in', department: 'Mechanical Engineering', semester: 6 },
      
      { username: 'sunita.mishra', name: 'Sunita Mishra', email: 'sunita.mishra@rtu.ac.in', department: 'Civil Engineering', semester: 7 },
      { username: 'deepak.verma', name: 'Deepak Verma', email: 'deepak.verma@jec.ac.in', department: 'Electrical Engineering', semester: 5 },
      { username: 'vikash.jain', name: 'Vikash Jain', email: 'vikash.jain@rtu.ac.in', department: 'Computer Science', semester: 6 },
      { username: 'radhika.verma', name: 'Radhika Verma', email: 'radhika.verma@jec.ac.in', department: 'Information Technology', semester: 7 },
      { username: 'amit.sharma2', name: 'Amit Sharma', email: 'amit.sharma2@rtu.ac.in', department: 'Electronics & Communication', semester: 5 },
      { username: 'neha.patel', name: 'Neha Patel', email: 'neha.patel@rtu.ac.in', department: 'Mechanical Engineering', semester: 8 },
      { username: 'ravi.sharma', name: 'Ravi Sharma', email: 'ravi.sharma@jec.ac.in', department: 'Civil Engineering', semester: 4 },
      { username: 'poonam.mishra2', name: 'Poonam Mishra', email: 'poonam.mishra2@rtu.ac.in', department: 'Electrical Engineering', semester: 6 },
      { username: 'sandeep.verma', name: 'Sandeep Verma', email: 'sandeep.verma@jec.ac.in', department: 'Computer Science', semester: 7 },
      { username: 'anjali.patel', name: 'Anjali Patel', email: 'anjali.patel@rtu.ac.in', department: 'Information Technology', semester: 5 }
    ];

    // Staff members
    const staff = [
      { username: 'rajesh.staff', name: 'Dr. Rajesh Gupta', email: 'rajesh.gupta@rtu.ac.in', department: 'Computer Science' },
      { username: 'sunita.staff', name: 'Prof. Sunita Agrawal', email: 'sunita.agrawal@jec.ac.in', department: 'Information Technology' },
      { username: 'vinod.staff', name: 'Dr. Vinod Sharma', email: 'vinod.sharma@rtu.ac.in', department: 'Electronics & Communication' }
    ];

    // Faculty mentors
    const mentors = [
      { username: 'vikram.mentor', name: 'Dr. Vikram Singh', email: 'vikram.singh@rtu.ac.in', department: 'Computer Science' },
      { username: 'meera.mentor', name: 'Prof. Meera Joshi', email: 'meera.joshi@jec.ac.in', department: 'Information Technology' },
      { username: 'ashok.mentor', name: 'Dr. Ashok Verma', email: 'ashok.verma@rtu.ac.in', department: 'Electronics & Communication' },
      { username: 'kavita.mentor', name: 'Prof. Kavita Bishnoi', email: 'kavita.bishnoi@jec.ac.in', department: 'Mechanical Engineering' },
      { username: 'ramesh.mentor', name: 'Dr. Ramesh Chand', email: 'ramesh.chand@rtu.ac.in', department: 'Civil Engineering' }
    ];

    // Employers/Supervisors
    const employers = [
      { username: 'suresh.employer', name: 'Mr. Suresh Agarwal', email: 'suresh@jaipurit.com', department: null },
      { username: 'anita.employer', name: 'Ms. Anita Mathur', email: 'anita@kotamanufacturing.com', department: null },
      { username: 'deepak.employer', name: 'Mr. Deepak Jain', email: 'deepak@jodhpurtech.com', department: null },
      { username: 'ravi.employer', name: 'Mr. Ravi Khandelwal', email: 'ravi@udaipurindustries.com', department: null },
      { username: 'sneha.employer', name: 'Ms. Sneha Goel', email: 'sneha@ajmertech.com', department: null }
    ];

    // Insert students
    for (const student of students) {
      const skills = ['Java', 'Python', 'React', 'Node.js', 'SQL', 'JavaScript', 'C++', 'HTML/CSS'];
      const studentSkills = skills.slice(0, Math.floor(Math.random() * 4) + 2);
      
      db.prepare(`
        INSERT INTO users (username, password_hash, role, name, email, department, current_semester, skills, resume)
        VALUES (?, ?, 'STUDENT', ?, ?, ?, ?, ?, ?)
      `).run(
        student.username,
        defaultPasswordHash,
        student.name,
        student.email,
        student.department,
        student.semester,
        JSON.stringify(studentSkills),
        `Resume for ${student.name} - ${student.department} student with strong foundation in programming and engineering principles.`
      );
    }

    // Insert staff
    for (const staffMember of staff) {
      db.prepare(`
        INSERT INTO users (username, password_hash, role, name, email, department)
        VALUES (?, ?, 'STAFF', ?, ?, ?)
      `).run(
        staffMember.username,
        defaultPasswordHash,
        staffMember.name,
        staffMember.email,
        staffMember.department
      );
    }

    // Insert mentors
    for (const mentor of mentors) {
      db.prepare(`
        INSERT INTO users (username, password_hash, role, name, email, department)
        VALUES (?, ?, 'MENTOR', ?, ?, ?)
      `).run(
        mentor.username,
        defaultPasswordHash,
        mentor.name,
        mentor.email,
        mentor.department
      );
    }

    // Insert employers
    for (const employer of employers) {
      db.prepare(`
        INSERT INTO users (username, password_hash, role, name, email)
        VALUES (?, ?, 'EMPLOYER', ?, ?)
      `).run(
        employer.username,
        defaultPasswordHash,
        employer.name,
        employer.email
      );
    }

    console.log('✅ Users seeded successfully');

    // Get staff IDs for internship posting
    const staffIds = db.prepare('SELECT id FROM users WHERE role = ?').all('STAFF').map(u => u.id);

    // Seed Internships
    console.log('💼 Seeding internships...');
    
    const internships = [
      {
        title: 'Software Developer Internship',
        description: 'Full-stack development internship at Jaipur IT Solutions. Work on React and Node.js projects.',
        required_skills: ['Java', 'React', 'Node.js'],
        eligible_departments: ['Computer Science', 'Information Technology'],
        stipend_min: 8000,
        stipend_max: 12000,
        is_placement: false
      },
      {
        title: 'Frontend Developer Trainee',
        description: 'Frontend development position at Kota Software Ltd. Focus on modern web technologies.',
        required_skills: ['JavaScript', 'React', 'HTML/CSS'],
        eligible_departments: ['Computer Science', 'Information Technology'],
        stipend_min: 6000,
        stipend_max: 10000,
        is_placement: false
      },
      {
        title: 'Mechanical Design Engineer Intern',
        description: 'Manufacturing and design internship at Kota Industries. Work with CAD software, product design, and manufacturing processes. Learn lean manufacturing principles.',
        required_skills: ['AutoCAD', 'SolidWorks', 'Manufacturing', 'Design'],
        eligible_departments: ['Mechanical Engineering'],
        stipend_min: 8000,
        stipend_max: 12000,
        is_placement: false
      },
      {
        title: 'Electronics Design Intern',
        description: 'Circuit design and embedded systems internship at Alwar Electronics. Work on PCB design, microcontroller programming, and IoT projects.',
        required_skills: ['Circuit Design', 'Embedded Systems', 'C Programming', 'PCB Design'],
        eligible_departments: ['Electronics & Communication', 'Electrical Engineering'],
        stipend_min: 9000,
        stipend_max: 13000,
        is_placement: false
      },
      {
        title: 'Civil Engineering Project Intern',
        description: 'Infrastructure development internship at Udaipur Constructions. Site supervision, project planning, and structural analysis experience.',
        required_skills: ['AutoCAD', 'Project Management', 'Structural Analysis', 'Construction'],
        eligible_departments: ['Civil Engineering'],
        stipend_min: 7000,
        stipend_max: 11000,
        is_placement: false
      },
      {
        title: 'Power Systems Engineer Trainee',
        description: 'Electrical power systems internship at Bharatpur Power Corp. Learn about power generation, transmission, and distribution systems.',
        required_skills: ['Power Systems', 'MATLAB', 'Electrical Engineering', 'Control Systems'],
        eligible_departments: ['Electrical Engineering'],
        stipend_min: 8500,
        stipend_max: 12500,
        is_placement: false
      },
      {
        title: 'Network Infrastructure Intern',
        description: 'Network engineering internship at Jaipur Communications. Configure routers, switches, and firewalls. Learn enterprise networking.',
        required_skills: ['Networking', 'Cisco', 'Network Security', 'Linux'],
        eligible_departments: ['Electronics & Communication', 'Computer Science'],
        stipend_min: 9500,
        stipend_max: 14000,
        is_placement: false
      },
      
      // Placement Opportunities
      {
        title: 'Software Engineer - Full Time',
        description: 'Full-time software engineer position at Jaipur Tech Hub. Develop enterprise applications using modern technologies. Excellent growth opportunities.',
        required_skills: ['Java', 'Spring Boot', 'React', 'Microservices'],
        eligible_departments: ['Computer Science', 'Information Technology'],
        stipend_min: 20000,
        stipend_max: 35000,
        is_placement: true
      },
      {
        title: 'Product Manager Trainee',
        description: 'Product management role at Udaipur Innovations. Learn product strategy, user research, and agile methodologies. Leadership development program.',
        required_skills: ['Product Management', 'Analytics', 'Communication', 'Leadership'],
        eligible_departments: ['Computer Science', 'Information Technology', 'Mechanical Engineering'],
        stipend_min: 18000,
        stipend_max: 28000,
        is_placement: true
      },
      {
        title: 'Data Engineer Position',
        description: 'Data engineering role at Ajmer Analytics. Build data pipelines, work with big data technologies, and create analytics solutions.',
        required_skills: ['Python', 'SQL', 'Apache Spark', 'Data Engineering'],
        eligible_departments: ['Computer Science', 'Information Technology'],
        stipend_min: 22000,
        stipend_max: 32000,
        is_placement: true
      },
      {
        title: 'Cybersecurity Analyst',
        description: 'Information security role at Kota Security Solutions. Monitor security threats, conduct vulnerability assessments, and implement security measures.',
        required_skills: ['Cybersecurity', 'Network Security', 'Ethical Hacking', 'Risk Assessment'],
        eligible_departments: ['Computer Science', 'Information Technology', 'Electronics & Communication'],
        stipend_min: 19000,
        stipend_max: 30000,
        is_placement: true
      },
      {
        title: 'Design Engineer - Automotive',
        description: 'Automotive design engineer position at Bharatpur Automotive. Design vehicle components, perform simulations, and work on innovative automotive solutions.',
        required_skills: ['Automotive Design', 'CAD', 'ANSYS', 'Manufacturing'],
        eligible_departments: ['Mechanical Engineering'],
        stipend_min: 17000,
        stipend_max: 27000,
        is_placement: true
      },
      {
        title: 'Quality Assurance Engineer',
        description: 'QA engineering role at Tonk Manufacturing. Ensure product quality, implement testing procedures, and maintain quality standards.',
        required_skills: ['Quality Assurance', 'Testing', 'Six Sigma', 'Process Improvement'],
        eligible_departments: ['Mechanical Engineering', 'Electronics & Communication'],
        stipend_min: 16000,
        stipend_max: 24000,
        is_placement: true
      },
      {
        title: 'Research & Development Intern',
        description: 'R&D internship at Jodhpur Research Institute. Work on innovative projects, conduct experiments, and contribute to research publications.',
        required_skills: ['Research', 'Analysis', 'Innovation', 'Technical Writing'],
        eligible_departments: ['Computer Science', 'Electronics & Communication', 'Mechanical Engineering'],
        stipend_min: 10000,
        stipend_max: 15000,
        is_placement: false
      },
      
      // Additional Internship Opportunities
      {
        title: 'Mobile App Development Intern',
        description: 'Mobile development internship at Bikaner Software Solutions. Work on iOS and Android applications using React Native and Flutter.',
        required_skills: ['React Native', 'Flutter', 'Mobile Development', 'JavaScript'],
        eligible_departments: ['Computer Science', 'Information Technology'],
        stipend_min: 9000,
        stipend_max: 13500,
        is_placement: false
      },
      {
        title: 'Machine Learning Intern',
        description: 'AI/ML internship at Jaisalmer Analytics. Work on data science projects using Python, TensorFlow, and machine learning algorithms.',
        required_skills: ['Python', 'Machine Learning', 'TensorFlow', 'Data Science'],
        eligible_departments: ['Computer Science', 'Information Technology', 'Electronics & Communication'],
        stipend_min: 10000,
        stipend_max: 15000,
        is_placement: false
      },
      {
        title: 'Database Administrator Intern',
        description: 'Database management internship at Pushkar Data Systems. Learn database design, optimization, and administration using MySQL and PostgreSQL.',
        required_skills: ['SQL', 'Database Management', 'MySQL', 'PostgreSQL'],
        eligible_departments: ['Computer Science', 'Information Technology'],
        stipend_min: 8500,
        stipend_max: 12500,
        is_placement: false
      },
      {
        title: 'Renewable Energy Systems Intern',
        description: 'Green energy internship at Mount Abu Solar Solutions. Work on solar panel installations, energy optimization, and sustainable technologies.',
        required_skills: ['Renewable Energy', 'Solar Systems', 'Energy Management', 'Sustainability'],
        eligible_departments: ['Electrical Engineering', 'Mechanical Engineering'],
        stipend_min: 9500,
        stipend_max: 14000,
        is_placement: false
      },
      {
        title: 'Structural Engineering Intern',
        description: 'Construction and structural design internship at Chittorgarh Construction Corp. Learn building design, structural analysis, and construction management.',
        required_skills: ['Structural Design', 'AutoCAD', 'STAAD Pro', 'Construction Management'],
        eligible_departments: ['Civil Engineering'],
        stipend_min: 8000,
        stipend_max: 12000,
        is_placement: false
      },
      {
        title: 'Automation Engineering Intern',
        description: 'Industrial automation internship at Sikar Manufacturing. Work with PLCs, SCADA systems, and industrial control systems.',
        required_skills: ['PLC Programming', 'SCADA', 'Industrial Automation', 'Control Systems'],
        eligible_departments: ['Electrical Engineering', 'Electronics & Communication', 'Mechanical Engineering'],
        stipend_min: 9000,
        stipend_max: 13000,
        is_placement: false
      },
      {
        title: 'UI/UX Design Intern',
        description: 'Design internship at Beawar Creative Studios. Learn user interface design, user experience research, and design thinking methodologies.',
        required_skills: ['UI/UX Design', 'Figma', 'Adobe Creative Suite', 'Design Thinking'],
        eligible_departments: ['Computer Science', 'Information Technology'],
        stipend_min: 7500,
        stipend_max: 11500,
        is_placement: false
      },
      {
        title: 'DevOps Engineering Intern',
        description: 'DevOps and cloud computing internship at Sawai Madhopur Tech. Learn Docker, Kubernetes, AWS, and CI/CD pipelines.',
        required_skills: ['DevOps', 'Docker', 'Kubernetes', 'AWS', 'CI/CD'],
        eligible_departments: ['Computer Science', 'Information Technology'],
        stipend_min: 10500,
        stipend_max: 15500,
        is_placement: false
      },
      {
        title: 'Embedded Systems Intern',
        description: 'Hardware and firmware development internship at Pali Electronics. Work on microcontrollers, IoT devices, and embedded software.',
        required_skills: ['Embedded Systems', 'Microcontrollers', 'C Programming', 'IoT'],
        eligible_departments: ['Electronics & Communication', 'Electrical Engineering'],
        stipend_min: 9000,
        stipend_max: 13500,
        is_placement: false
      },
      
      // Additional Placement Opportunities
      {
        title: 'Cloud Solutions Architect',
        description: 'Senior cloud architect role at Nathdwara Cloud Services. Design and implement cloud infrastructure solutions for enterprise clients.',
        required_skills: ['Cloud Architecture', 'AWS', 'Azure', 'Solution Design'],
        eligible_departments: ['Computer Science', 'Information Technology'],
        stipend_min: 25000,
        stipend_max: 40000,
        is_placement: true
      },
      {
        title: 'Full Stack Developer',
        description: 'Full-time full stack developer at Jhalawar Web Solutions. Build end-to-end web applications using modern frameworks and technologies.',
        required_skills: ['Full Stack Development', 'React', 'Node.js', 'MongoDB', 'Express'],
        eligible_departments: ['Computer Science', 'Information Technology'],
        stipend_min: 22000,
        stipend_max: 35000,
        is_placement: true
      },
      {
        title: 'Mechanical Design Engineer',
        description: 'Product design engineer role at Banswara Engineering Works. Design mechanical components, perform simulations, and optimize manufacturing processes.',
        required_skills: ['Mechanical Design', 'SolidWorks', 'ANSYS', 'Product Development'],
        eligible_departments: ['Mechanical Engineering'],
        stipend_min: 20000,
        stipend_max: 30000,
        is_placement: true
      },
      {
        title: 'Network Security Engineer',
        description: 'Cybersecurity specialist role at Hanumangarh Security Systems. Implement security protocols, monitor threats, and ensure network safety.',
        required_skills: ['Network Security', 'Cybersecurity', 'Firewall Management', 'Ethical Hacking'],
        eligible_departments: ['Computer Science', 'Information Technology', 'Electronics & Communication'],
        stipend_min: 23000,
        stipend_max: 35000,
        is_placement: true
      },
      {
        title: 'Project Manager - IT',
        description: 'IT project management role at Dausa Technology Solutions. Lead software development projects, manage teams, and ensure timely delivery.',
        required_skills: ['Project Management', 'Agile', 'Team Leadership', 'Software Development'],
        eligible_departments: ['Computer Science', 'Information Technology'],
        stipend_min: 24000,
        stipend_max: 38000,
        is_placement: true
      },
      {
        title: 'Power Systems Engineer',
        description: 'Electrical power systems engineer at Jhunjhunu Power Corporation. Design power distribution systems and work on grid modernization projects.',
        required_skills: ['Power Systems', 'Grid Design', 'MATLAB', 'Power Electronics'],
        eligible_departments: ['Electrical Engineering'],
        stipend_min: 21000,
        stipend_max: 32000,
        is_placement: true
      },
      {
        title: 'Construction Project Manager',
        description: 'Senior construction manager role at Ganganagar Infrastructure. Oversee large-scale construction projects and manage project timelines.',
        required_skills: ['Construction Management', 'Project Planning', 'Team Leadership', 'Quality Control'],
        eligible_departments: ['Civil Engineering'],
        stipend_min: 19000,
        stipend_max: 29000,
        is_placement: true
      },
      {
        title: 'Business Analyst',
        description: 'Business analysis role at Sriganganagar Consultancy. Analyze business processes, gather requirements, and recommend solutions.',
        required_skills: ['Business Analysis', 'Requirements Gathering', 'Process Improvement', 'SQL'],
        eligible_departments: ['Computer Science', 'Information Technology', 'Mechanical Engineering'],
        stipend_min: 20000,
        stipend_max: 31000,
        is_placement: true
      },
      
      // Additional internships to increase the count
      {
        title: 'AI Research Intern',
        description: 'Artificial intelligence research internship at Jaipur AI Labs. Work on cutting-edge machine learning projects and neural network architectures.',
        required_skills: ['Python', 'TensorFlow', 'PyTorch', 'Machine Learning'],
        eligible_departments: ['Computer Science', 'Information Technology', 'Electronics & Communication'],
        stipend_min: 12000,
        stipend_max: 18000,
        is_placement: false
      },
      {
        title: 'Blockchain Developer',
        description: 'Blockchain development internship at Udaipur Blockchain Solutions. Build decentralized applications and smart contracts.',
        required_skills: ['Solidity', 'JavaScript', 'Web3', 'Ethereum'],
        eligible_departments: ['Computer Science', 'Information Technology'],
        stipend_min: 15000,
        stipend_max: 22000,
        is_placement: false
      },
      {
        title: 'Data Science Intern',
        description: 'Data science internship at Jodhpur Analytics. Analyze large datasets, build predictive models, and create data visualizations.',
        required_skills: ['Python', 'R', 'SQL', 'Data Visualization'],
        eligible_departments: ['Computer Science', 'Information Technology'],
        stipend_min: 13000,
        stipend_max: 19000,
        is_placement: false
      },
      {
        title: 'IoT Solutions Engineer',
        description: 'Internet of Things internship at Bikaner IoT Solutions. Design and implement IoT systems for smart cities and industrial automation.',
        required_skills: ['IoT', 'Embedded Systems', 'C++', 'Cloud Computing'],
        eligible_departments: ['Electronics & Communication', 'Electrical Engineering', 'Computer Science'],
        stipend_min: 11000,
        stipend_max: 17000,
        is_placement: false
      },
      {
        title: 'Cybersecurity Specialist',
        description: 'Cybersecurity internship at Ajmer Security Corp. Conduct penetration testing, vulnerability assessments, and security audits.',
        required_skills: ['Cybersecurity', 'Ethical Hacking', 'Network Security', 'Incident Response'],
        eligible_departments: ['Computer Science', 'Information Technology', 'Electronics & Communication'],
        stipend_min: 14000,
        stipend_max: 20000,
        is_placement: false
      },
      {
        title: 'Cloud Infrastructure Engineer',
        description: 'Cloud computing internship at Kota Cloud Services. Deploy and manage cloud infrastructure on AWS, Azure, and Google Cloud.',
        required_skills: ['AWS', 'Azure', 'Docker', 'Kubernetes'],
        eligible_departments: ['Computer Science', 'Information Technology'],
        stipend_min: 16000,
        stipend_max: 24000,
        is_placement: false
      },
      {
        title: 'Mobile App Developer',
        description: 'Mobile application development internship at Alwar Mobile Solutions. Build native and cross-platform mobile apps for iOS and Android.',
        required_skills: ['React Native', 'Flutter', 'iOS', 'Android'],
        eligible_departments: ['Computer Science', 'Information Technology'],
        stipend_min: 12000,
        stipend_max: 18000,
        is_placement: false
      },
      {
        title: 'Game Developer Intern',
        description: 'Game development internship at Udaipur Game Studios. Create 2D and 3D games using Unity and Unreal Engine.',
        required_skills: ['Unity', 'C#', 'Game Design', '3D Modeling'],
        eligible_departments: ['Computer Science', 'Information Technology'],
        stipend_min: 13000,
        stipend_max: 19000,
        is_placement: false
      },
      {
        title: 'Robotics Engineer',
        description: 'Robotics internship at Jaipur Robotics Lab. Design and program robots for industrial and research applications.',
        required_skills: ['Robotics', 'ROS', 'Python', 'Control Systems'],
        eligible_departments: ['Electronics & Communication', 'Mechanical Engineering', 'Electrical Engineering'],
        stipend_min: 14000,
        stipend_max: 21000,
        is_placement: false
      },
      {
        title: 'Renewable Energy Analyst',
        description: 'Renewable energy internship at Jaisalmer Green Energy. Analyze solar and wind energy systems for optimal performance.',
        required_skills: ['Renewable Energy', 'MATLAB', 'Energy Systems', 'Data Analysis'],
        eligible_departments: ['Electrical Engineering', 'Mechanical Engineering'],
        stipend_min: 12000,
        stipend_max: 18000,
        is_placement: false
      },
      {
        title: 'Software Quality Assurance',
        description: 'QA engineering internship at Bharatpur Software Testing. Develop test cases, automate testing, and ensure software quality.',
        required_skills: ['Testing', 'Selenium', 'Test Automation', 'Bug Tracking'],
        eligible_departments: ['Computer Science', 'Information Technology'],
        stipend_min: 11000,
        stipend_max: 16000,
        is_placement: false
      },
      {
        title: 'Network Administrator',
        description: 'Network administration internship at Hanumangarh Networks. Manage enterprise networks, configure routers and switches.',
        required_skills: ['Networking', 'Cisco', 'Network Security', 'Troubleshooting'],
        eligible_departments: ['Computer Science', 'Electronics & Communication'],
        stipend_min: 13000,
        stipend_max: 19000,
        is_placement: false
      },
      {
        title: 'Database Administrator',
        description: 'Database administration internship at Dausa Data Systems. Manage database performance, security, and backups.',
        required_skills: ['SQL', 'Oracle', 'MySQL', 'Database Security'],
        eligible_departments: ['Computer Science', 'Information Technology'],
        stipend_min: 14000,
        stipend_max: 20000,
        is_placement: false
      },
      {
        title: 'UI/UX Designer',
        description: 'User interface and experience design internship at Sriganganagar Design Studio. Create wireframes, prototypes, and user interfaces.',
        required_skills: ['UI/UX Design', 'Figma', 'Adobe XD', 'Prototyping'],
        eligible_departments: ['Computer Science', 'Information Technology'],
        stipend_min: 12000,
        stipend_max: 17000,
        is_placement: false
      },
      {
        title: 'DevOps Engineer',
        description: 'DevOps internship at Ganganagar Tech Solutions. Implement CI/CD pipelines, automate deployment, and manage cloud infrastructure.',
        required_skills: ['DevOps', 'Jenkins', 'Docker', 'Kubernetes'],
        eligible_departments: ['Computer Science', 'Information Technology'],
        stipend_min: 15000,
        stipend_max: 23000,
        is_placement: false
      },
      {
        title: 'Full Stack Developer',
        description: 'Full stack development internship at Sawai Madhopur Web Solutions. Build complete web applications using modern technologies.',
        required_skills: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
        eligible_departments: ['Computer Science', 'Information Technology'],
        stipend_min: 14000,
        stipend_max: 21000,
        is_placement: false
      },
      {
        title: 'Technical Writer',
        description: 'Technical documentation internship at Jhalawar Tech Docs. Create user manuals, API documentation, and technical guides.',
        required_skills: ['Technical Writing', 'Documentation', 'API', 'Markdown'],
        eligible_departments: ['Computer Science', 'Information Technology'],
        stipend_min: 10000,
        stipend_max: 15000,
        is_placement: false
      },
      {
        title: 'System Administrator',
        description: 'System administration internship at Nathdwara IT Services. Manage servers, troubleshoot issues, and maintain IT infrastructure.',
        required_skills: ['Linux', 'Windows Server', 'Troubleshooting', 'Scripting'],
        eligible_departments: ['Computer Science', 'Information Technology'],
        stipend_min: 13000,
        stipend_max: 19000,
        is_placement: false
      },
      {
        title: 'Digital Marketing Intern',
        description: 'Digital marketing internship at Pushkar Marketing Solutions. Manage social media, SEO, and online advertising campaigns.',
        required_skills: ['Digital Marketing', 'SEO', 'Social Media', 'Google Analytics'],
        eligible_departments: ['Computer Science', 'Information Technology'],
        stipend_min: 11000,
        stipend_max: 16000,
        is_placement: false
      },
      {
        title: 'Business Intelligence Analyst',
        description: 'Business intelligence internship at Mount Abu Analytics. Create dashboards, analyze business data, and generate insights.',
        required_skills: ['Business Intelligence', 'Tableau', 'Power BI', 'Data Analysis'],
        eligible_departments: ['Computer Science', 'Information Technology'],
        stipend_min: 15000,
        stipend_max: 22000,
        is_placement: false
      }
    ];

    for (const internship of internships) {
      const randomStaffId = staffIds[Math.floor(Math.random() * staffIds.length)];
      
      db.prepare(`
        INSERT INTO internships (title, description, required_skills, eligible_departments, stipend_min, stipend_max, is_placement, posted_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        internship.title,
        internship.description,
        JSON.stringify(internship.required_skills),
        JSON.stringify(internship.eligible_departments),
        internship.stipend_min,
        internship.stipend_max,
        internship.is_placement ? 1 : 0,
        randomStaffId
      );
    }

    console.log('✅ Internships seeded successfully');

    // Get user and internship IDs for applications
    const studentIds = db.prepare('SELECT id FROM users WHERE role = ?').all('STUDENT').map(u => u.id);
    const internshipIds = db.prepare('SELECT id FROM internships').all().map(i => i.id);
    const mentorIds = db.prepare('SELECT id FROM users WHERE role = ?').all('MENTOR').map(u => u.id);

    // Seed Applications - More realistic data
    console.log('📋 Seeding applications...');
    
    const statuses = ['APPLIED', 'MENTOR_APPROVED', 'MENTOR_REJECTED', 'INTERVIEWED', 'OFFERED', 'NOT_OFFERED', 'COMPLETED'];
    
    // Create 300+ applications for better demonstration with more students and internships
    for (let i = 0; i < 300; i++) {
      const randomStudentId = studentIds[Math.floor(Math.random() * studentIds.length)];
      const randomInternshipId = internshipIds[Math.floor(Math.random() * internshipIds.length)];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      const randomMentorId = mentorIds[Math.floor(Math.random() * mentorIds.length)];

      // Check if application already exists
      const existing = db.prepare('SELECT id FROM applications WHERE student_id = ? AND internship_id = ?').get(randomStudentId, randomInternshipId);
      
      if (!existing) {
        db.prepare(`
          INSERT INTO applications (student_id, internship_id, status, mentor_id)
          VALUES (?, ?, ?, ?)
        `).run(
          randomStudentId,
          randomInternshipId,
          randomStatus,
          randomStatus !== 'APPLIED' ? randomMentorId : null
        );
      }
    }

    console.log('✅ Applications seeded successfully');

    // Get application IDs for feedback
    const applicationIds = db.prepare('SELECT id FROM applications WHERE status IN (?, ?)').all('OFFERED', 'COMPLETED').map(a => a.id);
    const employerIds = db.prepare('SELECT id FROM users WHERE role = ?').all('EMPLOYER').map(u => u.id);

    // Seed Feedback with more variety
    console.log('⭐ Seeding feedback...');
    
    const feedbackComments = [
      'Excellent performance during the internship. Very dedicated and hardworking student with strong technical skills.',
      'Good technical skills and quick learner. Completed all assigned tasks on time and showed great enthusiasm.',
      'Outstanding contribution to the project. Highly recommended for future opportunities. Exceptional problem-solving abilities.',
      'Satisfactory performance with room for improvement in communication skills. Shows potential for growth.',
      'Exceptional problem-solving abilities and great team player. Contributed significantly to team success.',
      'Demonstrates strong analytical thinking and attention to detail. Reliable and professional throughout.',
      'Creative approach to problem-solving. Brought fresh ideas to the team and executed them well.',
      'Consistent performer with good work ethic. Followed instructions well and delivered quality work.',
      'Shows leadership potential and ability to work independently. Exceeded expectations in most areas.',
      'Technical competency is strong, with room for improvement in presentation skills. Overall positive experience.'
    ];

    // Create feedback for more applications
    for (let i = 0; i < Math.min(100, applicationIds.length); i++) {
      const randomEmployerId = employerIds[Math.floor(Math.random() * employerIds.length)];
      const randomRating = Math.floor(Math.random() * 5) + 1;
      const randomComment = feedbackComments[Math.floor(Math.random() * feedbackComments.length)];

      db.prepare(`
        INSERT INTO feedback (application_id, supervisor_id, rating, comments)
        VALUES (?, ?, ?, ?)
      `).run(
        applicationIds[i],
        randomEmployerId,
        randomRating,
        randomComment
      );

      // Mark application as completed
      db.prepare('UPDATE applications SET status = ? WHERE id = ?').run('COMPLETED', applicationIds[i]);
    }

    console.log('✅ Feedback seeded successfully');
    console.log('🎉 Database seeding completed!');
    
    // Print summary
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const internshipCount = db.prepare('SELECT COUNT(*) as count FROM internships').get().count;
    const applicationCount = db.prepare('SELECT COUNT(*) as count FROM applications').get().count;
    const feedbackCount = db.prepare('SELECT COUNT(*) as count FROM feedback').get().count;

    console.log('\n📊 Seeding Summary:');
    console.log(`👥 Users: ${userCount}`);
    console.log(`💼 Internships: ${internshipCount}`);
    console.log(`📋 Applications: ${applicationCount}`);
    console.log(`⭐ Feedback: ${feedbackCount}`);

    console.log('\n🔑 Sample Login Credentials:');
    console.log('Student: amit.sharma / Password123!');
    console.log('Staff: rajesh.staff / Password123!');
    console.log('Mentor: vikram.mentor / Password123!');
    console.log('Employer: suresh.employer / Password123!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Force execution
seedDatabase().catch(console.error);