import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Database setup
 */
function getDatabase() {
  const dbPath = process.env.NODE_ENV === 'production' 
    ? '/tmp/internship.db' 
    : join(process.cwd(), 'internship.db');
  
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  return db;
}

/**
 * Initialize database with full schema
 */
function initializeDatabase() {
  const db = getDatabase();
  
  // Read the full schema
  const schemaPath = join(__dirname, '../database/schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  
  // Execute the schema to create all tables
  db.exec(schema);
  
  console.log('✅ Database schema initialized');
  return db;
}

/**
 * Auth utilities
 */
async function hashPassword(password) {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Import script to populate the database with synthetic dataset
 * Usage: node scripts/init-and-import.js
 */

async function importSyntheticData() {
  try {
    console.log('🌱 Starting import of synthetic dataset...');
    
    // Initialize database with full schema first
    const db = initializeDatabase();

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    db.prepare('DELETE FROM chat_messages').run();
    db.prepare('DELETE FROM chat_rooms').run();
    db.prepare('DELETE FROM interview_schedules').run();
    db.prepare('DELETE FROM mentor_approval_requests').run();
    db.prepare('DELETE FROM offer_tracking_steps').run();
    db.prepare('DELETE FROM placement_offers').run();
    db.prepare('DELETE FROM analytics_events').run();
    db.prepare('DELETE FROM placement_stats').run();
    db.prepare('DELETE FROM application_tracking').run();
    db.prepare('DELETE FROM calendar_events').run();
    db.prepare('DELETE FROM certificates').run();
    db.prepare('DELETE FROM user_badges').run();
    db.prepare('DELETE FROM badges').run();
    db.prepare('DELETE FROM feedback').run();
    db.prepare('DELETE FROM applications').run();
    db.prepare('DELETE FROM internships').run();
    db.prepare('DELETE FROM users').run();

    // Sample password hash - now meets strong password requirements
    const defaultPasswordHash = await hashPassword('Password123!');

    // Import users from CSV files
    console.log('👥 Importing users...');
    
    // Import students
    const studentsData = fs.readFileSync(join(__dirname, '../internship_portal_synthetic_dataset/dataset/students.csv'), 'utf8');
    const studentLines = studentsData.split('\n').slice(1); // Skip header
    const students = [];
    
    for (const line of studentLines) {
      if (line.trim() === '') continue;
      const [student_id, name, email, phone, college, department, year, semester, cgpa, city, state, mentor_id, resume_url, preferences] = line.split(',');
      students.push({
        id: parseInt(student_id),
        name,
        email,
        phone,
        department,
        year: parseInt(year),
        semester: parseInt(semester),
        cgpa: parseFloat(cgpa),
        mentor_id: mentor_id ? parseInt(mentor_id) : null,
        resume_url,
        preferences
      });
    }
    
    // Import mentors
    const mentorsData = fs.readFileSync(join(__dirname, '../internship_portal_synthetic_dataset/dataset/mentors.csv'), 'utf8');
    const mentorLines = mentorsData.split('\n').slice(1); // Skip header
    const mentors = [];
    
    for (const line of mentorLines) {
      if (line.trim() === '') continue;
      const [mentor_id, name, email, department, role, office] = line.split(',');
      mentors.push({
        id: parseInt(mentor_id),
        name,
        email,
        department,
        role,
        office
      });
    }
    
    // Import employers
    const employersData = fs.readFileSync(join(__dirname, '../internship_portal_synthetic_dataset/dataset/employers.csv'), 'utf8');
    const employerLines = employersData.split('\n').slice(1); // Skip header
    const employers = [];
    
    for (const line of employerLines) {
      if (line.trim() === '') continue;
      const [employer_id, org_name] = line.split(',');
      employers.push({
        id: parseInt(employer_id),
        org_name
      });
    }
    
    // Insert students
    console.log(`Inserting ${students.length} students...`);
    for (const student of students) {
      try {
        db.prepare(`
          INSERT INTO users (username, password_hash, role, name, email, department, current_semester, cgpa, phone)
          VALUES (?, ?, 'STUDENT', ?, ?, ?, ?, ?, ?)
        `).run(
          `student_${student.id}`,
          defaultPasswordHash,
          student.name,
          student.email,
          student.department,
          student.semester,
          student.cgpa,
          student.phone
        );
      } catch (error) {
        console.error(`Error inserting student ${student.name}:`, error.message);
      }
    }
    
    // Insert mentors
    console.log(`Inserting ${mentors.length} mentors...`);
    for (const mentor of mentors) {
      try {
        db.prepare(`
          INSERT INTO users (username, password_hash, role, name, email, department)
          VALUES (?, ?, 'MENTOR', ?, ?, ?)
        `).run(
          `mentor_${mentor.id}`,
          defaultPasswordHash,
          mentor.name,
          mentor.email,
          mentor.department
        );
      } catch (error) {
        console.error(`Error inserting mentor ${mentor.name}:`, error.message);
      }
    }
    
    // Insert employers
    console.log(`Inserting ${employers.length} employers...`);
    for (const employer of employers) {
      try {
        db.prepare(`
          INSERT INTO users (username, password_hash, role, name, email)
          VALUES (?, ?, 'EMPLOYER', ?, ?)
        `).run(
          `employer_${employer.id}`,
          defaultPasswordHash,
          employer.org_name,
          `${employer.org_name.toLowerCase().replace(/\s+/g, '')}@company.com`
        );
      } catch (error) {
        console.error(`Error inserting employer ${employer.org_name}:`, error.message);
      }
    }
    
    // Insert a staff user
    try {
      db.prepare(`
        INSERT INTO users (username, password_hash, role, name, email, department)
        VALUES (?, ?, 'STAFF', ?, ?, ?)
      `).run(
        'admin',
        defaultPasswordHash,
        'Admin User',
        'admin@portal.com',
        'Administration'
      );
    } catch (error) {
      console.error('Error inserting admin user:', error.message);
    }
    
    console.log('✅ Users imported successfully');

    // Import internships
    console.log('💼 Importing internships...');
    const internshipsData = fs.readFileSync(join(__dirname, '../internship_portal_synthetic_dataset/dataset/internships.csv'), 'utf8');
    const internshipLines = internshipsData.split('\n').slice(1); // Skip header
    const internships = [];
    
    for (const line of internshipLines) {
      if (line.trim() === '') continue;
      const parts = line.split(',');
      const [
        internship_id, employer_id, org_name, title, department, competencies, stipend_inr,
        duration_weeks, mode, location, application_deadline, seats, verified, ppo_probability,
        min_cgpa, min_year, created_at, description
      ] = parts;
      
      internships.push({
        id: parseInt(internship_id),
        employer_id: parseInt(employer_id),
        org_name,
        title,
        department,
        competencies,
        stipend_inr: parseInt(stipend_inr),
        duration_weeks: parseInt(duration_weeks),
        mode,
        location,
        application_deadline,
        seats: parseInt(seats),
        verified: verified === 'True',
        ppo_probability: parseFloat(ppo_probability),
        min_cgpa: parseFloat(min_cgpa),
        min_year: parseInt(min_year),
        created_at,
        description
      });
    }
    
    // Get staff IDs for internship posting
    const staffIds = db.prepare('SELECT id FROM users WHERE role = ?').all('STAFF').map(u => u.id);
    const employerUserIds = db.prepare('SELECT id FROM users WHERE role = ?').all('EMPLOYER').map(u => u.id);
    
    // Insert internships
    console.log(`Inserting ${internships.length} internships...`);
    for (const internship of internships) {
      try {
        const randomStaffId = staffIds.length > 0 ? staffIds[Math.floor(Math.random() * staffIds.length)] : 1;
        
        db.prepare(`
          INSERT INTO internships (
            title, description, required_skills, eligible_departments, stipend_min, stipend_max, 
            is_placement, company_name, location, duration_weeks, application_deadline, 
            placement_conversion_potential, posted_by, is_active
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          internship.title,
          internship.description,
          JSON.stringify(internship.competencies ? internship.competencies.split(';').map(s => s.trim()) : []),
          JSON.stringify([internship.department]),
          internship.stipend_inr,
          internship.stipend_inr,
          0, // is_placement = false for internships
          internship.org_name,
          internship.location,
          internship.duration_weeks,
          internship.application_deadline,
          internship.ppo_probability > 0.5 ? 'HIGH' : (internship.ppo_probability > 0.2 ? 'MEDIUM' : 'LOW'),
          randomStaffId,
          1 // is_active
        );
      } catch (error) {
        console.error(`Error inserting internship ${internship.title}:`, error.message);
      }
    }
    
    console.log('✅ Internships imported successfully');

    // Import applications
    console.log('📋 Importing applications...');
    const applicationsData = fs.readFileSync(join(__dirname, '../internship_portal_synthetic_dataset/dataset/applications.csv'), 'utf8');
    const applicationLines = applicationsData.split('\n').slice(1); // Skip header
    const applications = [];
    
    for (const line of applicationLines) {
      if (line.trim() === '') continue;
      const [
        application_id, student_id, internship_id, status, applied_at, last_updated, 
        mentor_id, mentor_approval, approval_timestamp, remarks
      ] = line.split(',');
      
      applications.push({
        id: parseInt(application_id),
        student_id: parseInt(student_id),
        internship_id: parseInt(internship_id),
        status,
        applied_at,
        last_updated,
        mentor_id: mentor_id ? parseInt(mentor_id) : null,
        mentor_approval,
        approval_timestamp,
        remarks
      });
    }
    
    // Get user and internship IDs
    const studentUserMap = {};
    const studentUsers = db.prepare('SELECT id, username FROM users WHERE role = ?').all('STUDENT');
    for (const user of studentUsers) {
      const studentId = parseInt(user.username.split('_')[1]);
      studentUserMap[studentId] = user.id;
    }
    
    const mentorUserMap = {};
    const mentorUsers = db.prepare('SELECT id, username FROM users WHERE role = ?').all('MENTOR');
    for (const user of mentorUsers) {
      const mentorId = parseInt(user.username.split('_')[1]);
      mentorUserMap[mentorId] = user.id;
    }
    
    const employerUserMap = {};
    const employerUsers = db.prepare('SELECT id, username FROM users WHERE role = ?').all('EMPLOYER');
    for (const user of employerUsers) {
      const employerId = parseInt(user.username.split('_')[1]);
      employerUserMap[employerId] = user.id;
    }
    
    const internshipMap = {};
    const internshipsFromDb = db.prepare('SELECT id FROM internships').all();
    internshipsFromDb.forEach((internship, index) => {
      internshipMap[index + 1] = internship.id;
    });
    
    // Insert applications
    console.log(`Inserting ${applications.length} applications...`);
    for (const application of applications) {
      try {
        const studentUserId = studentUserMap[application.student_id];
        const internshipId = internshipMap[application.internship_id];
        const mentorUserId = application.mentor_id ? mentorUserMap[application.mentor_id] : null;
        
        if (!studentUserId || !internshipId) {
          console.warn(`Skipping application ${application.id} due to missing student or internship`);
          continue;
        }
        
        // Convert status to database format
        let dbStatus = 'APPLIED';
        switch (application.status) {
          case 'Shortlisted':
            dbStatus = 'INTERVIEW_SCHEDULED';
            break;
          case 'Mentor_Approved':
            dbStatus = 'MENTOR_APPROVED';
            break;
          case 'Offered':
            dbStatus = 'OFFERED';
            break;
          case 'Rejected':
            dbStatus = 'NOT_OFFERED';
            break;
          case 'Completed':
            dbStatus = 'COMPLETED';
            break;
          case 'Withdrawn':
            dbStatus = 'WITHDRAWN';
            break;
          case 'Interview_Scheduled':
            dbStatus = 'INTERVIEW_SCHEDULED';
            break;
          default:
            dbStatus = application.status.toUpperCase();
        }
        
        db.prepare(`
          INSERT INTO applications (
            student_id, internship_id, status, applied_at, mentor_id, mentor_approved_at
          )
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          studentUserId,
          internshipId,
          dbStatus,
          application.applied_at,
          mentorUserId,
          application.approval_timestamp && application.approval_timestamp !== '' ? application.approval_timestamp : null
        );
      } catch (error) {
        console.error(`Error inserting application ${application.id}:`, error.message);
      }
    }
    
    console.log('✅ Applications imported successfully');

    // Import chat messages and create chat rooms
    console.log('💬 Importing chat messages...');
    
    // Create chat rooms for applications that have chat messages
    const chatRoomMap = new Map();
    
    // Read chat messages from JSONL file
    const chatMessagesFile = join(__dirname, '../internship_portal_synthetic_dataset/dataset/chat_messages.jsonl');
    const fileStream = fs.createReadStream(chatMessagesFile);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });
    
    let chatMessageCount = 0;
    const applicationChatMap = new Map(); // To track which applications have chats
    
    for await (const line of rl) {
      if (line.trim() === '') continue;
      
      try {
        const chatMessage = JSON.parse(line);
        const applicationId = chatMessage.application_id;
        
        // Track applications that have chat messages
        applicationChatMap.set(applicationId, true);
        
        chatMessageCount++;
      } catch (error) {
        console.error('Error parsing chat message line:', error.message);
      }
    }
    
    console.log(`Found ${chatMessageCount} chat messages for ${applicationChatMap.size} applications`);
    
    // Create chat rooms for applications that have chat messages
    const applicationIds = Array.from(applicationChatMap.keys());
    const applicationIdMap = {}; // Map from synthetic ID to actual DB ID
    
    // Get all applications from DB
    const dbApplications = db.prepare('SELECT id, student_id, internship_id FROM applications').all();
    
    // For simplicity, we'll create chat rooms for the first few applications that match our synthetic data
    for (let i = 0; i < Math.min(applicationIds.length, dbApplications.length); i++) {
      const syntheticAppId = applicationIds[i];
      const dbApp = dbApplications[i];
      
      if (dbApp) {
        applicationIdMap[syntheticAppId] = dbApp.id;
        
        try {
          // Get the student and mentor for this application
          const studentId = dbApp.student_id;
          // For mentor, we'll need to get one from the application or assign a random one
          const mentors = db.prepare('SELECT id FROM users WHERE role = ?').all('MENTOR');
          const mentorId = mentors.length > 0 ? mentors[Math.floor(Math.random() * mentors.length)].id : studentId;
          
          // Create chat room
          const result = db.prepare(`
            INSERT INTO chat_rooms (application_id, student_id, mentor_id)
            VALUES (?, ?, ?)
          `).run(dbApp.id, studentId, mentorId);
          
          chatRoomMap.set(syntheticAppId, result.lastInsertRowid);
        } catch (error) {
          console.error(`Error creating chat room for application ${syntheticAppId}:`, error.message);
        }
      }
    }
    
    console.log(`Created ${chatRoomMap.size} chat rooms`);
    
    // Now import chat messages
    const fileStream2 = fs.createReadStream(chatMessagesFile);
    const rl2 = readline.createInterface({
      input: fileStream2,
      crlfDelay: Infinity
    });
    
    let importedChatMessages = 0;
    
    for await (const line of rl2) {
      if (line.trim() === '') continue;
      
      try {
        const chatMessage = JSON.parse(line);
        const applicationId = chatMessage.application_id;
        const chatRoomId = chatRoomMap.get(applicationId);
        
        if (!chatRoomId) {
          // Skip messages for applications without chat rooms
          continue;
        }
        
        // Determine sender - map sender_id based on sender_role
        let senderId;
        if (chatMessage.sender_role === 'Student') {
          senderId = studentUserMap[chatMessage.sender_id] || 
                    (db.prepare('SELECT id FROM users WHERE role = ? LIMIT 1').get('STUDENT')?.id || 1);
        } else if (chatMessage.sender_role === 'Mentor') {
          senderId = mentorUserMap[chatMessage.sender_id] || 
                    (db.prepare('SELECT id FROM users WHERE role = ? LIMIT 1').get('MENTOR')?.id || 1);
        } else {
          // For HR/Employer
          senderId = employerUserMap[chatMessage.sender_id] || 
                    (db.prepare('SELECT id FROM users WHERE role = ? LIMIT 1').get('EMPLOYER')?.id || 1);
        }
        
        // Insert chat message
        db.prepare(`
          INSERT INTO chat_messages (chat_room_id, sender_id, message, is_read, created_at)
          VALUES (?, ?, ?, ?, ?)
        `).run(
          chatRoomId,
          senderId,
          chatMessage.message,
          0, // is_read
          chatMessage.timestamp
        );
        
        importedChatMessages++;
      } catch (error) {
        console.error('Error importing chat message:', error.message);
      }
    }
    
    console.log(`✅ Imported ${importedChatMessages} chat messages successfully`);

    // Print summary
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const internshipCount = db.prepare('SELECT COUNT(*) as count FROM internships').get().count;
    const applicationCount = db.prepare('SELECT COUNT(*) as count FROM applications').get().count;
    const chatRoomCount = db.prepare('SELECT COUNT(*) as count FROM chat_rooms').get().count;
    const chatMessageCountFinal = db.prepare('SELECT COUNT(*) as count FROM chat_messages').get().count;

    console.log('\n📊 Import Summary:');
    console.log(`👥 Users: ${userCount}`);
    console.log(`💼 Internships: ${internshipCount}`);
    console.log(`📋 Applications: ${applicationCount}`);
    console.log(`💬 Chat Rooms: ${chatRoomCount}`);
    console.log(`💬 Chat Messages: ${chatMessageCountFinal}`);

    console.log('\n🔑 Sample Login Credentials:');
    console.log('Student: student_1 / Password123!');
    console.log('Mentor: mentor_1 / Password123!');
    console.log('Employer: employer_1 / Password123!');
    console.log('Admin: admin / Password123!');

    console.log('\n🎉 Database import with synthetic dataset completed!');
    
  } catch (error) {
    console.error('❌ Error importing synthetic dataset:', error);
    process.exit(1);
  }
}

// Run the import function
importSyntheticData().catch(console.error);